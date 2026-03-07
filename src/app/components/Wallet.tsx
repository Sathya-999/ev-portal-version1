import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Wallet as WalletIcon, Plus, RefreshCw, ArrowUpCircle, ArrowDownCircle, CheckCircle2, X, QrCode, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  date: string;
  type: "TOPUP" | "CHARGE";
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
}

type PaymentMethod = "phonepe" | "googlepay" | "paytm" | "upi" | null;
type ModalStep = "select-method" | "show-qr" | null;

const WALLET_STORAGE_KEY = "ev_portal_wallet";
const TRANSACTIONS_STORAGE_KEY = "ev_portal_transactions";

const PAYMENT_METHODS = [
  { id: "phonepe" as const, name: "PhonePe", color: "bg-purple-600", icon: "📱" },
  { id: "googlepay" as const, name: "Google Pay", color: "bg-blue-500", icon: "💳" },
  { id: "paytm" as const, name: "Paytm", color: "bg-sky-500", icon: "📲" },
  { id: "upi" as const, name: "UPI ID", color: "bg-green-600", icon: "🔗" },
];

const Wallet: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Payment modal states
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load wallet data from localStorage on mount
  useEffect(() => {
    const savedBalance = localStorage.getItem(WALLET_STORAGE_KEY);
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }

    const savedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch {
        setTransactions([]);
      }
    }
  }, []);

  // Save wallet data to localStorage whenever it changes
  const saveWalletData = (newBalance: number, newTransactions: Transaction[]) => {
    localStorage.setItem(WALLET_STORAGE_KEY, newBalance.toString());
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(newTransactions));
  };

  // Open payment modal
  const openPaymentModal = (amount: number) => {
    setSelectedAmount(amount);
    setSelectedMethod(null);
    setModalStep("select-method");
  };

  // Select payment method and show QR
  const selectPaymentMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setModalStep("show-qr");
  };

  // Close modal and reset
  const closeModal = () => {
    setModalStep(null);
    setSelectedAmount(0);
    setSelectedMethod(null);
    setProcessingPayment(false);
  };

  // Confirm payment and update wallet
  const confirmPayment = () => {
    setProcessingPayment(true);
    
    // Simulate payment verification
    setTimeout(() => {
      const newBalance = balance + selectedAmount;
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        type: "TOPUP",
        amount: selectedAmount,
        status: "SUCCESS",
      };

      const updatedTransactions = [newTransaction, ...transactions];
      
      setBalance(newBalance);
      setTransactions(updatedTransactions);
      saveWalletData(newBalance, updatedTransactions);
      
      setProcessingPayment(false);
      closeModal();
      toast.success(`₹${selectedAmount} added to wallet successfully!`);
    }, 1500);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Wallet balance refreshed!");
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return dateStr;
  };

  // Generate a mock QR code SVG
  const QRCodeDisplay = ({ amount }: { amount: number }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-inner">
        {/* Mock QR Code Pattern */}
        <svg width="180" height="180" viewBox="0 0 180 180" className="text-gray-900">
          {/* QR Code Pattern - simplified mock */}
          <rect x="0" y="0" width="180" height="180" fill="white"/>
          {/* Corner squares */}
          <rect x="10" y="10" width="40" height="40" fill="currentColor"/>
          <rect x="15" y="15" width="30" height="30" fill="white"/>
          <rect x="20" y="20" width="20" height="20" fill="currentColor"/>
          
          <rect x="130" y="10" width="40" height="40" fill="currentColor"/>
          <rect x="135" y="15" width="30" height="30" fill="white"/>
          <rect x="140" y="20" width="20" height="20" fill="currentColor"/>
          
          <rect x="10" y="130" width="40" height="40" fill="currentColor"/>
          <rect x="15" y="135" width="30" height="30" fill="white"/>
          <rect x="20" y="140" width="20" height="20" fill="currentColor"/>
          
          {/* Data pattern */}
          {[...Array(8)].map((_, i) => (
            <React.Fragment key={i}>
              {[...Array(8)].map((_, j) => (
                (i + j + Math.floor(amount / 100)) % 3 !== 0 && (
                  <rect
                    key={`${i}-${j}`}
                    x={60 + j * 8}
                    y={60 + i * 8}
                    width="6"
                    height="6"
                    fill="currentColor"
                  />
                )
              ))}
            </React.Fragment>
          ))}
          
          {/* Additional patterns */}
          <rect x="60" y="10" width="6" height="6" fill="currentColor"/>
          <rect x="72" y="10" width="6" height="6" fill="currentColor"/>
          <rect x="84" y="10" width="6" height="6" fill="currentColor"/>
          <rect x="108" y="10" width="6" height="6" fill="currentColor"/>
          
          <rect x="10" y="60" width="6" height="6" fill="currentColor"/>
          <rect x="10" y="72" width="6" height="6" fill="currentColor"/>
          <rect x="10" y="96" width="6" height="6" fill="currentColor"/>
          <rect x="10" y="108" width="6" height="6" fill="currentColor"/>
        </svg>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">Scan and pay using your UPI app</p>
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400">Amount</p>
          <p className="text-2xl font-black text-gray-900">₹{amount.toLocaleString("en-IN")}</p>
          <p className="text-xs text-gray-400 mt-1">Merchant: EV Charging Portal</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Wallet</h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage your wallet balance and view transaction history.
          </p>
        </div>

        {/* SECTION 1: Wallet Balance Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <WalletIcon size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-medium">My Wallet Balance</p>
                  <p className="text-4xl font-black mt-1">
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-none"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Quick Top-Up Options */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus size={20} className="text-blue-600" />
              Quick Top-Up
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[100, 500, 1000, 2000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  className="h-16 text-lg font-bold hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all"
                  onClick={() => openPaymentModal(amount)}
                  disabled={loading || modalStep !== null}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Click any amount to add money via UPI payment
            </p>
          </CardContent>
        </Card>

        {/* SECTION 3: Transaction History */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowUpCircle size={20} className="text-green-600" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <WalletIcon size={48} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">No transactions yet</p>
                <p className="text-sm mt-1">Add money to your wallet to see transactions here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Type</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Amount</th>
                      <th className="text-center py-3 px-2 text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2 text-sm text-gray-700">{formatDate(txn.date)}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                            txn.type === "TOPUP" ? "text-green-600" : "text-orange-600"
                          }`}>
                            {txn.type === "TOPUP" ? (
                              <ArrowUpCircle size={14} />
                            ) : (
                              <ArrowDownCircle size={14} />
                            )}
                            {txn.type}
                          </span>
                        </td>
                        <td className={`py-3 px-2 text-right text-sm font-bold ${
                          txn.type === "TOPUP" ? "text-green-600" : "text-orange-600"
                        }`}>
                          {txn.type === "TOPUP" ? "+" : "-"}₹{txn.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            txn.status === "SUCCESS" 
                              ? "bg-green-100 text-green-700"
                              : txn.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {txn.status === "SUCCESS" && <CheckCircle2 size={12} />}
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {modalStep !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {modalStep === "select-method" ? "Choose Payment Method" : "Complete Payment"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={processingPayment}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Step 1: Select Payment Method */}
              {modalStep === "select-method" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4 text-center">
                    Select your preferred payment method to add ₹{selectedAmount.toLocaleString("en-IN")}
                  </p>
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => selectPaymentMethod(method.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {method.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-xs text-gray-500">Pay via {method.name}</p>
                      </div>
                      <Smartphone size={20} className="ml-auto text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Show QR Code */}
              {modalStep === "show-qr" && (
                <div className="space-y-6">
                  {/* Selected Payment Method Badge */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                      {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.icon}
                      {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}
                    </span>
                  </div>

                  {/* QR Code */}
                  <QRCodeDisplay amount={selectedAmount} />

                  {/* Confirm Button */}
                  <Button
                    onClick={confirmPayment}
                    disabled={processingPayment}
                    className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                  >
                    {processingPayment ? (
                      <>
                        <RefreshCw size={20} className="animate-spin mr-2" />
                        Verifying Payment...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} className="mr-2" />
                        I Have Completed Payment
                      </>
                    )}
                  </Button>

                  {/* Back Button */}
                  <Button
                    variant="ghost"
                    onClick={() => setModalStep("select-method")}
                    disabled={processingPayment}
                    className="w-full"
                  >
                    Choose Different Method
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Wallet;
