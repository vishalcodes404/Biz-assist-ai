"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import { getDashboardPathForRole, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const { user, isDemoMode, login, quickDemoLogin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const profile = await login(email, password);
      showToast(`Welcome back, ${profile.full_name}!`, "success");
      router.push(getDashboardPathForRole(profile.role));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setError("");
    setSubmitting(true);
    try {
      const profile = await quickDemoLogin(role);
      showToast(
        `Signed in as ${profile.full_name} (${profile.role.toUpperCase()})`,
        "success"
      );
      router.push(getDashboardPathForRole(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-white">
      <Link href="/" className="mb-6 flex items-center justify-center">
        <BrandLogo size="lg" />
      </Link>

      <div className="glass-card w-full max-w-md rounded-3xl p-7">
        <h1 className="text-2xl font-extrabold text-white">
          Sign in to your account
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Access your Customer, Admin, or Support Staff dashboard.
        </p>

        {isDemoMode && (
          <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Demo Mode Active — 1-Click Role Sign In</span>
            </div>
            <p className="mt-1 text-xs text-white/80">
              Choose a role below to explore all workflows immediately:
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuickDemo("customer")}
                className="glass-pill-btn flex flex-col items-center gap-1 rounded-2xl p-2.5 text-xs font-semibold text-white"
              >
                <User className="h-4 w-4 text-white" />
                Customer
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuickDemo("admin")}
                className="glass-pill-btn flex flex-col items-center gap-1 rounded-2xl p-2.5 text-xs font-semibold text-white"
              >
                <Shield className="h-4 w-4 text-white" />
                Admin
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuickDemo("staff")}
                className="glass-pill-btn flex flex-col items-center gap-1 rounded-2xl p-2.5 text-xs font-semibold text-white"
              >
                <Wrench className="h-4 w-4 text-white" />
                Staff
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-300/40 bg-rose-900/50 px-3.5 py-2.5 text-xs font-medium text-white">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@bizassist.demo"
                className="w-full rounded-full border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-white/55 focus:bg-white/15 transition"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-full border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-white/55 focus:bg-white/15 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="crimson-pill-btn flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/80">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-bold text-white underline underline-offset-4 hover:opacity-80"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
