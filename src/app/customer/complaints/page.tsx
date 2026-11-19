"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FilePlus2, Search, Ticket as TicketIcon } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { useAuth } from "@/context/AuthContext";
import { fetchTickets } from "@/lib/data-service";
import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  type Ticket,
} from "@/types";

export default function CustomerComplaintsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

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
      const matchesSearch =
        !q ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All" || t.status === statusFilter;
      const matchesCategory =
        categoryFilter === "All" || t.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tickets, search, statusFilter, categoryFilter]);

  return (
    <DashboardShell
      allowedRoles={["customer"]}
      title="My Complaint History"
      subtitle="Search, filter, and track every support ticket you have submitted."
    >
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ticket ID (BA-2026-...) or title..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <Link
            href="/customer/new-complaint"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            <FilePlus2 className="h-4 w-4" />
            New Complaint
          </Link>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading complaint history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-card">
          <TicketIcon className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-900">
            No matching complaints found
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Try clearing your filters or submit a new complaint.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/customer/ticket/${ticket.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-card hover:border-blue-300 hover:shadow-card-hover transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {ticket.ticket_number}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      {ticket.category} ({ticket.department})
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {ticket.title}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 max-w-3xl">
                    {ticket.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Assigned Staff:{" "}
                    <strong className="text-slate-700">
                      {ticket.assigned_staff_name || "Awaiting assignment"}
                    </strong>
                  </span>
                  <span>
                    Created: {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    Updated: {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                  View Timeline & Updates
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
