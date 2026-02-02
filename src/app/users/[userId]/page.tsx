"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { useAdminApi } from "@/hooks/useAdminApi";
import { EditTransactionPopup, TransactionData } from "@/components/admin/EditTransactionPopup";
import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";
import { DateInput } from "@/components/ui/date-input";
import { generateTransactionPDF } from "@/lib/Generator";

// --- Type Definitions for this page ---
interface BillingInfo {
  nameOnCard?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postCode?: string;
  validTill?: string;
}

interface UserProfile {
  name: string;
  email: string;
  billingInfo?: BillingInfo;
  credits?: number;
  generationCount?: number;
}

// This type matches the data received from the backend's GET request
interface Transaction {
  id: string;
  createdAt: string; // The backend formats this as 'dd/mm/yyyy'
  amount: number;
  type: string;
  status: 'paid' | 'pending' | 'failed';
}

const PlusButton = ({ isLoading }: { isLoading?: boolean }) => (
    <button type="submit" className="bg-yellow-300 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-2xl hover:bg-yellow-400 transition-colors disabled:bg-neutral-500" disabled={isLoading}>
      {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "+"}
    </button>
);

function UserDetailContent() {
  const { userId } = useParams<{ userId: string }>();
  const { makeRequest } = useAdminApi();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionData | null>(null);
  const [newTransactionDate, setNewTransactionDate] = useState('');

  const fetchData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
        const data = await makeRequest(`/admin/users/${userId}`);
        setProfile(data.profile);
        setTransactions(data.transactions);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [userId, makeRequest]);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>, formName: string, endpoint: string, method: 'POST' | 'PUT', body: object) => {
    e.preventDefault();
    setIsSubmitting(formName);
    try {
        await makeRequest(endpoint, { method, body: JSON.stringify(body) });
        alert(`${formName} updated successfully!`);
        fetchData();
    } catch (error) {
        alert(`Failed to update ${formName}: ${(error as Error).message}`);
    } finally {
        setIsSubmitting(null);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newPassword = (e.currentTarget.elements.namedItem('newPassword') as HTMLInputElement).value;
    
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (!confirm('Are you sure you want to reset this user\'s password?')) {
      return;
    }

    setIsSubmitting('Reset Password');
    try {
      await makeRequest(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword })
      });
      alert('Password reset successfully!');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      alert(`Failed to reset password: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleDeleteTransaction = async (transId: string) => {
    if(!confirm('Are you sure you want to delete this transaction?')) return;
    try {
        await makeRequest(`/admin/transactions/${userId}/${transId}`, { method: 'DELETE' });
        setTransactions(prev => prev.filter(t => t.id !== transId));
    } catch (error) {
        alert(`Failed to delete transaction: ${(error as Error).message}`);
    }
  };

  const openEditPopup = (transaction: Transaction) => {
    const transactionToEdit: TransactionData = {
      id: transaction.id,
      date: transaction.createdAt,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
    };
    setEditingTransaction(transactionToEdit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = async (data: TransactionData) => {
    const eventStub = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
    await handleFormSubmit(eventStub, 'Transaction', `/admin/transactions/${userId}/${data.id}`, 'PUT', data);
    setIsEditDialogOpen(false);
  };

  const inputStyles = "bg-transparent border-0 border-b border-neutral-700 rounded-none px-0 focus-visible:ring-0";

  if (isLoading || !profile) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <>
      <EditTransactionPopup
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleUpdateTransaction}
        isProcessing={isSubmitting === 'Transaction'}
        transaction={editingTransaction}
      />
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto py-12 px-4 space-y-10">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/" className="hover:bg-neutral-800/50 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">{profile.name}</h1>
          </div>
          <div className="flex gap-4 ml-14 text-sm text-neutral-400">
            <span>{profile.credits ?? 0} credits</span>
            <span className="text-neutral-600">·</span>
            <span>{profile.generationCount ?? 0} generations</span>
          </div>

          <div className="border border-neutral-800/50 rounded-xl p-6 bg-neutral-900/50">
            <h2 className="text-lg font-medium mb-5 flex items-center gap-2 text-neutral-200">
              <span className="w-1 h-5 bg-neutral-500 rounded-full"></span>
              User Details
            </h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
              <form onSubmit={(e) => handleFormSubmit(e, 'User Details', `/admin/users/${userId}`, 'PUT', { name: (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value, email: profile.email })} className="flex items-end gap-4">
                  <div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">Name</label><Input name="name" defaultValue={profile.name} className={inputStyles} /></div>
                  <PlusButton isLoading={isSubmitting === 'User Details'} />
              </form>
              <form onSubmit={(e) => handleFormSubmit(e, 'User Details', `/admin/users/${userId}`, 'PUT', { name: profile.name, email: (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value })} className="flex items-end gap-4">
                  <div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">Email</label><Input name="email" defaultValue={profile.email} className={inputStyles} /></div>
                  <PlusButton isLoading={isSubmitting === 'User Details'} />
              </form>
            </div>
          </div>

          <div className="border border-neutral-800/50 rounded-xl p-6 bg-neutral-900/50">
            <h2 className="text-lg font-medium mb-5 flex items-center gap-2 text-neutral-200">
              <span className="w-1 h-5 bg-neutral-500 rounded-full"></span>
              Billing Information
            </h2>
            <form onSubmit={(e) => {
              const formData = Object.fromEntries(new FormData(e.currentTarget));
              const filtered = Object.fromEntries(Object.entries(formData).filter(([, v]) => v !== ''));
              handleFormSubmit(e, 'Billing Info', `/admin/users/${userId}/billing`, 'PUT', filtered);
            }} className="grid md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">Name on Card</label><Input name="nameOnCard" defaultValue={profile.billingInfo?.nameOnCard} className={inputStyles} /></div></div>
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">Address</label><Input name="address" defaultValue={profile.billingInfo?.address} className={inputStyles} /></div></div>
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">City</label><Input name="city" defaultValue={profile.billingInfo?.city} className={inputStyles} /></div></div>
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">Post Code</label><Input name="postCode" defaultValue={profile.billingInfo?.postCode} className={inputStyles} /></div></div>
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">Country</label><Input name="country" defaultValue={profile.billingInfo?.country} className={inputStyles} /></div></div>
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">State / Region</label><Input name="state" defaultValue={profile.billingInfo?.state} className={inputStyles} /></div></div>
              <div className="md:col-span-2 flex justify-end">
                <PlusButton isLoading={isSubmitting === 'Billing Info'} />
              </div>
            </form>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="border border-neutral-800/50 rounded-xl p-6 bg-neutral-900/50">
              <h3 className="text-base font-medium mb-5 flex items-center gap-2 text-neutral-200">
                <span className="w-1 h-4 bg-neutral-500 rounded-full"></span>
                Gift Credits
              </h3>
              <form onSubmit={(e) => {
                const rawValue = (e.currentTarget.elements.namedItem('amount') as HTMLInputElement).value;
                const amount = parseInt(rawValue, 10);
                if (!rawValue || isNaN(amount) || amount < 1) {
                  e.preventDefault();
                  alert('Please enter a valid credit amount (minimum 1).');
                  return;
                }
                handleFormSubmit(e, 'Gift Credits', `/admin/users/${userId}/gift-credits`, 'POST', { amount });
              }} className="flex items-end gap-4">
                <div className="grid gap-2 w-full">
                  <label className="text-sm text-neutral-400 font-medium">Amount</label>
                  <Input name="amount" placeholder="eg: 10" type="number" min="1" max="10000" required className={inputStyles} />
                </div>
                <PlusButton isLoading={isSubmitting === 'Gift Credits'} />
              </form>
            </div>

            <div className="border border-neutral-800/50 rounded-xl p-6 bg-neutral-900/50">
              <h3 className="text-base font-medium mb-5 flex items-center gap-2 text-neutral-200">
                <span className="w-1 h-4 bg-neutral-500 rounded-full"></span>
                Reset Password
              </h3>
              <form onSubmit={handleResetPassword} className="flex items-end gap-4">
                <div className="grid gap-2 w-full">
                  <label className="text-sm text-neutral-400 font-medium">New Password</label>
                  <Input name="newPassword" placeholder="Min 6 characters" type="password" className={inputStyles} required minLength={6} />
                </div>
                <PlusButton isLoading={isSubmitting === 'Reset Password'} />
              </form>
            </div>
          </div>

          <div className="border border-neutral-800/50 rounded-xl p-6 bg-neutral-900/50">
            <h2 className="text-lg font-medium mb-5 flex items-center gap-2 text-neutral-200">
              <span className="w-1 h-5 bg-neutral-500 rounded-full"></span>
              Transaction History
            </h2>
            <div className="space-y-2">
              {transactions.length > 0 ? transactions.map(t => (
                  <div key={t.id} className="border border-neutral-800/50 rounded-lg p-4 grid grid-cols-5 items-center gap-4 group hover:bg-neutral-900/50 hover:border-neutral-700/50 transition-all">
                      <p className="col-span-2 text-neutral-400 font-medium">{t.createdAt}</p>
                      <div className="col-span-2">
                        <p className="text-lg font-semibold mb-1">{t.amount.toFixed(2)} € <span className="text-neutral-400 font-normal text-sm">{t.type}</span></p>
                        <Badge variant={t.status === 'paid' ? 'default' : 'secondary'} className={t.status === 'paid' ? 'bg-green-900 text-green-200 hover:bg-green-800' : t.status === 'pending' ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800' : 'bg-red-900 text-red-200 hover:bg-red-800'}>{t.status}</Badge>

                        <button
                            onClick={() => {
                                const pdfData: TransactionData = {
                                    id: t.id,
                                    date: t.createdAt,
                                    amount: t.amount,
                                    type: t.type,
                                    status: t.status
                                };
                                generateTransactionPDF(pdfData, profile.name, profile.email);
                            }}
                            className="text-xs text-neutral-500 hover:text-yellow-400 underline flex items-center gap-1 mt-2 transition-colors"
                        >
                            <Download className="w-3 h-3"/> Download PDF
                        </button>

                      </div>
                      <div className="flex gap-3 justify-self-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditPopup(t)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-neutral-500 hover:text-white" /></button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-neutral-500 hover:text-red-400" /></button>
                      </div>
                  </div>
              )) : <p className="text-neutral-500 text-center py-8">No transactions found for this user.</p>}
            </div>
          </div>

          <div className="border border-neutral-800/50 rounded-xl p-6 bg-neutral-900/50">
            <h2 className="text-lg font-medium mb-5 flex items-center gap-2 text-neutral-200">
              <span className="w-1 h-5 bg-neutral-500 rounded-full"></span>
              Add Transaction
            </h2>
            <form onSubmit={(e) => {
                const formData = new FormData(e.currentTarget);
                const body = {
                    date: newTransactionDate,
                    amount: parseInt(formData.get('amount') as string),
                    type: formData.get('type') as string,
                    status: formData.get('status') as string,
                };
                handleFormSubmit(e, 'Add Transaction', `/admin/transactions/${userId}`, 'POST', body);
                setNewTransactionDate('');
            }} className="flex items-end gap-4 flex-wrap">
              <div className="grid gap-2 flex-grow"><label className="text-sm text-neutral-400 font-medium">Date</label><DateInput name="date" value={newTransactionDate} onChange={setNewTransactionDate} className={inputStyles} required/></div>
              <div className="grid gap-2 flex-grow"><label className="text-sm text-neutral-400 font-medium">Amount</label><Input name="amount" type="number" className={inputStyles} required/></div>
              <div className="grid gap-2 flex-grow"><label className="text-sm text-neutral-400 font-medium">Type</label><Select name="type" defaultValue="Credit Purchase"><SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Credit Purchase">Credit Purchase</SelectItem><SelectItem value="Marketplace Purchase">Marketplace Purchase</SelectItem></SelectContent></Select></div>
              <div className="grid gap-2 flex-grow"><label className="text-sm text-neutral-400 font-medium">Status</label><Select name="status" defaultValue="paid"><SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select></div>
              <PlusButton isLoading={isSubmitting === 'Add Transaction'} />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminUserDetailPageWrapper() {
    return (
        <AdminAuthWrapper>
            <UserDetailContent />
        </AdminAuthWrapper>
    )
}