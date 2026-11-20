"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FilePlus2,
  Paperclip,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Ticket as TicketIcon,
  UploadCloud,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { TicketTimeline } from "@/components/tickets/TicketTimeline";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  createTicket,
  fetchTickets,
  getFastCachedTickets,
} from "@/lib/data-service";
import { suggestDepartmentForCategory } from "@/lib/demo-data";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
} from "@/types";

export default function NewComplaintPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Technical");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // On-the-spot submitted ticket showcase
  const [submittedTicket, setSubmittedTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);

  // Fast-cached list of recent user tickets for live on-the-spot display
  const [recentTickets, setRecentTickets] = useState<Ticket[]>(() =>
    user ? getFastCachedTickets(user) : []
  );

  useEffect(() => {
    if (!user) return;
    fetchTickets(user).then((data) => setRecentTickets(data));
  }, [user]);

  const predictedDepartment = suggestDepartmentForCategory(category);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Attachment must be smaller than 10MB.", "error");
      return;
    }
    setAttachmentName(file.name);
  };

  const handleCopyId = (ticketNumber: string) => {
    navigator.clipboard.writeText(ticketNumber);
    setCopied(true);
    showToast(`Copied ${ticketNumber} to clipboard!`, "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      showToast("Please provide both a title and description.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createTicket({
        customer: user,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        attachment_name: attachmentName,
      });

      // Show the ticket immediately ON THE SPOT
      setSubmittedTicket(created);
      setRecentTickets((prev) => [
        created,
        ...prev.filter((t) => t.id !== created.id),
      ]);

      showToast(
        `Ticket ${created.ticket_number} created on the spot and routed to ${created.department}!`,
        "success"
      );

      // Reset form fields for subsequent complaints
      setTitle("");
      setDescription("");
      setAttachmentName(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to submit complaint.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setSubmittedTicket(null);
    setTitle("");
    setDescription("");
    setAttachmentName(null);
  };

  return (
    <DashboardShell
      allowedRoles={["customer"]}
      title="Submit New Complaint"
      subtitle="Report an issue and get instant on-the-spot tracking, AI department routing, and live status."
    >
      {/* ==================================================================== */}
      {/* ON-THE-SPOT SUBMISSION CONFIRMATION SHOWCASE */}
      {/* Shown immediately when a complaint is created */}
      {/* ==================================================================== */}
      {submittedTicket && (
        <div className="glass-card mb-8 animate-fade-in overflow-hidden rounded-3xl border border-rose-500/40 bg-zinc-950/90 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/40">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Complaint Raised On The Spot • Live Tracking Active
                  </span>
                  <StatusBadge status={submittedTicket.status} />
                  <PriorityBadge priority={submittedTicket.priority} />
                </div>
                <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">
                  {submittedTicket.title}
                </h2>
                <p className="mt-1 text-xs text-white/70">
                  Registered by{" "}
                  <strong className="text-white">
                    {submittedTicket.customer_name || user?.full_name}
                  </strong>{" "}
                  • Just now ({new Date(submittedTicket.created_at).toLocaleTimeString()})
                </p>
              </div>
            </div>

            {/* Ticket ID & Copy Badge */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-black/60 px-4 py-2.5 shadow-inner">
                <span className="text-xs font-semibold text-white/60">Ticket ID:</span>
                <span className="font-mono text-base font-extrabold text-rose-300">
                  {submittedTicket.ticket_number}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(submittedTicket.ticket_number)}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
                  title="Copy Ticket ID"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {copied && (
                <span className="text-[11px] font-semibold text-emerald-400 animate-fade-in">
                  ✓ Ticket ID copied to clipboard!
                </span>
              )}
            </div>
          </div>

          {/* Key Routing & Status Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Routed Department
              </span>
              <p className="mt-1 text-base font-bold text-white">
                {submittedTicket.department}
              </p>
              <p className="text-[11px] text-white/60">
                Auto-assigned via BizAssist AI
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Issue Category
              </span>
              <p className="mt-1 text-base font-bold text-white">
                {submittedTicket.category}
              </p>
              <p className="text-[11px] text-white/60">
                Specialized handling queue
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Priority & Urgency
              </span>
              <p className="mt-1 text-base font-bold text-white">
                {submittedTicket.priority} Priority
              </p>
              <p className="text-[11px] text-white/60">
                High SLA escalation policy
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Expected Response
              </span>
              <p className="mt-1 text-base font-bold text-white">
                &lt; 2 Hours
              </p>
              <p className="text-[11px] text-white/60">
                Dedicated support agent SLA
              </p>
            </div>
          </div>

          {/* Description & Attachment on the spot */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
              Complaint Description Logged:
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
              {submittedTicket.description}
            </p>
            {submittedTicket.attachment_name && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white">
                <Paperclip className="h-4 w-4 text-rose-300" />
                <span>Attachment: {submittedTicket.attachment_name}</span>
              </div>
            )}
          </div>

          {/* Live Timeline */}
          <div className="mt-6">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/70">
              Live Complaint Lifecycle Stage:
            </h4>
            <TicketTimeline currentStatus={submittedTicket.status} />
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={handleResetForAnother}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <RotateCcw className="h-4 w-4" />
              Submit Another Complaint
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/customer/ticket/${submittedTicket.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/40 hover:from-red-500 hover:to-rose-500 transition"
              >
                Track Full Ticket Details & Discussion
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* COMPLAINT SUBMISSION FORM & LIVE RECENT COMPLAINTS FEED */}
      {/* ==================================================================== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="glass-card space-y-5 rounded-3xl p-6 sm:p-7 shadow-card lg:col-span-2 text-white"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                {submittedTicket ? "Raise Another Complaint" : "New Complaint Form"}
              </h3>
              <p className="text-xs text-white/70">
                All fields are automatically processed by BizAssist AI Triage.
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950/40 px-3 py-1 text-xs font-bold text-rose-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Assisted
            </span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/80">
              Complaint Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Unable to download January invoice PDF"
              className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-rose-400 focus:bg-black/60 transition"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/80">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full rounded-xl border border-white/20 bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-white outline-none focus:border-rose-400 transition"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/80">
                Priority Level *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {TICKET_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      priority === p
                        ? "border-rose-400 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-rose-950/40"
                        : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                Complaint Description *
              </label>
              <span className="text-[11px] text-white/50">
                {description.length} characters
              </span>
            </div>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include relevant details such as order ID, invoice number, steps taken, or error messages..."
              className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-rose-400 focus:bg-black/60 transition"
            />
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/80">
              Optional Attachment
            </label>
            {attachmentName ? (
              <div className="flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs font-semibold text-white">
                <span className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-rose-300" />
                  {attachmentName}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachmentName(null)}
                  className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-black/30 px-4 py-6 text-center hover:border-rose-400 hover:bg-black/40 transition">
                <UploadCloud className="h-7 w-7 text-rose-300" />
                <span className="mt-2 text-xs font-bold text-white">
                  Click to attach a screenshot, receipt, or PDF
                </span>
                <span className="mt-0.5 text-[11px] text-white/50">
                  PNG, JPG, PDF up to 10MB
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-[11px] text-white/60">
              ⚡ Instant ticket allocation on submission
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-950/40 hover:from-red-500 hover:to-rose-500 disabled:opacity-60 transition"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting on the spot..." : "Submit Complaint"}
            </button>
          </div>
        </form>

        {/* Smart Routing Preview & Live Recent Complaints Sidebar */}
        <div className="space-y-6">
          {/* Routing Preview */}
          <div className="glass-card rounded-3xl p-5 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300">
              <Sparkles className="h-4 w-4" />
              Auto-Routing Preview
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              Based on category (<strong>{category}</strong>), BizAssist AI will
              route this complaint to:
            </p>
            <div className="mt-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase text-white/70">
                Target Department
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">
                {predictedDepartment}
              </p>
            </div>
            <div className="mt-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase text-white/70">
                Ticket Tracking Format
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-rose-300">
                BA-{new Date().getFullYear()}-XXXX
              </p>
            </div>
          </div>

          {/* Live Recent Complaints on the spot */}
          <div className="glass-card rounded-3xl p-5 text-white shadow-card">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <TicketIcon className="h-4 w-4 text-rose-300" />
                Your Raised Complaints ({recentTickets.length})
              </h3>
              <Link
                href="/customer/complaints"
                className="text-[11px] font-semibold text-rose-300 hover:text-white transition"
              >
                View all →
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <div className="py-6 text-center text-xs text-white/60">
                No complaints submitted yet. Submit one to track it live!
              </div>
            ) : (
              <div className="mt-3 divide-y divide-white/10 max-h-80 overflow-y-auto">
                {recentTickets.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    href={`/customer/ticket/${t.id}`}
                    className="block py-3 hover:bg-white/5 transition rounded-xl px-2 -mx-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-rose-300">
                        {t.ticket_number}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-white">
                      {t.title}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-white/60">
                      <span>{t.department}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
