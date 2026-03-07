import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Wallet as WalletIcon, Plus, RefreshCw, ArrowUpCircle, ArrowDownCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  date: string;
  type: "TOPUP" | "CHARGE";
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
}

const WALLET_STORAGE_KEY = "ev_portal_wallet";
const TRANSACTIONS_STORAGE_KEY = "ev_portal_transactions";

const Wallet: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleTopUp = (amount: number) => {
    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const newBalance = balance + amount;
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        type: "TOPUP",
        amount: amount,
        status: "SUCCESS",
      };

      const updatedTransactions = [newTransaction, ...transactions];
      
      setBalance(newBalance);
      setTransactions(updatedTransactions);
      saveWalletData(newBalance, updatedTransactions);
      
      setLoading(false);
      toast.success(`₹${amount} added to wallet successfully!`);
    }, 800);
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
                  onClick={() => handleTopUp(amount)}
                  disabled={loading}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Click any amount to instantly add to your wallet
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
    </DashboardLayout>
  );
};

export default Wallet;
