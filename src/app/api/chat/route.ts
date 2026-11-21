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

const OFF_TOPIC_REFUSAL = `I am **BizAssist Assistant**, the dedicated AI customer support copilot for BizAssist AI. I am exclusively configured to help you with:

• Submitting customer complaints & issues
• Checking live ticket statuses (e.g., \`BA-2026-0001\`)
• Department routing (Technical, Billing, Delivery, Sales, General Support)
• Account & platform troubleshooting

I cannot answer unrelated questions such as cooking recipes, general trivia, entertainment, or off-topic topics.

How can I assist you with your BizAssist AI support tickets or account today?`;

/**
 * Guardrail heuristic to detect unwanted or off-topic questions (e.g., biriyani recipe, food, trivia, jokes, essays).
 */
function isUnwantedOrOffTopic(message: string): boolean {
  const m = message.toLowerCase().trim();

  // Explicit recipe & food patterns (e.g., biriyani, cooking, baking, recipes)
  const foodAndRecipeRegex = /\b(recipe|recipes|biriyani|biryani|briyani|cook|cooking|cooked|baking|bake|baked|ingredient|ingredients|dish|dishes|curry|paneer|chicken|mutton|pulao|pasta|pizza|burger|sandwich|soup|salad|dessert|cake|cookie|cocktail|mocktail|gravy|masala|cuisine|delicious|taste|spicy|fry|fried|boiled)\b/i;

  // General off-topic: trivia, entertainment, games, homework, creative writing
  const generalOffTopicRegex = /\b(joke|jokes|riddle|riddles|poem|poetry|story|stories|lyrics|song|sing|movie|movies|actor|actress|cinema|anime|weather|forecast|horoscope|astrology|football|cricket|basketball|messi|ronaldo|homework|essay|quicksort|fibonacci|girlfriend|boyfriend|love|dating)\b/i;

  // Questions explicitly asking how to make/cook or asking for food recipes
  if (/(how to (make|cook|prepare|bake|fry)|what is the recipe|recipe for|recipe of|give me a recipe|make me a)/i.test(m)) {
    return true;
  }

  if (foodAndRecipeRegex.test(m)) {
    // Exclude legitimate delivery complaints (e.g., "delivery of my package is late")
    const isSupportContext = /\b(ticket|complaint|delay|delayed|broken|damaged|refund|invoice|charge|bill|account|login|portal|error|bug|support)\b/i.test(m);
    if (!isSupportContext) {
      return true;
    }
  }

  if (generalOffTopicRegex.test(m)) {
    return true;
  }

  return false;
}

const SYSTEM_PROMPT = `You are "BizAssist Assistant", the official AI customer support copilot for BizAssist AI – an AI-Powered Customer Support & Complaint Management System.

================================================================================
CRITICAL MANDATE — STRICT DOMAIN RESTRICTION & OFF-TOPIC REFUSAL POLICY:
================================================================================
You are strictly and exclusively limited to:
1. Customer complaint filing, ticket registration, and portal guidance.
2. Real-time ticket status tracking (e.g., BA-2026-0001) and lifecycle explanation:
   - Submitted: Complaint logged in system.
   - Open: Queued for review.
   - Assigned: Routed to a department and assigned support engineer.
   - In Progress: Actively investigated and worked on.
   - Resolved: Fix implemented with resolution notes.
   - Closed: Verified and closed.
3. Routing issues across the 5 official support departments:
   - Technical Support (bugs, login/SSO, API, app errors)
   - Billing Department (invoices, double charges, refunds, subscription billing)
   - Sales Department (plan upgrades, seat changes, enterprise quotes)
   - Delivery Department (delayed logistics, carrier tracking, lost packages)
   - General Support (account updates, portal navigation)
4. First-step troubleshooting for technical, billing, or delivery issues related to the BizAssist AI platform.

STRICT REFUSAL RULE (NON-NEGOTIABLE):
Under NO circumstances may you answer unwanted, off-topic, or non-support questions.
You MUST REFUSE to answer requests for:
- Cooking recipes, food preparation, meals, dishes (FORBIDDEN: biriyani recipe, cooking tips, baking, ingredients, food preparation, etc.)
- General world trivia, science homework, math proofs, essays, history
- Entertainment, pop culture, movies, music, games, sports, celebrities
- Creative writing, jokes, poems, fictional stories, roleplay
- General programming or software coding unrelated to BizAssist AI
- Casual chit-chat or philosophical discussions unrelated to customer support.

MANDATORY REFUSAL RESPONSE:
Whenever a customer asks for ANY off-topic topic (such as asking for a biriyani recipe, how to cook, tell a joke, etc.):
You MUST immediately and politely decline without providing the requested information:
"I am BizAssist Assistant, dedicated exclusively to customer support, complaint management, and ticket inquiries for BizAssist AI. I cannot assist with recipes, general trivia, or off-topic requests.

How can I help you with your account, submitting a complaint, or checking a support ticket today?"

Keep all permitted customer support answers concise, structured, professional, and under 160 words.`;

function buildFallbackResponse(
  message: string,
  matchedTicket?: IncomingTicketContext | null
): {
  reply: string;
  suggestedAction?: { label: string; href: string };
} {
  // 0. Off-topic & unwanted questions guardrail
  if (isUnwantedOrOffTopic(message)) {
    return {
      reply: OFF_TOPIC_REFUSAL,
      suggestedAction: {
        label: "Submit New Complaint",
        href: "/customer/new-complaint",
      },
    };
  }

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

    // Step 0: Immediate Guardrail Check for off-topic / unwanted requests (e.g., biriyani recipe, food, trivia)
    if (isUnwantedOrOffTopic(message)) {
      return NextResponse.json({
        reply: OFF_TOPIC_REFUSAL,
        mode: "guardrail-refusal",
        provider: "BizAssist Guardrail",
        suggestedAction: {
          label: "Submit New Complaint",
          href: "/customer/new-complaint",
        },
      });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openRouterModel =
      process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const ticketContextText = matchedTicket
      ? `\n\nLIVE DATABASE TICKET CONTEXT:\nTicket Number: ${matchedTicket.ticket_number}\nTitle: ${matchedTicket.title}\nStatus: ${matchedTicket.status}\nDepartment: ${matchedTicket.department}\nPriority: ${matchedTicket.priority}\nAssigned Staff: ${matchedTicket.assigned_staff_name || "Unassigned"}\nLast Updated: ${matchedTicket.updated_at}`
      : "";

    // Option 1: OpenRouter AI API (Primary LLM Provider)
    if (openRouterKey && openRouterKey.length > 10) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterKey}`,
            "HTTP-Referer": "https://biz-assist-ai.vercel.app",
            "X-Title": "BizAssist AI",
          },
          body: JSON.stringify({
            model: openRouterModel,
            temperature: 0.4,
            max_tokens: 450,
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
            provider: "OpenRouter AI",
            model: openRouterModel,
            suggestedAction:
              reply.toLowerCase().includes("submit") ||
              reply.toLowerCase().includes("ticket")
                ? { label: "Submit New Complaint", href: "/customer/new-complaint" }
                : undefined,
          });
        } else {
          // Automatic fallback to high-reliability Llama 3.3 on OpenRouter
          const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openRouterKey}`,
              "HTTP-Referer": "https://biz-assist-ai.vercel.app",
              "X-Title": "BizAssist AI",
            },
            body: JSON.stringify({
              model: "meta-llama/llama-3.3-70b-instruct",
              temperature: 0.4,
              max_tokens: 450,
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
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const reply =
              data?.choices?.[0]?.message?.content?.trim() ||
              "I'm here to help! Could you share a bit more detail?";
            return NextResponse.json({
              reply,
              mode: "live-ai",
              provider: "OpenRouter AI",
              model: "meta-llama/llama-3.3-70b-instruct",
              suggestedAction:
                reply.toLowerCase().includes("submit") ||
                reply.toLowerCase().includes("ticket")
                  ? { label: "Submit New Complaint", href: "/customer/new-complaint" }
                  : undefined,
            });
          }
        }
      } catch (err) {
        console.warn("OpenRouter API error, falling back:", err);
      }
    }

    // Option 2: OpenAI API (Secondary)
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
