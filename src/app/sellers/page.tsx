"use client";

import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Users, Ban, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface Seller {
  userId: string;
  email: string;
  displayName: string;
  status: "unverified" | "verified" | "suspended" | "banned";
  paypalEmail?: string;
  verificationDate?: FirestoreTimestamp | string;
  suspensionReason?: string;
  suspendedAt?: FirestoreTimestamp | string;
}

interface SellersStats {
  sellers: Seller[];
  count: number;
  verified: number;
  unverified: number;
  suspended: number;
}

function SellersContent() {
  const { makeRequest } = useAdminApi();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState<SellersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>("");
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "verified" | "unverified" | "suspended">("all");

  const fetchSellers = async () => {
    try {
      const response = await makeRequest("/admin/sellers");
      setStats(response);
      setSellers(response.sellers || []);
    } catch (error) {
      console.error("Failed to fetch sellers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleVerifySeller = async (userId: string) => {
    setActioningId(userId);
    try {
      await makeRequest(`/admin/seller/${userId}/verify`, {
        method: "POST",
      });
      alert("Seller verified successfully!");
      await fetchSellers();
    } catch (error) {
      alert(`Failed to verify seller: ${(error as Error).message}`);
    } finally {
      setActioningId(null);
    }
  };

  const handleSuspendSeller = async (userId: string) => {
    if (!suspendReason.trim()) {
      alert("Please enter a suspension reason");
      return;
    }

    setActioningId(userId);
    try {
      await makeRequest(`/admin/seller/${userId}/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason: suspendReason }),
      });
      alert("Seller suspended successfully!");
      setSuspendModalOpen(false);
      setSuspendReason("");
      setSelectedSellerId(null);
      await fetchSellers();
    } catch (error) {
      alert(`Failed to suspend seller: ${(error as Error).message}`);
    } finally {
      setActioningId(null);
    }
  };

  const handleUnsuspendSeller = async (userId: string) => {
    setActioningId(userId);
    try {
      await makeRequest(`/admin/seller/${userId}/unsuspend`, {
        method: "POST",
      });
      alert("Seller unsuspended successfully!");
      await fetchSellers();
    } catch (error) {
      alert(`Failed to unsuspend seller: ${(error as Error).message}`);
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case "unverified":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
            <AlertCircle className="w-3 h-3" />
            Unverified
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
            <Ban className="w-3 h-3" />
            Suspended
          </span>
        );
      default:
        return null;
    }
  };

  const filteredSellers = sellers.filter((seller) => {
    if (filter === "all") return true;
    return seller.status === filter;
  });

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
        {/* Header */}
        <div className="flex items-center gap-4 mb-16">
          <Link href="/" className="hover:bg-neutral-800 p-2 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            Seller Management
          </h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <Card className="p-6 border-neutral-700 bg-neutral-950">
              <p className="text-sm text-neutral-500 mb-2">Total Sellers</p>
              <p className="text-3xl font-bold">{stats.count}</p>
            </Card>
            <Card className="p-6 border-neutral-700 bg-neutral-950">
              <p className="text-sm text-neutral-500 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Verified
              </p>
              <p className="text-3xl font-bold text-green-400">{stats.verified}</p>
            </Card>
            <Card className="p-6 border-neutral-700 bg-neutral-950">
              <p className="text-sm text-neutral-500 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                Unverified
              </p>
              <p className="text-3xl font-bold text-yellow-400">{stats.unverified}</p>
            </Card>
            <Card className="p-6 border-neutral-700 bg-neutral-950">
              <p className="text-sm text-neutral-500 mb-2 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" />
                Suspended
              </p>
              <p className="text-3xl font-bold text-red-400">{stats.suspended}</p>
            </Card>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {(["all", "verified", "unverified", "suspended"] as const).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? "default" : "outline"}
              className={filter === f ? "bg-blue-600 hover:bg-blue-700" : "border-neutral-700 text-neutral-300 hover:text-white"}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Sellers List */}
        <div className="space-y-4">
          {filteredSellers.length === 0 ? (
            <Card className="p-12 text-center border-neutral-700 bg-neutral-950">
              <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 text-lg">No sellers found</p>
            </Card>
          ) : (
            filteredSellers.map((seller) => (
              <Card key={seller.userId} className="p-6 border-neutral-700 bg-neutral-950/50 hover:bg-neutral-900/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-white truncate">{seller.displayName}</p>
                      {getStatusBadge(seller.status)}
                    </div>
                    <p className="text-sm text-neutral-400 mb-2">{seller.email}</p>
                    {seller.paypalEmail && (
                      <p className="text-sm text-neutral-500">PayPal: {seller.paypalEmail}</p>
                    )}
                    {seller.suspensionReason && (
                      <p className="text-sm text-red-400 mt-2">
                        <strong>Reason:</strong> {seller.suspensionReason}
                      </p>
                    )}
                    <p className="text-xs text-neutral-600 mt-2">ID: {seller.userId.substring(0, 12)}...</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {seller.status === "unverified" && (
                      <Button
                        onClick={() => handleVerifySeller(seller.userId)}
                        disabled={actioningId === seller.userId}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                      >
                        {actioningId === seller.userId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                    )}

                    {seller.status === "verified" && (
                      <Button
                        onClick={() => {
                          setSelectedSellerId(seller.userId);
                          setSuspendModalOpen(true);
                        }}
                        disabled={actioningId === seller.userId || suspendModalOpen}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                      >
                        {actioningId === seller.userId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Ban className="w-3 h-3 mr-1" />
                            Suspend
                          </>
                        )}
                      </Button>
                    )}

                    {seller.status === "suspended" && (
                      <Button
                        onClick={() => handleUnsuspendSeller(seller.userId)}
                        disabled={actioningId === seller.userId}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                      >
                        {actioningId === seller.userId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Unsuspend
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Suspension Modal */}
      {suspendModalOpen && selectedSellerId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 border-neutral-700 bg-neutral-950">
            <h2 className="text-xl font-bold mb-4">Suspend Seller Account</h2>
            <p className="text-sm text-neutral-400 mb-4">
              Please provide a reason for suspending this seller account
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter suspension reason..."
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 mb-4 text-sm focus:outline-none focus:border-blue-500"
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setSuspendModalOpen(false);
                  setSuspendReason("");
                  setSelectedSellerId(null);
                }}
                variant="outline"
                className="flex-1 border-neutral-700 text-neutral-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSuspendSeller(selectedSellerId)}
                disabled={!suspendReason.trim() || actioningId === selectedSellerId}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {actioningId === selectedSellerId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Suspend"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SellersPage() {
  return (
    <AdminAuthWrapper>
      <SellersContent />
    </AdminAuthWrapper>
  );
}
