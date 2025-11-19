-- BillSutra Schema Update - Add Missing Columns and Tables
-- Run this in Supabase SQL Editor to update existing schema

-- =====================================================
-- UPDATE ROOMS TABLE
-- =====================================================

-- Add missing columns to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS housekeeping_status TEXT DEFAULT 'CLEAN';

-- Add constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'rooms_housekeeping_status_check'
    ) THEN
        ALTER TABLE rooms ADD CONSTRAINT rooms_housekeeping_status_check 
        CHECK (housekeeping_status IN ('CLEAN', 'DIRTY', 'INSPECTED', 'OUT_OF_SERVICE'));
    END IF;
END $$;

-- =====================================================
-- UPDATE ITEMS TABLE
-- =====================================================

-- Add missing columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS cgst DECIMAL(5,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS sgst DECIMAL(5,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS igst DECIMAL(5,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS hsn TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =====================================================
-- UPDATE BOOKINGS TABLE
-- =====================================================

-- Add missing columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_check_in_date TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_check_out_date TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_id_proof TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_counts JSONB DEFAULT '{"adults": 1, "children": 0, "infants": 0}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_guests JSONB DEFAULT '[]';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nights INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS advance_payment DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'Walk-in';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS folio JSONB DEFAULT '{"lines": [], "balance": 0}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bill_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bill_number TEXT;

-- =====================================================
-- CREATE CUSTOMERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  id_proof TEXT,
  id_proof_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users see own tenant customers" ON customers;
CREATE POLICY "Users see own tenant customers" ON customers FOR ALL 
USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
BEFORE UPDATE ON customers 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CREATE BILLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_id_proof TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  cgst_total DECIMAL(10,2) DEFAULT 0,
  sgst_total DECIMAL(10,2) DEFAULT 0,
  igst_total DECIMAL(10,2) DEFAULT 0,
  total_tax DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  status TEXT NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid', 'Unpaid', 'Partial')),
  advance_payment DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  check_in_date DATE,
  check_out_date DATE,
  nights INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, bill_number)
);

CREATE INDEX IF NOT EXISTS idx_bills_tenant ON bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_phone);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users see own tenant bills" ON bills;
CREATE POLICY "Users see own tenant bills" ON bills FOR ALL 
USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at 
BEFORE UPDATE ON bills 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CREATE HOTEL_SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hotel_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hotel_name TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  next_bill_number INTEGER DEFAULT 1,
  next_reservation_number INTEGER DEFAULT 1,
  tax_settings JSONB DEFAULT '{"cgst": 6, "sgst": 6, "igst": 12}',
  address JSONB DEFAULT '{}',
  contact JSONB DEFAULT '{}',
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_hotel_settings_tenant ON hotel_settings(tenant_id);

-- Enable RLS
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users see own tenant settings" ON hotel_settings;
CREATE POLICY "Users see own tenant settings" ON hotel_settings FOR ALL 
USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_hotel_settings_updated_at ON hotel_settings;
CREATE TRIGGER update_hotel_settings_updated_at 
BEFORE UPDATE ON hotel_settings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CREATE HOUSEKEEPING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS housekeeping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('Cleaning', 'Maintenance', 'Inspection', 'Deep Clean')),
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Verified')),
  assigned_to TEXT,
  description TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_housekeeping_tenant ON housekeeping(tenant_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_room ON housekeeping(room_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON housekeeping(status);

-- Enable RLS
ALTER TABLE housekeeping ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users see own tenant housekeeping" ON housekeeping;
CREATE POLICY "Users see own tenant housekeeping" ON housekeeping FOR ALL 
USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_housekeeping_updated_at ON housekeeping;
CREATE TRIGGER update_housekeeping_updated_at 
BEFORE UPDATE ON housekeeping 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CREATE ROOM TYPES TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  default_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_occupancy INTEGER DEFAULT 2,
  amenities JSONB DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_room_types_tenant ON room_types(tenant_id);

-- Enable RLS
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users see own tenant room_types" ON room_types;
CREATE POLICY "Users see own tenant room_types" ON room_types FOR ALL 
USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_room_types_updated_at ON room_types;
CREATE TRIGGER update_room_types_updated_at 
BEFORE UPDATE ON room_types 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CREATE RATE PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
  room_type_name TEXT NOT NULL,
  name TEXT NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  overrides JSONB DEFAULT '{}',
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_plans_tenant ON rate_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_plans_room_type ON rate_plans(room_type_id);

-- Enable RLS
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users see own tenant rate_plans" ON rate_plans;
CREATE POLICY "Users see own tenant rate_plans" ON rate_plans FOR ALL 
USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_rate_plans_updated_at ON rate_plans;
CREATE TRIGGER update_rate_plans_updated_at 
BEFORE UPDATE ON rate_plans 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CREATE UPDATE TRIGGER FUNCTION (if not exists)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETE!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ BillSutra schema updated successfully!';
  RAISE NOTICE '📊 Tables: rooms, bookings, items (updated)';
  RAISE NOTICE '📊 Tables: customers, bills, hotel_settings, housekeeping, rate_plans (created)';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🔄 Auto-update triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '▶ Next: Run migration again with npm run db:migrate:supabase';
END $$;
