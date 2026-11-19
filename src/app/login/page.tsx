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
  const { user, isDemoMode, login, loginWithGoogle, quickDemoLogin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      if (!isDemoMode) {
        showToast("Redirecting to Google...", "info");
      } else {
        showToast("Signed in via Google account!", "success");
        router.push("/customer/dashboard");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setGoogleLoading(false);
    }
  };

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

        {/* Google ID Sign In Button */}
        <div className="mt-5">
          <button
            type="button"
            disabled={submitting || googleLoading}
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {googleLoading ? "Connecting to Google..." : "Continue with Google ID"}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
            or sign in with email
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
