"use client";

import { useState, useEffect, FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { DateInput } from "@/components/ui/date-input"; // Import the new component

export interface TransactionData {
  id: string;
  date: string;
  amount: number;
  type: string;
  status: 'paid' | 'pending' | 'failed';
  createdAt?: string; 
}

interface EditTransactionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionData) => void;
  isProcessing: boolean;
  transaction: TransactionData | null;
}

export const EditTransactionPopup: React.FC<EditTransactionPopupProps> = ({ isOpen, onClose, onSubmit, isProcessing, transaction }) => {
  const [data, setData] = useState<TransactionData>({ id: '', date: '', amount: 0, type: 'Purchase', status: 'paid' });

  useEffect(() => {
    if (transaction) {
      setData({ ...transaction, date: transaction.createdAt || transaction.date });
    }
  }, [transaction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: name === 'amount' ? parseInt(value) : value });
  };
  
  const handleSelectChange = (name: 'type' | 'status', value: string) => { setData({ ...data, [name]: value }); };
  const handleDateChange = (value: string) => { setData({ ...data, date: value }); };

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); onSubmit(data); };
  
  const inputStyles = "bg-transparent border-0 border-b border-neutral-700 rounded-none px-0 focus-visible:ring-0";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1C1C1C] border-neutral-800 text-white">
        <DialogHeader><DialogTitle className="text-2xl font-bold">Edit Transaction</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <DateInput id="date" value={data.date} onChange={handleDateChange} className={inputStyles} />
                </div>
                <div className="grid gap-2"><Label htmlFor="amount">Amount ($)</Label><Input id="amount" name="amount" type="number" value={data.amount} onChange={handleChange} className={inputStyles} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Type</Label><Select value={data.type} onValueChange={(v) => handleSelectChange('type', v)}><SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Purchase">Purchase</SelectItem><SelectItem value="Subscription">Subscription</SelectItem></SelectContent></Select></div>
                <div className="grid gap-2"><Label>Status</Label><Select value={data.status} onValueChange={(v) => handleSelectChange('status', v)}><SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select></div>
            </div>
          <Button type="submit" className="w-full bg-yellow-300 text-black font-bold hover:bg-yellow-400" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin" /> : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};