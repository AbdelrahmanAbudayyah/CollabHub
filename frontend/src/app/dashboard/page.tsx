"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/context/AuthContext";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
          <DashboardContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back, {user?.firstName}! Dashboard content coming in Slice 7.
      </p>
    </div>
  );
}
