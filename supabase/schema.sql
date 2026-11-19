-- ============================================================================
-- BizAssist AI – COMPLETE Supabase Backend Setup
-- ============================================================================
-- HOW TO RUN:
--   1. Open your Supabase Dashboard → SQL Editor
--   2. Paste this ENTIRE file and click "Run" (Ctrl+Enter)
--   3. Everything will be created: tables, indexes, triggers, RLS,
--      storage bucket, helper functions, and seed data.
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 2: DROP EXISTING OBJECTS (safe re-run — idempotent)
-- ============================================================================
-- Wrapped in a DO block so it never errors on a fresh database
DO $$ BEGIN
  -- Drop triggers (only if their parent tables exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tickets') THEN
    DROP TRIGGER IF EXISTS on_ticket_updated ON public.tickets;
    DROP TRIGGER IF EXISTS on_ticket_status_change ON public.tickets;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='information_schema' OR (table_schema='auth' AND table_name='users')) THEN
    BEGIN
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END IF;
END $$;

-- Drop policies (only if tables exist)
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Drop storage policies safely
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN ('Users upload own attachments', 'Users read accessible attachments', 'Users delete own attachments')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Drop views
DROP VIEW IF EXISTS public.ticket_detail_view CASCADE;

-- Drop tables in dependency order
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.ticket_updates CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.get_ticket_stats() CASCADE;

-- ============================================================================
-- PART 3: CREATE TABLES
-- ============================================================================

-- 3.1 DEPARTMENTS
CREATE TABLE public.departments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_name TEXT NOT NULL UNIQUE
);

COMMENT ON TABLE public.departments IS 'Lookup table for support departments';

-- 3.2 PROFILES (linked to Supabase Auth users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'customer'
                     CHECK (role IN ('customer', 'admin', 'staff')),
  department    TEXT REFERENCES public.departments(department_name)
                     ON DELETE SET NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles linked 1:1 with auth.users';

-- 3.3 TICKETS
CREATE TABLE public.tickets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number     TEXT NOT NULL UNIQUE,
  customer_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL
                         CHECK (category IN ('Technical','Billing','Product','Delivery','Account','Other')),
  priority          TEXT NOT NULL DEFAULT 'Medium'
                         CHECK (priority IN ('Low','Medium','High','Urgent')),
  department        TEXT DEFAULT 'General Support'
                         REFERENCES public.departments(department_name) ON DELETE SET NULL,
  assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  attachment_url    TEXT,
  attachment_name   TEXT,
  resolution_notes  TEXT,
  status            TEXT NOT NULL DEFAULT 'Submitted'
                         CHECK (status IN ('Submitted','Open','Assigned','In Progress','Resolved','Closed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tickets IS 'Customer complaint tickets with status lifecycle';

-- 3.4 TICKET UPDATES (audit trail / timeline)
CREATE TABLE public.ticket_updates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id     UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  updated_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_status    TEXT,
  new_status    TEXT NOT NULL,
  notes         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ticket_updates IS 'Chronological audit trail of every ticket change';

-- 3.5 NOTIFICATIONS
CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_id     UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'In-app notification inbox per user';


-- ============================================================================
-- PART 4: INDEXES (for fast queries)
-- ============================================================================
CREATE INDEX idx_tickets_customer_id      ON public.tickets(customer_id);
CREATE INDEX idx_tickets_assigned_staff   ON public.tickets(assigned_staff_id);
CREATE INDEX idx_tickets_status           ON public.tickets(status);
CREATE INDEX idx_tickets_priority         ON public.tickets(priority);
CREATE INDEX idx_tickets_category         ON public.tickets(category);
CREATE INDEX idx_tickets_department       ON public.tickets(department);
CREATE INDEX idx_tickets_ticket_number    ON public.tickets(ticket_number);
CREATE INDEX idx_tickets_created_at       ON public.tickets(created_at DESC);
CREATE INDEX idx_ticket_updates_ticket    ON public.ticket_updates(ticket_id);
CREATE INDEX idx_ticket_updates_created   ON public.ticket_updates(created_at);
CREATE INDEX idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread     ON public.notifications(user_id, is_read) WHERE is_read = FALSE;


-- ============================================================================
-- PART 5: FUNCTIONS & TRIGGERS
-- ============================================================================

-- 5.1 Auto-update `updated_at` on ticket modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ticket_updated
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.2 Auto-create profile row when a user signs up via Supabase Auth or Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_name TEXT;
  extracted_avatar TEXT;
  is_first_login BOOLEAN;
BEGIN
  -- Extract name from metadata (supports Google OAuth, GitHub, Email signup)
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract avatar URL if provided (Google sends 'avatar_url' or 'picture')
  extracted_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Check if this user ID already exists in profiles
  SELECT NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO is_first_login;

  -- Insert or update profile gracefully
  INSERT INTO public.profiles (id, full_name, email, role, department, avatar_url)
  VALUES (
    NEW.id,
    extracted_name,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.raw_user_meta_data->>'department',
    extracted_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name   = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email       = EXCLUDED.email,
    avatar_url  = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    department  = COALESCE(EXCLUDED.department, public.profiles.department);
    -- NOTE: role is intentionally preserved on conflict so admin/staff roles are never overwritten

  -- If it was their first login, insert a welcome notification!
  IF is_first_login THEN
    INSERT INTO public.notifications (user_id, ticket_id, message)
    VALUES (
      NEW.id,
      NULL,
      'Welcome to BizAssist AI, ' || extracted_name || '! Your account is active. You can submit complaints or ask our AI Copilot anytime.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.3 Auto-generate notification when ticket status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the customer when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, ticket_id, message)
    VALUES (
      NEW.customer_id,
      NEW.id,
      'Ticket ' || NEW.ticket_number || ' status updated: ' || OLD.status || ' → ' || NEW.status
    );
  END IF;

  -- Notify assigned staff when they are newly assigned
  IF NEW.assigned_staff_id IS NOT NULL
     AND OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id THEN
    INSERT INTO public.notifications (user_id, ticket_id, message)
    VALUES (
      NEW.assigned_staff_id,
      NEW.id,
      'You have been assigned ticket ' || NEW.ticket_number || ' (' || NEW.priority || ' priority)'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ticket_status_change
  AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();

-- 5.4 Helper: get current authenticated user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5.5 Helper: ticket statistics for admin dashboard (callable via RPC)
CREATE OR REPLACE FUNCTION public.get_ticket_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total',        COUNT(*),
    'submitted',    COUNT(*) FILTER (WHERE status = 'Submitted'),
    'open',         COUNT(*) FILTER (WHERE status = 'Open'),
    'assigned',     COUNT(*) FILTER (WHERE status = 'Assigned'),
    'in_progress',  COUNT(*) FILTER (WHERE status = 'In Progress'),
    'resolved',     COUNT(*) FILTER (WHERE status = 'Resolved'),
    'closed',       COUNT(*) FILTER (WHERE status = 'Closed'),
    'low',          COUNT(*) FILTER (WHERE priority = 'Low'),
    'medium',       COUNT(*) FILTER (WHERE priority = 'Medium'),
    'high',         COUNT(*) FILTER (WHERE priority = 'High'),
    'urgent',       COUNT(*) FILTER (WHERE priority = 'Urgent'),
    'technical',    COUNT(*) FILTER (WHERE category = 'Technical'),
    'billing',      COUNT(*) FILTER (WHERE category = 'Billing'),
    'product',      COUNT(*) FILTER (WHERE category = 'Product'),
    'delivery',     COUNT(*) FILTER (WHERE category = 'Delivery'),
    'account',      COUNT(*) FILTER (WHERE category = 'Account'),
    'other',        COUNT(*) FILTER (WHERE category = 'Other'),
    'avg_resolution_hours', ROUND(
      EXTRACT(EPOCH FROM AVG(
        CASE WHEN status IN ('Resolved','Closed')
             THEN updated_at - created_at
        END
      )) / 3600.0, 1
    )
  ) FROM public.tickets;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- PART 6: DETAIL VIEW (joins profiles onto tickets for convenience)
-- ============================================================================
CREATE OR REPLACE VIEW public.ticket_detail_view AS
SELECT
  t.*,
  c.full_name   AS customer_name,
  c.email       AS customer_email,
  s.full_name   AS assigned_staff_name,
  s.department  AS staff_department
FROM public.tickets t
LEFT JOIN public.profiles c ON c.id = t.customer_id
LEFT JOIN public.profiles s ON s.id = t.assigned_staff_id;


-- ============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.departments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

-- ── DEPARTMENTS ──────────────────────────────────────────────
-- Everyone authenticated can read departments
CREATE POLICY "departments_select_authenticated"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

-- ── PROFILES ─────────────────────────────────────────────────
-- Users read own profile; admin and staff can read all profiles
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.current_user_role() IN ('admin', 'staff')
  );

-- Users can update own profile; admins can update any profile
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'admin');

-- Profile is inserted by the trigger (SECURITY DEFINER) or by the user/admin
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Admins can delete profiles (remove staff, etc.)
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ── TICKETS ──────────────────────────────────────────────────
-- Customers see own tickets; staff see assigned tickets; admins see all
CREATE POLICY "tickets_select"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR assigned_staff_id = auth.uid()
    OR public.current_user_role() = 'admin'
  );

-- Customers create their own tickets; admins can create on behalf
CREATE POLICY "tickets_insert"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    OR public.current_user_role() = 'admin'
  );

-- Admins, assigned staff, and ticket owner can update
CREATE POLICY "tickets_update"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'admin'
    OR assigned_staff_id = auth.uid()
    OR customer_id = auth.uid()
  );

-- Only admins can delete tickets
CREATE POLICY "tickets_delete"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ── TICKET UPDATES ───────────────────────────────────────────
-- Visible to anyone who can see the parent ticket
CREATE POLICY "ticket_updates_select"
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

-- Only the actor who made the update can insert (enforced: updated_by = auth.uid())
CREATE POLICY "ticket_updates_insert"
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

-- ── NOTIFICATIONS ────────────────────────────────────────────
-- Users see their own notifications; admins see all
CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

-- Users can mark their own notifications as read
CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Any authenticated user (or trigger) can insert notifications
CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');


-- ============================================================================
-- PART 8: STORAGE BUCKET (for ticket attachments)
-- ============================================================================
-- Create the storage bucket for ticket file attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false,
  10485760,  -- 10 MB limit
  ARRAY[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: authenticated users can upload to their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users upload own attachments' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users upload own attachments"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'ticket-attachments'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Storage RLS: users can read attachments for tickets they can access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read accessible attachments' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users read accessible attachments"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'ticket-attachments'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR public.current_user_role() IN ('admin', 'staff')
        )
      );
  END IF;
END $$;

-- Storage RLS: users can delete their own uploads; admins delete any
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own attachments' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users delete own attachments"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'ticket-attachments'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR public.current_user_role() = 'admin'
        )
      );
  END IF;
END $$;


-- ============================================================================
-- PART 9: SEED DATA (Departments)
-- ============================================================================
INSERT INTO public.departments (department_name) VALUES
  ('Technical Support'),
  ('Billing Department'),
  ('Sales Department'),
  ('Delivery Department'),
  ('General Support')
ON CONFLICT (department_name) DO NOTHING;


-- ============================================================================
-- PART 10: GRANT PERMISSIONS (allow the anon/authenticated roles to call RPCs)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ticket_stats() TO authenticated;
GRANT SELECT ON public.ticket_detail_view TO authenticated;


-- ============================================================================
-- DONE! ✅
-- ============================================================================
-- Your BizAssist AI backend is now fully set up:
--
--   ✅ 5 tables: departments, profiles, tickets, ticket_updates, notifications
--   ✅ 7 indexes for fast search & filtering
--   ✅ 3 triggers: auto-profile on signup, auto-updated_at, auto-notifications
--   ✅ 5 functions: handle_updated_at, handle_new_user, notify_on_status_change,
--                   current_user_role, get_ticket_stats
--   ✅ 1 view: ticket_detail_view (pre-joined customer + staff names)
--   ✅ 17 RLS policies across all tables
--   ✅ 1 storage bucket: ticket-attachments (10 MB, images/PDFs/docs)
--   ✅ 3 storage policies for upload/read/delete
--   ✅ 5 seed departments
--
-- Next steps:
--   1. Register users via the app (/register page)
--   2. The auth trigger will auto-create their profile row
--   3. Start submitting complaints — tickets are saved to Supabase!
-- ============================================================================
