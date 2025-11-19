-- FIX RLS POLICIES TO ALLOW ANON KEY ACCESS
-- The issue: policies are set to "TO authenticated" but anon key is not considered authenticated
-- Solution: Change to "TO PUBLIC" or "TO anon"

-- Drop existing restrictive policies and create public ones
DROP POLICY IF EXISTS "Enable all for authenticated users on tenants" ON public.tenants;
DROP POLICY IF EXISTS "Enable all for authenticated users on users" ON public.users;
DROP POLICY IF EXISTS "Enable all for authenticated users on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Enable all for authenticated users on items" ON public.items;
DROP POLICY IF EXISTS "Enable all for authenticated users on customers" ON public.customers;
DROP POLICY IF EXISTS "Enable all for authenticated users on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable all for authenticated users on bills" ON public.bills;
DROP POLICY IF EXISTS "Enable all for authenticated users on hotel_settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Enable all for authenticated users on housekeeping" ON public.housekeeping;
DROP POLICY IF EXISTS "Enable all for authenticated users on room_types" ON public.room_types;
DROP POLICY IF EXISTS "Enable all for authenticated users on rate_plans" ON public.rate_plans;

-- Create new policies that allow anon access (PUBLIC includes anon role)
CREATE POLICY "Enable all for public on tenants"
ON public.tenants FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on users"
ON public.users FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on rooms"
ON public.rooms FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on items"
ON public.items FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on customers"
ON public.customers FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on bookings"
ON public.bookings FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on bills"
ON public.bills FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on hotel_settings"
ON public.hotel_settings FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on housekeeping"
ON public.housekeeping FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on room_types"
ON public.room_types FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for public on rate_plans"
ON public.rate_plans FOR ALL TO PUBLIC
USING (true) WITH CHECK (true);

-- Verify tenants exist
SELECT 'Tenants after policy fix' as info, COUNT(*) as count FROM public.tenants;
