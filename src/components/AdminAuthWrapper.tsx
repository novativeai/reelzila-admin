"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AdminAuthWrapperProps {
  children: ReactNode;
}

// Cache admin status per user to avoid re-verifying on every page navigation
const adminCache = new Map<string, { verified: boolean; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export function clearAdminCache() {
  adminCache.clear();
}

// Check cache synchronously — avoids spinner flash on navigation
function isCachedAdmin(uid: string | undefined): boolean {
  if (!uid) return false;
  const cached = adminCache.get(uid);
  return !!cached && cached.verified && (Date.now() - cached.timestamp) < CACHE_TTL;
}

export const AdminAuthWrapper = ({ children }: AdminAuthWrapperProps) => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // If cache already confirms admin, skip the verifying state entirely
  const cachedOnMount = isCachedAdmin(user?.uid);
  const [isAdmin, setIsAdmin] = useState(cachedOnMount);
  const [isVerifying, setIsVerifying] = useState(!cachedOnMount);
  const verifiedRef = useRef(cachedOnMount);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Check cache — may have been set after mount
    if (isCachedAdmin(user.uid)) {
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

  // Only show loading on true cold start (no cache, first visit)
  if (isVerifying && !cachedOnMount) {
    return (
      <div className="bg-black min-h-screen">
        {/* Render nothing visible — page skeletons handle loading state */}
      </div>
    );
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  return null;
};
