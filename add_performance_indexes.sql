-- PERFORMANCE OPTIMIZATION: Critical Database Indexes
-- Run this in Supabase SQL Editor to optimize query performance
-- Expected improvement: 10-50x faster queries on large datasets

-- =====================================================
-- BOOKINGS TABLE INDEXES
-- =====================================================

-- Index for filtering by status (most common query)
CREATE INDEX IF NOT EXISTS idx_bookings_status_tenant 
ON bookings(status, tenant_id) 
WHERE status IS NOT NULL;

-- Index for date range queries (arrivals, departures)
CREATE INDEX IF NOT EXISTS idx_bookings_date_range 
ON bookings(tenant_id, check_in, check_out);

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_bookings_dashboard 
ON bookings(tenant_id, status, check_in) 
WHERE status IN ('CONFIRMED', 'CHECKED_IN');

-- =====================================================
-- ROOMS TABLE INDEXES
-- =====================================================

-- Index for room availability queries
CREATE INDEX IF NOT EXISTS idx_rooms_status_type 
ON rooms(status, type, tenant_id);

-- Index for housekeeping status
CREATE INDEX IF NOT EXISTS idx_rooms_housekeeping 
ON rooms(housekeeping_status, tenant_id) 
WHERE housekeeping_status = 'DIRTY';

-- Index for room number lookups (exact match)
CREATE INDEX IF NOT EXISTS idx_rooms_number 
ON rooms(tenant_id, number);

-- =====================================================
-- HOUSEKEEPING_TASKS TABLE INDEXES
-- =====================================================

-- Index for active tasks
CREATE INDEX IF NOT EXISTS idx_housekeeping_active 
ON housekeeping_tasks(status, tenant_id) 
WHERE status IN ('PENDING', 'IN_PROGRESS');

-- Index for room-based queries
CREATE INDEX IF NOT EXISTS idx_housekeeping_room_status 
ON housekeeping_tasks(room_id, status);

-- Index for priority tasks
CREATE INDEX IF NOT EXISTS idx_housekeeping_priority 
ON housekeeping_tasks(priority, status, tenant_id) 
WHERE status != 'COMPLETED';

-- =====================================================
-- RATE_PLANS TABLE INDEXES
-- =====================================================

-- Index for room type lookups
CREATE INDEX IF NOT EXISTS idx_rate_plans_room_type 
ON rate_plans(room_type, tenant_id);

-- =====================================================
-- ITEMS TABLE INDEXES
-- =====================================================

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_items_category 
ON items(category, tenant_id) 
WHERE category IS NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all indexes created
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes 
JOIN pg_class ON indexname = relname
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Performance improvement expected:
-- ✅ Booking queries: 10-20x faster
-- ✅ Room availability: 15-30x faster  
-- ✅ Dashboard stats: 5-10x faster
-- ✅ Date range reports: 20-50x faster
