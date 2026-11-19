"use client";

import React, { useEffect, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function BrandedLoaderView({
  progress,
  statusText = "Preparing your AI support workspace...",
}: {
  progress?: number;
  statusText?: string;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 text-white">
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        {/* Clean transparent logo only — no background box or glow */}
        <div className="animate-logo-float">
          <BrandLogo size="xl" />
        </div>

        {/* Sleek minimal progress bar */}
        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          {typeof progress === "number" ? (
            <div
              className="h-full rounded-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
            />
          ) : (
            <div className="loading-indeterminate-bar h-full w-1/2 rounded-full bg-white" />
          )}
        </div>

        <div className="mt-3 flex w-full items-center justify-between text-xs font-medium text-white">
          <span>{statusText}</span>
          {typeof progress === "number" && (
            <span className="font-mono font-bold text-white">
              {Math.min(100, Math.round(progress))}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SplashLoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState("Initializing BizAssist AI...");

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(48);
      setStatusText("Loading AI Copilot & Ticket Engine...");
    }, 320);

    const t2 = setTimeout(() => {
      setProgress(86);
      setStatusText("Syncing Workspace & Notifications...");
    }, 780);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText("Ready!");
    }, 1150);

    const t4 = setTimeout(() => {
      setFading(true);
    }, 1350);

    const t5 = setTimeout(() => {
      setVisible(false);
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-[#0b0104]/90 backdrop-blur-2xl transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <BrandedLoaderView progress={progress} statusText={statusText} />
    </div>
  );
}
