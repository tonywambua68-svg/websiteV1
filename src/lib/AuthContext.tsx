import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as auth from "./auth";
import type { SafeUser } from "./auth";

interface AuthShape {
  user: SafeUser | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<SafeUser>;
  logout: () => void;
  refresh: () => void;
  updateProfile: (patch: { name?: string; phone?: string; avatarHue?: string }) => SafeUser;
  changePassword: (currentPw: string, nextPw: string) => Promise<void>;
}

const Ctx = createContext<AuthShape | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refresh = useCallback(() => setUser(auth.currentUser()), []);

  useEffect(() => {
    setUser(auth.currentUser());
    setInitializing(false);
    // Keep tabs in sync: signing out in one tab signs out all tabs.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "imara.session.v1" || e.key === "imara.users.v1") setUser(auth.currentUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await auth.login({ email, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (input: { name: string; email: string; phone: string; password: string }) => {
    const u = await auth.register(input);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback((patch: { name?: string; phone?: string; avatarHue?: string }) => {
    const u = auth.updateProfile(patch);
    setUser(u);
    return u;
  }, []);

  const changePassword = useCallback(async (currentPw: string, nextPw: string) => {
    await auth.changePassword(currentPw, nextPw);
  }, []);

  const value = useMemo<AuthShape>(
    () => ({ user, initializing, login, register, logout, refresh, updateProfile, changePassword }),
    [user, initializing, login, register, logout, refresh, updateProfile, changePassword],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthShape {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
