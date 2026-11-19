"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Ticket as TicketIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { useAuth } from "@/context/AuthContext";
import { fetchTickets } from "@/lib/data-service";
import type { Ticket } from "@/types";

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchTickets(user)
      .then(setTickets)
      .finally(() => setLoading(false));
  }, [user]);

  const assignedTotal = tickets.length;
  const activeCount = tickets.filter((t) =>
    ["Assigned", "In Progress", "Open"].includes(t.status)
  ).length;
  const urgentCount = tickets.filter(
    (t) =>
      ["Urgent", "High"].includes(t.priority) &&
      !["Resolved", "Closed"].includes(t.status)
  ).length;
  const resolvedCount = tickets.filter((t) =>
    ["Resolved", "Closed"].includes(t.status)
  ).length;

  return (
    <DashboardShell
      allowedRoles={["staff"]}
      title="Support Staff Workspace"
      subtitle={`Department: ${user?.department || "General Support"} — Investigate assigned tickets and communicate resolutions.`}
    >
      {/* Staff Welcome */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
            {user?.department || "Support Specialist"}
          </span>
          <h2 className="mt-2 text-2xl font-extrabold">
            Welcome, {user?.full_name}
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            You have {activeCount} active ticket{activeCount === 1 ? "" : "s"}{" "}
            assigned to your queue. Updates are synced live with customers.
          </p>
        </div>
        <Link
          href="/staff/tickets"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-500 transition"
        >
          Open Assigned Queue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Tickets"
          value={assignedTotal}
          hint="Total tickets in your queue"
          icon={<TicketIcon className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Active Investigations"
          value={activeCount}
          hint="Assigned or In Progress"
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="High / Urgent Open"
          value={urgentCount}
          hint="Requires prompt attention"
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="rose"
        />
        <StatCard
          label="Resolved Cases"
          value={resolvedCount}
          hint="Successfully completed"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="emerald"
        />
      </div>

      {/* Assigned Tickets Preview */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">
            Your Assigned Tickets
          </h3>
          <Link
            href="/staff/tickets"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Filter & View All →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading your assigned tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center">
            <TicketIcon className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-800">
              No tickets assigned to you yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              When an Admin assigns a complaint to you, it will appear here
              immediately.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex flex-col justify-between gap-4 p-5 hover:bg-blue-50/30 transition sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {t.ticket_number}
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-sm font-bold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    Customer: <strong>{t.customer_name || "Customer"}</strong> •
                    Updated {new Date(t.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/staff/ticket/${t.id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  Investigate
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
