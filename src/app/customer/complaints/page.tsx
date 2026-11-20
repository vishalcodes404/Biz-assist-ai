"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FilePlus2, Search, Ticket as TicketIcon } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { useAuth } from "@/context/AuthContext";
import { fetchTickets, getFastCachedTickets } from "@/lib/data-service";
import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  type Ticket,
} from "@/types";

export default function CustomerComplaintsPage() {
  const { user } = useAuth();

  // Instantaneous 0ms initial render from local cache
  const [tickets, setTickets] = useState<Ticket[]>(() =>
    user ? getFastCachedTickets(user) : []
  );
  const [loading, setLoading] = useState<boolean>(() =>
    user ? getFastCachedTickets(user).length === 0 : true
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  useEffect(() => {
    if (!user) return;
    fetchTickets(user)
      .then((data) => setTickets(data))
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
      subtitle="Search, filter, and track every support ticket you have submitted with real-time updates."
    >
      {/* Toolbar */}
      <div className="glass-card mb-6 flex flex-col gap-3 rounded-3xl p-4 shadow-card lg:flex-row lg:items-center lg:justify-between text-white">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ticket ID (BA-2026-...) or issue..."
            className="w-full rounded-xl border border-white/20 bg-black/40 py-2 pl-10 pr-3 text-sm text-white placeholder-white/40 outline-none focus:border-rose-400 focus:bg-black/60 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/20 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-rose-400"
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
            className="rounded-xl border border-white/20 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-rose-400"
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/40 hover:from-red-500 hover:to-rose-500 transition"
          >
            <FilePlus2 className="h-4 w-4" />
            New Complaint
          </Link>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-sm text-white/70">
          Loading complaint history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center shadow-card text-white">
          <TicketIcon className="mx-auto h-12 w-12 text-rose-300/40" />
          <h3 className="mt-3 text-base font-bold text-white">
            No matching complaints found
          </h3>
          <p className="mt-1 text-xs text-white/70">
            Submit a new complaint to start tracking it live with BizAssist AI.
          </p>
          <Link
            href="/customer/new-complaint"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/40 hover:from-red-500 hover:to-rose-500 transition"
          >
            <FilePlus2 className="h-4 w-4" />
            Raise Complaint Now
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/customer/ticket/${ticket.id}`}
              className="group glass-card block rounded-3xl p-5 shadow-card hover:border-rose-400/50 hover:bg-white/10 transition-all text-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-300">
                      {ticket.ticket_number}
                    </span>
                    <span className="text-xs text-white/40">•</span>
                    <span className="text-xs font-medium text-white/70">
                      {ticket.category} ({ticket.department})
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition">
                    {ticket.title}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-white/70 max-w-3xl">
                    {ticket.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-white/60">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Assigned Staff:{" "}
                    <strong className="text-white">
                      {ticket.assigned_staff_name || "Awaiting allocation"}
                    </strong>
                  </span>
                  <span>
                    Created: {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    Updated: {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-300 group-hover:translate-x-1 transition-transform">
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
