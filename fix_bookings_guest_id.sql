-- Make guest_id nullable in bookings table
ALTER TABLE bookings ALTER COLUMN guest_id DROP NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ guest_id is now nullable in bookings table';
END $$;
