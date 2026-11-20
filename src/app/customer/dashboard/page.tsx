"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FilePlus2,
  FolderOpen,
  Ticket as TicketIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { useAuth } from "@/context/AuthContext";
import { fetchTickets, getFastCachedTickets } from "@/lib/data-service";
import type { Ticket } from "@/types";

export default function CustomerDashboardPage() {
  const { user } = useAuth();

  // Instantaneous 0ms initial render from fast cache
  const [tickets, setTickets] = useState<Ticket[]>(() =>
    user ? getFastCachedTickets(user) : []
  );
  const [loading, setLoading] = useState<boolean>(() =>
    user ? getFastCachedTickets(user).length === 0 : true
  );

  useEffect(() => {
    if (!user) return;
    fetchTickets(user)
      .then((data) => setTickets(data))
      .finally(() => setLoading(false));
  }, [user]);

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) =>
    ["Submitted", "Open", "Assigned"].includes(t.status)
  ).length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "In Progress"
  ).length;
  const resolvedCount = tickets.filter((t) =>
    ["Resolved", "Closed"].includes(t.status)
  ).length;

  return (
    <DashboardShell
      allowedRoles={["customer"]}
      title="Customer Dashboard"
      subtitle="Submit complaints, track ticket progress, and view real-time updates."
    >
      {/* Welcome Banner */}
      <div className="glass-card mb-6 flex flex-col justify-between gap-4 rounded-3xl p-6 text-white sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Welcome back
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">
            Hello, {user?.full_name} 👋
          </h2>
          <p className="mt-1 text-sm text-white/85">
            Track your active complaints or launch BizAssist Assistant anytime
            for instant help.
          </p>
        </div>
        <Link
          href="/customer/new-complaint"
          className="crimson-pill-btn inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/40"
        >
          <FilePlus2 className="h-4 w-4" />
          Submit New Complaint
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Complaints"
          value={totalCount}
          hint="All submitted tickets"
          icon={<TicketIcon className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Open Tickets"
          value={openCount}
          hint="Submitted, Open, or Assigned"
          icon={<FolderOpen className="h-5 w-5" />}
          accent="purple"
        />
        <StatCard
          label="In-Progress"
          value={inProgressCount}
          hint="Actively investigated by staff"
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="Resolved Tickets"
          value={resolvedCount}
          hint="Completed & closed cases"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="emerald"
        />
      </div>

      {/* Recent Complaints Table */}
      <div className="glass-card overflow-hidden rounded-3xl shadow-card text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Recent Complaints
            </h3>
            <p className="text-xs text-white/70">
              Click any ticket to inspect its full timeline and staff notes.
            </p>
          </div>
          <Link
            href="/customer/complaints"
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-white transition"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-white/70">
            Loading your tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center">
            <TicketIcon className="mx-auto h-12 w-12 text-rose-300/40" />
            <h4 className="mt-3 text-base font-bold text-white">
              No complaints submitted yet
            </h4>
            <p className="mt-1 text-xs text-white/70">
              Need help with an issue? Submit your first complaint and receive
              an automatic ticket ID immediately.
            </p>
            <Link
              href="/customer/new-complaint"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/40 hover:from-red-500 hover:to-rose-500 transition"
            >
              <FilePlus2 className="h-4 w-4" />
              Submit New Complaint
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/70">
                <tr>
                  <th className="px-6 py-3 font-semibold">Ticket ID</th>
                  <th className="px-6 py-3 font-semibold">Title</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Priority</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Updated</th>
                  <th className="px-6 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tickets.slice(0, 6).map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-white/10 transition"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-rose-300">
                      {ticket.ticket_number}
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate font-semibold text-white">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-white/60">
                        {ticket.department}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-white/80">
                      {ticket.category}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-white/60">
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/customer/ticket/${ticket.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                      >
                        Track
                        <ArrowRight className="h-3 w-3" />
                      </Link>
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
