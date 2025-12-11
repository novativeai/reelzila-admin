"use client";

import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminApi } from "@/hooks/useAdminApi";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, Euro, RefreshCw, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface PayoutRequest {
  id: string;
  amount: number;
  paypalEmail: string;
  status: "pending" | "approved" | "rejected" | "completed";
  userId: string;
  createdAt: FirestoreTimestamp | string;
  approvedAt?: FirestoreTimestamp | string;
  rejectedAt?: FirestoreTimestamp | string;
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
  const refreshInterval = 10000; // 10 seconds

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
        <div className="flex items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:bg-neutral-800/50 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Seller Payouts
            </h1>
          </div>

          {/* Refresh Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchPayouts()}
              disabled={isLoading}
              className="bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-200 px-4 py-2 flex items-center gap-2 text-sm border border-neutral-700/50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>

            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${
                autoRefresh
                  ? "bg-neutral-700/50 text-neutral-200"
                  : "bg-neutral-800/30 text-neutral-400"
              } hover:bg-neutral-700/50 px-4 py-2 flex items-center gap-2 text-sm border border-neutral-700/50`}
            >
              {autoRefresh ? (
                <>
                  <Clock className="w-4 h-4" />
                  Auto On
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Auto Off
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
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-neutral-400" />
            <h2 className="text-xl font-semibold text-white">Pending Approval</h2>
            <span className="ml-auto px-3 py-1 bg-neutral-800/50 text-neutral-300 rounded-full text-sm font-medium">
              {pendingPayouts.length}
            </span>
          </div>

          {pendingPayouts.length === 0 ? (
            <Card className="p-10 text-center border-neutral-800/50 bg-neutral-900/30">
              <Euro className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">No pending payouts</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingPayouts.map((payout) => (
                <Card
                  key={payout.id}
                  className="p-5 border-neutral-800/50 bg-neutral-900/30 hover:bg-neutral-900/50 hover:border-neutral-700/50 transition-all"
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
                          <p className="text-xl font-semibold text-neutral-200">€{payout.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500">
                        User ID: {payout.userId?.substring(0, 12)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleApprovePayout(payout)}
                        disabled={approvingId === payout.id}
                        className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 text-sm"
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
                        className="bg-neutral-800 hover:bg-red-900/50 text-neutral-300 hover:text-red-300 px-4 text-sm border border-neutral-700/50"
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
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-5 h-5 text-neutral-400" />
            <h2 className="text-xl font-semibold text-white">History</h2>
            <span className="ml-auto px-3 py-1 bg-neutral-800/50 text-neutral-400 rounded-full text-sm font-medium">
              {historyPayouts.length}
            </span>
          </div>

          {historyPayouts.length === 0 ? (
            <Card className="p-10 text-center border-neutral-800/50 bg-neutral-900/30">
              <Euro className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">No payout history</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {historyPayouts.map((payout) => (
                <Card
                  key={payout.id}
                  className="p-4 border-neutral-800/50 bg-neutral-900/20 hover:bg-neutral-900/30 transition-all"
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
                          className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 text-sm"
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
