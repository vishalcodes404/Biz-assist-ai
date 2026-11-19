export type UserRole = "customer" | "admin" | "staff";

export type TicketCategory =
  | "Technical"
  | "Billing"
  | "Product"
  | "Delivery"
  | "Account"
  | "Other";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type TicketStatus =
  | "Submitted"
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type DepartmentName =
  | "Technical Support"
  | "Billing Department"
  | "Sales Department"
  | "Delivery Department"
  | "General Support";

export const TICKET_CATEGORIES: TicketCategory[] = [
  "Technical",
  "Billing",
  "Product",
  "Delivery",
  "Account",
  "Other",
];

export const TICKET_PRIORITIES: TicketPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export const TICKET_STATUSES: TicketStatus[] = [
  "Submitted",
  "Open",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
];

export const DEPARTMENTS: DepartmentName[] = [
  "Technical Support",
  "Billing Department",
  "Sales Department",
  "Delivery Department",
  "General Support",
];

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: DepartmentName | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  department: DepartmentName;
  assigned_staff_id: string | null;
  assigned_staff_name?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  resolution_notes?: string | null;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface TicketUpdate {
  id: string;
  ticket_id: string;
  updated_by: string;
  updated_by_name?: string;
  updated_by_role?: UserRole;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  notes: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  ticket_id: string | null;
  ticket_number?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DepartmentRecord {
  id: string;
  department_name: DepartmentName;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    href: string;
  };
}
