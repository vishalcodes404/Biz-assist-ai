"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Ticket as TicketIcon } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { useAuth } from "@/context/AuthContext";
import { fetchTickets } from "@/lib/data-service";
import { TICKET_PRIORITIES, TICKET_STATUSES, type Ticket } from "@/types";

export default function StaffTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchTickets(user)
      .then(setTickets)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.customer_name || "").toLowerCase().includes(q);
      const matchPri =
        priorityFilter === "All" || t.priority === priorityFilter;
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      return matchSearch && matchPri && matchStatus;
    });
  }, [tickets, search, priorityFilter, statusFilter]);

  return (
    <DashboardShell
      allowedRoles={["staff"]}
      title="Assigned Support Tickets"
      subtitle="Filter your assigned tickets by priority and status, and open cases to post resolutions."
    >
      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket ID, customer, or title..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Priorities</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading assigned tickets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <TicketIcon className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-900">
            No assigned tickets match your filters
          </h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card hover:border-blue-300 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {t.ticket_number}
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900">
                    {t.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 max-w-3xl">
                    {t.description}
                  </p>
                </div>
                <Link
                  href={`/staff/ticket/${t.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  Open Case
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Customer: {t.customer_name || "Customer"}</span>
                <span>Category: {t.category}</span>
                <span>
                  Last Updated: {new Date(t.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
