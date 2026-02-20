"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

function LoginContent() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            CollabHub
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-4">
          {registered && (
            <div className="rounded-md bg-green-50 p-3 text-center text-sm text-green-700">
              Account created successfully! Please log in.
            </div>
          )}
          <LoginForm />
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
