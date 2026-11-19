# BizAssist AI – AI-Powered Customer Support & Complaint Management System

BizAssist AI is a modern, full-stack SaaS web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase**, **Lucide React**, and a server-side **AI Chatbot** (`BizAssist Assistant`).

---

## Core Features

- **Landing Page (`/`)**: Modern SaaS showcase featuring hero CTA, features, workflow breakdown, stakeholder benefits, and footer.
- **Role-Based Access Control (RBAC)**: Protected dashboards for **Customer**, **Admin**, and **Support Staff**.
- **Customer Portal (`/customer/*`)**: Submit complaints with automatic unique ticket IDs (`BA-2026-XXXX`), attach files, filter complaint history, track progress through a 6-step visual timeline, post follow-ups, and receive real-time notifications.
- **Admin Command Center (`/admin/*`)**: Live KPI statistics, full queue search & multi-filter, department & staff allocation, priority & status management, staff/customer management, and visual analytics with CSV export.
- **Support Staff Workspace (`/staff/*`)**: Dedicated queue of assigned tickets, priority & status filters, investigation notes, resolution summaries, and 1-click ticket resolution synced immediately to the customer dashboard.
- **BizAssist Assistant (Floating AI Chatbot)**: Secure server-side `/api/chat` route supporting OpenAI or Google Gemini API keys, with a built-in FAQ & live ticket-lookup fallback clearly labelled in Demo Mode.

---

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Zero-Config Demo Mode**: If `.env.local` is not configured with Supabase credentials, BizAssist AI automatically runs in **Demo Mode** with persistent local sample data and 1-click Customer, Admin, and Staff login buttons on `/login`.

---

## Live Supabase & AI API Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) inside the Supabase SQL Editor to create all 5 tables (`profiles`, `tickets`, `ticket_updates`, `notifications`, `departments`), triggers, and Row Level Security (RLS) policies.
3. Add your keys to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   OPENAI_API_KEY=your-openai-key   # or GEMINI_API_KEY=...
   ```
4. Restart `npm run dev`.

---

## Deployment on Vercel

1. Push this repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add the environment variables from `.env.example` in Vercel Project Settings.
4. Deploy!
