"use client";

import React, { useEffect, useState } from "react";
import { Download, TrendingUp, Layers, ShieldCheck, Clock } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { fetchTickets } from "@/lib/data-service";
import {
  DEPARTMENTS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
} from "@/types";

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchTickets(user).then(setTickets);
  }, [user]);

  const total = tickets.length || 1;
  const resolvedCount = tickets.filter((t) =>
    ["Resolved", "Closed"].includes(t.status)
  ).length;
  const resolutionRate = Math.round((resolvedCount / total) * 100);
  const urgentCount = tickets.filter((t) => t.priority === "Urgent").length;

  const exportCsv = () => {
    const headers = [
      "Ticket ID",
      "Customer",
      "Title",
      "Category",
      "Priority",
      "Department",
      "Assigned Staff",
      "Status",
      "Created At",
    ];
    const rows = tickets.map((t) => [
      t.ticket_number,
      t.customer_name || "",
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.department,
      t.assigned_staff_name || "Unassigned",
      t.status,
      t.created_at,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizassist-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Analytics report exported as CSV.", "success");
  };

  return (
    <DashboardShell
      allowedRoles={["admin"]}
      title="Analytics & Performance Reports"
      subtitle="Visual insights into complaint volume, department load, priorities, and resolution efficiency."
    >
      {/* Actions header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            Support Operations Summary
          </h2>
          <p className="text-xs text-white/70">
            Computed dynamically from live ticket records.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/40 hover:from-red-500 hover:to-rose-500 transition"
        >
          <Download className="h-4 w-4" />
          Export CSV Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          hint={`${resolvedCount} of ${tickets.length} tickets solved`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          label="Active Departments"
          value={DEPARTMENTS.length}
          hint="Specialized support teams"
          icon={<Layers className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Urgent Escalations"
          value={urgentCount}
          hint="Highest priority queue"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="rose"
        />
        <StatCard
          label="Target SLA Window"
          value="< 4 hrs"
          hint="Standard response policy"
          icon={<Clock className="h-5 w-5" />}
          accent="purple"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Tickets by Status */}
        <div className="glass-card rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-bold text-white">
            Tickets by Lifecycle Status
          </h3>
          <p className="mb-5 text-xs text-white/70">
            Distribution across the 6 complaint workflow stages
          </p>
          <div className="space-y-3.5">
            {TICKET_STATUSES.map((status) => {
              const count = tickets.filter((t) => t.status === status).length;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-white/90">
                      {status}
                    </span>
                    <span className="font-bold text-white">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Tickets by Category (Vertical Bar Chart) */}
        <div className="glass-card rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-bold text-white">
            Complaints by Category
          </h3>
          <p className="mb-5 text-xs text-white/70">
            Volume breakdown across product & service issue areas
          </p>
          <div className="flex h-56 items-end justify-between gap-3 pt-4">
            {TICKET_CATEGORIES.map((cat) => {
              const count = tickets.filter((t) => t.category === cat).length;
              const maxVal = Math.max(
                1,
                ...TICKET_CATEGORIES.map(
                  (c) => tickets.filter((t) => t.category === c).length
                )
              );
              const heightPct = Math.round((count / maxVal) * 100);
              return (
                <div
                  key={cat}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs font-bold text-white">
                    {count}
                  </span>
                  <div className="flex h-40 w-full items-end justify-center rounded-xl border border-white/10 bg-white/5 p-1.5">
                    <div
                      className="w-full max-w-[38px] rounded-lg bg-gradient-to-t from-red-600 to-rose-400 transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPct, count > 0 ? 12 : 4)}%`,
                      }}
                    />
                  </div>
                  <span className="truncate text-[11px] font-semibold text-white/70">
                    {cat}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Department Workload */}
        <div className="glass-card rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-bold text-white">
            Department Allocation Workload
          </h3>
          <div className="mt-4 space-y-3">
            {DEPARTMENTS.map((dept) => {
              const count = tickets.filter((t) => t.department === dept).length;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={dept} className="flex items-center gap-3">
                  <span className="w-36 truncate text-xs font-semibold text-white/90">
                    {dept}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600"
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-white">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Priority Distribution */}
        <div className="glass-card rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-bold text-white">
            Priority Breakdown
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {TICKET_PRIORITIES.map((pri) => {
              const count = tickets.filter((t) => t.priority === pri).length;
              const colors: Record<string, string> = {
                Low: "border-white/20 bg-white/10 text-white",
                Medium: "border-amber-400/30 bg-amber-500/20 text-white",
                High: "border-orange-400/35 bg-orange-500/25 text-white",
                Urgent: "border-red-400/45 bg-red-600/40 text-white",
              };
              return (
                <div
                  key={pri}
                  className={`rounded-xl border p-4 ${colors[pri]}`}
                >
                  <p className="text-xs font-bold uppercase">{pri}</p>
                  <p className="mt-1 text-2xl font-extrabold">{count}</p>
                  <p className="text-[11px] opacity-80">
                    {Math.round((count / total) * 100)}% of total
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
