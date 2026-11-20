"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Sparkles,
  X,
  ArrowRight,
  Minimize2,
} from "lucide-react";
import { lookupTicketByNumber } from "@/lib/data-service";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { ChatMessage } from "@/types";

const QUICK_PROMPTS = [
  "Check ticket BA-2026-0001",
  "How do I submit a complaint?",
  "Explain ticket statuses",
  "Which department handles billing?",
];

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="rounded-md border border-white/25 bg-rose-500/25 px-1.5 py-0.5 text-xs font-mono font-semibold text-white"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function BizAssistChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState<
    "unknown" | "live-ai" | "demo-fallback"
  >("unknown");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! 👋 I'm **BizAssist Assistant**. I can answer FAQs, guide you to the right department, troubleshoot issues, or check your ticket status (try typing `BA-2026-0001`). How can I help today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  const sendMessage = async (textOverride?: string) => {
    const query = (textOverride ?? input).trim();
    if (!query || sending) return;

    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: nowTime,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    try {
      let matchedTicket = null;
      const ticketMatch = query.match(/BA-\d{4}-\d+/i);
      if (ticketMatch) {
        matchedTicket = await lookupTicketByNumber(ticketMatch[0]);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          matchedTicket,
        }),
      });

      const data = await res.json();
      if (data.mode === "live-ai" || data.mode === "demo-fallback") {
        setChatMode(data.mode);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content:
          data.reply ||
          "I'm here to help! Feel free to ask about tickets, departments, or troubleshooting.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestedAction: data.suggestedAction,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "I couldn't reach the assistant endpoint right now. You can still submit a formal complaint and our team will help promptly.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          suggestedAction: {
            label: "Submit New Complaint",
            href: "/customer/new-complaint",
          },
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat Window */}
      {open && (
        <div className="mb-3 flex h-[540px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/25 bg-[#1b040a]/90 shadow-2xl shadow-rose-950/70 backdrop-blur-2xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/15 bg-gradient-to-r from-[#9f1239] via-[#be123c] to-[#7f1d1d] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <BrandLogo size="xs" />
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <p className="mt-0.5 text-[10px] text-white/85">
                  {chatMode === "live-ai"
                    ? "BizAssist Assistant • Live AI API"
                    : "BizAssist Assistant • Demo Fallback Ready"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-white/85 hover:bg-white/15 hover:text-white transition"
                aria-label="Minimize chat"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-white/85 hover:bg-white/15 hover:text-white transition"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {chatMode === "live-ai" ? (
            <div className="flex items-center justify-between border-b border-white/15 bg-emerald-500/20 px-3.5 py-1.5 text-[11px] font-medium text-emerald-200">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>OpenRouter AI Copilot Active</span>
              </span>
              <span className="text-[10px] text-white/70">GPT-4o Mini</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 border-b border-white/15 bg-rose-500/20 px-3.5 py-1.5 text-[11px] font-medium text-white">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-white" />
              <span>
                Smart FAQ & live ticket lookup active
              </span>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-3.5"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[86%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed text-white shadow-md ${
                    msg.role === "user"
                      ? "rounded-br-sm border border-white/25 bg-gradient-to-br from-rose-600 to-red-700"
                      : "rounded-bl-sm border border-white/20 bg-white/10 backdrop-blur-md"
                  }`}
                >
                  {msg.role === "user"
                    ? msg.content
                    : renderFormattedText(msg.content)}

                  {msg.suggestedAction && (
                    <div className="mt-2.5 border-t border-white/15 pt-2">
                      <Link
                        href={msg.suggestedAction.href}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-rose-600/70 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition"
                      >
                        {msg.suggestedAction.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
                <span className="mt-1 px-1 text-[10px] text-white/65">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {sending && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs text-white/90">
                  <span className="inline-flex items-center gap-1">
                    BizAssist Assistant is thinking
                    <span className="animate-pulse">...</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts (glass pills matching reference image) */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-white/15 bg-black/20 px-3 py-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="shrink-0 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium text-white hover:bg-rose-600/60 hover:border-white/40 transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-white/15 bg-black/30 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs text-white outline-none focus:border-white/50 focus:bg-white/15 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="crimson-pill-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Pill Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="crimson-pill-btn group ml-auto flex items-center gap-2.5 rounded-full px-5 py-3 text-white hover:scale-[1.03]"
        aria-label="Toggle BizAssist Assistant"
      >
        <div className="relative">
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
          {!open && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </span>
          )}
        </div>
        <span className="text-sm font-semibold pr-1 text-white">
          {open ? "Close Assistant" : "BizAssist Assistant"}
        </span>
      </button>
    </div>
  );
}
