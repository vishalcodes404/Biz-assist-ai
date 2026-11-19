import type {
  DepartmentName,
  NotificationItem,
  Profile,
  Ticket,
  TicketCategory,
  TicketUpdate,
} from "@/types";

export function suggestDepartmentForCategory(
  category: TicketCategory
): DepartmentName {
  switch (category) {
    case "Technical":
      return "Technical Support";
    case "Billing":
      return "Billing Department";
    case "Delivery":
      return "Delivery Department";
    case "Product":
      return "Sales Department";
    case "Account":
    case "Other":
    default:
      return "General Support";
  }
}

export const DEMO_PROFILES: Profile[] = [
  {
    id: "cust-alex-001",
    full_name: "Alex Morgan",
    email: "customer@bizassist.demo",
    role: "customer",
    department: null,
    created_at: "2026-01-12T09:00:00Z",
  },
  {
    id: "cust-priya-002",
    full_name: "Priya Nair",
    email: "priya.nair@bizassist.demo",
    role: "customer",
    department: null,
    created_at: "2026-01-18T11:30:00Z",
  },
  {
    id: "admin-elena-001",
    full_name: "Elena Rostova",
    email: "admin@bizassist.demo",
    role: "admin",
    department: "General Support",
    created_at: "2026-01-01T08:00:00Z",
  },
  {
    id: "staff-sarah-001",
    full_name: "Sarah Chen",
    email: "staff@bizassist.demo",
    role: "staff",
    department: "Billing Department",
    created_at: "2026-01-05T08:30:00Z",
  },
  {
    id: "staff-marcus-002",
    full_name: "Marcus Sterling",
    email: "marcus@bizassist.demo",
    role: "staff",
    department: "Technical Support",
    created_at: "2026-01-06T09:15:00Z",
  },
  {
    id: "staff-david-003",
    full_name: "David Kim",
    email: "david@bizassist.demo",
    role: "staff",
    department: "Delivery Department",
    created_at: "2026-01-07T10:00:00Z",
  },
];

export const DEMO_TICKETS: Ticket[] = [
  {
    id: "tkt-001",
    ticket_number: "BA-2026-0001",
    customer_id: "cust-alex-001",
    customer_name: "Alex Morgan",
    customer_email: "customer@bizassist.demo",
    title: "Duplicate charge on monthly Pro subscription invoice",
    description:
      "My company card was billed twice ($149 each) for invoice #INV-9281 on Monday morning. Please verify the billing ledger and reverse the duplicate transaction.",
    category: "Billing",
    priority: "Urgent",
    department: "Billing Department",
    assigned_staff_id: "staff-sarah-001",
    assigned_staff_name: "Sarah Chen",
    attachment_name: "Invoice_INV9281.pdf",
    attachment_url: null,
    resolution_notes:
      "Identified duplicate webhook retry in Stripe billing ledger. Preparing credit memo CM-2026-01.",
    status: "In Progress",
    created_at: "2026-02-14T09:15:00Z",
    updated_at: "2026-02-14T11:40:00Z",
  },
  {
    id: "tkt-002",
    ticket_number: "BA-2026-0002",
    customer_id: "cust-alex-001",
    customer_name: "Alex Morgan",
    customer_email: "customer@bizassist.demo",
    title: "API webhook latency spikes in US-East region",
    description:
      "Our production order webhook endpoints have been experiencing 3.5+ second response times between 9:00 AM and 11:30 AM EST.",
    category: "Technical",
    priority: "High",
    department: "Technical Support",
    assigned_staff_id: "staff-marcus-002",
    assigned_staff_name: "Marcus Sterling",
    attachment_name: "latency-metrics.png",
    attachment_url: null,
    resolution_notes: null,
    status: "Assigned",
    created_at: "2026-02-15T10:05:00Z",
    updated_at: "2026-02-15T10:45:00Z",
  },
  {
    id: "tkt-003",
    ticket_number: "BA-2026-0003",
    customer_id: "cust-alex-001",
    customer_name: "Alex Morgan",
    customer_email: "customer@bizassist.demo",
    title: "SSO login redirect loop on Safari browser",
    description:
      "When signing in via company SAML SSO on Safari 18, the login page redirects repeatedly back to the sign-in screen.",
    category: "Account",
    priority: "Medium",
    department: "Technical Support",
    assigned_staff_id: "staff-marcus-002",
    assigned_staff_name: "Marcus Sterling",
    attachment_name: null,
    attachment_url: null,
    resolution_notes:
      "Updated SameSite cookie attribute on the OAuth callback handler. Confirmed working across Safari 17 & 18.",
    status: "Resolved",
    created_at: "2026-02-10T14:20:00Z",
    updated_at: "2026-02-11T16:10:00Z",
  },
  {
    id: "tkt-004",
    ticket_number: "BA-2026-0004",
    customer_id: "cust-priya-002",
    customer_name: "Priya Nair",
    customer_email: "priya.nair@bizassist.demo",
    title: "Delayed shipment for Order #ORD-78214",
    description:
      "Express delivery package was scheduled to arrive two days ago, but the tracking page has been stuck at the regional distribution hub.",
    category: "Delivery",
    priority: "High",
    department: "Delivery Department",
    assigned_staff_id: "staff-david-003",
    assigned_staff_name: "David Kim",
    attachment_name: "tracking-receipt.pdf",
    attachment_url: null,
    resolution_notes: null,
    status: "Open",
    created_at: "2026-02-16T08:30:00Z",
    updated_at: "2026-02-16T08:45:00Z",
  },
  {
    id: "tkt-005",
    ticket_number: "BA-2026-0005",
    customer_id: "cust-priya-002",
    customer_name: "Priya Nair",
    customer_email: "priya.nair@bizassist.demo",
    title: "Requesting upgrade to Enterprise annual plan with 50 seats",
    description:
      "We would like to migrate our team from the Starter tier to Enterprise annual billing before next month's renewal.",
    category: "Product",
    priority: "Low",
    department: "Sales Department",
    assigned_staff_id: null,
    assigned_staff_name: null,
    attachment_name: null,
    attachment_url: null,
    resolution_notes: null,
    status: "Submitted",
    created_at: "2026-02-17T12:15:00Z",
    updated_at: "2026-02-17T12:15:00Z",
  },
  {
    id: "tkt-006",
    ticket_number: "BA-2026-0006",
    customer_id: "cust-alex-001",
    customer_name: "Alex Morgan",
    customer_email: "customer@bizassist.demo",
    title: "Invoice PDF download showing incorrect tax ID",
    description:
      "Our updated GST/VAT number does not appear on newly downloaded invoices from the billing portal.",
    category: "Billing",
    priority: "Medium",
    department: "Billing Department",
    assigned_staff_id: "staff-sarah-001",
    assigned_staff_name: "Sarah Chen",
    attachment_name: null,
    attachment_url: null,
    resolution_notes:
      "Refreshed billing entity metadata and regenerated invoices for Q1 2026.",
    status: "Closed",
    created_at: "2026-02-04T09:00:00Z",
    updated_at: "2026-02-05T11:30:00Z",
  },
];

export const DEMO_TICKET_UPDATES: TicketUpdate[] = [
  {
    id: "upd-001",
    ticket_id: "tkt-001",
    updated_by: "cust-alex-001",
    updated_by_name: "Alex Morgan",
    updated_by_role: "customer",
    old_status: null,
    new_status: "Submitted",
    notes: "Complaint submitted via customer portal with invoice attachment.",
    created_at: "2026-02-14T09:15:00Z",
  },
  {
    id: "upd-002",
    ticket_id: "tkt-001",
    updated_by: "admin-elena-001",
    updated_by_name: "Elena Rostova",
    updated_by_role: "admin",
    old_status: "Submitted",
    new_status: "Assigned",
    notes:
      "Categorized under Billing Department and assigned to Sarah Chen with Urgent priority.",
    created_at: "2026-02-14T09:32:00Z",
  },
  {
    id: "upd-003",
    ticket_id: "tkt-001",
    updated_by: "staff-sarah-001",
    updated_by_name: "Sarah Chen",
    updated_by_role: "staff",
    old_status: "Assigned",
    new_status: "In Progress",
    notes:
      "Verified the billing ledger and isolated the redundant payment sync hook. Issuing a credit adjustment now.",
    created_at: "2026-02-14T11:40:00Z",
  },
  {
    id: "upd-004",
    ticket_id: "tkt-002",
    updated_by: "cust-alex-001",
    updated_by_name: "Alex Morgan",
    updated_by_role: "customer",
    old_status: null,
    new_status: "Submitted",
    notes: "Submitted API latency report with p99 telemetry graph.",
    created_at: "2026-02-15T10:05:00Z",
  },
  {
    id: "upd-005",
    ticket_id: "tkt-002",
    updated_by: "admin-elena-001",
    updated_by_name: "Elena Rostova",
    updated_by_role: "admin",
    old_status: "Submitted",
    new_status: "Assigned",
    notes: "Assigned to Marcus Sterling in Technical Support for trace analysis.",
    created_at: "2026-02-15T10:45:00Z",
  },
  {
    id: "upd-006",
    ticket_id: "tkt-003",
    updated_by: "staff-marcus-002",
    updated_by_name: "Marcus Sterling",
    updated_by_role: "staff",
    old_status: "In Progress",
    new_status: "Resolved",
    notes:
      "Deployed SameSite cookie fix for Safari OAuth callback. Please test and confirm login succeeds.",
    created_at: "2026-02-11T16:10:00Z",
  },
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-001",
    user_id: "cust-alex-001",
    ticket_id: "tkt-001",
    ticket_number: "BA-2026-0001",
    message:
      "Sarah Chen updated ticket BA-2026-0001 status to In Progress: Isolated redundant billing sync hook.",
    is_read: false,
    created_at: "2026-02-14T11:40:00Z",
  },
  {
    id: "notif-002",
    user_id: "cust-alex-001",
    ticket_id: "tkt-002",
    ticket_number: "BA-2026-0002",
    message:
      "Admin assigned ticket BA-2026-0002 to Marcus Sterling (Technical Support).",
    is_read: false,
    created_at: "2026-02-15T10:45:00Z",
  },
  {
    id: "notif-003",
    user_id: "staff-sarah-001",
    ticket_id: "tkt-001",
    ticket_number: "BA-2026-0001",
    message: "Urgent ticket BA-2026-0001 has been assigned to you by Admin.",
    is_read: false,
    created_at: "2026-02-14T09:32:00Z",
  },
  {
    id: "notif-004",
    user_id: "admin-elena-001",
    ticket_id: "tkt-005",
    ticket_number: "BA-2026-0005",
    message:
      "New unassigned complaint BA-2026-0005 submitted by Priya Nair (Sales Department).",
    is_read: false,
    created_at: "2026-02-17T12:15:00Z",
  },
];
