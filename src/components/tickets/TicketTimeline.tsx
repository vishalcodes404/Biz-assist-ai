"use client";

import { Check, Circle, Clock } from "lucide-react";
import { TICKET_STATUSES, type TicketStatus } from "@/types";

export function TicketTimeline({ currentStatus }: { currentStatus: TicketStatus }) {
  const currentIndex = TICKET_STATUSES.indexOf(currentStatus);

  return (
    <div className="w-full py-2">
      <div className="hidden sm:grid sm:grid-cols-6 gap-2 relative">
        {TICKET_STATUSES.map((status, idx) => {
          const isCompleted = idx < currentIndex || currentStatus === "Closed";
          const isCurrent = idx === currentIndex && currentStatus !== "Closed";

          return (
            <div
              key={status}
              className="relative flex flex-col items-center text-center"
            >
              {/* Connector line */}
              {idx < TICKET_STATUSES.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${
                    idx < currentIndex ? "bg-rose-400" : "bg-white/20"
                  }`}
                />
              )}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                  isCompleted
                    ? "bg-rose-600 border-rose-300 text-white shadow-md shadow-rose-600/40"
                    : isCurrent
                    ? "bg-rose-500/30 border-white text-white ring-4 ring-rose-500/30 backdrop-blur"
                    : "bg-white/10 border-white/25 text-white/60"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-semibold ${
                  isCompleted || isCurrent ? "text-white" : "text-white/60"
                }`}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="sm:hidden space-y-3">
        {TICKET_STATUSES.map((status, idx) => {
          const isCompleted = idx < currentIndex || currentStatus === "Closed";
          const isCurrent = idx === currentIndex && currentStatus !== "Closed";

          return (
            <div key={status} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                  isCompleted
                    ? "bg-rose-600 border-rose-300 text-white"
                    : isCurrent
                    ? "bg-rose-500/30 border-white text-white ring-4 ring-rose-500/30"
                    : "bg-white/10 border-white/25 text-white/60"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[11px] font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isCurrent
                    ? "text-white font-bold"
                    : isCompleted
                    ? "text-white"
                    : "text-white/60"
                }`}
              >
                {status}
                {isCurrent && " (Current Stage)"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
