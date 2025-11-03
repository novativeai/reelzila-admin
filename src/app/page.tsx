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
      <div className="container mx-auto py-16 px-4">
        <div className="flex items-center justify-between mb-16">
          <h1 className="text-7xl md:text-8xl font-extrabold tracking-tighter bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Admin Dashboard</h1>
          <Link href="/marketplace" className="px-6 py-3 bg-yellow-300 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors">
            Marketplace
          </Link>
        </div>

        <div className="text-center my-16 p-12 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl">
            <p className="text-neutral-400 mb-4 text-sm uppercase tracking-wider">Total Users</p>
            <p className="text-8xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">{stats.userCount}</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
              <span className="w-1 h-8 bg-yellow-400 rounded-full"></span>
              User List
            </h2>
            <div className="space-y-3">
              {users.map((u) => (
                  <Link key={u.id} href={`/users/${u.id}`}>
                      <div className="border border-neutral-800 rounded-2xl p-6 flex justify-between items-center hover:bg-neutral-900 hover:border-neutral-700 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:scale-[1.01]">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center font-bold text-black text-sm">
                              {/* FIX: Check if email exists before calling charAt */}
                              {u.email ? u.email.charAt(0).toUpperCase() : '?'}
                            </div>
                            {/* FIX: Provide a fallback if email is null/undefined */}
                            <p className="font-semibold text-lg">{u.email || "No Email Provided"}</p>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-yellow-400 text-lg">{u.plan}</p>
                              <p className="text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors">{u.generationCount} Generations</p>
                          </div>
                      </div>
                  </Link>
              ))}
            </div>
            <div className="text-center pt-8">
                <button className="text-sm text-neutral-400 hover:text-yellow-400 transition-colors font-medium">See more</button>
            </div>
        </div>

        <Separator className="my-16 md:my-24 bg-neutral-800" />

        <div className="max-w-4xl mx-auto">
          <CsvUpload />
        </div>

        <div className="max-w-4xl mx-auto mt-24">
             <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
               <span className="w-1 h-8 bg-yellow-400 rounded-full"></span>
               Create Account
             </h2>
             <div className="border border-neutral-800 rounded-2xl p-8 bg-gradient-to-br from-neutral-900 to-neutral-950 shadow-xl">
               <form onSubmit={handleCreateUser} className="flex items-end gap-8">
                  <div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">Mail</label><Input name="email" placeholder="eg: john.smith@gmail.com" className={inputStyles} required/></div>
                  <div className="grid gap-2 w-full"><label className="text-sm text-neutral-400 font-medium">Password</label><Input name="password" type="password" placeholder="********" className={inputStyles} required/></div>
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