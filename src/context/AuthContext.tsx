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
  loginWithGoogle: () => Promise<void>;
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
          let profile: Profile | null = null;
          try {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();
            if (data) profile = data as Profile;
          } catch {
            // ignore if table not ready
          }

          if (profile) {
            setUser(profile);
          } else {
            // First time login (e.g. from Google OAuth): insert profile row
            const googleName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "Customer";
            const googleAvatar =
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              null;

            const newProfile: Profile = {
              id: session.user.id,
              full_name: googleName,
              email: session.user.email || "",
              role: (session.user.user_metadata?.role as UserRole) || "customer",
              department:
                (session.user.user_metadata?.department as DepartmentName) ||
                null,
              avatar_url: googleAvatar,
              created_at: session.user.created_at,
            };

            try {
              await supabase.from("profiles").upsert(newProfile);
            } catch {
              // fallback
            }

            setUser(newProfile);
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

  const loginWithGoogle = async (): Promise<void> => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient()!;
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw new Error(error.message);
      return;
    }

    // Demo Mode: simulate Google ID sign-in
    const storedProfilesRaw = window.localStorage.getItem(DEMO_PROFILES_KEY);
    const profiles: Profile[] = storedProfilesRaw
      ? JSON.parse(storedProfilesRaw)
      : [...DEMO_PROFILES];

    const demoGoogleEmail = "google.alex@example.com";
    let matched = profiles.find(
      (p) => p.email.toLowerCase() === demoGoogleEmail
    );

    if (!matched) {
      // First-time Google user in demo mode
      matched = {
        id: `customer-google-${Date.now()}`,
        full_name: "Alex Morgan (Google)",
        email: demoGoogleEmail,
        role: "customer",
        department: null,
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        created_at: new Date().toISOString(),
      };
      profiles.unshift(matched);
      window.localStorage.setItem(DEMO_PROFILES_KEY, JSON.stringify(profiles));
    }

    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(matched));
    setUser(matched);
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
        loginWithGoogle,
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
