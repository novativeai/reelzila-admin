"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AdminAuthWrapperProps {
  children: ReactNode;
}

// Cache admin status per user to avoid re-verifying on every page navigation
const adminCache = new Map<string, { verified: boolean; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export function clearAdminCache() {
  adminCache.clear();
}

export const AdminAuthWrapper = ({ children }: AdminAuthWrapperProps) => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    // Check cache first — skip Firestore read if recently verified
    const cached = adminCache.get(user.uid);
    if (cached && cached.verified && (Date.now() - cached.timestamp) < CACHE_TTL) {
      setIsAdmin(true);
      setIsVerifying(false);
      verifiedRef.current = true;
      return;
    }

    // Skip if already verified in this mount
    if (verifiedRef.current) return;

    const verifyAdmin = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        setIsAdmin(true);
        adminCache.set(user.uid, { verified: true, timestamp: Date.now() });
        verifiedRef.current = true;
      } else {
        alert("Access Denied. You are not an administrator.");
        router.push("/login");
      }
      setIsVerifying(false);
    };

    verifyAdmin();
  }, [user, authLoading, router]);

  if (isVerifying || authLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12" />
        <p className="mt-4 text-neutral-400">Verifying administrator access...</p>
      </div>
    );
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  return null;
};
