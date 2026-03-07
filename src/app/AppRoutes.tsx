
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SignIn, SignUp, ForgotPassword, ResetPassword } from "./components/Auth";
import { Layout } from "./components/Layout";

// Dashboard Pages (lazy would be better, but direct imports for hackathon speed)
import DashboardHome from "./components/DashboardHome";
import NearbyChargers from "./components/NearbyChargers";
import ChargingHistory from "./components/ChargingHistory";
import Profile from "./components/Profile";
import StationsMap from "./components/StationsMap";
import DynamicLoadControl from "./components/DynamicLoadControl";
import SettingsPage from "./components/SettingsPage";
import SlotBooking from "./components/SlotBooking";
import Wallet from "./components/Wallet";

// Protected Route Logic — checks for JWT token
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes wrapped in Layout for the image/split screen */}
      <Route element={<Layout />}>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Dashboard Routes - Each component wraps itself in DashboardLayout */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
      <Route path="/dashboard/chargers" element={<ProtectedRoute><NearbyChargers /></ProtectedRoute>} />
      <Route path="/dashboard/map" element={<ProtectedRoute><StationsMap /></ProtectedRoute>} />
      <Route path="/dashboard/load-control" element={<ProtectedRoute><DynamicLoadControl /></ProtectedRoute>} />
      <Route path="/dashboard/history" element={<ProtectedRoute><ChargingHistory /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/dashboard/slot-booking" element={<ProtectedRoute><SlotBooking /></ProtectedRoute>} />
      <Route path="/dashboard/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
};

