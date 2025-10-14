"use client";

import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Loader2 } from "lucide-react";

const PlusButton = ({ isLoading }: { isLoading?: boolean }) => (
  <button type="submit" className="bg-yellow-300 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-2xl hover:bg-yellow-400 transition-colors disabled:bg-neutral-500" disabled={isLoading}>
    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "+"}
  </button>
);

interface UserRecord {
  id: string,
  email: string;
  plan?: string;
  credits: number;
  isAdmin?: boolean; // optional — add if your API returns it
  generationCount?: number
  // Add more fields if needed, like role, status, etc.
}


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
        fetchData(); // Refresh all data
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
        <h1 className="text-7xl md:text-8xl font-extrabold tracking-tighter mb-16">Admin Dashboard</h1>
        
        <div className="text-center my-16">
            <p className="text-neutral-400 mb-2">Number of users</p>
            <p className="text-8xl font-bold">{stats.userCount}</p>
        </div>
        <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold mb-6">User List</h2>
            {users.map((u) => (
                <Link key={u.id} href={`/users/${u.id}`}>
                    <div className="border-b border-neutral-800 py-4 flex justify-between items-center hover:bg-neutral-900 transition-colors cursor-pointer">
                        <p className="font-semibold">{u.email}</p>
                        <div className="text-right">
                            <p className="font-semibold">{u.plan}</p>
                            <p className="text-sm text-neutral-400">{u.generationCount} Generations</p>
                        </div>
                    </div>
                </Link>
            ))}
            <div className="text-center pt-8">
                <button className="text-sm text-neutral-400 hover:text-white">See more</button>
            </div>
        </div>
        <div className="max-w-4xl mx-auto mt-24">
             <h2 className="text-2xl font-semibold mb-6">Create Account</h2>
             <form onSubmit={handleCreateUser} className="flex items-end gap-8">
                <div className="grid gap-2 w-full"><label className="text-sm text-neutral-400">Mail</label><Input name="email" placeholder="eg: john.smith@gmail.com" className={inputStyles} required/></div>
                <div className="grid gap-2 w-full"><label className="text-sm text-neutral-400">Password</label><Input name="password" type="password" placeholder="********" className={inputStyles} required/></div>
                <PlusButton isLoading={isCreating} />
             </form>
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