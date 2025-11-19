-- Disable RLS temporarily for development, then configure proper policies
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS on all tables (for development)
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_types DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Users see own tenant rooms" ON rooms;
DROP POLICY IF EXISTS "Users see own tenant bookings" ON bookings;
DROP POLICY IF EXISTS "Users see own tenant bills" ON bills;
DROP POLICY IF EXISTS "Users see own tenant items" ON items;
DROP POLICY IF EXISTS "Users see own tenant customers" ON customers;
DROP POLICY IF EXISTS "Users see own tenant settings" ON hotel_settings;
DROP POLICY IF EXISTS "Users see own tenant housekeeping" ON housekeeping;
DROP POLICY IF EXISTS "Users see own tenant rate_plans" ON rate_plans;
DROP POLICY IF EXISTS "Users see own tenant room_types" ON room_types;

-- Step 3: Create simple, working policies
-- These policies allow authenticated users to access their tenant's data

CREATE POLICY "Enable all for authenticated users on rooms"
ON rooms FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on bookings"
ON bookings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on bills"
ON bills FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on items"
ON items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on customers"
ON customers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on hotel_settings"
ON hotel_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on housekeeping"
ON housekeeping FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on rate_plans"
ON rate_plans FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users on room_types"
ON room_types FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 4: Re-enable RLS (but with permissive policies)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies configured for development!';
  RAISE NOTICE '📝 All authenticated users can access data';
  RAISE NOTICE '🔒 RLS is enabled but permissive';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  For production: Add tenant_id filtering to policies';
END $$;
