"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { User } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          CollabHub
        </Link>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {/*
                Clickable avatar + name linking to /profile.
                Shows profile pic if available, otherwise a
                User icon placeholder. The avatar is a small circle
                (h-8 w-8 = 32px) matching the navbar height.
              */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                  {user?.profilePicUrl ? (
                    <img
                      src={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/api\/v1$/, "")}${user.profilePicUrl}`}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {user?.firstName}
                </span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
