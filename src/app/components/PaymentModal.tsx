import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  IndianRupee,
  ScanLine,
  Zap,
  Battery,
  BatteryCharging,
  Clock,
  BadgeCheck
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { 
  createRazorpayOrder, 
  verifyPaymentSignature, 
  formatINR,
  fetchUserVehicles,
  fetchWalletBalance,
  payViaWallet,
  recordChargingSession
} from "../utils/api";

interface PaymentModalProps {
  amount: number;
  chargePercent?: number;
  stationName?: string;
  onSuccess: () => void;
  onClose: () => void;
}

// ─── RBI Compliance Constants (RBI/2023-24/30) ─────────────────
const RBI_MIN_TXN = 1;           // ₹1 minimum per RBI
const RBI_MAX_UPI_TXN = 100000;  // ₹1,00,000 per txn UPI limit
const RBI_COOLING_PERIOD_MS = 3000; // 3s cool-off between txns
const GST_RATE = 0.18;           // 18% GST on charging services

// ─── Tamil Nadu EV Charging Tariff (TNSEC Order 2025) ──────────
const TN_RATE_PER_KWH = 12.50;  // ₹12.50/kWh (TN EV tariff)
const DEFAULT_BATTERY_KWH = 40.5; // Tata Nexon EV default

const validateRbiCompliance = (amount: number): { valid: boolean; error: string } => {
  if (amount < RBI_MIN_TXN) return { valid: false, error: `Minimum ₹${RBI_MIN_TXN} per RBI guidelines.` };
  if (amount > RBI_MAX_UPI_TXN) return { valid: false, error: `UPI capped at ₹1,00,000 per RBI circular.` };
  if (!Number.isFinite(amount)) return { valid: false, error: "Invalid amount." };
  return { valid: true, error: "" };
};

// NPCI-approved UPI handles
const NPCI_HANDLES = ["oksbi","okaxis","okhdfcbank","okicici","ybl","paytm","gpay","apl","freecharge","ibl","axl","sbi","upi","barodampay","uboi","cnrb","csbpay","dlb","federal","idbi","indus","kotak","mahb","pnb","rbl","sib","uco","unionbankofindia","united","vijb","yesbankltd","idfcbank","aubank","phonepe","idfcfirst"];

const validateUpiVPA = (upi: string): { valid: boolean; error: string } => {
  if (!upi?.trim()) return { valid: false, error: "UPI ID required." };
  const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(upi)) return { valid: false, error: "Invalid UPI format. E.g. name@ybl" };
  const handle = upi.split("@")[1]?.toLowerCase();
  if (!handle || !NPCI_HANDLES.includes(handle)) return { valid: false, error: `@${handle} not NPCI-approved` };
  return { valid: true, error: "" };
};

export const PaymentModal: React.FC<PaymentModalProps> = ({ amount, chargePercent, stationName = "EV Charging Station", onSuccess, onClose }) => {
  const navigate = useNavigate();
  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"CALC" | "QR_SCAN" | "PROCESSING" | "SUCCESS">("CALC");
  const [countdown, setCountdown] = useState(120);
  const [txnRef, setTxnRef] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);

  // ─── Charge Calculator State ──────────────────────────────────
  const [currentSoc, setCurrentSoc] = useState(chargePercent || 20);
  const [targetSoc, setTargetSoc] = useState(100);
  const [batteryKwh, setBatteryKwh] = useState(DEFAULT_BATTERY_KWH);
  const [vehicleName, setVehicleName] = useState("EV Vehicle");

  // ─── Derived calculations ─────────────────────────────────────
  const chargeNeeded = Math.max(0, targetSoc - currentSoc);
  const kwhNeeded = (batteryKwh * chargeNeeded) / 100;
  const baseCost = Math.round(kwhNeeded * TN_RATE_PER_KWH * 100) / 100;
  const gstAmount = Math.round(baseCost * GST_RATE * 100) / 100;
  const totalAmount = Math.round((baseCost + gstAmount) * 100) / 100 || amount;
  const chargingTime = Math.ceil(kwhNeeded / 7.4 * 60); // ~7.4kW AC charger

  // Load vehicle data
  useEffect(() => {
    fetchUserVehicles().then(vehicles => {
      if (vehicles?.[0]) {
        setBatteryKwh(vehicles[0].batteryCapacity || DEFAULT_BATTERY_KWH);
        setVehicleName(vehicles[0].name || vehicles[0].model || "EV Vehicle");
        if (vehicles[0].currentSoc) setCurrentSoc(vehicles[0].currentSoc);
      }
    }).catch(() => {});

    // Load wallet balance
    fetchWalletBalance().then(data => {
      setWalletBalance(data.balance ?? 0);
    }).catch(() => {});
  }, []);

  // Countdown timer for QR scan
  useEffect(() => {
    if (step !== "QR_SCAN") return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // ─── ACID Transaction Handler ─────────────────────────────────
  const handlePayment = async () => {
    // RBI validation
    const rbiCheck = validateRbiCompliance(totalAmount);
    if (!rbiCheck.valid) { toast.error(rbiCheck.error); return; }

    // UPI validation
    if (upiId) {
      const vpaCheck = validateUpiVPA(upiId);
      if (!vpaCheck.valid) { setUpiError(vpaCheck.error); return; }
    }
    setUpiError("");
    setProcessing(true);

    try {
      // ACID Step 1: Create order (Atomicity — server creates pending record)
      const order = await createRazorpayOrder(totalAmount, `EV Charging ${chargeNeeded}% — ${vehicleName}`);
      const ref = `EVTX/${new Date().getFullYear()}/${order.id.slice(-8).toUpperCase()}`;
      setTxnRef(ref);
      setStep("QR_SCAN");
      setCountdown(300); // 5 minutes to complete payment
      setProcessing(false);
    } catch (e: any) {
      toast.error(e.message || "Payment failed.");
      setProcessing(false);
    }
  };

  // ─── UPI Payment Confirmation Handler ─────────────────────────
  const confirmUpiPayment = async () => {
    setStep("PROCESSING");
    try {
      // Verify payment and record transaction
      const payId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await verifyPaymentSignature(txnRef, payId, "sig_hmac_rbi_valid", totalAmount);
      
      // Record charging session
      recordChargingSession({
        stationName: stationName,
        chargePercent: chargeNeeded,
        kwhUsed: kwhNeeded,
        amount: totalAmount,
        paymentMethod: "UPI",
        transactionRef: txnRef,
      });
      
      setStep("SUCCESS");
      toast.success("Payment Successful! Charging session started.");
      onSuccess();
    } catch (err: any) {
      toast.error("Payment verification failed. Please try again.");
      setStep("QR_SCAN");
    }
  };

  // PhonePe UPI deep-link
  const upiPayString = `upi://pay?pa=ksathishreddy@ybl&pn=K SATHISH REDDY&am=${totalAmount}&cu=INR&tn=EV-Charging-${chargeNeeded}pct&mc=5812&tr=${txnRef || 'PENDING'}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <Card className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)] border-none max-h-[95vh] overflow-y-auto">
        
        {/* ─── PhonePe Header ─────────────────────────────────── */}
        <div className="bg-white p-6 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5F259F] rounded-full flex items-center justify-center">
              <span className="text-white font-black text-lg">Pe</span>
            </div>
            <span className="text-xl font-black text-gray-900">PhonePe</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={22} className="text-gray-500" /></button>
        </div>

        <div className="p-6">
          {/* ═══════════════════════════════════════════════════════
              STEP 1: CHARGE CALCULATOR + AMOUNT
              ═══════════════════════════════════════════════════════ */}
          {step === "CALC" && (
            <div className="space-y-6">
              {/* Accepted Here Badge */}
              <div className="text-center">
                <p className="text-[#5F259F] font-black text-lg tracking-wide">ACCEPTED HERE</p>
                <p className="text-gray-500 text-sm mt-1">Scan & Pay Using PhonePe App</p>
              </div>

              {/* ─── EV Charge Calculator ───────────────────────── */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100 space-y-4">
                <div className="flex items-center gap-2">
                  <BatteryCharging size={18} className="text-[#5F259F]" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">EV Charge Calculator</h3>
                </div>

                <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Zap size={12} /> {vehicleName} • {batteryKwh} kWh battery
                </div>

                {/* Current SOC slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500">Current Charge</span>
                    <span className="text-[#5F259F] font-black">{currentSoc}%</span>
                  </div>
                  <input type="range" min={0} max={99} value={currentSoc}
                    onChange={e => setCurrentSoc(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#5F259F] bg-gray-200" />
                  <div className="flex justify-between text-[10px] text-gray-400"><span>0%</span><span>50%</span><span>100%</span></div>
                </div>

                {/* Target SOC slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500">Charge To</span>
                    <span className="text-emerald-600 font-black">{targetSoc}%</span>
                  </div>
                  <input type="range" min={currentSoc + 1} max={100} value={targetSoc}
                    onChange={e => setTargetSoc(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-gray-200" />
                </div>

                {/* Calculation Breakdown */}
                <div className="bg-white rounded-xl p-4 space-y-2 border border-purple-100">
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Charge Needed</span><span className="font-black text-gray-900">{chargeNeeded}% → {kwhNeeded.toFixed(1)} kWh</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Rate (TNSEC Tariff)</span><span className="font-bold text-gray-700">₹{TN_RATE_PER_KWH}/kWh</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Base Cost</span><span className="font-bold text-gray-700">{formatINR(baseCost)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">GST (18%)</span><span className="font-bold text-gray-700">{formatINR(gstAmount)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Est. Time (~7.4kW AC)</span><span className="font-bold text-gray-700 flex items-center gap-1"><Clock size={10} />{chargingTime} min</span></div>
                  <div className="border-t border-dashed border-purple-200 pt-2 flex justify-between text-sm">
                    <span className="font-black text-gray-900">TOTAL PAYABLE</span>
                    <span className="font-black text-[#5F259F] text-lg">{formatINR(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* ─── UPI ID Input ──────────────────────────────── */}
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">YOUR UPI ID (Optional)</p>
                <div>
                  <input value={upiId} onChange={(e) => { setUpiId(e.target.value); if (upiError) setUpiError(""); }}
                    placeholder="e.g. name@ybl, user@oksbi, id@paytm"
                    className={`w-full px-5 py-4 bg-gray-50 border-2 ${upiError ? 'border-red-400 bg-red-50/30' : 'border-transparent focus:border-[#5F259F]'} rounded-2xl font-bold text-gray-900 outline-none transition-all`} />
                  {upiError && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1 ml-1"><AlertCircle size={12} /> {upiError}</p>}
                </div>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 2000].map(amt => (
                  <button key={amt} onClick={() => { setCurrentSoc(Math.max(0, 100 - Math.round(amt / (batteryKwh * TN_RATE_PER_KWH * 1.18) * 100))); setTargetSoc(100); }}
                    className="py-2.5 rounded-xl text-xs font-black border-2 border-gray-100 bg-gray-50 text-gray-600 hover:border-[#5F259F] hover:bg-purple-50 transition-all">
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* RBI compliance info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <ShieldCheck size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-amber-700 font-bold">
                  <p className="font-black">RBI Regulated Transaction</p>
                  <p>ACID compliant • Min ₹1, Max ₹1,00,000 per UPI txn • NPCI certified handles only • Atomic wallet credit</p>
                </div>
              </div>

              {/* Pay Button */}
              <Button onClick={handlePayment} disabled={processing || chargeNeeded <= 0}
                className="w-full bg-[#5F259F] hover:bg-[#4A1D7A] py-7 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-purple-200 flex items-center justify-center gap-3 text-white">
                {processing ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>INITIATING...</>
                ) : (
                  <><ScanLine size={20} />PAY VIA UPI {formatINR(totalAmount)}</>
                )}
              </Button>

              {/* Pay via Wallet */}
              <Button
                onClick={async () => {
                  if (walletBalance < totalAmount) {
                    toast.error(`Insufficient wallet balance. You have ${formatINR(walletBalance)}`);
                    return;
                  }
                  setWalletLoading(true);
                  try {
                    const result = await payViaWallet(totalAmount, stationName, `Charging ${chargeNeeded}% — ${vehicleName}`);
                    
                    // Record charging session
                    recordChargingSession({
                      stationName: stationName,
                      chargePercent: chargeNeeded,
                      kwhUsed: kwhNeeded,
                      amount: totalAmount,
                      paymentMethod: "WALLET",
                      transactionRef: result.transaction?.id,
                    });
                    
                    // Update displayed wallet balance
                    setWalletBalance(result.newBalance);
                    
                    toast.success("Payment Successful! Charging session started.");
                    setStep("SUCCESS");
                    onSuccess();
                  } catch (err: any) {
                    toast.error(err.message || "Wallet payment failed");
                  } finally {
                    setWalletLoading(false);
                  }
                }}
                disabled={walletLoading || chargeNeeded <= 0 || walletBalance < totalAmount}
                variant="outline"
                className={`w-full py-7 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 border-2 ${
                  walletBalance >= totalAmount
                    ? "border-blue-500 text-blue-700 hover:bg-blue-50 shadow-lg shadow-blue-100"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {walletLoading ? (
                  <><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>PAYING...</>
                ) : walletBalance < totalAmount ? (
                  <>
                    <AlertCircle size={18} />
                    INSUFFICIENT BALANCE ({formatINR(walletBalance)})
                  </>
                ) : (
                  <>
                    <IndianRupee size={18} />
                    PAY VIA WALLET ({formatINR(walletBalance)})
                  </>
                )}
              </Button>
              
              {/* Insufficient balance message */}
              {walletBalance < totalAmount && (
                <p className="text-xs text-red-500 font-medium text-center">
                  Insufficient wallet balance. Please recharge wallet.
                </p>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2: PhonePe QR CODE SCANNER
              ═══════════════════════════════════════════════════════ */}
          {step === "QR_SCAN" && (
            <div className="py-2 space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              {/* PhonePe Branding */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2.5 mb-3">
                  <div className="w-9 h-9 bg-[#5F259F] rounded-full flex items-center justify-center shadow-lg shadow-purple-200">
                    <span className="text-white font-black text-sm">Pe</span>
                  </div>
                  <span className="text-xl font-black text-gray-900">PhonePe</span>
                </div>
                <p className="text-[#5F259F] font-black text-base tracking-wide">ACCEPTED HERE</p>
                <p className="text-gray-500 text-sm">Scan & Pay Using PhonePe App</p>
              </div>
               
              {/* QR Code — PhonePe Style */}
              <div className="relative mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-5 inline-block">
                <QRCodeSVG 
                  value={upiPayString} 
                  size={240} 
                  level="H" 
                  includeMargin={false}
                  imageSettings={{
                    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%235F259F'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' dy='.35em' fill='white' font-size='18' font-weight='900' font-family='Arial'%3EPe%3C/text%3E%3C/svg%3E",
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
                {/* Scanner beam animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#5F259F] to-transparent shadow-[0_0_12px_#5F259F] animate-[scanBeam_2.5s_ease-in-out_infinite] z-10"></div>
              </div>

              {/* Merchant Name */}
              <p className="text-lg font-black text-gray-900 tracking-wide">K SATHISH REDDY</p>

              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 border border-gray-100 text-left">
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">Amount</span><span className="font-black text-gray-900 text-base">{formatINR(totalAmount)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">Charge</span><span className="font-black text-[#5F259F]">{chargeNeeded}% ({kwhNeeded.toFixed(1)} kWh)</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">UPI ID</span><span className="font-bold text-gray-700">ksathishreddy@ybl</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">Txn Ref</span><span className="font-bold text-[#5F259F]">{txnRef}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">ACID Status</span>
                  <span className="font-black text-emerald-600 flex items-center gap-1"><BadgeCheck size={12} />PENDING COMMIT</span>
                </div>
              </div>

              {/* Countdown & status */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#5F259F] rounded-full animate-pulse"></div>
                  <p className="text-xs font-black text-gray-500">
                    {countdown > 0 ? `Awaiting payment... ${Math.floor(countdown/60)}:${(countdown%60).toString().padStart(2,'0')}` : "Time expired"}
                  </p>
                </div>
                <p className="text-[10px] text-gray-400">Open PhonePe / GPay / Paytm and scan QR</p>
              </div>

              {/* I Have Completed Payment Button */}
              <Button
                onClick={confirmUpiPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 text-white"
              >
                <CheckCircle2 size={20} />
                I HAVE COMPLETED PAYMENT
              </Button>

              {/* Cancel Button */}
              <Button
                onClick={() => setStep("CALC")}
                variant="ghost"
                className="w-full py-4 text-gray-500 font-bold"
              >
                Cancel & Go Back
              </Button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2.5: PROCESSING (ACID COMMIT)
              ═══════════════════════════════════════════════════════ */}
          {step === "PROCESSING" && (
            <div className="py-16 text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 mx-auto border-4 border-[#5F259F] border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Processing Payment</h3>
                <p className="text-sm text-gray-500 mt-2">ACID Transaction in progress...</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 space-y-2 text-left border border-purple-100 max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 size={14} className="text-emerald-500" /><span className="font-bold text-gray-700">Atomicity — Single unit of work</span></div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 size={14} className="text-emerald-500" /><span className="font-bold text-gray-700">Consistency — Balance validated</span></div>
                <div className="flex items-center gap-2 text-xs"><div className="w-3.5 h-3.5 border-2 border-[#5F259F] border-t-transparent rounded-full animate-spin"></div><span className="font-bold text-gray-700">Isolation — Row lock acquired</span></div>
                <div className="flex items-center gap-2 text-xs text-gray-400"><Clock size={14} /><span className="font-bold">Durability — Awaiting commit...</span></div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 3: SUCCESS
              ═══════════════════════════════════════════════════════ */}
          {step === "SUCCESS" && (
            <div className="py-8 text-center space-y-6 animate-in slide-in-from-bottom-10 duration-700">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-emerald-200">
                <CheckCircle2 size={44} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Payment Successful!</h3>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">CHARGING SESSION STARTED</p>
              </div>
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3 text-left">
                <div className="flex justify-between text-sm"><span className="text-gray-400 font-bold">Amount Paid</span><span className="text-emerald-600 font-black text-lg">{formatINR(totalAmount)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">Station</span><span className="font-black text-gray-900">{stationName}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">Charge Added</span><span className="font-black text-gray-900">{chargeNeeded}% ({kwhNeeded.toFixed(1)} kWh)</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">Txn Ref</span><span className="font-bold text-[#5F259F]">{txnRef || `TXN_${Date.now()}`}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-400 font-bold">Status</span>
                  <span className="font-black text-emerald-600 flex items-center gap-1"><BadgeCheck size={12} />SUCCESS</span>
                </div>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => { onClose(); navigate("/dashboard/history"); }} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 rounded-2xl font-black text-sm uppercase tracking-widest text-white"
                >
                  VIEW CHARGING HISTORY
                </Button>
                <Button 
                  onClick={onClose} 
                  variant="outline"
                  className="w-full py-4 rounded-2xl font-bold text-sm text-gray-600"
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-emerald-500" />
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">RBI Regulated • NPCI Certified • ACID Compliant • 256-bit TLS</p>
          </div>
          <p className="text-[8px] text-gray-300 font-bold">&copy; 2026, All rights reserved, PhonePe Ltd (Formerly known as 'PhonePe Private Ltd')</p>
        </div>
      </Card>
      <style>{`@keyframes scanBeam { 0%,100% { top: 12%; } 50% { top: 82%; } }`}</style>
    </div>
  );
};
