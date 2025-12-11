"use client";

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';

// Define the expected structure of a row in the CSV (case-insensitive)
interface CsvRow {
  [key: string]: string;
}

// Normalize header names to lowercase
const normalizeHeaders = (row: CsvRow): CsvRow => {
  const normalized: CsvRow = {};
  for (const key of Object.keys(row)) {
    normalized[key.toLowerCase().trim()] = row[key];
  }
  return normalized;
};

// Normalize status values to lowercase
const normalizeStatus = (status: string): 'paid' | 'pending' | 'failed' => {
  const normalized = status.toLowerCase().trim();
  if (['paid', 'pending', 'failed'].includes(normalized)) {
    return normalized as 'paid' | 'pending' | 'failed';
  }
  return 'pending'; // Default fallback
};

export const CsvUpload = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [showExample, setShowExample] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResults(null);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResult) => {
        const { data, errors: parseErrors } = parseResult;

        if (parseErrors.length > 0) {
          setResults({ success: 0, errors: parseErrors.map(e => e.message) });
          setIsProcessing(false);
          return;
        }

        const errorMessages: string[] = [];
        const writePromises: Promise<void>[] = [];

        // Use a Map to cache user lookups and avoid repeated queries for the same email
        const userCache = new Map<string, string | null>();

        for (const [index, rawRow] of data.entries()) {
          try {
            // Normalize headers to be case-insensitive
            const row = normalizeHeaders(rawRow);

            if (!row.email || !row.date || !row.amount || !row.type || !row.status) {
              throw new Error(`Row ${index + 2}: Missing required fields.`);
            }

            const email = row.email.toLowerCase().trim();

            let userId: string | null = null;
            if (userCache.has(email)) {
              userId = userCache.get(email)!;
            } else {
              const userQuery = query(collection(db, "users"), where("email", "==", email));
              const querySnapshot = await getDocs(userQuery);
              if (querySnapshot.empty) {
                userCache.set(email, null);
                throw new Error(`Row ${index + 2}: User with email "${email}" not found.`);
              }
              userId = querySnapshot.docs[0].id;
              userCache.set(email, userId);
            }

            if (!userId) continue;

            // Convert date string 'dd/mm/yyyy' to a Date object
            const dateParts = row.date.split('/');
            const dateObject = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);

            const transactionData = {
              amount: parseInt(row.amount, 10),
              type: row.type.trim(),
              status: normalizeStatus(row.status),
              createdAt: Timestamp.fromDate(dateObject),
            };

            const transactionsCollectionRef = collection(db, "users", userId, "payments");
            writePromises.push(addDoc(transactionsCollectionRef, transactionData).then());
          } catch (error) {
            errorMessages.push((error as Error).message);
          }
        }

        await Promise.all(writePromises);

        setResults({ success: writePromises.length, errors: errorMessages });
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <FileSpreadsheet className="h-5 w-5 text-neutral-500" />
        <h3 className="text-lg font-medium text-white">Upload Transactions</h3>
      </div>

      <p className="text-sm text-neutral-400 mb-4">
        Import transactions from a CSV file. Headers are case-insensitive.
      </p>

      {/* Example Toggle */}
      <button
        onClick={() => setShowExample(!showExample)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-4"
      >
        {showExample ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {showExample ? 'Hide example' : 'Show example format'}
      </button>

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
                <td className="px-3 py-2 text-neutral-300">subscription</td>
                <td className="px-3 py-2 text-neutral-300">Pending</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-neutral-600 mt-2">
            Status values: paid, pending, failed (case-insensitive)
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Label htmlFor="csv-upload" className="sr-only">Upload CSV</Label>
        <Input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="text-sm bg-neutral-800/50 border-neutral-700/50 file:bg-neutral-700 file:text-neutral-200 file:border-0 file:mr-3 file:px-3 file:py-1 file:rounded hover:bg-neutral-800/70 transition-colors cursor-pointer"
        />
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center gap-2 text-neutral-400 text-sm">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Processing...</span>
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-3">
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
                {results.errors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};