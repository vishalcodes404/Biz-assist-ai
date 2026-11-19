"use client";

import React from "react";

export function FlowingRedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-[#090103]"
    >
      {/* Deep velvet base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 45%, #3b0512 0%, #160207 52%, #080103 100%)",
        }}
      />

      {/* Flowing Crimson Silk Ribbon 1 (Top-Left to Bottom-Right) */}
      <div
        className="aurora-blob-1 absolute -top-[20%] -left-[15%] h-[78vh] w-[78vw] rounded-full blur-[110px] opacity-85"
        style={{
          background:
            "radial-gradient(circle at 40% 45%, #e11d48 0%, #9f1239 38%, #4c0519 72%, transparent 100%)",
        }}
      />

      {/* Flowing Ruby Velvet Wave 2 (Right-Bottom Glow) */}
      <div
        className="aurora-blob-2 absolute -bottom-[22%] -right-[12%] h-[82vh] w-[75vw] rounded-full blur-[115px] opacity-90"
        style={{
          background:
            "radial-gradient(circle at 55% 55%, #dc2626 0%, #be123c 36%, #6b051b 70%, transparent 100%)",
        }}
      />

      {/* Luminous Warm Rose / Silk Highlight Streak 3 (Center Drift — matches image light bloom) */}
      <div
        className="aurora-blob-3 absolute top-[12%] left-[22%] h-[65vh] w-[42vw] rounded-full blur-[95px] opacity-60"
        style={{
          background:
            "linear-gradient(155deg, rgba(254, 205, 211, 0.55) 0%, rgba(244, 63, 94, 0.72) 45%, rgba(136, 19, 55, 0.35) 85%, transparent 100%)",
        }}
      />

      {/* Undulating Wine Shadow & Crimson Ribbon 4 */}
      <div
        className="aurora-blob-4 absolute top-[35%] -right-[10%] h-[60vh] w-[55vw] rounded-full blur-[105px] opacity-75"
        style={{
          background:
            "radial-gradient(ellipse at center, #fb7185 0%, #be123c 42%, #3b0410 78%, transparent 100%)",
        }}
      />

      {/* Subtle Flowing Horizontal Silk Wave Overlay */}
      <div
        className="aurora-wave-sheen absolute inset-0 opacity-35"
        style={{
          background:
            "linear-gradient(115deg, transparent 15%, rgba(255, 190, 200, 0.22) 38%, rgba(225, 29, 72, 0.32) 52%, transparent 78%)",
          backgroundSize: "220% 220%",
        }}
      />

      {/* Soft dark vignette around edges for crisp text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, transparent 25%, rgba(6, 0, 2, 0.65) 100%)",
        }}
      />
    </div>
  );
}
