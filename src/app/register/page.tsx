"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Building2,
} from "lucide-react";
import { getDashboardPathForRole, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { DEPARTMENTS, type DepartmentName, type UserRole } from "@/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [department, setDepartment] =
    useState<DepartmentName>("Technical Support");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setSubmitting(true);
    try {
      const profile = await register({
        full_name: fullName,
        email,
        password,
        role,
        department: role === "staff" ? department : null,
      });
      showToast(
        `Account created! Welcome to BizAssist AI, ${profile.full_name}.`,
        "success"
      );
      router.push(getDashboardPathForRole(profile.role));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setError(msg);
      showToast(msg, "error");
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
          Create your account
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Register as a Customer, Support Staff, or Admin to explore BizAssist AI.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-300/40 bg-rose-900/50 px-3.5 py-2.5 text-xs font-medium text-white">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white">
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Taylor"
                className="w-full rounded-full border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-white/55 focus:bg-white/15 transition"
              />
            </div>
          </div>

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
                placeholder="jordan@company.com"
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-full border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-white/55 focus:bg-white/15 transition"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white">
              Account Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["customer", "staff", "admin"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-full border py-2 text-xs font-semibold capitalize transition ${role === r
                      ? "crimson-pill-btn text-white"
                      : "glass-pill-btn text-white"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {role === "staff" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white">
                Support Department
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75" />
                <select
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value as DepartmentName)
                  }
                  className="w-full rounded-full border border-white/25 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-white/55 transition"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="crimson-pill-btn flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create Account"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/80">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-bold text-white underline underline-offset-4 hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
