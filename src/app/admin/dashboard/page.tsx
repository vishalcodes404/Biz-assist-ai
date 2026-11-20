"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Timer,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { useAuth } from "@/context/AuthContext";
import { fetchTickets } from "@/lib/data-service";
import { DEPARTMENTS, type Ticket } from "@/types";

export default function AdminDashboardPage() {
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

  const total = tickets.length;
  const pending = tickets.filter((t) =>
    ["Submitted", "Open"].includes(t.status)
  ).length;
  const inProgress = tickets.filter((t) =>
    ["Assigned", "In Progress"].includes(t.status)
  ).length;
  const resolved = tickets.filter((t) =>
    ["Resolved", "Closed"].includes(t.status)
  ).length;

  // Compute average resolution time in hours for resolved/closed tickets
  const resolvedTickets = tickets.filter((t) =>
    ["Resolved", "Closed"].includes(t.status)
  );
  const avgResHours =
    resolvedTickets.length > 0
      ? (
          resolvedTickets.reduce((acc, t) => {
            const diff =
              (new Date(t.updated_at).getTime() -
                new Date(t.created_at).getTime()) /
              (1000 * 60 * 60);
            return acc + Math.max(0.5, diff);
          }, 0) / resolvedTickets.length
        ).toFixed(1)
      : "0.0";

  return (
    <DashboardShell
      allowedRoles={["admin"]}
      title="Admin Command Center"
      subtitle="Monitor platform-wide complaints, route departments, and oversee support performance."
    >
      {/* 5 Required Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Tickets"
          value={total}
          hint="All customer complaints"
          icon={<TicketIcon className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Pending Tickets"
          value={pending}
          hint="Submitted & Open"
          icon={<AlertCircle className="h-5 w-5" />}
          accent="rose"
        />
        <StatCard
          label="In-Progress"
          value={inProgress}
          hint="Assigned & Investigating"
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="Resolved Tickets"
          value={resolved}
          hint="Resolved & Closed"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          label="Avg Resolution"
          value={`${avgResHours}h`}
          hint="Mean time to solve"
          icon={<Timer className="h-5 w-5" />}
          accent="purple"
        />
      </div>

      {/* Quick Actions + Department Load */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Department Ticket Distribution
              </h3>
              <p className="text-xs text-white/70">
                Live workload across all 5 support departments
              </p>
            </div>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-white transition"
            >
              Full Analytics
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {DEPARTMENTS.map((dept) => {
              const count = tickets.filter((t) => t.department === dept).length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={dept}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/90">{dept}</span>
                    <span className="font-bold text-white">
                      {count} ticket{count === 1 ? "" : "s"} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin Quick Links */}
        <div className="glass-card flex flex-col justify-between rounded-2xl p-6 shadow-card">
          <div>
            <h3 className="text-base font-bold text-white">
              Admin Quick Actions
            </h3>
            <p className="mt-1 text-xs text-white/70">
              Jump directly to key complaint management workflows.
            </p>
            <div className="mt-4 space-y-2.5">
              <Link
                href="/admin/tickets"
                className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-3.5 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/20 transition"
              >
                <span className="flex items-center gap-2.5">
                  <TicketIcon className="h-4 w-4 text-rose-300" />
                  Manage & Assign Tickets
                </span>
                <ArrowRight className="h-4 w-4 text-white/70" />
              </Link>
              <Link
                href="/admin/staff"
                className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-3.5 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/20 transition"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-rose-300" />
                  Manage Staff & Customers
                </span>
                <ArrowRight className="h-4 w-4 text-white/70" />
              </Link>
              <Link
                href="/admin/analytics"
                className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-3.5 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/20 transition"
              >
                <span className="flex items-center gap-2.5">
                  <BarChart3 className="h-4 w-4 text-rose-300" />
                  View Analytics & Reports
                </span>
                <ArrowRight className="h-4 w-4 text-white/70" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets Queue */}
      <div className="glass-card overflow-hidden rounded-2xl shadow-card">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-base font-bold text-white">
            Latest Customer Complaints
          </h3>
          <Link
            href="/admin/tickets"
            className="text-xs font-semibold text-rose-300 hover:text-white transition"
          >
            Open Full Queue →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-white/70">
            Loading tickets...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/70">
                <tr>
                  <th className="px-6 py-3 font-semibold">Ticket ID</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Complaint</th>
                  <th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Assigned Staff</th>
                  <th className="px-6 py-3 font-semibold">Priority</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tickets.slice(0, 6).map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-rose-300">
                      {t.ticket_number}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-white">
                      {t.customer_name || "Customer"}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs font-medium text-white/90">
                      {t.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-white/80">
                      {t.department}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs">
                      {t.assigned_staff_name ? (
                        <span className="font-medium text-white">
                          {t.assigned_staff_name}
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-200 border border-rose-400/30">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
