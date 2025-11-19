-- COMPLETE SUPABASE FIX - RUN THIS IN SUPABASE SQL EDITOR
-- This will reset everything and create fresh schema with data

-- 1. Drop all existing tables (cascading)
DROP TABLE IF EXISTS public.housekeeping CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.rate_plans CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.room_types CASCADE;
DROP TABLE IF EXISTS public.hotel_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- 2. Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  firebase_uid TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'Standard',
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  housekeeping_status TEXT NOT NULL DEFAULT 'CLEAN',
  floor INTEGER,
  amenities JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, room_number)
);

-- 5. Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  hsn TEXT,
  cgst NUMERIC(5,2) DEFAULT 0,
  sgst NUMERIC(5,2) DEFAULT 0,
  igst NUMERIC(5,2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  id_proof_type TEXT,
  id_proof_number TEXT,
  gstin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  check_in_date TIMESTAMPTZ NOT NULL,
  check_out_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Reserved',
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create bills table
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  bill_number TEXT NOT NULL,
  bill_date TIMESTAMPTZ DEFAULT NOW(),
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  cgst_amount NUMERIC(10,2) DEFAULT 0,
  sgst_amount NUMERIC(10,2) DEFAULT 0,
  igst_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, bill_number)
);

-- 9. Create hotel_settings table
CREATE TABLE public.hotel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  hotel_name TEXT,
  hotel_address TEXT,
  hotel_phone TEXT,
  hotel_email TEXT,
  gstin TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create housekeeping table
CREATE TABLE public.housekeeping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  priority TEXT DEFAULT 'MEDIUM',
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create room_types table
CREATE TABLE public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  amenities JSONB DEFAULT '[]',
  max_occupancy INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- 12. Create rate_plans table
CREATE TABLE public.rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE CASCADE,
  base_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  weekend_rate NUMERIC(10,2),
  monthly_rate NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans ENABLE ROW LEVEL SECURITY;

-- 14. Create permissive RLS policies (ALLOW ALL FOR DEVELOPMENT)
-- Tenants
CREATE POLICY "Enable all for authenticated users on tenants"
ON public.tenants FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Users
CREATE POLICY "Enable all for authenticated users on users"
ON public.users FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Rooms
CREATE POLICY "Enable all for authenticated users on rooms"
ON public.rooms FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Items
CREATE POLICY "Enable all for authenticated users on items"
ON public.items FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Customers
CREATE POLICY "Enable all for authenticated users on customers"
ON public.customers FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Bookings
CREATE POLICY "Enable all for authenticated users on bookings"
ON public.bookings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Bills
CREATE POLICY "Enable all for authenticated users on bills"
ON public.bills FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Hotel Settings
CREATE POLICY "Enable all for authenticated users on hotel_settings"
ON public.hotel_settings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Housekeeping
CREATE POLICY "Enable all for authenticated users on housekeeping"
ON public.housekeeping FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Room Types
CREATE POLICY "Enable all for authenticated users on room_types"
ON public.room_types FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Rate Plans
CREATE POLICY "Enable all for authenticated users on rate_plans"
ON public.rate_plans FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 15. INSERT DEMO TENANT
INSERT INTO public.tenants (id, name, subdomain)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Demo Hotel', 'demo-hotel')
ON CONFLICT (id) DO NOTHING;

-- 16. INSERT 8 ROOMS
INSERT INTO public.rooms (tenant_id, room_number, room_type, base_price, status, housekeeping_status, floor) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '101', 'Standard', 1500.00, 'AVAILABLE', 'CLEAN', 1),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '102', 'Standard', 1500.00, 'AVAILABLE', 'CLEAN', 1),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '103', 'Deluxe', 2000.00, 'AVAILABLE', 'CLEAN', 1),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '104', 'Deluxe', 2000.00, 'AVAILABLE', 'CLEAN', 1),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '201', 'Standard', 1500.00, 'AVAILABLE', 'CLEAN', 2),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '202', 'Standard', 1500.00, 'AVAILABLE', 'CLEAN', 2),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '203', 'Suite', 3000.00, 'AVAILABLE', 'CLEAN', 2),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', '204', 'Suite', 3000.00, 'AVAILABLE', 'CLEAN', 2)
ON CONFLICT (tenant_id, room_number) DO NOTHING;

-- 17. INSERT 1 ITEM
INSERT INTO public.items (tenant_id, name, category, price, cgst, sgst, is_active) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Thali', 'Food', 150.00, 2.5, 2.5, true)
ON CONFLICT DO NOTHING;

-- 18. Verify data
SELECT 'Tenants' as table_name, COUNT(*) as count FROM public.tenants
UNION ALL
SELECT 'Rooms', COUNT(*) FROM public.rooms
UNION ALL
SELECT 'Items', COUNT(*) FROM public.items;
