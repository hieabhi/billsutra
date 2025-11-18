/**
 * Migration Script: JSON Files → PostgreSQL (Supabase)
 * 
 * This script migrates all data from JSON files to Supabase PostgreSQL
 * Run after setting up Supabase project
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ═══════════════════════════════════════════════════════════
// CONFIGURATION - UPDATE THESE AFTER SUPABASE SETUP
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Default tenant ID (will be created if doesn't exist)
const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function readJSONFile(filename) {
  const filePath = path.join(__dirname, '..', 'server', 'data', filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ═══════════════════════════════════════════════════════════
// MIGRATION FUNCTIONS
// ═══════════════════════════════════════════════════════════

async function migrateTenant() {
  console.log('\n📦 Migrating Tenant...');
  
  const tenant = {
    id: DEFAULT_TENANT_ID,
    name: 'Demo Hotel',
    subdomain: 'demo',
    business_type: 'hotel',
    phone: '+919876543210',
    email: 'demo@billsutra.com',
    subscription_plan: 'pro',
    subscription_status: 'active',
    max_rooms: 100,
    max_users: 20,
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  };

  const { data, error } = await supabase
    .from('tenants')
    .upsert(tenant)
    .select();

  if (error) {
    console.error('❌ Error creating tenant:', error);
    throw error;
  }

  console.log('✅ Tenant created:', data[0].name);
  return data[0];
}

async function migrateRooms() {
  console.log('\n🏠 Migrating Rooms...');
  
  const rooms = readJSONFile('rooms.json');
  console.log(`Found ${rooms.length} rooms in JSON`);

  const roomsToInsert = rooms.map(room => ({
    id: generateUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    room_number: room.number,
    floor_number: parseInt(room.number.toString().charAt(0)) || 1,
    room_type: room.type || 'standard',
    base_price: parseFloat(room.price) || 1000,
    extra_guest_charge: parseFloat(room.extraGuestCharge) || 500,
    max_occupancy: room.capacity || 2,
    status: room.status || 'AVAILABLE',
    housekeeping_status: room.housekeepingStatus || 'CLEAN',
    amenities: room.amenities || []
  }));

  const { data, error } = await supabase
    .from('rooms')
    .upsert(roomsToInsert)
    .select();

  if (error) {
    console.error('❌ Error migrating rooms:', error);
    throw error;
  }

  console.log(`✅ Migrated ${data.length} rooms`);
  return data;
}

async function migrateGuests() {
  console.log('\n👥 Migrating Guests...');
  
  const bookings = readJSONFile('bookings.json');
  
  // Extract unique guests from bookings
  const guestMap = new Map();
  
  bookings.forEach(booking => {
    const key = booking.guestPhone || booking.guestName;
    if (!guestMap.has(key)) {
      guestMap.set(key, {
        id: generateUUID(),
        tenant_id: DEFAULT_TENANT_ID,
        full_name: booking.guestName,
        phone: booking.guestPhone || `+9198765${Math.floor(Math.random() * 100000)}`,
        email: booking.guestEmail || null,
        id_type: booking.guestIdType || null,
        id_number: booking.guestIdNumber || null,
        address: booking.guestAddress ? { street: booking.guestAddress } : null,
        total_bookings: 1
      });
    } else {
      const guest = guestMap.get(key);
      guest.total_bookings += 1;
    }
  });

  const guestsToInsert = Array.from(guestMap.values());
  console.log(`Found ${guestsToInsert.length} unique guests`);

  const { data, error } = await supabase
    .from('guests')
    .upsert(guestsToInsert)
    .select();

  if (error) {
    console.error('❌ Error migrating guests:', error);
    throw error;
  }

  console.log(`✅ Migrated ${data.length} guests`);
  return data;
}

async function migrateBookings() {
  console.log('\n📅 Migrating Bookings...');
  
  const bookings = readJSONFile('bookings.json');
  const rooms = await supabase.from('rooms').select('*').eq('tenant_id', DEFAULT_TENANT_ID);
  const guests = await supabase.from('guests').select('*').eq('tenant_id', DEFAULT_TENANT_ID);

  console.log(`Found ${bookings.length} bookings in JSON`);

  const bookingsToInsert = bookings.map(booking => {
    // Find room by number
    const room = rooms.data.find(r => r.room_number === booking.roomId);
    // Find guest by phone or name
    const guest = guests.data.find(g => 
      g.phone === booking.guestPhone || g.full_name === booking.guestName
    );

    if (!room || !guest) {
      console.warn(`⚠️ Skipping booking ${booking.id}: room or guest not found`);
      return null;
    }

    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    return {
      id: generateUUID(),
      tenant_id: DEFAULT_TENANT_ID,
      room_id: room.id,
      guest_id: guest.id,
      check_in: booking.checkInDate,
      check_out: booking.checkOutDate,
      actual_check_in: booking.checkInTime ? new Date(booking.checkInTime).toISOString() : null,
      actual_check_out: booking.checkOutTime ? new Date(booking.checkOutTime).toISOString() : null,
      number_of_guests: booking.numberOfGuests || 1,
      room_rate: parseFloat(booking.roomRate) || parseFloat(room.base_price),
      number_of_nights: nights,
      subtotal: parseFloat(booking.subtotal) || 0,
      taxes: parseFloat(booking.cgst || 0) + parseFloat(booking.sgst || 0),
      discount: parseFloat(booking.discount) || 0,
      total_amount: parseFloat(booking.totalAmount) || 0,
      status: booking.status || 'CONFIRMED',
      payment_status: booking.advancePayment > 0 ? 'PARTIAL' : 'UNPAID',
      special_requests: booking.specialRequests || null
    };
  }).filter(Boolean);

  const { data, error } = await supabase
    .from('bookings')
    .upsert(bookingsToInsert)
    .select();

  if (error) {
    console.error('❌ Error migrating bookings:', error);
    throw error;
  }

  console.log(`✅ Migrated ${data.length} bookings`);
  return data;
}

async function migrateFolioLines() {
  console.log('\n💰 Migrating Folio Lines...');
  
  const folioLines = readJSONFile('folioLines.json');
  const bookings = await supabase.from('bookings').select('*').eq('tenant_id', DEFAULT_TENANT_ID);

  console.log(`Found ${folioLines.length} folio lines in JSON`);

  const folioLinesToInsert = folioLines.map(line => {
    const booking = bookings.data.find(b => b.id === line.bookingId);
    
    if (!booking) {
      console.warn(`⚠️ Skipping folio line: booking not found`);
      return null;
    }

    return {
      id: generateUUID(),
      tenant_id: DEFAULT_TENANT_ID,
      booking_id: booking.id,
      date: line.date || new Date().toISOString().split('T')[0],
      description: line.description,
      category: line.category || 'misc',
      quantity: parseFloat(line.quantity) || 1,
      unit_price: parseFloat(line.price) || 0,
      amount: parseFloat(line.amount) || 0,
      type: 'charge'
    };
  }).filter(Boolean);

  if (folioLinesToInsert.length === 0) {
    console.log('⚠️ No folio lines to migrate');
    return [];
  }

  const { data, error } = await supabase
    .from('folio_lines')
    .upsert(folioLinesToInsert)
    .select();

  if (error) {
    console.error('❌ Error migrating folio lines:', error);
    throw error;
  }

  console.log(`✅ Migrated ${data.length} folio lines`);
  return data;
}

async function migrateHousekeepingTasks() {
  console.log('\n🧹 Migrating Housekeeping Tasks...');
  
  const tasks = readJSONFile('housekeeping.json');
  const rooms = await supabase.from('rooms').select('*').eq('tenant_id', DEFAULT_TENANT_ID);

  console.log(`Found ${tasks.length} housekeeping tasks in JSON`);

  const tasksToInsert = tasks.map(task => {
    const room = rooms.data.find(r => r.room_number === task.roomId);
    
    if (!room) {
      console.warn(`⚠️ Skipping task: room ${task.roomId} not found`);
      return null;
    }

    return {
      id: generateUUID(),
      tenant_id: DEFAULT_TENANT_ID,
      room_id: room.id,
      task_type: 'cleaning',
      priority: task.priority || 'normal',
      status: task.status || 'PENDING',
      assigned_to: null, // Will be linked to users later
      start_time: task.startTime || null,
      end_time: task.endTime || null,
      notes: task.notes || null
    };
  }).filter(Boolean);

  const { data, error } = await supabase
    .from('housekeeping_tasks')
    .upsert(tasksToInsert)
    .select();

  if (error) {
    console.error('❌ Error migrating housekeeping tasks:', error);
    throw error;
  }

  console.log(`✅ Migrated ${data.length} housekeeping tasks`);
  return data;
}

async function migrateItems() {
  console.log('\n🍽️ Migrating Items...');
  
  const items = readJSONFile('items.json');
  console.log(`Found ${items.length} items in JSON`);

  const itemsToInsert = items.map(item => ({
    id: generateUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    name: item.name,
    description: item.description || null,
    category: item.category || 'food',
    price: parseFloat(item.price) || 0,
    stock_quantity: item.quantity || 0,
    is_available: item.available !== false
  }));

  const { data, error } = await supabase
    .from('items')
    .upsert(itemsToInsert)
    .select();

  if (error) {
    console.error('❌ Error migrating items:', error);
    throw error;
  }

  console.log(`✅ Migrated ${data.length} items`);
  return data;
}

// ═══════════════════════════════════════════════════════════
// MAIN MIGRATION FUNCTION
// ═══════════════════════════════════════════════════════════

async function runMigration() {
  console.log('🚀 Starting migration from JSON to PostgreSQL...\n');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // Check connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Cannot connect to Supabase. Please check your credentials.');
      console.error('Error:', healthError.message);
      process.exit(1);
    }

    console.log('✅ Connected to Supabase\n');

    // Run migrations in order (respecting foreign keys)
    await migrateTenant();
    const rooms = await migrateRooms();
    const guests = await migrateGuests();
    const bookings = await migrateBookings();
    await migrateFolioLines();
    await migrateHousekeepingTasks();
    await migrateItems();

    console.log('\n═══════════════════════════════════════════════');
    console.log('🎉 Migration completed successfully!');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('Summary:');
    console.log(`- Rooms: ${rooms.length}`);
    console.log(`- Guests: ${guests.length}`);
    console.log(`- Bookings: ${bookings.length}`);
    console.log('\n✅ All data migrated to PostgreSQL!');
    console.log('🔗 View in Supabase: ' + SUPABASE_URL);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
