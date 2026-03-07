import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom"; // Fixed import
import { SignIn, SignUp } from "./components/Auth";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { dbService } from "./services/dbService";
import { ChatbotModule } from "./components/chatbot/ChatbotModule";

// Protected Route Logic using dbService session
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = dbService.getCurrentUser() || localStorage.getItem("token"); // Support both old and new auth for now
  if (!user) return <Navigate to="/signin" replace />;
  return (
    <>
      {children}
      <ChatbotModule />
    </>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <Navigate to="/signin" replace /> },
]);


