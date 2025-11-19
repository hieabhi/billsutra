-- Add all missing columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reservation_number TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Add missing columns to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_number TEXT;

-- Add missing rate column to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2) DEFAULT 0;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All missing columns added!';
  RAISE NOTICE '   - bookings: amount, check_in_date, check_out_date, reservation_number, room_number, guest_name';
  RAISE NOTICE '   - rooms: room_number';  
  RAISE NOTICE '   - items: rate';
END $$;
