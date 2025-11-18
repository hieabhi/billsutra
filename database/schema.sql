-- ═══════════════════════════════════════════════════════════
-- BILLSUTRA HMS - PostgreSQL Database Schema
-- Multi-tenant SaaS Architecture
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────
-- 1. TENANTS (Hotels/Businesses)
-- ───────────────────────────────────────────────────────────
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL, -- taj, oberoi, etc.
  business_type TEXT DEFAULT 'hotel', -- hotel, restaurant, pharmacy
  
  -- Contact Info
  phone TEXT,
  email TEXT,
  address JSONB,
  
  -- Subscription & Billing
  subscription_plan TEXT DEFAULT 'trial', -- trial, basic, pro, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, past_due, canceled
  trial_ends_at TIMESTAMPTZ,
  
  -- Limits (based on plan)
  max_rooms INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 5,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  currency TEXT DEFAULT 'INR',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);

-- ───────────────────────────────────────────────────────────
-- 2. USERS (Staff members mapped to Firebase)
-- ───────────────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Firebase Mapping
  firebase_uid TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  email TEXT,
  
  -- User Info
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff', -- owner, manager, staff, housekeeping
  
  -- Permissions
  permissions JSONB DEFAULT '{}', -- { "bookings": ["create", "read"], "rooms": ["read"] }
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_phone ON users(phone_number);

-- ───────────────────────────────────────────────────────────
-- 3. ROOMS
-- ───────────────────────────────────────────────────────────
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  room_number TEXT NOT NULL,
  floor_number INTEGER,
  room_type TEXT NOT NULL, -- standard, deluxe, suite
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  extra_guest_charge DECIMAL(10,2) DEFAULT 0,
  
  -- Capacity
  max_occupancy INTEGER DEFAULT 2,
  bed_type TEXT, -- single, double, king, twin
  
  -- Status
  status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED, BLOCKED, MAINTENANCE
  housekeeping_status TEXT DEFAULT 'CLEAN', -- CLEAN, DIRTY, IN_PROGRESS, INSPECTED
  
  -- Amenities
  amenities JSONB DEFAULT '[]', -- ["AC", "TV", "WiFi", "Mini Bar"]
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, room_number)
);

CREATE INDEX idx_rooms_tenant_id ON rooms(tenant_id);
CREATE INDEX idx_rooms_status ON rooms(tenant_id, status);

-- ───────────────────────────────────────────────────────────
-- 4. GUESTS
-- ───────────────────────────────────────────────────────────
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Personal Info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- ID Proof
  id_type TEXT, -- passport, aadhar, license
  id_number TEXT,
  
  -- Address
  address JSONB,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  
  -- Preferences
  preferences JSONB DEFAULT '{}', -- { "room_preference": "sea_view", "allergies": [] }
  
  -- Metadata
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, phone)
);

CREATE INDEX idx_guests_tenant_id ON guests(tenant_id);
CREATE INDEX idx_guests_phone ON guests(tenant_id, phone);

-- ───────────────────────────────────────────────────────────
-- 5. BOOKINGS
-- ───────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- References
  room_id UUID NOT NULL REFERENCES rooms(id),
  guest_id UUID NOT NULL REFERENCES guests(id),
  
  -- Dates
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  actual_check_in TIMESTAMPTZ,
  actual_check_out TIMESTAMPTZ,
  
  -- Guests
  number_of_guests INTEGER DEFAULT 1,
  guest_names JSONB DEFAULT '[]', -- Additional guests
  
  -- Pricing
  room_rate DECIMAL(10,2) NOT NULL,
  number_of_nights INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  taxes DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELED
  payment_status TEXT DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID, REFUNDED
  
  -- Special Requests
  special_requests TEXT,
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(tenant_id, check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(tenant_id, status);

-- ───────────────────────────────────────────────────────────
-- 6. FOLIO LINES (Charges & Credits)
-- ───────────────────────────────────────────────────────────
CREATE TABLE folio_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Line Details
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT, -- room_charge, food, beverage, laundry, misc
  
  -- Amount
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  -- Type
  type TEXT DEFAULT 'charge', -- charge, payment, credit
  
  -- Reference
  reference_id TEXT, -- Links to items, payments, etc.
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_folio_lines_tenant_id ON folio_lines(tenant_id);
CREATE INDEX idx_folio_lines_booking_id ON folio_lines(booking_id);
CREATE INDEX idx_folio_lines_date ON folio_lines(date);

-- ───────────────────────────────────────────────────────────
-- 7. PAYMENTS
-- ───────────────────────────────────────────────────────────
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  booking_id UUID NOT NULL REFERENCES bookings(id),
  
  -- Payment Details
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, card, upi, bank_transfer
  payment_reference TEXT, -- Transaction ID, cheque number, etc.
  
  -- Gateway (if online)
  gateway TEXT, -- razorpay, stripe, etc.
  gateway_payment_id TEXT,
  gateway_response JSONB,
  
  -- Status
  status TEXT DEFAULT 'completed', -- pending, completed, failed, refunded
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- ───────────────────────────────────────────────────────────
-- 8. HOUSEKEEPING TASKS
-- ───────────────────────────────────────────────────────────
CREATE TABLE housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  room_id UUID NOT NULL REFERENCES rooms(id),
  
  -- Task Details
  task_type TEXT DEFAULT 'cleaning', -- cleaning, inspection, maintenance
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Status
  status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELED
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Timing
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  issue_reported TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_housekeeping_tenant_id ON housekeeping_tasks(tenant_id);
CREATE INDEX idx_housekeeping_room_id ON housekeeping_tasks(room_id);
CREATE INDEX idx_housekeeping_status ON housekeeping_tasks(tenant_id, status);
CREATE INDEX idx_housekeeping_assigned_to ON housekeeping_tasks(assigned_to);

-- ───────────────────────────────────────────────────────────
-- 9. ITEMS (Restaurant/Minibar)
-- ───────────────────────────────────────────────────────────
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- food, beverage, snacks, alcohol
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 10,
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_tenant_id ON items(tenant_id);
CREATE INDEX idx_items_category ON items(tenant_id, category);

-- ───────────────────────────────────────────────────────────
-- 10. SUBSCRIPTIONS (Billing)
-- ───────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Plan
  plan TEXT NOT NULL, -- basic, pro, enterprise
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
  
  -- Pricing
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Razorpay
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_plan_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, past_due, canceled, trialing
  
  -- Dates
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);

-- ───────────────────────────────────────────────────────────
-- 11. AUDIT LOGS (Who did what, when)
-- ───────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- User
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  
  -- Action
  action TEXT NOT NULL, -- created, updated, deleted, checked_in, checked_out
  entity_type TEXT NOT NULL, -- booking, room, payment, etc.
  entity_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (Multi-tenant isolation)
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only access their tenant's data)
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_rooms ON rooms
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_guests ON guests
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_bookings ON bookings
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_folio_lines ON folio_lines
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_payments ON payments
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_housekeeping ON housekeeping_tasks
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_items ON items
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_subscriptions ON subscriptions
  USING (tenant_id::text = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  USING (tenant_id::text = current_setting('app.tenant_id', true));

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS (Auto-update timestamps)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_housekeeping_updated_at BEFORE UPDATE ON housekeeping_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- VIEWS (Common queries)
-- ═══════════════════════════════════════════════════════════

-- Active bookings with room and guest details
CREATE VIEW active_bookings AS
SELECT 
  b.*,
  r.room_number,
  r.room_type,
  g.full_name as guest_name,
  g.phone as guest_phone
FROM bookings b
JOIN rooms r ON b.room_id = r.id
JOIN guests g ON b.guest_id = g.id
WHERE b.status IN ('CONFIRMED', 'CHECKED_IN');

-- Room availability (today)
CREATE VIEW available_rooms_today AS
SELECT r.*
FROM rooms r
WHERE r.status = 'AVAILABLE'
  AND r.id NOT IN (
    SELECT room_id FROM bookings
    WHERE CURRENT_DATE BETWEEN check_in AND check_out
      AND status IN ('CONFIRMED', 'CHECKED_IN')
  );

-- Revenue by date
CREATE VIEW daily_revenue AS
SELECT 
  tenant_id,
  DATE(created_at) as date,
  SUM(amount) as total_revenue,
  COUNT(*) as payment_count
FROM payments
WHERE status = 'completed'
GROUP BY tenant_id, DATE(created_at);

-- ═══════════════════════════════════════════════════════════
-- SAMPLE DATA (for testing)
-- ═══════════════════════════════════════════════════════════

-- Insert sample tenant
INSERT INTO tenants (id, name, subdomain, phone, email, subscription_plan, subscription_status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo Hotel',
  'demo',
  '+919876543210',
  'demo@billsutra.com',
  'pro',
  'active'
);

-- Schema creation complete!
-- Next: Run this in Supabase SQL Editor
