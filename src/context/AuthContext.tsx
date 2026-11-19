"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { DEMO_PROFILES } from "@/lib/demo-data";
import type { DepartmentName, Profile, UserRole } from "@/types";

const DEMO_SESSION_KEY = "bizassist_demo_current_user_v1";
const DEMO_PROFILES_KEY = "bizassist_demo_profiles_v1";

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<Profile>;
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: DepartmentName | null;
  }) => Promise<Profile>;
  quickDemoLogin: (role: UserRole) => Promise<Profile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getDashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "staff":
      return "/staff/dashboard";
    case "customer":
    default:
      return "/customer/dashboard";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isSupabaseConfigured();

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowserClient()!;
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser(profile as Profile);
          } else {
            // Fallback profile from auth metadata
            setUser({
              id: session.user.id,
              full_name:
                session.user.user_metadata?.full_name ||
                session.user.email?.split("@")[0] ||
                "User",
              email: session.user.email || "",
              role: (session.user.user_metadata?.role as UserRole) || "customer",
              department:
                (session.user.user_metadata?.department as DepartmentName) ||
                null,
              created_at: session.user.created_at,
            });
          }
        } else {
          setUser(null);
        }
      } else {
        // Demo Mode session from localStorage
        const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
        if (raw) {
          setUser(JSON.parse(raw) as Profile);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient()!;
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        loadSession();
      });
      return () => subscription.unsubscribe();
    }
  }, [loadSession]);

  const login = async (email: string, password: string): Promise<Profile> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient()!;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Unable to sign in.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      const resolved: Profile = profile
        ? (profile as Profile)
        : {
            id: data.user.id,
            full_name:
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0] ||
              "User",
            email: data.user.email || email,
            role: (data.user.user_metadata?.role as UserRole) || "customer",
            department:
              (data.user.user_metadata?.department as DepartmentName) || null,
            created_at: data.user.created_at,
          };

      setUser(resolved);
      return resolved;
    }

    // Demo Mode Login
    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }
    const storedProfilesRaw = window.localStorage.getItem(DEMO_PROFILES_KEY);
    const profiles: Profile[] = storedProfilesRaw
      ? JSON.parse(storedProfilesRaw)
      : DEMO_PROFILES;

    const matched = profiles.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!matched) {
      throw new Error(
        "No demo account found for that email. Try customer@bizassist.demo, admin@bizassist.demo, staff@bizassist.demo, or register a new account."
      );
    }
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(matched));
    setUser(matched);
    return matched;
  };

  const register = async (payload: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: DepartmentName | null;
  }): Promise<Profile> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient()!;
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.full_name,
            role: payload.role,
            department: payload.department || null,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Registration failed.");

      const newProfile: Profile = {
        id: data.user.id,
        full_name: payload.full_name,
        email: payload.email,
        role: payload.role,
        department: payload.department || null,
        created_at: new Date().toISOString(),
      };

      await supabase.from("profiles").upsert(newProfile);
      setUser(newProfile);
      return newProfile;
    }

    // Demo Mode Registration
    const storedProfilesRaw = window.localStorage.getItem(DEMO_PROFILES_KEY);
    const profiles: Profile[] = storedProfilesRaw
      ? JSON.parse(storedProfilesRaw)
      : [...DEMO_PROFILES];

    if (
      profiles.some(
        (p) => p.email.toLowerCase() === payload.email.trim().toLowerCase()
      )
    ) {
      throw new Error("An account with this email already exists.");
    }

    const newProfile: Profile = {
      id: `${payload.role}-${Date.now()}`,
      full_name: payload.full_name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      department:
        payload.role === "staff"
          ? payload.department || "General Support"
          : null,
      created_at: new Date().toISOString(),
    };

    const nextProfiles = [newProfile, ...profiles];
    window.localStorage.setItem(DEMO_PROFILES_KEY, JSON.stringify(nextProfiles));
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(newProfile));
    setUser(newProfile);
    return newProfile;
  };

  const quickDemoLogin = async (role: UserRole): Promise<Profile> => {
    const emailMap: Record<UserRole, string> = {
      customer: "customer@bizassist.demo",
      admin: "admin@bizassist.demo",
      staff: "staff@bizassist.demo",
    };
    return login(emailMap[role], "demo1234");
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient()!;
      await supabase.auth.signOut();
    } else {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        login,
        register,
        quickDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
