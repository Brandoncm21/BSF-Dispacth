-- ============================================================
-- Migration: Tracking System + Fuel Type
-- Creates tables for driver checkpoints, notifications, 
-- and adds fuel columns to trucks.
-- ============================================================

-- 1. Driver Checkpoints
CREATE TABLE IF NOT EXISTS public.driver_checkpoints (
  checkpoint_id SERIAL PRIMARY KEY,
  load_id INTEGER REFERENCES public.loads(load_id) ON DELETE CASCADE,
  driver_id INTEGER REFERENCES public.drivers(driver_id) ON DELETE SET NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  status_at_checkpoint VARCHAR(50),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_by INTEGER REFERENCES public.employees(employee_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_driver_checkpoints_load_time
  ON public.driver_checkpoints(load_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_checkpoints_driver
  ON public.driver_checkpoints(driver_id, recorded_at DESC);

-- 2. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id SERIAL PRIMARY KEY,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('dispatcher', 'driver', 'broker')),
  recipient_id INTEGER NOT NULL,
  load_id INTEGER REFERENCES public.loads(load_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_via VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  preference_id SERIAL PRIMARY KEY,
  user_type VARCHAR(20),
  user_id INTEGER NOT NULL,
  channel_email BOOLEAN DEFAULT TRUE,
  channel_sms BOOLEAN DEFAULT FALSE,
  channel_push BOOLEAN DEFAULT FALSE,
  notify_on_status_change BOOLEAN DEFAULT TRUE,
  notify_on_checkpoint BOOLEAN DEFAULT TRUE,
  notify_on_geofence BOOLEAN DEFAULT FALSE,
  notify_on_delay BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tracking token on loads
ALTER TABLE public.loads
  ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE;

-- 5. Fuel columns on trucks
ALTER TABLE public.trucks
  ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20) CHECK (fuel_type IN ('diesel', 'gasoline'));
ALTER TABLE public.trucks
  ADD COLUMN IF NOT EXISTS fuel_cost_per_mile NUMERIC(10,4) DEFAULT 0.60;

-- 6. RLS Policies
ALTER TABLE public.driver_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "authenticated_can_insert_checkpoints" ON public.driver_checkpoints
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_can_select_checkpoints" ON public.driver_checkpoints
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "recipient_can_select_notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id IN (SELECT employee_id FROM public.employees WHERE auth_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "recipient_can_update_notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id IN (SELECT employee_id FROM public.employees WHERE auth_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "user_can_select_preferences" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT employee_id FROM public.employees WHERE auth_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "user_can_insert_preferences" ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT employee_id FROM public.employees WHERE auth_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "user_can_update_preferences" ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id IN (SELECT employee_id FROM public.employees WHERE auth_user_id = auth.uid()));
