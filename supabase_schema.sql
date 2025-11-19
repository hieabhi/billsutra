-- BillSutra Database Schema for Supabase PostgreSQL
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ROOMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  type TEXT NOT NULL,
  floor INTEGER,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED', 'MAINTENANCE')),
  housekeeping_status TEXT NOT NULL DEFAULT 'CLEAN' CHECK (housekeeping_status IN ('CLEAN', 'DIRTY', 'INSPECTED', 'OUT_OF_SERVICE')),
  amenities JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, number)
);

-- Index for faster queries
CREATE INDEX idx_rooms_tenant ON rooms(tenant_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_housekeeping ON rooms(housekeeping_status);

-- =====================================================
-- ROOM TYPES TABLE
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

CREATE INDEX idx_room_types_tenant ON room_types(tenant_id);

-- =====================================================
-- CUSTOMERS TABLE
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

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_number TEXT NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_email TEXT,
  guest_id_proof TEXT,
  guest_address TEXT,
  guest_counts JSONB DEFAULT '{"adults": 1, "children": 0, "infants": 0}',
  additional_guests JSONB DEFAULT '[]',
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in_date TIMESTAMPTZ,
  actual_check_out_date TIMESTAMPTZ,
  nights INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_payment DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Reserved' CHECK (status IN ('Reserved', 'CheckedIn', 'CheckedOut', 'Cancelled', 'NoShow')),
  booking_source TEXT DEFAULT 'Walk-in',
  payment_method TEXT DEFAULT 'Cash',
  special_requests TEXT,
  folio JSONB DEFAULT '{"lines": [], "balance": 0}',
  bill_id UUID,
  bill_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, reservation_number)
);

CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_guest ON bookings(guest_phone, guest_email);

-- =====================================================
-- BILLS TABLE
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

CREATE INDEX idx_bills_tenant ON bills(tenant_id);
CREATE INDEX idx_bills_date ON bills(date);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_customer ON bills(customer_phone);

-- =====================================================
-- ITEMS / MENU TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  hsn TEXT,
  cgst DECIMAL(5,2) DEFAULT 0,
  sgst DECIMAL(5,2) DEFAULT 0,
  igst DECIMAL(5,2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_items_tenant ON items(tenant_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_active ON items(is_active);

-- =====================================================
-- HOUSEKEEPING TABLE
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

CREATE INDEX idx_housekeeping_tenant ON housekeeping(tenant_id);
CREATE INDEX idx_housekeeping_room ON housekeeping(room_id);
CREATE INDEX idx_housekeeping_status ON housekeeping(status);

-- =====================================================
-- RATE PLANS TABLE
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

CREATE INDEX idx_rate_plans_tenant ON rate_plans(tenant_id);
CREATE INDEX idx_rate_plans_room_type ON rate_plans(room_type_id);

-- =====================================================
-- SETTINGS TABLE
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

CREATE INDEX idx_hotel_settings_tenant ON hotel_settings(tenant_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only see their own tenant's data)
CREATE POLICY "Users see own tenant rooms" ON rooms FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY "Users see own tenant room_types" ON room_types FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY "Users see own tenant customers" ON customers FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY "Users see own tenant bookings" ON bookings FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY "Users see own tenant bills" ON bills FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY "Users see own tenant items" ON items FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY "Users see own tenant housekeeping" ON housekeeping FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY "Users see own tenant rate_plans" ON rate_plans FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY "Users see own tenant settings" ON hotel_settings FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON room_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_housekeeping_updated_at BEFORE UPDATE ON housekeeping FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rate_plans_updated_at BEFORE UPDATE ON rate_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_hotel_settings_updated_at BEFORE UPDATE ON hotel_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- COMPLETE!
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ BillSutra database schema created successfully!';
  RAISE NOTICE '📊 Tables created: 9';
  RAISE NOTICE '🔒 Row Level Security enabled';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🔄 Auto-update triggers configured';
END $$;
