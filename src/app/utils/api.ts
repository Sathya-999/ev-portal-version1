// EV-PORTAL — Real API Client
// Connects to Express backend at /api/*

import { toast } from "sonner";
import { HAWAII_CHARGERS } from "./chargerUtils";

// Use relative URLs for Vercel deployment, or VITE_API_URL if provided
export const API_BASE = import.meta.env.VITE_API_URL || "";

export const getAuthToken = () => localStorage.getItem("token");

/**
 * Authenticated fetch wrapper — attaches JWT and handles errors
 */
const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expired or invalid — force re-login
    localStorage.removeItem("token");
    localStorage.removeItem("user_profile");
    window.location.href = "/signin";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json();
};

// ─── Kept for backward compatibility during migration ─────────
export const simulateApiCall = async <T>(data: T, delay = 800): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// ─── User Profile ─────────────────────────────────────────────
export const fetchUserProfile = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized");

  try {
    return await apiFetch("/api/user/me");
  } catch (err) {
    // Fallback: read from localStorage cache if backend is unreachable
    const cached = localStorage.getItem("user_profile");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (isNaN(parsed.walletBalance) || parsed.walletBalance === null || parsed.walletBalance === undefined) {
        parsed.walletBalance = 0;
      }
      return parsed;
    }
    return {
      id: 0,
      firstName: "Guest",
      lastName: "",
      email: "",
      phone: "",
      location: "India",
      membership: "EV-Portal Free",
      walletBalance: 0,
      loyaltyPoints: 0,
      vehicleBrand: "",
      vehicleModel: "",
    };
  }
};

// ─── User Vehicles ────────────────────────────────────────────
export const fetchUserVehicles = async () => {
  try {
    const vehicles = await apiFetch("/api/vehicles");
    if (vehicles && vehicles.length > 0) return vehicles;
  } catch {}

  // Fallback: return empty or default
  return [
    {
      id: "veh_default",
      name: "Tata Nexon EV",
      model: "Tata Nexon EV",
      batteryCapacity: 40.5,
      connectorType: "CCS2",
      currentSoc: 65,
      regNo: "",
    },
  ];
};

// ─── Charging History (from localStorage for demo) ────────────
export const fetchChargingHistory = async () => {
  // First try API
  try {
    const data = await apiFetch("/api/payments/history");
    if (data && data.length > 0) return data;
  } catch {}
  
  // Fallback: get from localStorage
  const CHARGING_HISTORY_KEY_LOCAL = "ev_portal_charging_history";
  const savedHistory = localStorage.getItem(CHARGING_HISTORY_KEY_LOCAL);
  if (savedHistory) {
    try {
      return JSON.parse(savedHistory);
    } catch {}
  }
  return [];
};

// ─── Dashboard Summary (Dynamic from localStorage) ────────────
export const fetchDashboardSummary = async () => {
  // Get charging history from localStorage
  const CHARGING_HISTORY_KEY_LOCAL = "ev_portal_charging_history";
  const WALLET_KEY_LOCAL = "ev_portal_wallet";
  const TRANSACTIONS_KEY_LOCAL = "ev_portal_transactions";
  
  const savedHistory = localStorage.getItem(CHARGING_HISTORY_KEY_LOCAL);
  const savedWallet = localStorage.getItem(WALLET_KEY_LOCAL);
  const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY_LOCAL);
  
  let history: any[] = [];
  let transactions: any[] = [];
  
  try {
    if (savedHistory) history = JSON.parse(savedHistory);
  } catch {}
  
  try {
    if (savedTransactions) transactions = JSON.parse(savedTransactions);
  } catch {}
  
  // Calculate dynamic metrics
  const totalEnergy = history.reduce((sum, h) => sum + (h.kwhUsed || h.energy || 0), 0);
  const totalSessions = history.length;
  const totalSpent = history.reduce((sum, h) => sum + (h.amount || 0), 0);
  const walletBalance = savedWallet ? parseFloat(savedWallet) : 0;
  
  // Active stations = 21 fallback stations (always active in demo mode)
  const activeStations = 21;
  
  return {
    activeStations,
    totalStations: 21,
    totalEnergy: Math.round(totalEnergy * 10) / 10,
    totalSessions,
    totalSpent: Math.round(totalSpent * 100) / 100,
    walletBalance,
    recentTransactions: transactions.slice(0, 5),
  };
};

// ─── Razorpay — Create Order via Backend ──────────────────────
export const createRazorpayOrder = async (amount: number, purpose: string = "Wallet Top-up") => {
  console.log(`[RAZORPAY] Creating order for ₹${amount} (${purpose})`);
  return await apiFetch("/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ amount, purpose }),
  });
};

// ─── Local Storage Keys (Demo Mode) ──────────────────────────
const WALLET_STORAGE_KEY = "ev_portal_wallet";
const TRANSACTIONS_STORAGE_KEY = "ev_portal_transactions";
const CHARGING_HISTORY_KEY = "ev_portal_charging_history";

// ─── Wallet — Fetch Balance (Demo: localStorage) ─────────────
export const fetchWalletBalance = async () => {
  // Use localStorage for demo mode - same as Wallet.tsx
  const savedBalance = localStorage.getItem(WALLET_STORAGE_KEY);
  return { balance: savedBalance ? parseFloat(savedBalance) : 0 };
};

// ─── Wallet — Fetch Transactions (Demo: localStorage) ─────────
export const fetchWalletTransactions = async () => {
  const savedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  if (savedTransactions) {
    try {
      return JSON.parse(savedTransactions);
    } catch {
      return [];
    }
  }
  return [];
};

// ─── Wallet — Pay for Charging (Demo: localStorage) ───────────
export const payViaWallet = async (amount: number, stationName: string, description?: string) => {
  const savedBalance = localStorage.getItem(WALLET_STORAGE_KEY);
  const currentBalance = savedBalance ? parseFloat(savedBalance) : 0;
  
  if (currentBalance < amount) {
    throw new Error(`Insufficient wallet balance. You have ₹${currentBalance.toFixed(2)}`);
  }
  
  // Deduct amount from wallet
  const newBalance = currentBalance - amount;
  localStorage.setItem(WALLET_STORAGE_KEY, newBalance.toString());
  
  // Add transaction record
  const savedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
  
  const newTransaction = {
    id: `txn_${Date.now()}`,
    date: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    type: "CHARGE",
    amount: amount,
    status: "SUCCESS",
    stationName: stationName,
    description: description,
  };
  
  const updatedTransactions = [newTransaction, ...transactions];
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(updatedTransactions));
  
  return { 
    success: true, 
    newBalance: newBalance,
    transaction: newTransaction
  };
};

// ─── Charging Session — Record (Demo: localStorage) ───────────
export const recordChargingSession = (session: {
  stationName: string;
  chargePercent: number;
  kwhUsed: number;
  amount: number;
  paymentMethod: "UPI" | "WALLET";
  transactionRef?: string;
}) => {
  const savedHistory = localStorage.getItem(CHARGING_HISTORY_KEY);
  const history = savedHistory ? JSON.parse(savedHistory) : [];
  
  const newSession = {
    id: `session_${Date.now()}`,
    date: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    ...session,
    status: "COMPLETED",
  };
  
  const updatedHistory = [newSession, ...history];
  localStorage.setItem(CHARGING_HISTORY_KEY, JSON.stringify(updatedHistory));
  
  return newSession;
};

// ─── Razorpay — Verify & Confirm Payment ──────────────────────
export const verifyPaymentSignature = async (orderId: string, paymentId: string, signature: string, paidAmount?: number) => {
  console.log(`[RBI_COMPLIANCE] Confirming payment for ${orderId}`);
  const result = await apiFetch("/api/payments/confirm", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      paymentId,
      signature,
      amount: paidAmount || 500,
    }),
  });
  // Return full result so callers can use walletBalance directly
  return result;
};

// ─── UPI Validation (client-side) ─────────────────────────────
export const validateUpiId = (upi: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upi);
};

// ─── Currency Formatting ──────────────────────────────────────
export const formatINR = (amount: number) => {
  if (isNaN(amount) || amount === null || amount === undefined) amount = 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

// ─── Haversine Distance (km) ──────────────────────────────────
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Auth Helpers (called by Auth.tsx) ────────────────────────
export const apiSignup = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
  const result = await apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.token) {
    localStorage.setItem("token", result.token);
    localStorage.setItem("user_profile", JSON.stringify(result.user));
  }
  return result;
};

export const apiLogin = async (data: { email: string; password: string }) => {
  const result = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.token) {
    localStorage.setItem("token", result.token);
    localStorage.setItem("user_profile", JSON.stringify(result.user));
  }
  return result;
};

export const apiGoogleAuth = async (credential: string) => {
  const result = await apiFetch("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  if (result.token) {
    localStorage.setItem("token", result.token);
    localStorage.setItem("user_profile", JSON.stringify(result.user));
  }
  return result;
};

export const apiUpdateProfile = async (data: Record<string, any>) => {
  return await apiFetch("/api/user/update", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const apiForgotPassword = async (email: string) => {
  return await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const apiResetPassword = async (token: string, newPassword: string) => {
  return await apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
};
