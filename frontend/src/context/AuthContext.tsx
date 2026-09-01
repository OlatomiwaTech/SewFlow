"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser, Business, LoginInput, RegisterInput } from "@/types/auth";
import { apiClient } from "@/lib/api";

export interface AuthContextType {
  user: AuthUser | null;
  business: Business | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setUser(null);
    setBusiness(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUser(null);
      setBusiness(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiClient.getCurrentUser();
      setUser(data.user);
      setBusiness(data.business);
    } catch (error) {
      console.error("Session restore failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (input: LoginInput) => {
    setIsLoading(true);
    try {
      const data = await apiClient.login(input);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
      }
      setUser(data.user);
      setBusiness(data.business);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setIsLoading(true);
    try {
      const data = await apiClient.register(input);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
      }
      setUser(data.user);
      setBusiness(data.business);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      business,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, business, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
