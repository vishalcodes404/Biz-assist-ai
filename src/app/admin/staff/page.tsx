"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, Mail, UserPlus, Users, Wrench } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  createStaffProfileDemoOrLive,
  fetchAllProfiles,
  fetchTickets,
  updateProfileRoleOrDepartment,
} from "@/lib/data-service";
import { DEPARTMENTS, type DepartmentName, type Profile, type Ticket } from "@/types";

export default function AdminStaffManagementPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"staff" | "customers">("staff");

  // New staff form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDept, setNewDept] = useState<DepartmentName>("Technical Support");
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [pList, tList] = await Promise.all([
        fetchAllProfiles(),
        fetchTickets(user),
      ]);
      setProfiles(pList);
      setTickets(tList);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const staffMembers = profiles.filter((p) => p.role === "staff");
  const customers = profiles.filter((p) => p.role === "customer");

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setAdding(true);
    try {
      await createStaffProfileDemoOrLive({
        full_name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: "staff",
        department: newDept,
      });
      setNewName("");
      setNewEmail("");
      showToast("Support staff account added successfully.", "success");
      await loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not add staff account.",
        "error"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDepartmentChange = async (
    staffId: string,
    department: DepartmentName
  ) => {
    try {
      await updateProfileRoleOrDepartment(staffId, { department });
      showToast(`Updated staff department to ${department}.`, "success");
      await loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Update failed.",
        "error"
      );
    }
  };

  return (
    <DashboardShell
      allowedRoles={["admin"]}
      title="Staff & Customer Management"
      subtitle="Manage support staff department assignments and view registered customer records."
    >
      {/* Tab Bar */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("staff")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            tab === "staff"
              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-rose-950/40"
              : "border border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Support Staff ({staffMembers.length})
        </button>
        <button
          onClick={() => setTab("customers")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            tab === "customers"
              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-rose-950/40"
              : "border border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
          }`}
        >
          <Users className="h-4 w-4" />
          Customer Records ({customers.length})
        </button>
      </div>

      {tab === "staff" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Staff Form */}
          <form
            onSubmit={handleAddStaff}
            className="glass-card h-fit space-y-4 rounded-2xl p-6 shadow-card"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <UserPlus className="h-4 w-4 text-rose-400" />
              Add Support Staff Member
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/80">
                Full Name
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Maya Patel"
                className="w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-rose-400 focus:bg-black/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/80">
                Work Email
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="maya@bizassist.demo"
                className="w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-rose-400 focus:bg-black/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/80">
                Department
              </label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value as DepartmentName)}
                className="w-full rounded-xl border border-white/20 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-rose-400"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/40 hover:from-red-500 hover:to-rose-500 disabled:opacity-60 transition"
            >
              {adding ? "Adding Staff..." : "Create Staff Account"}
            </button>
          </form>

          {/* Staff Table */}
          <div className="glass-card overflow-hidden rounded-2xl shadow-card lg:col-span-2">
            <div className="border-b border-white/10 px-6 py-4">
              <h3 className="text-sm font-bold text-white">
                Active Support Staff Directory
              </h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-xs text-white/70">
                Loading staff accounts...
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {staffMembers.map((member) => {
                  const assignedCount = tickets.filter(
                    (t) => t.assigned_staff_id === member.id
                  ).length;
                  const resolvedCount = tickets.filter(
                    (t) =>
                      t.assigned_staff_id === member.id &&
                      ["Resolved", "Closed"].includes(t.status)
                  ).length;

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-600 text-xs font-bold text-white shadow-md shadow-rose-950/40">
                          {member.full_name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {member.full_name}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-white/70">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-white/60" />
                          <select
                            value={member.department || "General Support"}
                            onChange={(e) =>
                              handleDepartmentChange(
                                member.id,
                                e.target.value as DepartmentName
                              )
                            }
                            className="rounded-lg border border-white/20 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-rose-400"
                          >
                            {DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        <span className="rounded-full border border-rose-500/30 bg-rose-950/60 px-2.5 py-1 text-xs font-semibold text-rose-300">
                          {assignedCount} Assigned • {resolvedCount} Resolved
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Customers Table */
        <div className="glass-card overflow-hidden rounded-2xl shadow-card">
          <div className="border-b border-white/10 px-6 py-4">
            <h3 className="text-sm font-bold text-white">
              Registered Customer Accounts
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/70">
                <tr>
                  <th className="px-6 py-3 font-semibold">Customer Name</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Total Complaints</th>
                  <th className="px-6 py-3 font-semibold">Resolved</th>
                  <th className="px-6 py-3 font-semibold">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {customers.map((c) => {
                  const custTickets = tickets.filter(
                    (t) => t.customer_id === c.id
                  );
                  const custResolved = custTickets.filter((t) =>
                    ["Resolved", "Closed"].includes(t.status)
                  ).length;
                  return (
                    <tr key={c.id} className="hover:bg-white/10 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        {c.full_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-white/70">
                        {c.email}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-rose-300">
                        {custTickets.length}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-emerald-400">
                        {custResolved}
                      </td>
                      <td className="px-6 py-4 text-xs text-white/60">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
