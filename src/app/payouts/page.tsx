"use client";

import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, Euro, RefreshCw, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PayoutRequest {
  id: string;
  amount: number;
  paypalEmail: string;
  status: "pending" | "approved" | "rejected" | "completed";
  userId: string;
  createdAt: any;
  approvedAt?: any;
  rejectedAt?: any;
  docPath?: string;
}

function PayoutsContent() {
  const { makeRequest } = useAdminApi();
  const [pendingPayouts, setPendingPayouts] = useState<PayoutRequest[]>([]);
  const [historyPayouts, setHistoryPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds

  const fetchPayouts = async () => {
    try {
      const pending = await makeRequest("/admin/payouts/queue");
      const history = await makeRequest("/admin/payouts/history");
      setPendingPayouts(pending.payouts || []);
      setHistoryPayouts(history.payouts || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPayouts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleApprovePayout = async (payout: PayoutRequest) => {
    setApprovingId(payout.id);
    try {
      const userId = payout.docPath?.split("/")[1];
      await makeRequest(`/admin/payouts/${payout.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      alert("Payout approved! Processing PayPal transfer...");
      await fetchPayouts();
    } catch (error) {
      alert(`Failed to approve payout: ${(error as Error).message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectPayout = async (payout: PayoutRequest) => {
    setRejectingId(payout.id);
    try {
      const userId = payout.docPath?.split("/")[1];
      await makeRequest(`/admin/payouts/${payout.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      alert("Payout rejected");
      await fetchPayouts();
    } catch (error) {
      alert(`Failed to reject payout: ${(error as Error).message}`);
    } finally {
      setRejectingId(null);
    }
  };

  const handleCompletePayout = async (payout: PayoutRequest) => {
    setCompletingId(payout.id);
    try {
      const userId = payout.docPath?.split("/")[1];
      await makeRequest(`/admin/payouts/${payout.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      alert("Payout marked as completed!");
      await fetchPayouts();
    } catch (error) {
      alert(`Failed to complete payout: ${(error as Error).message}`);
    } finally {
      setCompletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

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
        <div className="flex items-center justify-between gap-4 mb-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:bg-neutral-800 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              Seller Payouts
            </h1>
          </div>

          {/* Refresh Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => fetchPayouts()}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Now
            </Button>

            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${
                autoRefresh
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-neutral-700 hover:bg-neutral-600"
              } text-white px-4 py-2 flex items-center gap-2`}
            >
              {autoRefresh ? (
                <>
                  <Clock className="w-4 h-4" />
                  Auto-Refresh On
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Auto-Refresh Off
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Info */}
        {lastUpdated && (
          <div className="mb-8 p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              {autoRefresh && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live updates enabled</span>
                </>
              )}
              {!autoRefresh && (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Manual refresh only</span>
                </>
              )}
            </div>
            <span className="text-xs text-neutral-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Pending Payouts Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-6 h-6 text-yellow-400" />
            <h2 className="text-3xl font-bold">Pending Approval</h2>
            <span className="ml-auto px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full font-bold">
              {pendingPayouts.length}
            </span>
          </div>

          {pendingPayouts.length === 0 ? (
            <Card className="p-12 text-center border-neutral-700 bg-neutral-950">
              <Euro className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 text-lg">No pending payouts</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPayouts.map((payout) => (
                <Card
                  key={payout.id}
                  className="p-6 border-neutral-700 bg-neutral-950/50 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500 mb-1">Email</p>
                          <p className="font-mono text-white">{payout.paypalEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 mb-1">Amount</p>
                          <p className="text-2xl font-bold text-green-400">€{payout.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500">
                        User ID: {payout.userId?.substring(0, 12)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Button
                        onClick={() => handleApprovePayout(payout)}
                        disabled={approvingId === payout.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-6"
                      >
                        {approvingId === payout.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRejectPayout(payout)}
                        disabled={rejectingId === payout.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-6"
                      >
                        {rejectingId === payout.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Reject"
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h2 className="text-3xl font-bold">History</h2>
            <span className="ml-auto px-4 py-2 bg-neutral-800 text-neutral-400 rounded-full font-bold">
              {historyPayouts.length}
            </span>
          </div>

          {historyPayouts.length === 0 ? (
            <Card className="p-12 text-center border-neutral-700 bg-neutral-950">
              <Euro className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 text-lg">No payout history</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {historyPayouts.map((payout) => (
                <Card
                  key={payout.id}
                  className="p-6 border-neutral-700 bg-neutral-950/30 hover:bg-neutral-900/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div>
                          <p className="text-sm text-neutral-500 mb-1">Email</p>
                          <p className="font-mono text-white">{payout.paypalEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 mb-1">Amount</p>
                          <p className="font-bold text-white">€{payout.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500">
                        User ID: {payout.userId?.substring(0, 12)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {getStatusBadge(payout.status)}
                      {payout.status === "approved" && (
                        <Button
                          onClick={() => handleCompletePayout(payout)}
                          disabled={completingId === payout.id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 text-sm"
                        >
                          {completingId === payout.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Mark Completed"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PayoutsPage() {
  return (
    <AdminAuthWrapper>
      <PayoutsContent />
    </AdminAuthWrapper>
  );
}
