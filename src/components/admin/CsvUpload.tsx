"use client";

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAdminApi } from '@/hooks/useAdminApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, FileSpreadsheet, ChevronDown, ChevronUp, Download } from 'lucide-react';

interface ParsedRow {
  email: string;
  date: string;
  amount: number;
  type: string;
  status: string;
}

interface BulkResult {
  success: number;
  errors: string[];
}

const VALID_STATUSES = ['paid', 'pending', 'failed'];
const MAX_ROWS = 1000;
const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

/** Validate a single parsed row, returning an error message or null. */
function validateRow(row: ParsedRow, rowNum: number): string | null {
  if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    return `Row ${rowNum}: Invalid or missing email "${row.email || ''}"`;
  }
  if (!row.date || !DATE_REGEX.test(row.date)) {
    return `Row ${rowNum}: Invalid date "${row.date || ''}". Use DD/MM/YYYY format`;
  }
  // Validate date is a real calendar date
  const [dd, mm, yyyy] = row.date.split('/').map(Number);
  const dateObj = new Date(yyyy, mm - 1, dd);
  if (dateObj.getDate() !== dd || dateObj.getMonth() !== mm - 1 || dateObj.getFullYear() !== yyyy) {
    return `Row ${rowNum}: Date "${row.date}" is not a valid calendar date`;
  }
  if (yyyy < 2000 || yyyy > 2100) {
    return `Row ${rowNum}: Year ${yyyy} is out of reasonable range (2000-2100)`;
  }
  if (isNaN(row.amount) || row.amount < 0 || row.amount > 100000) {
    return `Row ${rowNum}: Amount must be a number between 0 and 100,000`;
  }
  if (!row.type || row.type.trim().length === 0 || row.type.trim().length > 50) {
    return `Row ${rowNum}: Type is required and must be under 50 characters`;
  }
  if (!VALID_STATUSES.includes(row.status.toLowerCase().trim())) {
    return `Row ${rowNum}: Status must be one of: paid, pending, failed`;
  }
  return null;
}

/** Normalize a header string to lowercase trimmed. */
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim();
}

/** Parse an XLSX file into rows. */
function parseXlsx(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('No sheets found in the file'));
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false });

        const rows: ParsedRow[] = jsonData.map((raw) => {
          const normalized: Record<string, string> = {};
          for (const key of Object.keys(raw)) {
            normalized[normalizeHeader(key)] = String(raw[key] ?? '');
          }
          return {
            email: normalized['email'] || '',
            date: normalized['date'] || '',
            amount: parseInt(normalized['amount'] || '0', 10),
            type: normalized['type'] || '',
            status: normalized['status'] || '',
          };
        });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/** Parse a CSV file into rows using PapaParse. */
function parseCsv(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors.map((e) => e.message).join(', ')));
          return;
        }
        const rows: ParsedRow[] = result.data.map((raw) => {
          const normalized: Record<string, string> = {};
          for (const key of Object.keys(raw)) {
            normalized[normalizeHeader(key)] = raw[key];
          }
          return {
            email: normalized['email'] || '',
            date: normalized['date'] || '',
            amount: parseInt(normalized['amount'] || '0', 10),
            type: normalized['type'] || '',
            status: normalized['status'] || '',
          };
        });
        resolve(rows);
      },
      error: (err: Error) => reject(err),
    });
  });
}

/** Generate and download an XLSX template file. */
function downloadTemplate() {
  const templateData = [
    { email: 'john@example.com', date: '15/01/2025', amount: 50, type: 'credit_purchase', status: 'paid' },
    { email: 'jane@example.com', date: '20/01/2025', amount: 100, type: 'credit_purchase', status: 'pending' },
    { email: 'bob@example.com', date: '25/01/2025', amount: 75, type: 'credit_purchase', status: 'failed' },
  ];
  const ws = XLSX.utils.json_to_sheet(templateData);
  // Set column widths for readability
  ws['!cols'] = [
    { wch: 25 }, // email
    { wch: 14 }, // date
    { wch: 10 }, // amount
    { wch: 20 }, // type
    { wch: 10 }, // status
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, 'transactions_template.xlsx');
}

export const CsvUpload = () => {
  const { makeRequest } = useAdminApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<BulkResult | null>(null);
  const [showExample, setShowExample] = useState(false);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setResults({ success: 0, errors: ['Unsupported file type. Please upload a .csv or .xlsx file.'] });
      resetFileInput();
      return;
    }

    setIsProcessing(true);
    setResults(null);
    setProgress('Parsing file...');

    try {
      // 1. Parse file
      let rows: ParsedRow[];
      if (ext === 'csv') {
        rows = await parseCsv(file);
      } else {
        rows = await parseXlsx(file);
      }

      if (rows.length === 0) {
        setResults({ success: 0, errors: ['File is empty or has no data rows.'] });
        setIsProcessing(false);
        resetFileInput();
        return;
      }

      if (rows.length > MAX_ROWS) {
        setResults({ success: 0, errors: [`File has ${rows.length} rows. Maximum is ${MAX_ROWS} per upload.`] });
        setIsProcessing(false);
        resetFileInput();
        return;
      }

      // 2. Client-side validation
      setProgress(`Validating ${rows.length} rows...`);
      const clientErrors: string[] = [];
      const validRows: Array<{ email: string; date: string; amount: number; type: string; status: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const error = validateRow(row, i + 2); // +2: row 1 is headers, index is 0-based
        if (error) {
          clientErrors.push(error);
          if (clientErrors.length >= 100) {
            clientErrors.push(`... and more errors. Fix the first issues and re-upload.`);
            break;
          }
        } else {
          validRows.push({
            email: row.email.trim(),
            date: row.date.trim(),
            amount: row.amount,
            type: row.type.trim(),
            status: row.status.toLowerCase().trim(),
          });
        }
      }

      if (validRows.length === 0) {
        setResults({ success: 0, errors: clientErrors });
        setIsProcessing(false);
        resetFileInput();
        return;
      }

      // 3. Send to backend
      setProgress(`Uploading ${validRows.length} valid rows to server...`);
      const response = await makeRequest('/admin/transactions/bulk', {
        method: 'POST',
        body: JSON.stringify({ rows: validRows }),
      }) as BulkResult;

      // Combine client-side errors with server-side errors
      const allErrors = [...clientErrors, ...(response.errors || [])];
      setResults({ success: response.success || 0, errors: allErrors });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setResults({ success: 0, errors: [message] });
    } finally {
      setIsProcessing(false);
      setProgress('');
      resetFileInput();
    }
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <FileSpreadsheet className="h-5 w-5 text-neutral-500" />
        <h3 className="text-lg font-medium text-white">Upload Transactions</h3>
      </div>

      <p className="text-sm text-neutral-400 mb-4">
        Import transactions from a CSV or XLSX file. Headers are case-insensitive. Max {MAX_ROWS} rows per upload.
      </p>

      {/* Example Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setShowExample(!showExample)}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          {showExample ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showExample ? 'Hide example' : 'Show example format'}
        </button>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download template (.xlsx)
        </button>
      </div>

      {/* Example Table */}
      {showExample && (
        <div className="mb-5 overflow-x-auto">
          <table className="w-full text-xs border border-neutral-800 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-neutral-800/50">
                <th className="px-3 py-2 text-left text-neutral-400 font-medium">email</th>
                <th className="px-3 py-2 text-left text-neutral-400 font-medium">date</th>
                <th className="px-3 py-2 text-left text-neutral-400 font-medium">amount</th>
                <th className="px-3 py-2 text-left text-neutral-400 font-medium">type</th>
                <th className="px-3 py-2 text-left text-neutral-400 font-medium">status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              <tr className="bg-neutral-900/30">
                <td className="px-3 py-2 text-neutral-300">john@example.com</td>
                <td className="px-3 py-2 text-neutral-300">15/01/2025</td>
                <td className="px-3 py-2 text-neutral-300">50</td>
                <td className="px-3 py-2 text-neutral-300">credit_purchase</td>
                <td className="px-3 py-2 text-neutral-300">paid</td>
              </tr>
              <tr className="bg-neutral-900/30">
                <td className="px-3 py-2 text-neutral-300">jane@example.com</td>
                <td className="px-3 py-2 text-neutral-300">20/01/2025</td>
                <td className="px-3 py-2 text-neutral-300">100</td>
                <td className="px-3 py-2 text-neutral-300">credit_purchase</td>
                <td className="px-3 py-2 text-neutral-300">pending</td>
              </tr>
              <tr className="bg-neutral-900/30">
                <td className="px-3 py-2 text-neutral-300">bob@example.com</td>
                <td className="px-3 py-2 text-neutral-300">25/01/2025</td>
                <td className="px-3 py-2 text-neutral-300">75</td>
                <td className="px-3 py-2 text-neutral-300">credit_purchase</td>
                <td className="px-3 py-2 text-neutral-300">failed</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-neutral-600 mt-2">
            Status values: paid, pending, failed (case-insensitive) &bull; Date format: DD/MM/YYYY &bull; Amount: 0&ndash;100,000
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Label htmlFor="csv-upload" className="sr-only">Upload CSV or XLSX</Label>
        <Input
          ref={fileInputRef}
          id="csv-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="text-sm bg-neutral-800/50 border-neutral-700/50 file:bg-neutral-700 file:text-neutral-200 file:border-0 file:mr-3 file:px-3 file:py-1 file:rounded hover:bg-neutral-800/70 transition-colors cursor-pointer"
        />
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center gap-2 text-neutral-400 text-sm" aria-live="polite">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>{progress || 'Processing...'}</span>
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-3" aria-live="polite">
          {results.success > 0 && (
            <div className="flex items-center gap-2 text-green-400/90 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>{results.success} transaction{results.success !== 1 ? 's' : ''} imported successfully</span>
            </div>
          )}
          {results.errors.length > 0 && (
            <div className="p-3 bg-red-950/30 border border-red-900/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400/90 text-sm mb-2">
                <XCircle className="h-4 w-4" />
                <span>{results.errors.length} error{results.errors.length !== 1 ? 's' : ''}</span>
              </div>
              <ul className="text-red-400/70 text-xs space-y-1 max-h-32 overflow-y-auto">
                {results.errors.slice(0, 100).map((err, i) => <li key={i}>&bull; {err}</li>)}
                {results.errors.length > 100 && (
                  <li className="text-red-400/50 italic">... and {results.errors.length - 100} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
