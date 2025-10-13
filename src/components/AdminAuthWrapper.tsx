"use client";

import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AdminAuthWrapperProps {
  children: ReactNode;
}

export const AdminAuthWrapper = ({ children }: AdminAuthWrapperProps) => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const verifyAdmin = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        setIsAdmin(true);
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