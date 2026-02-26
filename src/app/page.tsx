"use client";

import { AdminAuthWrapper, clearAdminCache } from "@/components/AdminAuthWrapper";
import { useEffect, useState, useRef, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { CsvUpload } from "@/components/admin/CsvUpload";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

interface UserRecord {
  id: string;
  email: string;
  displayName?: string;
  credits: number;
  isAdmin?: boolean;
  generationCount?: number;
}

interface StatsData {
  userCount: number;
}

// Module-level cache so data persists across navigation
const dataCache: { stats: StatsData | null; users: UserRecord[] | null; timestamp: number } = {
  stats: null,
  users: null,
  timestamp: 0,
};
const CACHE_TTL = 60 * 1000; // 1 minute

const PlusButton = ({ isLoading }: { isLoading?: boolean }) => (
  <button type="submit" className="bg-yellow-300 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-2xl hover:bg-yellow-400 transition-colors disabled:bg-neutral-500" disabled={isLoading}>
    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "+"}
  </button>
);


function DashboardContent() {
  const { makeRequest } = useAdminApi();
  const { logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>(dataCache.stats ?? { userCount: 0 });
  const [users, setUsers] = useState<UserRecord[]>(dataCache.users ?? []);
  const [isLoading, setIsLoading] = useState(!dataCache.stats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchData = useCallback(async (isRefresh = false) => {
    setError(null);
    if (isRefresh) setIsRefreshing(true);
    try {
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured. Please set this environment variable in Vercel.");
      }
      const [statsResult, usersResult] = await Promise.allSettled([
        makeRequest('/admin/stats'),
        makeRequest('/admin/users'),
      ]);

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
        dataCache.stats = statsResult.value;
      }
      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
        dataCache.users = usersResult.value;
      }

      const failures = [statsResult, usersResult].filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        const messages = failures.map(f => (f as PromiseRejectedResult).reason?.message);
        setError(`Failed to load: ${messages.join('; ')}`);
      } else {
        dataCache.timestamp = Date.now();
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [makeRequest, apiBaseUrl]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // If cache is fresh, skip fetch
    if (dataCache.stats && dataCache.users && (Date.now() - dataCache.timestamp) < CACHE_TTL) {
      setStats(dataCache.stats);
      setUsers(dataCache.users);
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [fetchData]);

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
        fetchData(true);
    } catch (error) {
        alert(`Failed to create user: ${(error as Error).message}`);
    } finally {
        setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    // Clear all caches before signing out
    dataCache.stats = null;
    dataCache.users = null;
    dataCache.timestamp = 0;
    clearAdminCache();
    await logout();
    router.push("/login");
  };

  const inputStyles = "bg-transparent border-0 border-b border-neutral-700 rounded-none px-0 focus-visible:ring-0";

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Admin Dashboard</h1>
          <div className="flex gap-2 flex-wrap items-center">
            <Link href="/payouts" className="px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-200 text-sm font-medium rounded-lg border border-neutral-700/50 transition-colors">
              Seller Payouts
            </Link>
            <Link href="/sellers" className="px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-200 text-sm font-medium rounded-lg border border-neutral-700/50 transition-colors">
              Manage Sellers
            </Link>
            <Link href="/marketplace" className="px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-200 text-sm font-medium rounded-lg border border-neutral-700/50 transition-colors">
              Marketplace
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 text-sm font-medium rounded-lg border border-red-800/50 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-700 rounded-xl">
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={() => fetchData(true)}
              className="mt-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Card */}
        <div className="text-center mb-12 p-8 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
          <p className="text-neutral-500 mb-2 text-xs uppercase tracking-widest">Total Users</p>
          {isLoading ? (
            <Skeleton className="h-12 w-24 mx-auto bg-neutral-800" />
          ) : (
            <p className="text-5xl font-semibold text-white">{stats.userCount}</p>
          )}
        </div>

        {/* User List */}
        <div className="max-w-4xl mx-auto space-y-4 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-neutral-300">User List</h2>
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-700/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              // Skeleton placeholders
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-neutral-800/50 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full bg-neutral-800" />
                    <Skeleton className="h-4 w-48 bg-neutral-800" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-20 bg-neutral-800 ml-auto" />
                    <Skeleton className="h-3 w-16 bg-neutral-800 ml-auto" />
                  </div>
                </div>
              ))
            ) : (
              users.map((u) => (
                <Link key={u.id} href={`/users/${u.id}`}>
                  <div className="border border-neutral-800/50 rounded-lg p-4 flex justify-between items-center hover:bg-neutral-900/50 hover:border-neutral-700/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-medium text-neutral-300 text-sm">
                        {u.email ? u.email.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        {u.displayName && (
                          <p className="font-medium text-sm text-neutral-200">{u.displayName}</p>
                        )}
                        <p className={`text-sm ${u.displayName ? "text-neutral-500" : "font-medium text-neutral-200"}`}>
                          {u.email || "No Email Provided"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-400">{u.credits} credits</p>
                      {u.generationCount != null && (
                        <p className="text-xs text-neutral-600">{u.generationCount} generations</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
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
