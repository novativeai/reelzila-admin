"use client";

import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Loader2 } from "lucide-react";
import { CsvUpload } from "@/components/admin/CsvUpload";
import { Separator } from "@/components/ui/separator";


interface UserRecord {
  id: string,
  email: string; // Note: API might be returning null for this
  plan?: string;
  credits: number;
  isAdmin?: boolean;
  generationCount?: number
}

const PlusButton = ({ isLoading }: { isLoading?: boolean }) => (
  <button type="submit" className="bg-yellow-300 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-2xl hover:bg-yellow-400 transition-colors disabled:bg-neutral-500" disabled={isLoading}>
    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "+"}
  </button>
);


function DashboardContent() {
  const { makeRequest } = useAdminApi();
  const [stats, setStats] = useState({ userCount: 0 });
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = async () => {
    try {
      const statsData = await makeRequest('/admin/stats');
      const usersData = await makeRequest('/admin/users');
      setStats(statsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [makeRequest]);

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    try {
        await makeRequest('/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        alert('User created!');
        form.reset();
        fetchData();
    } catch (error) {
        alert(`Failed to create user: ${(error as Error).message}`);
    } finally {
        setIsCreating(false);
    }
  };

  const inputStyles = "bg-transparent border-0 border-b border-neutral-700 rounded-none px-0 focus-visible:ring-0";

  if (isLoading) {
    return (
        <div className="bg-black text-white min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10" />
        </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Admin Dashboard</h1>
          <div className="flex gap-2 flex-wrap">
            <Link href="/payouts" className="px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-200 text-sm font-medium rounded-lg border border-neutral-700/50 transition-colors">
              Seller Payouts
            </Link>
            <Link href="/sellers" className="px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-200 text-sm font-medium rounded-lg border border-neutral-700/50 transition-colors">
              Manage Sellers
            </Link>
            <Link href="/marketplace" className="px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-200 text-sm font-medium rounded-lg border border-neutral-700/50 transition-colors">
              Marketplace
            </Link>
          </div>
        </div>

        {/* Stats Card */}
        <div className="text-center mb-12 p-8 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <p className="text-neutral-500 mb-2 text-xs uppercase tracking-widest">Total Users</p>
            <p className="text-5xl font-semibold text-white">{stats.userCount}</p>
        </div>

        {/* User List */}
        <div className="max-w-4xl mx-auto space-y-4 mb-12">
            <h2 className="text-lg font-medium mb-4 text-neutral-300">User List</h2>
            <div className="space-y-2">
              {users.map((u) => (
                  <Link key={u.id} href={`/users/${u.id}`}>
                      <div className="border border-neutral-800/50 rounded-lg p-4 flex justify-between items-center hover:bg-neutral-900/50 hover:border-neutral-700/50 transition-all cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-medium text-neutral-300 text-sm">
                              {u.email ? u.email.charAt(0).toUpperCase() : '?'}
                            </div>
                            <p className="font-medium text-sm text-neutral-200">{u.email || "No Email Provided"}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-sm text-neutral-400">{u.plan}</p>
                              <p className="text-xs text-neutral-600">{u.generationCount} Generations</p>
                          </div>
                      </div>
                  </Link>
              ))}
            </div>
            <div className="text-center pt-4">
                <button className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">See more</button>
            </div>
        </div>

        <Separator className="my-12 bg-neutral-800/50" />

        {/* CSV Upload */}
        <div className="max-w-4xl mx-auto mb-12">
          <CsvUpload />
        </div>

        {/* Create Account */}
        <div className="max-w-4xl mx-auto">
             <h2 className="text-lg font-medium mb-4 text-neutral-300">Create Account</h2>
             <div className="border border-neutral-800/50 rounded-xl p-6 bg-neutral-900/50">
               <form onSubmit={handleCreateUser} className="flex items-end gap-6">
                  <div className="grid gap-2 w-full"><label className="text-xs text-neutral-500 font-medium">Mail</label><Input name="email" placeholder="eg: john.smith@gmail.com" className={inputStyles} required/></div>
                  <div className="grid gap-2 w-full"><label className="text-xs text-neutral-500 font-medium">Password</label><Input name="password" type="password" placeholder="********" className={inputStyles} required/></div>
                  <PlusButton isLoading={isCreating} />
               </form>
             </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminAuthWrapper>
      <DashboardContent />
    </AdminAuthWrapper>
  );
}