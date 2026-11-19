import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  DEMO_NOTIFICATIONS,
  DEMO_PROFILES,
  DEMO_TICKET_UPDATES,
  DEMO_TICKETS,
  suggestDepartmentForCategory,
} from "@/lib/demo-data";
import type {
  DepartmentName,
  NotificationItem,
  Profile,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketUpdate,
  UserRole,
} from "@/types";

const STORAGE_KEYS = {
  profiles: "bizassist_demo_profiles_v1",
  tickets: "bizassist_demo_tickets_v1",
  updates: "bizassist_demo_updates_v1",
  notifications: "bizassist_demo_notifications_v1",
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

function isTableMissingError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { code?: string; message?: string };
  const msg = String(err.message || "");
  const code = String(err.code || "");
  return (
    code === "PGRST205" ||
    msg.includes("Could not find the table") ||
    msg.includes("relation") ||
    msg.includes("schema cache")
  );
}

export function generateTicketNumber(existingTickets: Ticket[]): string {
  const year = new Date().getFullYear();
  let maxSeq = 0;
  for (const t of existingTickets) {
    const match = t.ticket_number.match(/BA-\d{4}-(\d+)/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `BA-${year}-${nextSeq}`;
}

// ============================================================================
// PROFILES
// ============================================================================
export async function fetchAllProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient()!;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        if (isTableMissingError(error)) {
          console.warn("Supabase 'profiles' table not found yet. Using local fallback.");
          return readStorage<Profile[]>(STORAGE_KEYS.profiles, DEMO_PROFILES);
        }
        throw new Error(error.message);
      }
      return (data || []) as Profile[];
    } catch (e) {
      if (isTableMissingError(e)) {
        return readStorage<Profile[]>(STORAGE_KEYS.profiles, DEMO_PROFILES);
      }
      throw e;
    }
  }
  return readStorage<Profile[]>(STORAGE_KEYS.profiles, DEMO_PROFILES);
}

export async function createStaffProfileDemoOrLive(payload: {
  full_name: string;
  email: string;
  role: UserRole;
  department: DepartmentName | null;
}): Promise<Profile> {
  if (isSupabaseConfigured()) {
    // In live Supabase, staff should register or be invited via Admin API;
    // here we attempt inserting or updating profile if allowed by RLS.
    const supabase = getSupabaseBrowserClient()!;
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        full_name: payload.full_name,
        email: payload.email,
        role: payload.role,
        department: payload.department,
      })
      .select()
      .single();
    if (error) {
      throw new Error(
        "In live Supabase mode, have the staff member register at /register or invite them via the Supabase Auth dashboard."
      );
    }
    return data as Profile;
  }

  const profiles = readStorage<Profile[]>(STORAGE_KEYS.profiles, DEMO_PROFILES);
  const exists = profiles.find(
    (p) => p.email.toLowerCase() === payload.email.toLowerCase()
  );
  if (exists) {
    throw new Error("A user with this email already exists.");
  }
  const created: Profile = {
    id: `${payload.role}-${Date.now()}`,
    full_name: payload.full_name,
    email: payload.email,
    role: payload.role,
    department: payload.department,
    created_at: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.profiles, [created, ...profiles]);
  return created;
}

export async function updateProfileRoleOrDepartment(
  profileId: string,
  updates: Partial<Pick<Profile, "role" | "department" | "full_name">>
): Promise<Profile> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient()!;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  }

  const profiles = readStorage<Profile[]>(STORAGE_KEYS.profiles, DEMO_PROFILES);
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx === -1) throw new Error("Profile not found.");
  profiles[idx] = { ...profiles[idx], ...updates };
  writeStorage(STORAGE_KEYS.profiles, profiles);
  return profiles[idx];
}

// ============================================================================
// TICKETS
// ============================================================================
export async function fetchTickets(user: Profile): Promise<Ticket[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient()!;
      let query = supabase
        .from("tickets")
        .select(
          `
          *,
          customer:profiles!tickets_customer_id_fkey(full_name, email),
          staff:profiles!tickets_assigned_staff_id_fkey(full_name)
        `
        )
        .order("created_at", { ascending: false });

      if (user.role === "customer") {
        query = query.eq("customer_id", user.id);
      } else if (user.role === "staff") {
        query = query.eq("assigned_staff_id", user.id);
      }

      const { data, error } = await query;
      if (error) {
        if (isTableMissingError(error)) {
          console.warn("Supabase 'tickets' table not found yet. Using local fallback.");
          const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
          if (user.role === "customer") return tickets.filter((t) => t.customer_id === user.id);
          if (user.role === "staff") return tickets.filter((t) => t.assigned_staff_id === user.id);
          return tickets;
        }
        throw new Error(error.message);
      }

      return (data || []).map((row: Record<string, unknown>) => {
        const cust = row.customer as { full_name?: string; email?: string } | null;
        const st = row.staff as { full_name?: string } | null;
        return {
          ...(row as unknown as Ticket),
          customer_name: cust?.full_name || "Customer",
          customer_email: cust?.email || "",
          assigned_staff_name: st?.full_name || null,
        };
      });
    } catch (e) {
      if (isTableMissingError(e)) {
        const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
        if (user.role === "customer") return tickets.filter((t) => t.customer_id === user.id);
        if (user.role === "staff") return tickets.filter((t) => t.assigned_staff_id === user.id);
        return tickets;
      }
      throw e;
    }
  }

  const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
  if (user.role === "customer") {
    return tickets.filter((t) => t.customer_id === user.id);
  }
  if (user.role === "staff") {
    return tickets.filter((t) => t.assigned_staff_id === user.id);
  }
  return tickets;
}

export async function fetchTicketById(ticketId: string): Promise<Ticket | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient()!;
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          *,
          customer:profiles!tickets_customer_id_fkey(full_name, email),
          staff:profiles!tickets_assigned_staff_id_fkey(full_name)
        `
        )
        .eq("id", ticketId)
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          console.warn("Supabase 'tickets' table not found. Using local fallback.");
        } else if (error.code !== "PGRST116") {
          // PGRST116 = "not found" which is a valid empty result
          throw new Error(error.message);
        }
      }
      if (data) {
        const row = data as Record<string, unknown>;
        const cust = row.customer as { full_name?: string; email?: string } | null;
        const st = row.staff as { full_name?: string } | null;
        return {
          ...(row as unknown as Ticket),
          customer_name: cust?.full_name || "Customer",
          customer_email: cust?.email || "",
          assigned_staff_name: st?.full_name || null,
        };
      }
      // If table missing, fall through to local
      if (error && isTableMissingError(error)) {
        // fall through
      } else {
        return null;
      }
    } catch (e) {
      if (!isTableMissingError(e)) throw e;
    }
  }

  const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
  return (
    tickets.find(
      (t) =>
        t.id === ticketId ||
        t.ticket_number.toLowerCase() === ticketId.toLowerCase()
    ) || null
  );
}

export async function lookupTicketByNumber(
  ticketNumber: string
): Promise<Ticket | null> {
  const clean = ticketNumber.trim().toUpperCase();
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient()!;
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .ilike("ticket_number", clean)
        .maybeSingle();
      if (error && isTableMissingError(error)) {
        const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
        return tickets.find((t) => t.ticket_number.toUpperCase() === clean) || null;
      }
      return (data as Ticket) || null;
    } catch (e) {
      if (isTableMissingError(e)) {
        const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
        return tickets.find((t) => t.ticket_number.toUpperCase() === clean) || null;
      }
      throw e;
    }
  }
  const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
  return tickets.find((t) => t.ticket_number.toUpperCase() === clean) || null;
}

export async function createTicket(payload: {
  customer: Profile;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  attachment_name?: string | null;
  attachment_url?: string | null;
}): Promise<Ticket> {
  const department = suggestDepartmentForCategory(payload.category);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient()!;
    const { data: existing } = await supabase
      .from("tickets")
      .select("ticket_number");
    const ticketNumber = generateTicketNumber((existing || []) as Ticket[]);

    const { data: created, error } = await supabase
      .from("tickets")
      .insert({
        ticket_number: ticketNumber,
        customer_id: payload.customer.id,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        priority: payload.priority,
        department,
        status: "Submitted",
        attachment_name: payload.attachment_name || null,
        attachment_url: payload.attachment_url || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("ticket_updates").insert({
      ticket_id: created.id,
      updated_by: payload.customer.id,
      old_status: null,
      new_status: "Submitted",
      notes: `Complaint submitted and automatically categorized under ${department}.`,
    });

    // Notify admins
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id,
          ticket_id: created.id,
          message: `New ${payload.priority} complaint ${ticketNumber} submitted by ${payload.customer.full_name}.`,
        }))
      );
    }

    return {
      ...(created as Ticket),
      customer_name: payload.customer.full_name,
      customer_email: payload.customer.email,
    };
  }

  // Demo Mode persistence
  const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
  const ticketNumber = generateTicketNumber(tickets);
  const now = new Date().toISOString();

  const newTicket: Ticket = {
    id: `tkt-${Date.now()}`,
    ticket_number: ticketNumber,
    customer_id: payload.customer.id,
    customer_name: payload.customer.full_name,
    customer_email: payload.customer.email,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    department,
    assigned_staff_id: null,
    assigned_staff_name: null,
    attachment_name: payload.attachment_name || null,
    attachment_url: payload.attachment_url || null,
    resolution_notes: null,
    status: "Submitted",
    created_at: now,
    updated_at: now,
  };

  writeStorage(STORAGE_KEYS.tickets, [newTicket, ...tickets]);

  const updates = readStorage<TicketUpdate[]>(
    STORAGE_KEYS.updates,
    DEMO_TICKET_UPDATES
  );
  updates.push({
    id: `upd-${Date.now()}`,
    ticket_id: newTicket.id,
    updated_by: payload.customer.id,
    updated_by_name: payload.customer.full_name,
    updated_by_role: payload.customer.role,
    old_status: null,
    new_status: "Submitted",
    notes: `Complaint submitted and routed to ${department}.`,
    created_at: now,
  });
  writeStorage(STORAGE_KEYS.updates, updates);

  // Notify admins & customer confirmation
  const profiles = readStorage<Profile[]>(STORAGE_KEYS.profiles, DEMO_PROFILES);
  const notifs = readStorage<NotificationItem[]>(
    STORAGE_KEYS.notifications,
    DEMO_NOTIFICATIONS
  );
  const adminUsers = profiles.filter((p) => p.role === "admin");
  for (const adm of adminUsers) {
    notifs.unshift({
      id: `notif-${Date.now()}-${adm.id}`,
      user_id: adm.id,
      ticket_id: newTicket.id,
      ticket_number: ticketNumber,
      message: `New ${payload.priority} complaint ${ticketNumber} submitted by ${payload.customer.full_name}.`,
      is_read: false,
      created_at: now,
    });
  }
  notifs.unshift({
    id: `notif-${Date.now()}-cust`,
    user_id: payload.customer.id,
    ticket_id: newTicket.id,
    ticket_number: ticketNumber,
    message: `Your complaint ${ticketNumber} has been created and routed to ${department}.`,
    is_read: false,
    created_at: now,
  });
  writeStorage(STORAGE_KEYS.notifications, notifs);

  return newTicket;
}

export async function updateTicketAndLog(payload: {
  ticketId: string;
  actor: Profile;
  status?: TicketStatus;
  priority?: TicketPriority;
  department?: DepartmentName;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  resolution_notes?: string | null;
  updateNote: string;
}): Promise<Ticket> {
  const existing = await fetchTicketById(payload.ticketId);
  if (!existing) throw new Error("Ticket not found.");

  const nextStatus = payload.status ?? existing.status;
  const nextPriority = payload.priority ?? existing.priority;
  const nextDept = payload.department ?? existing.department;
  const nextStaffId =
    payload.assigned_staff_id !== undefined
      ? payload.assigned_staff_id
      : existing.assigned_staff_id;
  const nextResolution =
    payload.resolution_notes !== undefined
      ? payload.resolution_notes
      : existing.resolution_notes;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient()!;
    const { data: updated, error } = await supabase
      .from("tickets")
      .update({
        status: nextStatus,
        priority: nextPriority,
        department: nextDept,
        assigned_staff_id: nextStaffId,
        resolution_notes: nextResolution,
      })
      .eq("id", payload.ticketId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("ticket_updates").insert({
      ticket_id: payload.ticketId,
      updated_by: payload.actor.id,
      old_status: existing.status,
      new_status: nextStatus,
      notes: payload.updateNote,
    });

    const notificationsToInsert: Array<{
      user_id: string;
      ticket_id: string;
      message: string;
    }> = [];

    if (existing.customer_id !== payload.actor.id) {
      notificationsToInsert.push({
        user_id: existing.customer_id,
        ticket_id: existing.id,
        message: `${payload.actor.full_name} updated ticket ${existing.ticket_number} (${nextStatus}): ${payload.updateNote}`,
      });
    }
    if (nextStaffId && nextStaffId !== payload.actor.id) {
      notificationsToInsert.push({
        user_id: nextStaffId,
        ticket_id: existing.id,
        message: `Ticket ${existing.ticket_number} (${nextPriority}) updated/assigned by ${payload.actor.full_name}.`,
      });
    }
    if (notificationsToInsert.length > 0) {
      await supabase.from("notifications").insert(notificationsToInsert);
    }

    return {
      ...(updated as Ticket),
      customer_name: existing.customer_name,
      customer_email: existing.customer_email,
      assigned_staff_name:
        payload.assigned_staff_name !== undefined
          ? payload.assigned_staff_name
          : existing.assigned_staff_name,
    };
  }

  // Demo Mode persistence
  const tickets = readStorage<Ticket[]>(STORAGE_KEYS.tickets, DEMO_TICKETS);
  const profiles = readStorage<Profile[]>(STORAGE_KEYS.profiles, DEMO_PROFILES);
  const idx = tickets.findIndex((t) => t.id === payload.ticketId);
  if (idx === -1) throw new Error("Ticket not found.");

  const staffProfile = nextStaffId
    ? profiles.find((p) => p.id === nextStaffId)
    : null;
  const now = new Date().toISOString();

  const updatedTicket: Ticket = {
    ...tickets[idx],
    status: nextStatus,
    priority: nextPriority,
    department: nextDept,
    assigned_staff_id: nextStaffId,
    assigned_staff_name: staffProfile
      ? staffProfile.full_name
      : payload.assigned_staff_name ?? null,
    resolution_notes: nextResolution,
    updated_at: now,
  };

  tickets[idx] = updatedTicket;
  writeStorage(STORAGE_KEYS.tickets, tickets);

  const updates = readStorage<TicketUpdate[]>(
    STORAGE_KEYS.updates,
    DEMO_TICKET_UPDATES
  );
  updates.push({
    id: `upd-${Date.now()}`,
    ticket_id: existing.id,
    updated_by: payload.actor.id,
    updated_by_name: payload.actor.full_name,
    updated_by_role: payload.actor.role,
    old_status: existing.status,
    new_status: nextStatus,
    notes: payload.updateNote,
    created_at: now,
  });
  writeStorage(STORAGE_KEYS.updates, updates);

  const notifs = readStorage<NotificationItem[]>(
    STORAGE_KEYS.notifications,
    DEMO_NOTIFICATIONS
  );
  if (existing.customer_id !== payload.actor.id) {
    notifs.unshift({
      id: `notif-${Date.now()}-c`,
      user_id: existing.customer_id,
      ticket_id: existing.id,
      ticket_number: existing.ticket_number,
      message: `${payload.actor.full_name} updated ${existing.ticket_number} to ${nextStatus}: ${payload.updateNote}`,
      is_read: false,
      created_at: now,
    });
  }
  if (nextStaffId && nextStaffId !== payload.actor.id) {
    notifs.unshift({
      id: `notif-${Date.now()}-s`,
      user_id: nextStaffId,
      ticket_id: existing.id,
      ticket_number: existing.ticket_number,
      message: `Ticket ${existing.ticket_number} (${nextPriority}) assigned/updated by ${payload.actor.full_name}.`,
      is_read: false,
      created_at: now,
    });
  }
  writeStorage(STORAGE_KEYS.notifications, notifs);

  return updatedTicket;
}

// ============================================================================
// TICKET UPDATES
// ============================================================================
export async function fetchTicketUpdates(
  ticketId: string
): Promise<TicketUpdate[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient()!;
      const { data, error } = await supabase
        .from("ticket_updates")
        .select(
          `
          *,
          actor:profiles!ticket_updates_updated_by_fkey(full_name, role)
        `
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) {
        if (isTableMissingError(error)) {
          console.warn("Supabase 'ticket_updates' table not found. Using local fallback.");
        } else {
          throw new Error(error.message);
        }
      } else {
        return (data || []).map((row: Record<string, unknown>) => {
          const actor = row.actor as { full_name?: string; role?: UserRole } | null;
          return {
            ...(row as unknown as TicketUpdate),
            updated_by_name: actor?.full_name || "System",
            updated_by_role: actor?.role || "staff",
          };
        });
      }
    } catch (e) {
      if (!isTableMissingError(e)) throw e;
    }
  }

  const updates = readStorage<TicketUpdate[]>(
    STORAGE_KEYS.updates,
    DEMO_TICKET_UPDATES
  );
  return updates
    .filter((u) => u.ticket_id === ticketId)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export async function fetchNotifications(
  userId: string
): Promise<NotificationItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient()!;
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        if (isTableMissingError(error)) {
          return readStorage<NotificationItem[]>(STORAGE_KEYS.notifications, DEMO_NOTIFICATIONS).filter((n) => n.user_id === userId);
        }
        throw new Error(error.message);
      }
      return (data || []) as NotificationItem[];
    } catch {
      return readStorage<NotificationItem[]>(STORAGE_KEYS.notifications, DEMO_NOTIFICATIONS).filter((n) => n.user_id === userId);
    }
  }

  const notifs = readStorage<NotificationItem[]>(
    STORAGE_KEYS.notifications,
    DEMO_NOTIFICATIONS
  );
  return notifs.filter((n) => n.user_id === userId);
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient()!;
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      return;
    } catch {
      // fall through to local
    }
  }
  const notifs = readStorage<NotificationItem[]>(
    STORAGE_KEYS.notifications,
    DEMO_NOTIFICATIONS
  );
  const idx = notifs.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notifs[idx].is_read = true;
    writeStorage(STORAGE_KEYS.notifications, notifs);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient()!;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId);
      return;
    } catch {
      // fall through to local
    }
  }
  const notifs = readStorage<NotificationItem[]>(
    STORAGE_KEYS.notifications,
    DEMO_NOTIFICATIONS
  );
  for (const n of notifs) {
    if (n.user_id === userId) n.is_read = true;
  }
  writeStorage(STORAGE_KEYS.notifications, notifs);
}
