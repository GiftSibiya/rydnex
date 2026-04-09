import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authService } from "@/backend";
import { AuthStore } from "@/stores/StoresIndex";

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateAccount: (data: { name?: string; email?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  userEmail: string | null;
  userName: string | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const accessToken = AuthStore((state) => state.accessToken);
  const user = AuthStore((state) => state.user);
  const { setAuthFromLogin, updateUser } = AuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const isLoggedIn = !!accessToken;
  const userEmail = user?.email ?? null;
  const userName = user?.name ?? null;

  useEffect(() => {
    async function initSession() {
      const token = AuthStore.getState().accessToken;
      if (token) {
        const result = await authService.refreshSession();
        if (result.expired) {
          await AuthStore.getState().logout();
        }
      }
      setIsLoading(false);
    }

    if (AuthStore.persist.hasHydrated()) {
      initSession();
      return;
    }
    const unsubscribe = AuthStore.persist.onFinishHydration(() => {
      initSession();
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim()) return { success: false, error: "Email is required" };
    if (!email.includes("@")) return { success: false, error: "Enter a valid email" };
    if (!password.trim()) return { success: false, error: "Password is required" };

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });
      if (!response.success) {
        return { success: false, error: response.message ?? response.error ?? "Login failed" };
      }
      setAuthFromLogin(response.data);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  }, [setAuthFromLogin]);

  const logout = useCallback(async () => {
    await AuthStore.getState().logout();
  }, []);

  const updateAccount = useCallback(async ({ name, email, password }: { name?: string; email?: string; password?: string }) => {
    if (email !== undefined) {
      if (!email.trim()) return { success: false, error: "Email cannot be empty" };
      if (!email.includes("@")) return { success: false, error: "Enter a valid email address" };
    }
    try {
      const patch: { name?: string; email?: string } = {};
      if (name !== undefined) patch.name = name.trim();
      if (email !== undefined) patch.email = email.trim();
      if (Object.keys(patch).length > 0) {
        updateUser(patch);
      }
      if (password !== undefined && password.length > 0) {
        // Password update endpoint is not wired in this context flow yet.
      }
      return { success: true };
    } catch {
      return { success: false, error: "Failed to save changes" };
    }
  }, [updateUser]);

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout, updateAccount, userEmail, userName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
