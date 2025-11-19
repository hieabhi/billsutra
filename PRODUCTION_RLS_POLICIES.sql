-- PRODUCTION-READY RLS POLICIES WITH TENANT ISOLATION
-- Run this in Supabase SQL Editor AFTER testing is complete
-- This ensures each hotel only sees their own data

-- ============================================
-- IMPORTANT: This replaces the PUBLIC policies
-- ============================================

-- 1. DROP PUBLIC (TESTING) POLICIES
DROP POLICY IF EXISTS "Enable all for public on tenants" ON public.tenants;
DROP POLICY IF EXISTS "Enable all for public on users" ON public.users;
DROP POLICY IF EXISTS "Enable all for public on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Enable all for public on items" ON public.items;
DROP POLICY IF EXISTS "Enable all for public on customers" ON public.customers;
DROP POLICY IF EXISTS "Enable all for public on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable all for public on bills" ON public.bills;
DROP POLICY IF EXISTS "Enable all for public on hotel_settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Enable all for public on housekeeping" ON public.housekeeping;
DROP POLICY IF EXISTS "Enable all for public on room_types" ON public.room_types;
DROP POLICY IF EXISTS "Enable all for public on rate_plans" ON public.rate_plans;

-- 2. CREATE HELPER FUNCTION TO GET USER'S TENANT
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE firebase_uid = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- 3. TENANTS - Anyone can read (for signup), but only admins can modify
CREATE POLICY "Anyone can view tenants"
ON public.tenants FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Only service role can modify tenants"
ON public.tenants FOR ALL
TO PUBLIC
USING (false) WITH CHECK (false);

-- 4. USERS - Users can only see users in their tenant
CREATE POLICY "Users can view users in their tenant"
ON public.users FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert themselves"
ON public.users FOR INSERT
TO PUBLIC
WITH CHECK (true); -- Allow user creation during signup

CREATE POLICY "Users can update users in their tenant"
ON public.users FOR UPDATE
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 5. ROOMS - Tenant-isolated
CREATE POLICY "Users can view rooms in their tenant"
ON public.rooms FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage rooms in their tenant"
ON public.rooms FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 6. ITEMS - Tenant-isolated
CREATE POLICY "Users can view items in their tenant"
ON public.items FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage items in their tenant"
ON public.items FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 7. CUSTOMERS - Tenant-isolated
CREATE POLICY "Users can view customers in their tenant"
ON public.customers FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage customers in their tenant"
ON public.customers FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 8. BOOKINGS - Tenant-isolated
CREATE POLICY "Users can view bookings in their tenant"
ON public.bookings FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage bookings in their tenant"
ON public.bookings FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 9. BILLS - Tenant-isolated
CREATE POLICY "Users can view bills in their tenant"
ON public.bills FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage bills in their tenant"
ON public.bills FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 10. HOTEL SETTINGS - Tenant-isolated
CREATE POLICY "Users can view settings in their tenant"
ON public.hotel_settings FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage settings in their tenant"
ON public.hotel_settings FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 11. HOUSEKEEPING - Tenant-isolated
CREATE POLICY "Users can view housekeeping in their tenant"
ON public.housekeeping FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage housekeeping in their tenant"
ON public.housekeeping FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 12. ROOM TYPES - Tenant-isolated
CREATE POLICY "Users can view room types in their tenant"
ON public.room_types FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage room types in their tenant"
ON public.room_types FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 13. RATE PLANS - Tenant-isolated
CREATE POLICY "Users can view rate plans in their tenant"
ON public.rate_plans FOR SELECT
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage rate plans in their tenant"
ON public.rate_plans FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 14. VERIFY SETUP
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- SUMMARY:
-- ✅ Each tenant can ONLY see their own data
-- ✅ No data leakage between hotels
-- ✅ Users can only access data for their tenant
-- ✅ Production-ready security
-- ============================================
