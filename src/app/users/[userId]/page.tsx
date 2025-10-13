"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Loader2 } from "lucide-react";
import { useAdminApi } from "@/hooks/useAdminApi";
import { EditTransactionPopup, TransactionData } from "@/components/admin/EditTransactionPopup";
import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";

const PlusButton = ({ isLoading }: { isLoading?: boolean }) => (
    <button type="submit" className="bg-yellow-300 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-2xl hover:bg-yellow-400 transition-colors disabled:bg-neutral-500" disabled={isLoading}>
      {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "+"}
    </button>
);

function UserDetailContent() {
  const { userId } = useParams();
  const { makeRequest } = useAdminApi();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionData | null>(null);

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

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>, formName: string, endpoint: string, method: 'POST' | 'PUT', body: any) => {
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

  const handleDeleteTransaction = async (transId: string) => {
    if(!confirm('Are you sure you want to delete this transaction?')) return;
    try {
        await makeRequest(`/admin/transactions/${userId}/${transId}`, { method: 'DELETE' });
        setTransactions(prev => prev.filter(t => t.id !== transId));
    } catch (error) {
        alert(`Failed to delete transaction: ${(error as Error).message}`);
    }
  };

  const openEditPopup = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = async (data: TransactionData) => {
    await handleFormSubmit({ preventDefault: () => {} } as any, 'Transaction', `/admin/transactions/${userId}/${data.id}`, 'PUT', data);
    setIsEditDialogOpen(false);
  };

  const inputStyles = "bg-transparent border-0 border-b border-neutral-700 rounded-none px-0 focus-visible:ring-0";

  if (isLoading || !profile) return <div className="bg-black text-white min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10" /></div>;

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
        <div className="container mx-auto py-16 px-4 space-y-16">
          <h1 className="text-7xl md:text-8xl font-extrabold tracking-tighter">{profile.name}</h1>
          
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
              <form onSubmit={(e) => handleFormSubmit(e, 'User Details', `/admin/users/${userId}`, 'PUT', { name: (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value, email: profile.email })} className="flex items-end gap-4">
                  <div className="grid gap-2 w-full"><label className="text-sm">Name</label><Input name="name" defaultValue={profile.name} className={inputStyles} /></div>
                  <PlusButton isLoading={isSubmitting === 'User Details'} />
              </form>
              <form onSubmit={(e) => handleFormSubmit(e, 'User Details', `/admin/users/${userId}`, 'PUT', { name: profile.name, email: (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value })} className="flex items-end gap-4">
                  <div className="grid gap-2 w-full"><label className="text-sm">Email</label><Input name="email" defaultValue={profile.email} className={inputStyles} /></div>
                  <PlusButton isLoading={isSubmitting === 'User Details'} />
              </form>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Billing Information</h2>
            <form onSubmit={(e) => handleFormSubmit(e, 'Billing Info', `/admin/users/${userId}/billing`, 'PUT', Object.fromEntries(new FormData(e.currentTarget)) )} className="grid md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm">Name on Card</label><Input name="nameOnCard" defaultValue={profile.billingInfo?.nameOnCard} className={inputStyles} /></div><PlusButton isLoading={isSubmitting === 'Billing Info'} /></div>
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm">Valid Till (MM/YY)</label><Input name="validTill" defaultValue={profile.billingInfo?.validTill} className={inputStyles} /></div><PlusButton isLoading={isSubmitting === 'Billing Info'} /></div>
              <div className="flex items-end gap-4 md:col-span-2"><div className="grid gap-2 w-full"><label className="text-sm">Address</label><Input name="address" defaultValue={profile.billingInfo?.address} className={inputStyles} /></div><PlusButton isLoading={isSubmitting === 'Billing Info'} /></div>
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm">City</label><Input name="city" defaultValue={profile.billingInfo?.city} className={inputStyles} /></div><PlusButton isLoading={isSubmitting === 'Billing Info'} /></div>
              <div className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm">State</label><Input name="state" defaultValue={profile.billingInfo?.state} className={inputStyles} /></div><PlusButton isLoading={isSubmitting === 'Billing Info'} /></div>
            </form>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            <form onSubmit={(e) => handleFormSubmit(e, 'Gift Credits', `/admin/users/${userId}/gift-credits`, 'POST', { amount: parseInt((e.currentTarget.elements.namedItem('amount') as HTMLInputElement).value) })} className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm">Gift Credits</label><Input name="amount" placeholder="eg: 10" type="number" className={inputStyles} /></div><PlusButton isLoading={isSubmitting === 'Gift Credits'} /></form>
            <form className="flex items-end gap-4"><div className="grid gap-2 w-full"><label className="text-sm">Reset Password</label><Input placeholder="New Password" type="password" className={inputStyles} /></div><PlusButton /></form>
          </div>

          <div>
              <h2 className="text-2xl font-semibold mb-6">Transaction History</h2>
              <div className="space-y-4">
                  {transactions.length > 0 ? transactions.map(t => (
                      <div key={t.id} className="border-b border-neutral-800 py-4 grid grid-cols-5 items-center gap-4 group">
                          <p className="col-span-2">{t.createdAt}</p>
                          <div className="col-span-2"><p>{t.amount}$ {t.type} <Badge variant={t.status === 'paid' ? 'default' : 'secondary'} className={t.status === 'paid' ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}>{t.status}</Badge></p><a href="#" className="text-sm text-neutral-400 hover:text-white underline">Download PDF</a></div>
                          <div className="flex gap-4 justify-self-end opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEditPopup(t)}><Edit2 className="w-4 h-4 text-neutral-500 hover:text-white" /></button><button onClick={() => handleDeleteTransaction(t.id)}><Trash2 className="w-4 h-4 text-neutral-500 hover:text-red-500" /></button></div>
                      </div>
                  )) : <p className="text-neutral-500">No transactions found for this user.</p>}
              </div>
          </div>
          
          <div>
              <h2 className="text-2xl font-semibold mb-6">Add a transaction</h2>
              <form onSubmit={(e) => handleFormSubmit(e, 'Add Transaction', `/admin/transactions/${userId}`, 'POST', { date: (e.currentTarget.elements.namedItem('date') as HTMLInputElement).value, amount: parseInt((e.currentTarget.elements.namedItem('amount') as HTMLInputElement).value), type: (e.currentTarget.elements.namedItem('type') as HTMLInputElement).value, status: (e.currentTarget.elements.namedItem('status') as HTMLInputElement).value })} className="flex items-end gap-4 flex-wrap">
                <div className="grid gap-2 flex-grow"><label className="text-sm">Date (dd/mm/yyyy)</label><Input name="date" className={inputStyles} required/></div>
                <div className="grid gap-2 flex-grow"><label className="text-sm">Amount</label><Input name="amount" type="number" className={inputStyles} required/></div>
                <div className="grid gap-2 flex-grow"><label className="text-sm">Type</label><Select name="type" defaultValue="Purchase"><SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Purchase">Purchase</SelectItem><SelectItem value="Subscription">Subscription</SelectItem></SelectContent></Select></div>
                <div className="grid gap-2 flex-grow"><label className="text-sm">Status</label><Select name="status" defaultValue="paid"><SelectTrigger className={inputStyles}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select></div>
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