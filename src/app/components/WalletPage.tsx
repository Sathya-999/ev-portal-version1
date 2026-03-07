import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Wallet,
  Plus,
  ArrowDownToLine,
  IndianRupee,
  History,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ScanLine,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  createRazorpayOrder,
  verifyPaymentSignature,
  formatINR,
} from "../utils/api";

// ─── Quick Top-up Amounts ─────────────────────────────────────
const TOPUP_OPTIONS = [100, 500, 1000, 2000];

// ─── UPI Apps ─────────────────────────────────────────────────
const UPI_APPS = [
  { name: "PhonePe", icon: "Pe", color: "#5F259F", handle: "@ybl" },
  { name: "Google Pay", icon: "G", color: "#4285F4", handle: "@okicici" },
  { name: "Paytm", icon: "₹", color: "#00BAF2", handle: "@paytm" },
];

type ModalStep = "SELECT" | "QR_SCAN" | "PROCESSING" | "SUCCESS" | "FAILED";

interface Transaction {
  id: string;
  date: string;
  type: string;
  station: string;
  amount: number;
  status: string;
  method?: string;
}

const WalletPage: React.FC = () => {
  // ─── State ────────────────────────────────────────────────────
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedApp, setSelectedApp] = useState(UPI_APPS[0]);
  const [modalStep, setModalStep] = useState<ModalStep>("SELECT");
  const [txnRef, setTxnRef] = useState("");

  // ─── Data Fetching ────────────────────────────────────────────
  const loadData = useCallback(async (preserveBalance = false) => {
    setLoading(true);
    try {
      const [walletData, txnData] = await Promise.all([
        fetchWalletBalance(),
        fetchWalletTransactions(),
      ]);
      // Only update balance if we got a valid response
      // preserveBalance flag prevents overwriting a known-good value
      if (!preserveBalance && walletData && typeof walletData.balance === "number") {
        setBalance(walletData.balance);
      }
      setTransactions(txnData ?? []);
    } catch (err) {
      console.error("[Wallet] loadData error:", err);
      // Don't show error toast on preserveBalance calls (background refresh)
      if (!preserveBalance) {
        toast.error("Failed to load wallet data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Add Money Handler ────────────────────────────────────────
  const handleAddMoney = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount < 1) {
      toast.error("Enter a valid amount (minimum ₹1)");
      return;
    }
    if (amount > 100000) {
      toast.error("Maximum ₹1,00,000 per transaction (RBI limit)");
      return;
    }

    setModalStep("QR_SCAN");

    try {
      const order = await createRazorpayOrder(amount, "Wallet Top-up");
      const ref = `EVWLT/${new Date().getFullYear()}/${order.id.slice(-8).toUpperCase()}`;
      setTxnRef(ref);

      // Simulate payment after 5s (in production, webhook confirms)
      setTimeout(async () => {
        setModalStep("PROCESSING");
        try {
          const payId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          console.log("[Wallet] Confirming payment...", { orderId: order.id, payId, amount });
          
          const result = await verifyPaymentSignature(order.id, payId, "sig_hmac_valid", amount);
          console.log("[Wallet] Payment confirmed:", result);

          // Immediately update balance from the confirmed response
          if (result && typeof result.walletBalance === "number") {
            console.log("[Wallet] Setting balance to:", result.walletBalance);
            setBalance(result.walletBalance);
          } else {
            console.warn("[Wallet] No walletBalance in response, fetching...");
            // Fallback: fetch balance directly if not in response
            try {
              const balanceData = await fetchWalletBalance();
              if (balanceData && typeof balanceData.balance === "number") {
                setBalance(balanceData.balance);
              }
            } catch (fetchErr) {
              console.error("[Wallet] Balance fetch failed:", fetchErr);
            }
          }

          setModalStep("SUCCESS");
          toast.success(`₹${amount} added to wallet!`);

          // Background refresh for transaction history (preserveBalance=true to not overwrite)
          loadData(true).catch((e) => console.error("[Wallet] Background refresh failed:", e));
        } catch (err) {
          console.error("[Wallet] Payment failed:", err);
          setModalStep("FAILED");
          toast.error("Payment failed. Amount NOT debited.");
        }
      }, 5000);
    } catch (e: any) {
      toast.error(e.message || "Could not create order");
      setModalStep("SELECT");
    }
  };

  const closeModal = () => {
    setShowAddMoney(false);
    setModalStep("SELECT");
    setCustomAmount("");
    setSelectedAmount(500);
    // Refresh transaction history only, preserve current balance
    loadData(true).catch(() => {});
  };

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;
  const upiPayString = `upi://pay?pa=evportal@ybl&pn=EV-PORTAL&am=${finalAmount}&cu=INR&tn=Wallet-Topup-${txnRef || "PENDING"}`;

  // ─── Transaction Type Helpers ─────────────────────────────────
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "TOPUP":
        return { label: "Top-up", icon: ArrowDownLeft, color: "text-green-600", bg: "bg-green-50" };
      case "CHARGING":
        return { label: "Charging", icon: Zap, color: "text-orange-600", bg: "bg-orange-50" };
      case "REFUND":
        return { label: "Refund", icon: RefreshCcw, color: "text-blue-600", bg: "bg-blue-50" };
      default:
        return { label: type, icon: ArrowUpRight, color: "text-gray-600", bg: "bg-gray-50" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold"><CheckCircle2 size={10} className="mr-1" />Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px] font-bold"><Clock size={10} className="mr-1" />Pending</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-bold"><XCircle size={10} className="mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: undefined });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ─── Page Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Wallet size={28} className="text-blue-600" />
              My Wallet
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your wallet balance and transactions</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
            <RefreshCcw size={14} className={loading ? "animate-spin mr-2" : "mr-2"} />
            Refresh
          </Button>
        </div>

        {/* ─── Balance Card ──────────────────────────────────── */}
        <Card className="overflow-hidden border-none shadow-xl">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white relative">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-10 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

            <div className="relative z-10">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest">
                Wallet Balance
              </p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-lg text-blue-200">₹</span>
                <span className="text-5xl font-black tracking-tight">
                  {loading ? (
                    <Loader2 size={40} className="animate-spin" />
                  ) : (
                    balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  )}
                </span>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowAddMoney(true)}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg"
                >
                  <Plus size={16} className="mr-2" />
                  Add Money
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-bold"
                  disabled
                  title="Coming soon"
                >
                  <ArrowDownToLine size={16} className="mr-2" />
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Quick Top-Up Strip ──────────────────────────────── */}
        <Card className="p-4 border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Top-Up</p>
          <div className="flex flex-wrap gap-3">
            {TOPUP_OPTIONS.map((amt) => (
              <Button
                key={amt}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-base px-6"
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount("");
                  setShowAddMoney(true);
                }}
              >
                <IndianRupee size={14} className="mr-1" />
                {amt.toLocaleString("en-IN")}
              </Button>
            ))}
          </div>
        </Card>

        {/* ─── Transaction History ──────────────────────────────── */}
        <Card className="border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <History size={20} className="text-gray-400" />
              Transaction History
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <History size={48} className="mb-3 opacity-40" />
              <p className="font-semibold">No transactions yet</p>
              <p className="text-sm mt-1">Add money to your wallet to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-[1fr_1fr_1.5fr_1fr_0.8fr] gap-4 px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">
                <span>Date</span>
                <span>Type</span>
                <span>Station</span>
                <span className="text-right">Amount</span>
                <span className="text-center">Status</span>
              </div>

              {transactions.map((txn) => {
                const typeInfo = getTypeInfo(txn.type);
                const TypeIcon = typeInfo.icon;
                const isCredit = txn.type === "TOPUP" || txn.type === "REFUND";

                return (
                  <div
                    key={txn.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr_1fr_0.8fr] gap-2 md:gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors items-center"
                  >
                    {/* Date */}
                    <div className="text-sm font-semibold text-gray-700">
                      {formatDate(txn.date)}
                    </div>

                    {/* Type */}
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${typeInfo.bg} flex items-center justify-center`}>
                        <TypeIcon size={14} className={typeInfo.color} />
                      </div>
                      <span className={`text-sm font-bold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>

                    {/* Station */}
                    <div className="text-sm text-gray-600 truncate">
                      {txn.type === "TOPUP" ? "Wallet Recharge" : txn.station || "—"}
                    </div>

                    {/* Amount */}
                    <div className={`text-sm font-black text-right ${isCredit ? "text-green-600" : "text-red-600"}`}>
                      {isCredit ? "+" : "-"}{formatINR(txn.amount)}
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      {getStatusBadge(txn.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ADD MONEY MODAL
          ═══════════════════════════════════════════════════════════ */}
      {showAddMoney && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.3)] border-none max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-white p-5 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <span className="text-lg font-black text-gray-900">Add Money</span>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* ── Step: SELECT AMOUNT ─────────────────────────── */}
              {modalStep === "SELECT" && (
                <div className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Amount</p>
                    <div className="grid grid-cols-2 gap-3">
                      {TOPUP_OPTIONS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                          className={`p-4 rounded-xl border-2 transition-all font-black text-lg ${
                            !customAmount && selectedAmount === amt
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          ₹{amt.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Or Enter Custom Amount</p>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                      <span className="px-4 text-gray-400 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="flex-1 py-3 pr-4 text-lg font-bold text-gray-900 outline-none bg-transparent"
                        min={1}
                        max={100000}
                      />
                    </div>
                  </div>

                  {/* UPI App Selection */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pay Using</p>
                    <div className="space-y-2">
                      {UPI_APPS.map((app) => (
                        <button
                          key={app.name}
                          onClick={() => setSelectedApp(app)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            selectedApp.name === app.name
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm"
                            style={{ backgroundColor: app.color }}
                          >
                            {app.icon}
                          </div>
                          <span className="font-bold text-gray-900">{app.name}</span>
                          <Smartphone size={16} className="ml-auto text-gray-300" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pay Button */}
                  <Button
                    onClick={handleAddMoney}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-lg shadow-blue-200"
                  >
                    <Plus size={20} className="mr-2" />
                    Add {formatINR(finalAmount)}
                  </Button>
                </div>
              )}

              {/* ── Step: QR SCAN ──────────────────────────────── */}
              {modalStep === "QR_SCAN" && (
                <div className="flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-500">Scan with {selectedApp.name}</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{formatINR(finalAmount)}</p>
                  </div>

                  <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                    <QRCodeSVG
                      value={upiPayString}
                      size={220}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${encodeURIComponent(selectedApp.color)}'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' dy='.35em' fill='white' font-size='16' font-weight='900' font-family='Arial'%3E${encodeURIComponent(selectedApp.icon)}%3C/text%3E%3C/svg%3E`,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                    <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_#3B82F6] animate-[scanBeam_2.5s_ease-in-out_infinite] z-10" />
                  </div>

                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    Waiting for payment confirmation...
                  </div>

                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <ScanLine size={12} /> Scan & pay via {selectedApp.name}
                  </p>
                </div>
              )}

              {/* ── Step: PROCESSING ───────────────────────────── */}
              {modalStep === "PROCESSING" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 size={48} className="animate-spin text-blue-500" />
                  <p className="text-lg font-bold text-gray-700">Verifying payment...</p>
                  <p className="text-sm text-gray-400">Transaction ref: {txnRef}</p>
                </div>
              )}

              {/* ── Step: SUCCESS ──────────────────────────────── */}
              {modalStep === "SUCCESS" && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Money Added!</h3>
                  <p className="text-green-600 font-bold text-2xl">{formatINR(finalAmount)}</p>
                  <p className="text-sm text-gray-400">has been credited to your wallet</p>
                  <Button onClick={closeModal} className="mt-4 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-8">
                    Done
                  </Button>
                </div>
              )}

              {/* ── Step: FAILED ───────────────────────────────── */}
              {modalStep === "FAILED" && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle size={48} className="text-red-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Payment Failed</h3>
                  <p className="text-sm text-gray-400">Amount was NOT debited from your account</p>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={closeModal}>Cancel</Button>
                    <Button onClick={() => setModalStep("SELECT")} className="bg-blue-600 hover:bg-blue-700 font-bold">
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <style>{`@keyframes scanBeam { 0%,100% { top: 10%; } 50% { top: 85%; } }`}</style>
    </DashboardLayout>
  );
};

export default WalletPage;
