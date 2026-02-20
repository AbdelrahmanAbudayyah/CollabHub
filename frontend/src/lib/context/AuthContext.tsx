"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  UserData,
  login as loginApi,
  logout as logoutApi,
  refreshToken as refreshApi,
} from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/api/users";
import { setAccessToken } from "@/lib/api/client";

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Re-fetches the current user's profile from the API and
   * updates the context. Call this after editing the profile
   * so the navbar avatar/name reflects the changes immediately.
   */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore session from refresh token on mount
  useEffect(() => {
    let cancelled = false;
    async function tryRefresh() {
      try {
        const data = await refreshApi();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        // No valid refresh token — user is not logged in
        if (!cancelled) {
          setAccessToken(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    tryRefresh();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  /**
   * refreshUser re-fetches the full profile from GET /users/me
   * and updates the user object in context.
   *
   * Why do we need this? The AuthContext stores a minimal UserData
   * object (id, email, firstName, lastName, profilePicUrl). When
   * the user edits their profile (changes name, uploads a pic),
   * the navbar still shows the OLD data because it reads from context.
   *
   * Calling refreshUser() after a profile edit forces a fresh fetch,
   * so the navbar updates immediately.
   *
   * We map the full UserProfile response back to the minimal UserData
   * shape that the rest of the app expects.
   */
  const refreshUser = useCallback(async () => {
    try {
      const profile = await getCurrentUser();
      setUser({
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePicUrl: profile.profilePicUrl,
      });
    } catch {
      // Silently fail — if refresh fails, the old data stays
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
