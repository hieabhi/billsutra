-- =====================================================
-- FIX SUPABASE SECURITY & PERFORMANCE ISSUES
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FIX SECURITY DEFINER VIEW
-- =====================================================
-- Drop and recreate daily_revenue view without SECURITY DEFINER
DROP VIEW IF EXISTS public.daily_revenue;

CREATE OR REPLACE VIEW public.daily_revenue AS
SELECT 
  date(bill_date) as date,
  tenant_id,
  SUM(total_amount) as revenue,
  COUNT(*) as bill_count
FROM public.bills
WHERE payment_status = 'PAID'
GROUP BY date(bill_date), tenant_id
ORDER BY date DESC;

-- =====================================================
-- 2. FIX FUNCTION SEARCH_PATH
-- =====================================================
-- Update update_updated_at function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. FIX RLS PERFORMANCE ISSUES
-- Replace auth.<function>() with (select auth.<function>())
-- =====================================================

-- Fix guests table RLS
DROP POLICY IF EXISTS tenant_isolation_guests ON public.guests;
CREATE POLICY tenant_isolation_guests ON public.guests
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix folio_lines table RLS
DROP POLICY IF EXISTS tenant_isolation_folio_lines ON public.folio_lines;
CREATE POLICY tenant_isolation_folio_lines ON public.folio_lines
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix payments table RLS
DROP POLICY IF EXISTS tenant_isolation_payments ON public.payments;
CREATE POLICY tenant_isolation_payments ON public.payments
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix housekeeping_tasks table RLS
DROP POLICY IF EXISTS tenant_isolation_housekeeping ON public.housekeeping_tasks;
CREATE POLICY tenant_isolation_housekeeping ON public.housekeeping_tasks
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix subscriptions table RLS
DROP POLICY IF EXISTS tenant_isolation_subscriptions ON public.subscriptions;
CREATE POLICY tenant_isolation_subscriptions ON public.subscriptions
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix audit_logs table RLS
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON public.audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON public.audit_logs
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- =====================================================
-- ALSO FIX ALL OTHER TABLES (COMMON ONES)
-- =====================================================

-- Fix rooms table RLS if exists
DROP POLICY IF EXISTS tenant_isolation_rooms ON public.rooms;
CREATE POLICY tenant_isolation_rooms ON public.rooms
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix bookings table RLS if exists
DROP POLICY IF EXISTS tenant_isolation_bookings ON public.bookings;
CREATE POLICY tenant_isolation_bookings ON public.bookings
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix bills table RLS if exists
DROP POLICY IF EXISTS tenant_isolation_bills ON public.bills;
CREATE POLICY tenant_isolation_bills ON public.bills
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix items table RLS if exists
DROP POLICY IF EXISTS tenant_isolation_items ON public.items;
CREATE POLICY tenant_isolation_items ON public.items
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Fix customers table RLS if exists
DROP POLICY IF EXISTS tenant_isolation_customers ON public.customers;
CREATE POLICY tenant_isolation_customers ON public.customers
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- =====================================================
-- 4. REMOVE DUPLICATE PUBLIC POLICIES
-- =====================================================
-- Remove public_access_* policies that cause multiple permissive policy warnings
-- The tenant_isolation_* policies are sufficient for ANON_KEY access

DROP POLICY IF EXISTS public_access_rooms ON public.rooms;
DROP POLICY IF EXISTS public_access_bookings ON public.bookings;
DROP POLICY IF EXISTS public_access_bills ON public.bills;
DROP POLICY IF EXISTS public_access_items ON public.items;
DROP POLICY IF EXISTS public_access_customers ON public.customers;
DROP POLICY IF EXISTS public_access_housekeeping ON public.housekeeping_tasks;
DROP POLICY IF EXISTS public_access_guests ON public.guests;
DROP POLICY IF EXISTS public_access_folio_lines ON public.folio_lines;
DROP POLICY IF EXISTS public_access_payments ON public.payments;

-- Also remove old "Enable all for public" policies
DROP POLICY IF EXISTS "Enable all for public on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Enable all for public on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable all for public on bills" ON public.bills;
DROP POLICY IF EXISTS "Enable all for public on items" ON public.items;
DROP POLICY IF EXISTS "Enable all for public on customers" ON public.customers;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the fixes

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check functions
SELECT 
  routine_schema,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check views
SELECT 
  table_schema,
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
