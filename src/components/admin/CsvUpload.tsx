"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, CheckCircle, XCircle } from 'lucide-react';

// Define the expected structure of a row in the CSV
interface CsvRow {
  email: string;
  date: string; // Expects 'dd/mm/yyyy'
  amount: string; // PapaParse reads everything as strings initially
  type: string;
  status: 'paid' | 'pending' | 'failed';
}

export const CsvUpload = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

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

        const successCount = 0;
        const errorMessages: string[] = [];
        const writePromises: Promise<void>[] = [];

        // Use a Map to cache user lookups and avoid repeated queries for the same email
        const userCache = new Map<string, string | null>();

        for (const [index, row] of data.entries()) {
          try {
            if (!row.email || !row.date || !row.amount || !row.type || !row.status) {
              throw new Error(`Row ${index + 2}: Missing required fields.`);
            }

            let userId: string | null = null;
            if (userCache.has(row.email)) {
              userId = userCache.get(row.email)!;
            } else {
              const userQuery = query(collection(db, "users"), where("email", "==", row.email));
              const querySnapshot = await getDocs(userQuery);
              if (querySnapshot.empty) {
                userCache.set(row.email, null);
                throw new Error(`Row ${index + 2}: User with email "${row.email}" not found.`);
              }
              userId = querySnapshot.docs[0].id;
              userCache.set(row.email, userId);
            }
            
            if (!userId) continue; // Skip if user was not found and cached as null

            // Convert date string 'dd/mm/yyyy' to a Date object
            const dateParts = row.date.split('/');
            const dateObject = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);

            const transactionData = {
              amount: parseInt(row.amount, 10),
              type: row.type,
              status: row.status,
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
    <div className="bg-[#1C1C1C] border border-neutral-800 rounded-2xl p-8">
      <h3 className="text-2xl font-semibold mb-4">Upload Transactions CSV</h3>
      <p className="text-neutral-400 mb-6">
        Upload a CSV file with columns: `email`, `date` (dd/mm/yyyy), `amount`, `type`, `status`.
      </p>
      
      <div className="grid w-full max-w-sm items-center gap-2">
        <Label htmlFor="csv-upload" className="sr-only">Upload CSV</Label>
        <Input 
          id="csv-upload" 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          disabled={isProcessing}
          className="file:text-white"
        />
      </div>

      {isProcessing && (
        <div className="mt-6 flex items-center gap-2 text-yellow-400">
          <Loader2 className="animate-spin h-5 w-5" />
          <span>Processing file... This may take a moment.</span>
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span>Successfully processed and wrote {results.success} transactions to the database.</span>
          </div>
          {results.errors.length > 0 && (
            <div className="p-4 bg-red-900/50 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                <XCircle className="h-5 w-5" />
                <span>Encountered {results.errors.length} errors:</span>
              </div>
              <ul className="list-disc list-inside text-red-400/80 text-sm space-y-1">
                {results.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};