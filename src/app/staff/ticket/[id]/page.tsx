"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardEdit,
  Paperclip,
  Save,
  User,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { TicketTimeline } from "@/components/tickets/TicketTimeline";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchTicketById,
  fetchTicketUpdates,
  updateTicketAndLog,
} from "@/lib/data-service";
import {
  TICKET_STATUSES,
  type Ticket,
  type TicketStatus,
  type TicketUpdate,
} from "@/types";

export default function StaffTicketWorkspacePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [updates, setUpdates] = useState<TicketUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<TicketStatus>("In Progress");
  const [investigationNote, setInvestigationNote] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!params?.id) return;
    setLoading(true);
    try {
      const t = await fetchTicketById(params.id);
      setTicket(t);
      if (t) {
        setStatus(t.status);
        setResolutionNotes(t.resolution_notes || "");
        const upds = await fetchTicketUpdates(t.id);
        setUpdates(upds);
      }
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const submitUpdate = async (overrideStatus?: TicketStatus) => {
    if (!user || !ticket) return;
    const nextStatus = overrideStatus ?? status;
    const noteToSave =
      investigationNote.trim() ||
      (nextStatus === "Resolved"
        ? resolutionNotes.trim() || "Issue investigated and marked as resolved."
        : `Updated ticket status to ${nextStatus}.`);

    setSaving(true);
    try {
      await updateTicketAndLog({
        ticketId: ticket.id,
        actor: user,
        status: nextStatus,
        resolution_notes: resolutionNotes.trim() || null,
        updateNote: noteToSave,
      });
      setInvestigationNote("");
      showToast(
        nextStatus === "Resolved"
          ? `Ticket ${ticket.ticket_number} marked as Resolved! Customer notified.`
          : `Ticket ${ticket.ticket_number} updated to ${nextStatus}.`,
        "success"
      );
      await loadTicket();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to save update.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      allowedRoles={["staff"]}
      title={ticket ? `Case ${ticket.ticket_number}` : "Ticket Workspace"}
      subtitle="Add investigation notes, update status, and document final resolution."
    >
      <div className="mb-4">
        <Link
          href="/staff/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assigned Tickets
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading ticket details...
        </div>
      ) : !ticket ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-bold text-slate-900">Ticket not found</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Details + Activity Log */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700">
                  {ticket.ticket_number}
                </span>
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">
                  {ticket.category} ({ticket.department})
                </span>
              </div>

              <h2 className="mt-3 text-xl font-extrabold text-slate-900">
                {ticket.title}
              </h2>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Customer:{" "}
                  <strong className="text-slate-700">
                    {ticket.customer_name || "Customer"}
                  </strong>{" "}
                  ({ticket.customer_email || "Registered user"})
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {ticket.description}
              </div>

              {ticket.attachment_name && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                  Attachment: {ticket.attachment_name}
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-5">
                <TicketTimeline currentStatus={ticket.status} />
              </div>
            </div>

            {/* Activity History */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <h3 className="text-sm font-bold text-slate-900">
                Ticket Communication & Update History ({updates.length})
              </h3>
              <div className="mt-4 space-y-3">
                {updates.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {u.updated_by_name}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                          {u.updated_by_role}
                        </span>
                        <StatusBadge status={u.new_status} />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(u.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{u.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Staff Resolution & Status Panel */}
          <div className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ClipboardEdit className="h-4 w-4 text-blue-600" />
              Investigation & Resolution
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Update Ticket Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Investigation Note / Customer Update
              </label>
              <textarea
                rows={3}
                value={investigationNote}
                onChange={(e) => setInvestigationNote(e.target.value)}
                placeholder="Write a clear update that will appear on the customer's timeline..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Resolution Summary
              </label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Document root cause and exact resolution steps taken..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => submitUpdate()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Update & Notify Customer"}
              </button>

              {ticket.status !== "Resolved" && ticket.status !== "Closed" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => submitUpdate("Resolved")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Ticket as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
