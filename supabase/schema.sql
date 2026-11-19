-- ============================================================================
-- BizAssist AI – Supabase PostgreSQL Schema & Row Level Security (RLS)
-- ============================================================================
-- Run this entire script inside the Supabase SQL Editor to initialize
-- all tables, triggers, seed departments, and strict RBAC RLS policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_name TEXT NOT NULL UNIQUE
);

INSERT INTO public.departments (department_name) VALUES
  ('Technical Support'),
  ('Billing Department'),
  ('Sales Department'),
  ('Delivery Department'),
  ('General Support')
ON CONFLICT (department_name) DO NOTHING;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  department TEXT REFERENCES public.departments(department_name) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Technical', 'Billing', 'Product', 'Delivery', 'Account', 'Other')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  department TEXT DEFAULT 'General Support' REFERENCES public.departments(department_name) ON DELETE SET NULL,
  assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  resolution_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TICKET UPDATES TABLE
CREATE TABLE IF NOT EXISTS public.ticket_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast filtering & search
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON public.tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_staff_id ON public.tickets(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON public.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_ticket_updates_ticket_id ON public.ticket_updates(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Auto-update `updated_at` timestamp on tickets
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ticket_updated ON public.tickets;
CREATE TRIGGER on_ticket_updated
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile when a new user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.raw_user_meta_data->>'department'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to inspect current user's role safely
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Departments: readable by all authenticated users
CREATE POLICY "Departments readable by authenticated users"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: users read own profile; admins read all; staff can read customer names for assigned tickets
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Allow profile insert on signup"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.current_user_role() = 'admin');

-- Tickets:
-- Customers access only their own tickets
CREATE POLICY "Customers view own tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR assigned_staff_id = auth.uid()
    OR public.current_user_role() = 'admin'
  );

CREATE POLICY "Customers create own tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Admins and assigned staff update tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR assigned_staff_id = auth.uid()
    OR customer_id = auth.uid()
  );

CREATE POLICY "Admins delete tickets"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Ticket Updates: visible to ticket owner, assigned staff, and admins
CREATE POLICY "View ticket updates for authorized tickets"
  ON public.ticket_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_updates.ticket_id
        AND (
          t.customer_id = auth.uid()
          OR t.assigned_staff_id = auth.uid()
          OR public.current_user_role() = 'admin'
        )
    )
  );

CREATE POLICY "Insert ticket updates for authorized tickets"
  ON public.ticket_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    updated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_updates.ticket_id
        AND (
          t.customer_id = auth.uid()
          OR t.assigned_staff_id = auth.uid()
          OR public.current_user_role() = 'admin'
        )
    )
  );

-- Notifications: users see and update their own; any authorized workflow actor can create notifications
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Users mark own notifications read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
