"use client";

import { useAuth } from "@/context/AuthContext";
import { clearAdminCache } from "@/components/AdminAuthWrapper";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    clearAdminCache();
    await logout();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 text-sm font-medium rounded-lg border border-red-800/50 transition-colors flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  );
}
