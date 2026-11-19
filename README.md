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

## Deployment on Vercel & Localhost Co-existence

BizAssist AI is architected to run seamlessly on **both** your local machine (`http://localhost:3000`) and your production **Vercel** deployment with zero code changes.

### 1. Deploy to Vercel in 1-Click
1. Push this repository to your GitHub account (`vishalcodes404/Biz-assist-ai`).
2. Go to [Vercel](https://vercel.com/new) and click **Import** on `Biz-assist-ai`.
3. In the **Environment Variables** section, add your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://kihcmgipkcmkrxklkavq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_MnJoeUUO66dEUnqgdSudVg_ZC_l3Opx`
   - *(Optional)* `OPENAI_API_KEY` or `GEMINI_API_KEY` for AI chatbot.
4. Click **Deploy**.

---

### 2. Configure Supabase for BOTH Localhost and Vercel

In your **[Supabase Project Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/kihcmgipkcmkrxklkavq/auth/url-configuration)**:

1. **Site URL**:
   Set this to your Vercel production URL (e.g., `https://biz-assist-ai.vercel.app`) or leave as `http://localhost:3000`.
2. **Redirect URLs (Allow List)**:
   Add all of the following entries so both local development and all Vercel deployments (including branch previews) can authenticate:
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`
   - `https://*.vercel.app/**`
   - `https://*.vercel.app/auth/callback`
   - `https://your-project-name.vercel.app/**`
   - `https://your-project-name.vercel.app/auth/callback`
3. Click **Save**.

---

### 3. Google OAuth for BOTH Localhost and Vercel

In **Google Cloud Console** (Credentials → OAuth 2.0 Client ID):
- Google Cloud only needs **ONE** Authorized Redirect URI for Supabase:
  ```
  https://kihcmgipkcmkrxklkavq.supabase.co/auth/v1/callback
  ```
- Because Google redirects to Supabase first, Supabase then routes back to either `localhost:3000` or your Vercel URL dynamically based on where the user initiated the login!
