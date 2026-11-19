"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Paperclip,
  Send,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { createTicket } from "@/lib/data-service";
import { suggestDepartmentForCategory } from "@/lib/demo-data";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketCategory,
  type TicketPriority,
} from "@/types";

export default function NewComplaintPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Technical");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      showToast(
        `Ticket ${created.ticket_number} created successfully and routed to ${created.department}!`,
        "success"
      );
      router.push(`/customer/ticket/${created.id}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to submit complaint.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell
      allowedRoles={["customer"]}
      title="Submit New Complaint"
      subtitle="Report an issue and receive an automatic tracking ID immediately."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-2"
        >
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Complaint Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Unable to download January invoice PDF"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Priority Level *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {TICKET_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      priority === p
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Complaint Description *
              </label>
              <span className="text-[11px] text-slate-400">
                {description.length} characters
              </span>
            </div>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include relevant details such as order ID, invoice number, timestamps, or steps to reproduce..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Optional Attachment
            </label>
            {attachmentName ? (
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs font-semibold text-blue-800">
                <span className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  {attachmentName}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachmentName(null)}
                  className="rounded-lg p-1 text-blue-600 hover:bg-blue-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition">
                <UploadCloud className="h-7 w-7 text-slate-400" />
                <span className="mt-2 text-xs font-semibold text-slate-700">
                  Click to attach a screenshot, receipt, or PDF
                </span>
                <span className="mt-0.5 text-[11px] text-slate-400">
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

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60 transition"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Generating Ticket..." : "Submit Complaint"}
            </button>
          </div>
        </form>

        {/* Smart Routing Info Sidebar */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <Sparkles className="h-4 w-4" />
              Auto-Routing Preview
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/85">
              Based on your selected category (<strong>{category}</strong>),
              BizAssist AI will automatically route this ticket to:
            </p>
            <div className="mt-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase text-white/75">
                Target Department
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">
                {predictedDepartment}
              </p>
            </div>
            <div className="mt-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase text-white/75">
                Ticket ID Format
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-white">
                BA-{new Date().getFullYear()}-XXXX (Auto-generated)
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-sm font-bold text-slate-900">
              What happens after submission?
            </h3>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  A unique ticket number is saved in the database immediately.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  Admins allocate your case to a dedicated specialist.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  You receive instant in-app notifications on every status
                  change.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
