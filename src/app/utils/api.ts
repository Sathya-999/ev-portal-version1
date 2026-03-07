// EV-PORTAL — Real API Client
// Connects to Express backend at /api/*

import { toast } from "sonner";
import { HAWAII_CHARGERS } from "./chargerUtils";

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

// ─── Charging History ─────────────────────────────────────────
export const fetchChargingHistory = async () => {
  try {
    return await apiFetch("/api/payments/history");
  } catch {
    // Return empty if backend unavailable
    return [];
  }
};

// ─── Dashboard Summary ────────────────────────────────────────
export const fetchDashboardSummary = async () => {
  try {
    return await apiFetch("/api/dashboard/summary");
  } catch {
    return {
      activeStations: 0,
      totalStations: HAWAII_CHARGERS.length,
      totalEnergy: 0,
      totalSessions: 0,
      totalSpent: 0,
      walletBalance: 0,
    };
  }
};

// ─── Razorpay — Create Order via Backend ──────────────────────
export const createRazorpayOrder = async (amount: number, purpose: string = "Wallet Top-up") => {
  console.log(`[RAZORPAY] Creating order for ₹${amount} (${purpose})`);
  return await apiFetch("/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ amount, purpose }),
  });
};

// ─── Wallet — Fetch Balance ───────────────────────────────────
export const fetchWalletBalance = async () => {
  // Don't swallow errors - let caller handle them
  return await apiFetch("/api/wallet/balance");
};

// ─── Wallet — Fetch Transactions ──────────────────────────────
export const fetchWalletTransactions = async () => {
  try {
    return await apiFetch("/api/wallet/transactions");
  } catch {
    return [];
  }
};

// ─── Wallet — Pay for Charging ────────────────────────────────
export const payViaWallet = async (amount: number, stationName: string, description?: string) => {
  return await apiFetch("/api/wallet/pay", {
    method: "POST",
    body: JSON.stringify({ amount, stationName, description }),
  });
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
