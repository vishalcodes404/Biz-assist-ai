"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  MessageSquarePlus,
  Paperclip,
  Send,
  UserCheck,
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
import type { Ticket, TicketUpdate } from "@/types";

export default function CustomerTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [updates, setUpdates] = useState<TicketUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  const loadData = useCallback(async () => {
    if (!params?.id) return;
    setLoading(true);
    try {
      const t = await fetchTicketById(params.id);
      setTicket(t);
      if (t) {
        const upds = await fetchTicketUpdates(t.id);
        setUpdates(upds);
      }
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCustomerComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticket || !replyText.trim()) return;
    setPosting(true);
    try {
      await updateTicketAndLog({
        ticketId: ticket.id,
        actor: user,
        updateNote: replyText.trim(),
      });
      setReplyText("");
      showToast("Comment added to ticket timeline.", "success");
      await loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to post comment.",
        "error"
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <DashboardShell
      allowedRoles={["customer"]}
      title={ticket ? `Ticket ${ticket.ticket_number}` : "Ticket Details"}
      subtitle="Visual status timeline, assigned team, and resolution history."
    >
      <div className="mb-4">
        <Link
          href="/customer/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Complaints
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading ticket timeline...
        </div>
      ) : !ticket ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <h2 className="text-base font-bold text-slate-900">
            Ticket not found
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            This ticket may not exist or you may not have permission to view it.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header & Timeline Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700">
                    {ticket.ticket_number}
                  </span>
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
                <h2 className="mt-3 text-xl font-extrabold text-slate-900">
                  {ticket.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {ticket.description}
                </p>
                {ticket.attachment_name && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                    Attachment: {ticket.attachment_name}
                  </div>
                )}
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="mt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Complaint Progress Timeline
              </p>
              <TicketTimeline currentStatus={ticket.status} />
            </div>

            {/* Metadata Row */}
            <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Assigned Department
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {ticket.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <UserCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Assigned Staff Member
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {ticket.assigned_staff_name || "Pending Admin Allocation"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Calendar className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Created / Last Updated
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {new Date(ticket.created_at).toLocaleDateString()} •{" "}
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Banner if available */}
          {ticket.resolution_notes && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Latest Staff Resolution Notes
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-950">
                {ticket.resolution_notes}
              </p>
            </div>
          )}

          {/* Status History & Updates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-base font-bold text-slate-900">
              Ticket Activity & Updates ({updates.length})
            </h3>
            <div className="mt-4 space-y-4">
              {updates.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No updates logged yet.
                </p>
              ) : (
                updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {upd.updated_by_name || "Support Team"}
                        </span>
                        <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                          {upd.updated_by_role || "staff"}
                        </span>
                        <StatusBadge status={upd.new_status} />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(upd.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{upd.notes}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Follow-up Comment */}
            {ticket.status !== "Closed" && (
              <form
                onSubmit={handleCustomerComment}
                className="mt-6 border-t border-slate-100 pt-5"
              >
                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MessageSquarePlus className="h-4 w-4 text-blue-600" />
                  Add a follow-up message
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Share additional context or reply to support staff..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    disabled={posting || !replyText.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    <Send className="h-4 w-4" />
                    {posting ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
