"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Zap,
} from "lucide-react";
import { getDashboardPathForRole, useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/ui/BrandLogo";

const FEATURES = [
  {
    icon: Ticket,
    title: "Automatic Ticket Generation",
    description:
      "Every submitted complaint instantly receives a unique tracking ID (e.g., BA-2026-0001) and is categorized automatically.",
  },
  {
    icon: Bot,
    title: "BizAssist AI Assistant",
    description:
      "24/7 floating AI support chatbot answers FAQs, guides department selection, troubleshoots issues, and looks up live ticket statuses.",
  },
  {
    icon: Layers,
    title: "Smart Department Allocation",
    description:
      "Admins allocate tickets across Technical, Billing, Sales, Delivery, and General Support teams with priority controls.",
  },
  {
    icon: Clock,
    title: "Visual Progress Timeline",
    description:
      "Customers monitor every stage—Submitted, Open, Assigned, In Progress, Resolved, and Closed—with full transparency.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access Control",
    description:
      "Dedicated, protected workspaces for Customers, Support Staff, and Administrators backed by Supabase Row Level Security.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics & Alerts",
    description:
      "In-app notifications alert users on every update while Admins track resolution times, department load, and SLA metrics.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Submit Complaint or Ask AI",
    desc: "Customers chat with BizAssist Assistant for immediate help or submit a structured complaint with optional attachments.",
  },
  {
    step: "02",
    title: "Automatic Ticket Creation",
    desc: "The system generates a unique ticket ID (BA-2026-XXXX), categorizes the request, and logs it securely in Supabase.",
  },
  {
    step: "03",
    title: "Admin Routing & Allocation",
    desc: "Administrators review incoming queues, set priorities, and assign tickets to the right department and support specialist.",
  },
  {
    step: "04",
    title: "Investigation & Resolution",
    desc: "Support staff investigate, add resolution notes, and update status—instantly notifying the customer on their timeline.",
  },
];

const BENEFITS = [
  {
    role: "For Customers",
    icon: Users,
    points: [
      "Zero waiting for instant FAQ & troubleshooting help via AI",
      "Simple complaint submission with automatic ticket IDs",
      "Complete visibility through a 6-step visual status timeline",
      "Full complaint history and real-time update notifications",
    ],
  },
  {
    role: "For Administrators",
    icon: ShieldCheck,
    points: [
      "Centralized command center for all customer complaints",
      "Fast filtering by ticket ID, department, status, and priority",
      "One-click staff assignment and department workload management",
      "Actionable analytics covering resolution speed and ticket volume",
    ],
  },
  {
    role: "For Support Staff",
    icon: Zap,
    points: [
      "Focused workspace showing only assigned tickets",
      "Clear priority indicators to tackle Urgent issues first",
      "Structured investigation notes and resolution documentation",
      "Automatic customer updates whenever ticket status changes",
    ],
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#120206]/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <BrandLogo size="md" />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-white/90 md:flex">
            <a href="#features" className="hover:opacity-75 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:opacity-75 transition">
              How It Works
            </a>
            <a href="#benefits" className="hover:opacity-75 transition">
              Benefits
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {user ? (
              <Link
                href={getDashboardPathForRole(user.role)}
                className="crimson-pill-btn inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="glass-pill-btn rounded-full px-4 py-2 text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="crimson-pill-btn inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 flex justify-center">
              <BrandLogo size="lg" className="animate-logo-float" />
            </div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered Customer Support & Complaint Management</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1] drop-shadow-sm">
              Smart Customer Support, Simplified.
            </h1>

            <p className="mt-6 text-base leading-relaxed text-white/85 sm:text-lg">
              Streamline complaint registration, automate ticket generation and
              department routing, empower support staff with structured
              resolution workflows, and deliver instant answers with BizAssist
              Assistant.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={user ? getDashboardPathForRole(user.role) : "/login"}
                className="crimson-pill-btn inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white sm:w-auto"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="glass-pill-btn inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white sm:w-auto"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Glassmorphic SaaS Preview Card */}
          <div className="glass-card mt-14 mx-auto max-w-5xl rounded-3xl p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-300" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-semibold text-white/80">
                  BizAssist AI — Unified Support Platform Preview
                </span>
              </div>
              <span className="rounded-full border border-white/25 bg-rose-600/40 px-3 py-0.5 text-[11px] font-semibold text-white">
                ● Live SLA Tracking
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs font-semibold text-white/75">
                  Ticket #BA-2026-0001
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  Duplicate Billing Charge
                </p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="rounded-full border border-white/25 bg-amber-500/30 px-2.5 py-0.5 font-semibold text-white">
                    In Progress
                  </span>
                  <span className="text-white/80">Billing Dept</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/25 bg-gradient-to-br from-rose-600/40 to-red-900/40 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Bot className="h-4 w-4" />
                  BizAssist Assistant
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-white/90">
                  &ldquo;Ticket BA-2026-0001 is actively being resolved by Sarah
                  Chen in the Billing Department.&rdquo;
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs font-semibold text-white/75">
                  Average Resolution Time
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  1.8 hrs
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-white/90">
                  <Bell className="h-3.5 w-3.5" /> Real-time customer alerts
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-white/25 bg-rose-600/35 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              Platform Capabilities
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Everything You Need for Modern Complaint Management
            </h2>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Built from the ground up for transparency, rapid ticket allocation,
              and seamless collaboration between customers, admins, and support
              teams.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="glass-card glass-card-hover rounded-3xl p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-white/25 bg-rose-600/35 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              End-to-End Workflow
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              How BizAssist AI Works
            </h2>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              A transparent, four-step journey from initial complaint submission
              to verified resolution.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="glass-card glass-card-hover relative rounded-3xl p-6"
              >
                <span className="crimson-pill-btn inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-extrabold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-white/25 bg-rose-600/35 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              Built for Every Stakeholder
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Tailored Dashboards & Benefits
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.role} className="glass-card rounded-3xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/30 bg-rose-600/60 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{b.role}</h3>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {b.points.map((pt) => (
                      <li
                        key={pt}
                        className="flex items-start gap-2.5 text-sm text-white/90"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-white mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="glass-card mt-16 rounded-3xl p-8 text-center sm:p-12">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Ready to experience smarter customer support?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/85 sm:text-base">
              Log in as a Customer, Admin, or Support Staff member to explore the
              complete ticket lifecycle and BizAssist Assistant.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="crimson-pill-btn inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white"
              >
                Launch Application
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="glass-pill-btn inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/15 bg-black/40 py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center">
            <BrandLogo size="sm" />
          </div>
          <p className="text-xs text-white/80">
            © {new Date().getFullYear()} BizAssist AI — AI-Powered Customer
            Support & Complaint Management System.
          </p>
          <div className="flex gap-5 text-xs text-white">
            <Link href="/login" className="hover:underline">
              Login
            </Link>
            <Link href="/register" className="hover:underline">
              Register
            </Link>
            <a href="#features" className="hover:underline">
              Features
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
