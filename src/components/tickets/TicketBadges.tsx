import type { TicketPriority, TicketStatus } from "@/types";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    Submitted: "bg-white/10 text-white border-white/25",
    Open: "bg-rose-500/25 text-white border-rose-300/40",
    Assigned: "bg-pink-500/25 text-white border-pink-300/40",
    "In Progress": "bg-amber-500/25 text-white border-amber-300/40",
    Resolved: "bg-emerald-500/25 text-white border-emerald-300/40",
    Closed: "bg-white/15 text-white border-white/25",
  };

  const dotStyles: Record<TicketStatus, string> = {
    Submitted: "bg-white/80",
    Open: "bg-rose-300",
    Assigned: "bg-pink-300",
    "In Progress": "bg-amber-300",
    Resolved: "bg-emerald-300",
    Closed: "bg-white/70",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md ${
        styles[status] || styles.Submitted
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dotStyles[status] || dotStyles.Submitted
        }`}
      />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const styles: Record<TicketPriority, string> = {
    Low: "bg-white/10 text-white border-white/20",
    Medium: "bg-rose-400/20 text-white border-rose-200/30",
    High: "bg-orange-500/25 text-white border-orange-300/40",
    Urgent: "bg-red-600/45 text-white border-red-300/50",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold backdrop-blur-md ${
        styles[priority] || styles.Medium
      }`}
    >
      {priority}
    </span>
  );
}
