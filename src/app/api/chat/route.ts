import { NextRequest, NextResponse } from "next/server";

interface IncomingTicketContext {
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  department: string;
  assigned_staff_name?: string | null;
  updated_at: string;
}

const SYSTEM_PROMPT = `You are "BizAssist Assistant", the friendly, professional AI customer support chatbot for BizAssist AI – an AI-Powered Customer Support & Complaint Management System.

Your responsibilities:
1. Welcome customers warmly and answer frequently asked questions concisely.
2. Explain how to submit a complaint (go to Customer Dashboard -> "Submit New Complaint" or /customer/new-complaint, fill out title, description, category, priority, and optional attachment; a unique ticket ID like BA-2026-0001 is generated automatically).
3. Explain ticket statuses clearly:
   - Submitted: Complaint received and logged in the system.
   - Open: Reviewed and waiting for department allocation.
   - Assigned: Routed to a specific department and support staff specialist.
   - In Progress: Support staff is actively investigating and working on a fix.
   - Resolved: Solution has been implemented and resolution notes added.
   - Closed: Ticket verified and finalized.
4. Guide users to the right department:
   - Technical Support (software bugs, login/SSO errors, API/webhook issues)
   - Billing Department (invoices, duplicate charges, tax IDs, subscription billing)
   - Sales Department (plan upgrades, seat changes, product inquiries)
   - Delivery Department (delayed shipments, tracking issues, logistics)
   - General Support (account updates, general questions)
5. Help customers check their ticket status when they share a ticket ID like BA-2026-0001.
6. Provide helpful first-step troubleshooting suggestions.
7. If the issue cannot be solved immediately in chat, recommend submitting a formal support ticket.

Keep answers clear, structured, helpful, and under 160 words.`;

function buildFallbackResponse(
  message: string,
  matchedTicket?: IncomingTicketContext | null
): {
  reply: string;
  suggestedAction?: { label: string; href: string };
} {
  const lower = message.toLowerCase();

  // 1. Live ticket lookup result passed from client/server
  if (matchedTicket) {
    return {
      reply: `I found ticket **${matchedTicket.ticket_number}** ("${matchedTicket.title}"):\n\n• **Current Status:** ${matchedTicket.status}\n• **Department:** ${matchedTicket.department}\n• **Priority:** ${matchedTicket.priority}\n• **Assigned Staff:** ${matchedTicket.assigned_staff_name || "Pending Admin Assignment"}\n• **Last Updated:** ${new Date(matchedTicket.updated_at).toLocaleString()}\n\nYou can view the full visual timeline and staff updates in your Complaint History.`,
      suggestedAction: {
        label: `View ${matchedTicket.ticket_number}`,
        href: "/customer/complaints",
      },
    };
  }

  // Ticket ID mentioned but not found
  const ticketIdMatch = message.match(/BA-\d{4}-\d+/i);
  if (ticketIdMatch) {
    return {
      reply: `I searched for ticket **${ticketIdMatch[0].toUpperCase()}**, but couldn't locate it in your current session. Please double-check the ticket number (for example: **BA-2026-0001**) or log in to your Customer Dashboard to inspect your full complaint history.`,
      suggestedAction: {
        label: "Open Complaint History",
        href: "/customer/complaints",
      },
    };
  }

  // 2. How to submit a complaint
  if (
    lower.includes("submit") ||
    lower.includes("create") ||
    lower.includes("new complaint") ||
    lower.includes("file") ||
    lower.includes("report")
  ) {
    return {
      reply: `Submitting a complaint takes less than a minute:\n\n1. Click **Submit New Complaint** in your Customer Dashboard.\n2. Enter a clear **Title** and **Description**.\n3. Choose a **Category** (Technical, Billing, Product, Delivery, Account, or Other) and **Priority**.\n4. Optionally attach a screenshot or invoice.\n5. Click **Submit** — BizAssist AI automatically generates a unique ticket ID (e.g., \`BA-2026-0007\`) and routes it to the right department.`,
      suggestedAction: {
        label: "Submit New Complaint",
        href: "/customer/new-complaint",
      },
    };
  }

  // 3. Ticket statuses explanation
  if (lower.includes("status") || lower.includes("timeline") || lower.includes("track")) {
    return {
      reply: `Here is what each BizAssist AI ticket status means:\n\n• **Submitted:** Complaint received and ticket ID created.\n• **Open:** Queued for department verification.\n• **Assigned:** Allocated to a department and support specialist.\n• **In Progress:** Support staff is actively investigating.\n• **Resolved:** A solution has been applied with resolution notes.\n• **Closed:** Issue confirmed resolved and archived.\n\nShare a ticket ID like **BA-2026-0001** and I can look up its live status right now!`,
      suggestedAction: {
        label: "Track My Tickets",
        href: "/customer/complaints",
      },
    };
  }

  // 4. Billing / Invoice guidance
  if (
    lower.includes("bill") ||
    lower.includes("invoice") ||
    lower.includes("charge") ||
    lower.includes("payment") ||
    lower.includes("refund")
  ) {
    return {
      reply: `This sounds like a **Billing Department** matter.\n\n**Quick Troubleshooting Steps:**\n1. Verify whether the second charge is a pending authorization hold (which clears in 24–48 hrs).\n2. Download your latest invoice PDF from your account portal.\n3. If you see a confirmed duplicate charge or wrong tax ID, submit a Billing ticket with the invoice number attached so a Billing Specialist can investigate immediately.`,
      suggestedAction: {
        label: "Create Billing Ticket",
        href: "/customer/new-complaint",
      },
    };
  }

  // 5. Technical / Login / Bug guidance
  if (
    lower.includes("login") ||
    lower.includes("password") ||
    lower.includes("error") ||
    lower.includes("bug") ||
    lower.includes("slow") ||
    lower.includes("api") ||
    lower.includes("technical")
  ) {
    return {
      reply: `For technical issues, our **Technical Support** team can assist you.\n\n**Quick Troubleshooting Steps:**\n1. Clear your browser cache & cookies or test in an Incognito/Private window.\n2. Confirm third-party cookies aren't blocking SSO login redirects.\n3. Check your internet connection and API endpoint status.\n\nIf the problem persists, please open a Technical ticket with screenshots or timestamps.`,
      suggestedAction: {
        label: "Create Technical Ticket",
        href: "/customer/new-complaint",
      },
    };
  }

  // 6. Delivery / Shipping
  if (
    lower.includes("deliver") ||
    lower.includes("ship") ||
    lower.includes("order") ||
    lower.includes("package") ||
    lower.includes("late")
  ) {
    return {
      reply: `Delayed or missing shipments are handled by our **Delivery Department**.\n\nPlease have your **Order ID** ready and check if the carrier tracking shows a regional hub delay. If your package is more than 24 hours overdue, submit a Delivery complaint so our team can escalate directly with the courier.`,
      suggestedAction: {
        label: "Create Delivery Ticket",
        href: "/customer/new-complaint",
      },
    };
  }

  // 7. Department routing guide
  if (lower.includes("department") || lower.includes("team") || lower.includes("who")) {
    return {
      reply: `BizAssist AI routes complaints across 5 specialized departments:\n\n• **Technical Support:** Bugs, API issues, SSO & login errors\n• **Billing Department:** Invoices, duplicate charges, tax details\n• **Sales Department:** Plan upgrades, seat changes, product quotes\n• **Delivery Department:** Shipment delays & order tracking\n• **General Support:** Account updates & general questions\n\nTell me your issue and I'll point you to the right team!`,
    };
  }

  // 8. Greeting
  if (
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("hey") ||
    lower.includes("help")
  ) {
    return {
      reply: `Hello! 👋 Welcome to **BizAssist Assistant**. I can help you:\n\n• Check a ticket status (try typing \`BA-2026-0001\`)\n• Guide you to the right support department\n• Explain how to submit a complaint or track ticket statuses\n• Walk through quick troubleshooting steps\n\nWhat can I help you with today?`,
    };
  }

  // Default helpful response with ticket creation offer
  return {
    reply: `Thanks for reaching out! I can help troubleshoot **Technical**, **Billing**, **Delivery**, **Product**, or **Account** questions, or look up any ticket ID (like \`BA-2026-0001\`).\n\nIf your issue requires investigation by a specialist, I recommend opening a formal support ticket so our team can track and resolve it promptly.`,
    suggestedAction: {
      label: "Create Support Ticket",
      href: "/customer/new-complaint",
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = String(body?.message || "").trim();
    const history: Array<{ role: string; content: string }> = Array.isArray(
      body?.history
    )
      ? body.history.slice(-6)
      : [];
    const matchedTicket: IncomingTicketContext | null =
      body?.matchedTicket || null;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const ticketContextText = matchedTicket
      ? `\n\nLIVE DATABASE TICKET CONTEXT:\nTicket Number: ${matchedTicket.ticket_number}\nTitle: ${matchedTicket.title}\nStatus: ${matchedTicket.status}\nDepartment: ${matchedTicket.department}\nPriority: ${matchedTicket.priority}\nAssigned Staff: ${matchedTicket.assigned_staff_name || "Unassigned"}\nLast Updated: ${matchedTicket.updated_at}`
      : "";

    // Option 1: OpenAI API (Server-side only)
    if (openAiKey && openAiKey.length > 10) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 350,
          messages: [
            { role: "system", content: SYSTEM_PROMPT + ticketContextText },
            ...history.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
            { role: "user", content: message },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply =
          data?.choices?.[0]?.message?.content?.trim() ||
          "I'm here to help! Could you share a bit more detail?";
        return NextResponse.json({
          reply,
          mode: "live-ai",
          provider: "OpenAI",
          suggestedAction:
            reply.toLowerCase().includes("submit") ||
            reply.toLowerCase().includes("ticket")
              ? { label: "Submit New Complaint", href: "/customer/new-complaint" }
              : undefined,
        });
      }
    }

    // Option 2: Google Gemini API (Server-side only)
    if (geminiKey && geminiKey.length > 10) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
          geminiKey
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT + ticketContextText }],
            },
            contents: [
              ...history.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              })),
              { role: "user", parts: [{ text: message }] },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          "I'm here to help! Could you share more details?";
        return NextResponse.json({
          reply,
          mode: "live-ai",
          provider: "Gemini",
          suggestedAction:
            reply.toLowerCase().includes("submit") ||
            reply.toLowerCase().includes("ticket")
              ? { label: "Submit New Complaint", href: "/customer/new-complaint" }
              : undefined,
        });
      }
    }

    // Fallback: Built-in Smart FAQ & Live Ticket Lookup Demo Mode
    const fallback = buildFallbackResponse(message, matchedTicket);
    return NextResponse.json({
      reply: fallback.reply,
      suggestedAction: fallback.suggestedAction,
      mode: "demo-fallback",
      provider: "Built-in FAQ Demo",
    });
  } catch {
    return NextResponse.json(
      {
        reply:
          "I encountered a brief issue processing your request. You can still submit a support ticket directly and our team will assist you right away.",
        suggestedAction: {
          label: "Submit New Complaint",
          href: "/customer/new-complaint",
        },
        mode: "demo-fallback",
      },
      { status: 200 }
    );
  }
}
