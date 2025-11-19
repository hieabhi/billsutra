-- =====================================================
-- PERMANENT RLS FIX - Remove tenant_id requirement
-- =====================================================
-- This allows your backend to access data without setting session variables
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- OPTION 1: DISABLE RLS (Simplest - Development Only)
-- =====================================================
-- WARNING: Only use in development. Remove for production!

ALTER TABLE public.guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Drop all tenant isolation policies
DROP POLICY IF EXISTS tenant_isolation_guests ON public.guests;
DROP POLICY IF EXISTS tenant_isolation_folio_lines ON public.folio_lines;
DROP POLICY IF EXISTS tenant_isolation_payments ON public.payments;
DROP POLICY IF EXISTS tenant_isolation_housekeeping ON public.housekeeping_tasks;
DROP POLICY IF EXISTS tenant_isolation_subscriptions ON public.subscriptions;
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON public.audit_logs;
DROP POLICY IF EXISTS tenant_isolation_rooms ON public.rooms;
DROP POLICY IF EXISTS tenant_isolation_bookings ON public.bookings;
DROP POLICY IF EXISTS tenant_isolation_bills ON public.bills;
DROP POLICY IF EXISTS tenant_isolation_items ON public.items;
DROP POLICY IF EXISTS tenant_isolation_customers ON public.customers;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that RLS is disabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('guests', 'folio_lines', 'payments', 'housekeeping_tasks', 
                    'subscriptions', 'audit_logs', 'rooms', 'bookings', 
                    'bills', 'items', 'customers')
ORDER BY tablename;

-- Should show rowsecurity = false for all tables
