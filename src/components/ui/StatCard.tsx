import React from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  accent?: "blue" | "amber" | "emerald" | "purple" | "rose";
}) {
  const accentStyles = {
    blue: "bg-rose-500/20 text-white border-white/25",
    amber: "bg-amber-500/25 text-white border-amber-200/30",
    emerald: "bg-emerald-500/25 text-white border-emerald-200/30",
    purple: "bg-pink-500/25 text-white border-pink-200/30",
    rose: "bg-red-500/30 text-white border-rose-200/35",
  };

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-white/75">{hint}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md ${accentStyles[accent]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
