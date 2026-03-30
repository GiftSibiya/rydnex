import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

const AUTH_KEY = "rydnex_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setIsLoggedIn(true);
          setUserEmail(data.email ?? null);
          setUserName(data.name ?? null);
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    if (!email.trim()) return { success: false, error: "Email is required" };
    if (!email.includes("@")) return { success: false, error: "Enter a valid email" };
    const existing = await AsyncStorage.getItem(AUTH_KEY);
    const prev = existing ? JSON.parse(existing) : {};
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ ...prev, email: email.trim() }));
    setIsLoggedIn(true);
    setUserEmail(email.trim());
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
    setUserEmail(null);
    setUserName(null);
  }, []);

  const updateAccount = useCallback(async ({ name, email, password }: { name?: string; email?: string; password?: string }) => {
    if (email !== undefined) {
      if (!email.trim()) return { success: false, error: "Email cannot be empty" };
      if (!email.includes("@")) return { success: false, error: "Enter a valid email address" };
    }
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      const updated = {
        ...prev,
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(email !== undefined ? { email: email.trim() } : {}),
        ...(password !== undefined && password.length > 0 ? { password } : {}),
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      if (email !== undefined) setUserEmail(email.trim());
      if (name !== undefined) setUserName(name.trim());
      return { success: true };
    } catch {
      return { success: false, error: "Failed to save changes" };
    }
  }, []);

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
