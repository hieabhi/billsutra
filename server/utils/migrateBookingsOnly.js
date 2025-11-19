/**
 * Quick Bookings Migration to Supabase
 * Migrates only bookings since other data is already there
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DATA_DIR = path.join(__dirname, '../data');

const log = {
  info: (msg) => console.log(`\x1b[36mℹ ${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m✗ ${msg}\x1b[0m`),
  step: (msg) => console.log(`\x1b[34m▶ ${msg}\x1b[0m`)
};

const readJSON = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const migrateBookings = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('  Quick Bookings Migration');
  console.log('='.repeat(60) + '\n');

  // Get tenant ID
  const { data: users } = await supabase.from('users').select('tenant_id').limit(1);
  const tenantId = users[0].tenant_id;
  log.success(`Using tenant ID: ${tenantId}`);

  // Read bookings
  const bookings = readJSON('bookings.json');
  log.info(`Found ${bookings.length} bookings to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (const booking of bookings) {
    // Get room_id from room_number
    const { data: roomData } = await supabase
      .from('rooms')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('room_number', booking.roomNumber)
      .single();

    if (!roomData) {
      log.error(`Failed: ${booking.reservationNumber} - Room ${booking.roomNumber} not found`);
      errorCount++;
      continue;
    }

    // Map JSON structure to Supabase columns (match actual column names)
    const bookingData = {
      tenant_id: tenantId,
      room_id: roomData.id,
      reservation_number: booking.reservationNumber,
      room_number: booking.roomNumber,
      guest_name: booking.guest?.name || 'Guest',
      check_in: booking.checkInDate,
      check_out: booking.checkOutDate,
      room_rate: parseFloat(booking.rate) || 0,
      number_of_nights: booking.nights || 1,
      subtotal: parseFloat(booking.amount) || 0,
      total_amount: parseFloat(booking.amount) || 0,
      amount: parseFloat(booking.amount) || 0,
      status: booking.status || 'Reserved'
    };

    const { error } = await supabase
      .from('bookings')
      .insert(bookingData);

    if (error) {
      log.error(`Failed: ${booking.reservationNumber} - ${error.message}`);
      errorCount++;
    } else {
      log.success(`Migrated: ${booking.reservationNumber}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  log.success(`Migration complete! ${successCount} bookings migrated, ${errorCount} errors`);
  console.log('='.repeat(60) + '\n');
};

migrateBookings().catch(console.error);
