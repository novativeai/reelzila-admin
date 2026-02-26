"use client";

import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminApi } from "@/hooks/useAdminApi";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, Euro, RefreshCw, Pause, Building2, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface BankDetails {
  iban?: string;
  accountHolder?: string;
  bankName?: string;
  bic?: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  bankDetails?: BankDetails;
  status: "pending" | "approved" | "rejected" | "completed";
  userId: string;
  userEmail?: string;
  requestedAt: FirestoreTimestamp | string;
  approvedAt?: FirestoreTimestamp | string;
  rejectedAt?: FirestoreTimestamp | string;
  completedAt?: FirestoreTimestamp | string;
  docPath?: string;
}

// Format IBAN with spaces for readability
function formatIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

function PayoutsContent() {
  const { makeRequest } = useAdminApi();
  const { user } = useAuth();
  const [pendingPayouts, setPendingPayouts] = useState<PayoutRequest[]>([]);
  const [historyPayouts, setHistoryPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [pendingData, historyData] = await Promise.all([
        makeRequest("/admin/payouts/queue"),
        makeRequest("/admin/payouts/history"),
      ]);
      setPendingPayouts(pendingData.payouts || []);
      setHistoryPayouts(historyData.payouts || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest, user]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Pause polling while an action is in-flight
  const isActioning = approvingId !== null || rejectingId !== null || completingId !== null;

  useEffect(() => {
    if (!autoRefresh || isActioning) return;

    const interval = setInterval(fetchPayouts, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, isActioning, fetchPayouts]);

  const handleCopyIban = (iban: string, payoutId: string) => {
    navigator.clipboard.writeText(iban.replace(/\s/g, ''));
    setCopiedIban(payoutId);
    setTimeout(() => setCopiedIban(null), 2000);
  };

  const handleApprovePayout = async (payout: PayoutRequest) => {
    setApprovingId(payout.id);
    try {
      const userId = payout.docPath?.split("/")[1];
      await makeRequest(`/admin/payouts/${payout.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      alert("Payout approved! Please process the bank transfer manually.");
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

  const renderBankDetails = (payout: PayoutRequest, showCopyButton: boolean = true) => {
    const bank = payout.bankDetails;
    if (!bank?.iban) {
      return <p className="text-neutral-500 text-sm">No bank details provided</p>;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-white">{bank.accountHolder || "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-xs text-neutral-500 mb-1">IBAN</p>
            <p className="font-mono text-white text-sm">{formatIBAN(bank.iban)}</p>
          </div>
          {showCopyButton && (
            <Button
              onClick={() => handleCopyIban(bank.iban!, payout.id)}
              size="sm"
              variant="ghost"
              className="text-neutral-400 hover:text-white"
            >
              {copiedIban === payout.id ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
        {bank.bankName && (
          <div>
            <p className="text-xs text-neutral-500">Bank</p>
            <p className="text-neutral-300 text-sm">{bank.bankName}</p>
          </div>
        )}
        {bank.bic && (
          <div>
            <p className="text-xs text-neutral-500">BIC/SWIFT</p>
            <p className="font-mono text-neutral-300 text-sm">{bank.bic}</p>
          </div>
        )}
      </div>
    );
  };

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

          {/* Controls */}
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
            <AdminHeader />
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

        {/* Instructions */}
        <Card className="mb-8 p-4 border-blue-700/50 bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-200 font-medium mb-1">Bank Transfer Workflow</p>
              <p className="text-xs text-blue-200/70">
                1. Review the payout request and verify the bank details<br />
                2. Click &quot;Approve&quot; to mark as approved<br />
                3. Process the bank transfer manually using your banking system<br />
                4. Click &quot;Mark Completed&quot; once the transfer is done
              </p>
            </div>
          </div>
        </Card>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-700 rounded-xl">
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={() => fetchPayouts()}
              className="mt-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pending Payouts Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-neutral-400" />
            <h2 className="text-xl font-semibold text-white">Pending Approval</h2>
            <span className="ml-auto px-3 py-1 bg-neutral-800/50 text-neutral-300 rounded-full text-sm font-medium">
              {isLoading ? "..." : pendingPayouts.length}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="p-5 border-neutral-800/50 bg-neutral-900/30">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-48 bg-neutral-800" />
                      <Skeleton className="h-4 w-64 bg-neutral-800" />
                      <Skeleton className="h-4 w-32 bg-neutral-800" />
                    </div>
                    <Skeleton className="h-9 w-24 bg-neutral-800" />
                  </div>
                </Card>
              ))}
            </div>
          ) : pendingPayouts.length === 0 ? (
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
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {/* Bank Details */}
                      <div className="mb-4">
                        {renderBankDetails(payout)}
                      </div>
                      {/* User Info */}
                      <div className="text-xs text-neutral-500 space-y-1">
                        {payout.userEmail && <p>Email: {payout.userEmail}</p>}
                        <p>User ID: {payout.userId?.substring(0, 12)}...</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-neutral-500 mb-1">Amount</p>
                        <p className="text-2xl font-bold text-[#D4FF4F]">€{payout.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleApprovePayout(payout)}
                          disabled={approvingId === payout.id}
                          className="bg-green-700 hover:bg-green-600 text-white px-4 text-sm"
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
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {/* Bank Details */}
                      <div className="mb-3">
                        {renderBankDetails(payout, payout.status === "approved")}
                      </div>
                      {/* User Info */}
                      <p className="text-xs text-neutral-500">
                        User ID: {payout.userId?.substring(0, 12)}...
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">€{payout.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payout.status)}
                        {payout.status === "approved" && (
                          <Button
                            onClick={() => handleCompletePayout(payout)}
                            disabled={completingId === payout.id}
                            className="bg-green-700 hover:bg-green-600 text-white px-4 text-sm"
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
