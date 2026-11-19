"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Paperclip,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PriorityBadge, StatusBadge } from "@/components/tickets/TicketBadges";
import { TicketTimeline } from "@/components/tickets/TicketTimeline";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchAllProfiles,
  fetchTickets,
  fetchTicketUpdates,
  updateTicketAndLog,
} from "@/lib/data-service";
import {
  DEPARTMENTS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type DepartmentName,
  type Profile,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
  type TicketUpdate,
} from "@/types";

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // Modal state for inspecting & editing a ticket
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketUpdates, setTicketUpdates] = useState<TicketUpdate[]>([]);
  const [editDepartment, setEditDepartment] =
    useState<DepartmentName>("General Support");
  const [editStaffId, setEditStaffId] = useState<string>("");
  const [editPriority, setEditPriority] = useState<TicketPriority>("Medium");
  const [editStatus, setEditStatus] = useState<TicketStatus>("Open");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tList, profiles] = await Promise.all([
        fetchTickets(user),
        fetchAllProfiles(),
      ]);
      setTickets(tList);
      setStaffList(profiles.filter((p) => p.role === "staff"));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openManageModal = async (t: Ticket) => {
    setSelectedTicket(t);
    setEditDepartment(t.department);
    setEditStaffId(t.assigned_staff_id || "");
    setEditPriority(t.priority);
    setEditStatus(t.status);
    setAdminNote("");
    const upds = await fetchTicketUpdates(t.id);
    setTicketUpdates(upds);
  };

  const handleSaveTicketChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket) return;
    setSaving(true);
    try {
      const chosenStaff = staffList.find((s) => s.id === editStaffId) || null;
      let finalStatus = editStatus;
      if (
        chosenStaff &&
        (selectedTicket.status === "Submitted" ||
          selectedTicket.status === "Open") &&
        editStatus === selectedTicket.status
      ) {
        finalStatus = "Assigned";
      }

      const noteToLog =
        adminNote.trim() ||
        `Admin updated ticket: Dept=${editDepartment}, Staff=${
          chosenStaff ? chosenStaff.full_name : "Unassigned"
        }, Priority=${editPriority}, Status=${finalStatus}.`;

      const updated = await updateTicketAndLog({
        ticketId: selectedTicket.id,
        actor: user,
        department: editDepartment,
        assigned_staff_id: chosenStaff ? chosenStaff.id : null,
        assigned_staff_name: chosenStaff ? chosenStaff.full_name : null,
        priority: editPriority,
        status: finalStatus,
        updateNote: noteToLog,
      });

      showToast(
        `Ticket ${updated.ticket_number} updated & notifications sent!`,
        "success"
      );
      await loadAll();
      setSelectedTicket(updated);
      const upds = await fetchTicketUpdates(updated.id);
      setTicketUpdates(upds);
      setAdminNote("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update ticket.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.ticket_number.toLowerCase().includes(q) ||
        (t.customer_name || "").toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchCat =
        categoryFilter === "All" || t.category === categoryFilter;
      const matchPri =
        priorityFilter === "All" || t.priority === priorityFilter;
      const matchDept =
        departmentFilter === "All" || t.department === departmentFilter;
      return matchSearch && matchStatus && matchCat && matchPri && matchDept;
    });
  }, [
    tickets,
    search,
    statusFilter,
    categoryFilter,
    priorityFilter,
    departmentFilter,
  ]);

  return (
    <DashboardShell
      allowedRoles={["admin"]}
      title="Ticket Queue & Allocation"
      subtitle="Search, filter, assign departments and staff members, and manage ticket priorities."
    >
      {/* Search & Multi-Filter Bar */}
      <div className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Ticket ID (BA-2026-...), customer name, or complaint title..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <span>{filteredTickets.length} tickets shown</span>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
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

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
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
                Category: {c}
              </option>
            ))}
          </select>

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
        </div>
      </div>

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading ticket queue...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No tickets match your current search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ticket ID</th>
                  <th className="px-5 py-3 font-semibold">Customer & Issue</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Assigned Staff</th>
                  <th className="px-5 py-3 font-semibold">Priority</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-blue-600">
                      {t.ticket_number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs truncate text-xs font-bold text-slate-900">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {t.customer_name || "Customer"} • {t.category}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-700">
                      {t.department}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      {t.assigned_staff_name ? (
                        <span className="font-semibold text-slate-800">
                          {t.assigned_staff_name}
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        onClick={() => openManageModal(t)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Assign / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manage Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-fade-in">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700">
                    {selectedTicket.ticket_number}
                  </span>
                  <PriorityBadge priority={selectedTicket.priority} />
                  <StatusBadge status={selectedTicket.status} />
                </div>
                <h2 className="mt-2 text-lg font-extrabold text-slate-900">
                  {selectedTicket.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Submitted by{" "}
                  <strong>{selectedTicket.customer_name || "Customer"}</strong>{" "}
                  on {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Complaint description */}
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="text-[11px] font-bold uppercase text-slate-400">
                Complaint Details
              </p>
              <p className="mt-1 leading-relaxed">
                {selectedTicket.description}
              </p>
              {selectedTicket.attachment_name && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                  {selectedTicket.attachment_name}
                </div>
              )}
            </div>

            <div className="mt-4">
              <TicketTimeline currentStatus={selectedTicket.status} />
            </div>

            {/* Assignment & Status Form */}
            <form
              onSubmit={handleSaveTicketChanges}
              className="mt-5 space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-5"
            >
              <h3 className="text-sm font-bold text-slate-900">
                Allocate Department, Staff & Priority
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Department
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) =>
                      setEditDepartment(e.target.value as DepartmentName)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Assign Support Staff
                  </label>
                  <select
                    value={editStaffId}
                    onChange={(e) => setEditStaffId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.department || "General Support"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) =>
                      setEditPriority(e.target.value as TicketPriority)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Ticket Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as TicketStatus)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Admin Update / Allocation Note (Optional)
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g., Escalated to Billing specialist for priority review."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {saving ? "Saving..." : "Save & Notify"}
                </button>
              </div>
            </form>

            {/* Activity History */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Status Update History ({ticketUpdates.length})
              </h4>
              <div className="mt-2.5 space-y-2">
                {ticketUpdates.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {u.updated_by_name} → {u.new_status}
                      </span>
                      <span className="text-slate-400">
                        {new Date(u.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{u.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
