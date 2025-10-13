// src/app/account/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

// --- Sub-components with Empty States ---
function UsageStats() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "generations"));
    const unsub = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach(doc => {
        const modelId = doc.data().modelId || "unknown";
        counts[modelId] = (counts[modelId] || 0) + 1;
      });
      setUsage(counts);
    });
    return () => unsub();
  }, [user]);

  // THE FIX: Production-ready empty state
  if (Object.keys(usage).length === 0) {
    return (
      <Card className="bg-[#1C1C1C] border-neutral-800 p-4 text-center text-neutral-400 text-sm">
        No usage data yet. <Link href="/explore" className="text-white underline">Start creating</Link> to see your stats.
      </Card>
    );
  }

  return (
    <div>
        <h2 className="font-semibold text-lg mb-4">Usage per model</h2>
        <div className="space-y-3">
            {Object.entries(usage).map(([modelId, count]) => (
                 <div key={modelId} className="flex justify-between items-center text-neutral-400">
                    <p className="capitalize">{modelId.replace(/-/g, ' ')}</p>
                    <p>{count} Generations</p>
                 </div>
            ))}
        </div>
    </div>
  );
}

function BillingHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "payments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  // THE FIX: Production-ready empty state
  if (history.length === 0) {
    return (
      <div>
        <h2 className="font-semibold text-lg mb-4">Billing History</h2>
        <Card className="bg-[#1C1C1C] border-neutral-800 p-4 text-center text-neutral-400 text-sm">
          No billing history found.
        </Card>
      </div>
    );
  }

  return (
     <div>
        <h2 className="font-semibold text-lg mb-4">Billing History</h2>
        <div className="space-y-4">
            {history.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <div>
                        <p>{item.createdAt?.toDate().toLocaleDateString()}</p>
                        <p className={`text-sm ${item.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {item.amount}€ Purchase - {item.status}
                        </p>
                    </div>
                    {item.status === 'paid' && <a href="#" className="text-sm text-white underline">Download PDF</a>}
                </div>
            ))}
        </div>
     </div>
  );
}

// --- Main Page Component ---
export default function AccountPage() {
    const { user, credits } = useAuth();

    if (!user) {
        return <div className="text-white text-center pt-48">Loading user profile...</div>;
    }

    const inputStyles = "bg-transparent border-0 border-b border-neutral-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-b-white";

    return (
        <div className="bg-black text-white min-h-screen pt-32">
            <div className="container mx-auto py-16">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-16 text-center sm:text-left">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex-shrink-0" />
                    <div>
                        <h1 className="text-4xl font-bold">{user.displayName || "User"}</h1>
                        <p className="text-neutral-400">{user.email}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 lg:gap-16">
                    <div className="lg:col-span-1 space-y-12 order-2 lg:order-1">
                        <UsageStats />
                        <div>
                            <p className="text-neutral-300">Want to get more done?</p>
                            <Link href="/pricing">
                              <Button variant="outline" className="mt-2 bg-white text-black font-semibold">Purchase more credits</Button>
                            </Link>
                        </div>
                    </div>
                    {/* THE FIX: Made responsive with text alignment and order changes */}
                    <div className="lg:col-span-2 order-1 lg:order-2 flex flex-col justify-between text-center md:text-right">
                       <div>
                            <p className="text-neutral-400">Active Plan</p>
                            <p className="text-4xl font-bold mb-4">Starter</p>
                            <p className="text-neutral-400">Remaining credits</p>
                            <p className="text-6xl font-bold">{credits}</p>
                       </div>
                    </div>
                </div>

                <Separator className="my-16 bg-neutral-800" />

                <div className="grid lg:grid-cols-2 gap-16">
                    <BillingHistory />
                    <div className="space-y-12">
                         <div>
                            <h2 className="font-semibold text-lg mb-4">Billing Information</h2>
                            <p className="text-sm text-neutral-400">Manage your payment details.</p>
                             <div className="space-y-4 mt-4">
                                <Input placeholder="Name On Card" className={inputStyles} />
                                {/* Display other billing info from Firestore if available */}
                             </div>
                         </div>
                         <div>
                            <h2 className="font-semibold text-lg mb-4">User Setting</h2>
                             <div className="space-y-4">
                                <Input placeholder="Name" defaultValue={user.displayName || ""} className={inputStyles} />
                                <Input placeholder="Email" defaultValue={user.email || ""} className={inputStyles} disabled />
                                <div className="flex justify-end gap-4 pt-4">
                                    <Button variant="ghost">Discard</Button>
                                    <Button className="bg-white text-black font-semibold">Save changes</Button>
                                </div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}