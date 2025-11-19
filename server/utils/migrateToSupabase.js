/**
 * BillSutra JSON to Supabase Migration Utility
 * Migrates all operational data from JSON files to Supabase PostgreSQL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(__dirname, '../data/backups');

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.blue}▶ ${msg}${colors.reset}`)
};

// Read JSON file safely
const readJSON = (filename) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      log.warning(`File not found: ${filename}`);
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log.error(`Error reading ${filename}: ${error.message}`);
    return [];
  }
};

// Create backup of JSON files
const createBackup = () => {
  log.step('Creating backup of JSON files...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `migration_backup_${timestamp}`);
  fs.mkdirSync(backupPath, { recursive: true });

  const files = ['rooms.json', 'customers.json', 'bookings.json', 'bills.json', 'items.json', 'settings.json'];
  
  files.forEach(file => {
    const sourcePath = path.join(DATA_DIR, file);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(backupPath, file);
      fs.copyFileSync(sourcePath, destPath);
      log.success(`Backed up ${file}`);
    }
  });

  log.success(`Backup created at: ${backupPath}`);
  return backupPath;
};

// Get tenant ID from users table
const getTenantId = async () => {
  log.step('Fetching tenant information...');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('tenant_id')
    .limit(1);

  if (error) {
    log.error(`Error fetching tenant: ${error.message}`);
    throw error;
  }

  if (!users || users.length === 0) {
    log.error('No users found. Please ensure you have users in the database.');
    throw new Error('No tenant found');
  }

  const tenantId = users[0].tenant_id;
  log.success(`Using tenant ID: ${tenantId}`);
  return tenantId;
};

// Migrate rooms
const migrateRooms = async (tenantId) => {
  log.step('Migrating rooms...');
  
  const rooms = readJSON('rooms.json');
  if (rooms.length === 0) {
    log.warning('No rooms to migrate');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const room of rooms) {
    const roomData = {
      tenant_id: tenantId,
      number: room.number,
      type: room.type,
      floor: room.floor || null,
      rate: parseFloat(room.rate) || 0,
      status: room.status || 'AVAILABLE',
      housekeeping_status: room.housekeepingStatus || 'CLEAN',
      amenities: room.amenities || [],
      notes: room.notes || null
    };

    const { error } = await supabase
      .from('rooms')
      .upsert(roomData, { onConflict: 'tenant_id,number' });

    if (error) {
      log.error(`Failed to migrate room ${room.number}: ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  log.success(`Rooms: ${successCount} migrated, ${errorCount} errors`);
};

// Migrate customers
const migrateCustomers = async (tenantId) => {
  log.step('Migrating customers...');
  
  const customers = readJSON('customers.json');
  if (customers.length === 0) {
    log.warning('No customers to migrate');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const customer of customers) {
    const customerData = {
      tenant_id: tenantId,
      name: customer.name,
      phone: customer.phone || null,
      email: customer.email || null,
      id_proof: customer.idProof || null,
      id_proof_number: customer.idProofNumber || null,
      address: customer.address || null,
      city: customer.city || null,
      state: customer.state || null,
      country: customer.country || 'India',
      notes: customer.notes || null
    };

    const { error } = await supabase
      .from('customers')
      .insert(customerData);

    if (error) {
      log.error(`Failed to migrate customer ${customer.name}: ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  log.success(`Customers: ${successCount} migrated, ${errorCount} errors`);
};

// Migrate bookings
const migrateBookings = async (tenantId) => {
  log.step('Migrating bookings...');
  
  const bookings = readJSON('bookings.json');
  if (bookings.length === 0) {
    log.warning('No bookings to migrate');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const booking of bookings) {
    // Get room_id from room_number
    const { data: roomData } = await supabase
      .from('rooms')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('number', booking.roomNumber)
      .single();

    const bookingData = {
      tenant_id: tenantId,
      reservation_number: booking.reservationNumber,
      room_id: roomData?.id || null,
      room_number: booking.roomNumber,
      guest_name: booking.guestName,
      guest_phone: booking.guestPhone || null,
      guest_email: booking.guestEmail || null,
      guest_id_proof: booking.guestIdProof || null,
      guest_address: booking.guestAddress || null,
      guest_counts: booking.guestCounts || { adults: 1, children: 0, infants: 0 },
      additional_guests: booking.additionalGuests || [],
      check_in_date: booking.checkInDate,
      check_out_date: booking.checkOutDate,
      actual_check_in_date: booking.actualCheckInDate || null,
      actual_check_out_date: booking.actualCheckOutDate || null,
      nights: booking.nights,
      amount: parseFloat(booking.amount) || 0,
      advance_payment: parseFloat(booking.advancePayment) || 0,
      status: booking.status || 'Reserved',
      booking_source: booking.bookingSource || 'Walk-in',
      payment_method: booking.paymentMethod || 'Cash',
      special_requests: booking.specialRequests || null,
      folio: booking.folio || { lines: [], balance: 0 },
      bill_id: null,
      bill_number: booking.billNumber || null
    };

    const { error } = await supabase
      .from('bookings')
      .upsert(bookingData, { onConflict: 'tenant_id,reservation_number' });

    if (error) {
      log.error(`Failed to migrate booking ${booking.reservationNumber}: ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  log.success(`Bookings: ${successCount} migrated, ${errorCount} errors`);
};

// Migrate bills
const migrateBills = async (tenantId) => {
  log.step('Migrating bills...');
  
  const bills = readJSON('bills.json');
  if (bills.length === 0) {
    log.warning('No bills to migrate');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const bill of bills) {
    const billData = {
      tenant_id: tenantId,
      bill_number: bill.billNumber,
      date: bill.date || new Date().toISOString(),
      customer_name: bill.customer?.name || 'Guest',
      customer_phone: bill.customer?.phone || null,
      customer_email: bill.customer?.email || null,
      customer_id_proof: bill.customer?.idProof || null,
      customer_address: bill.customer?.address || null,
      items: bill.items || [],
      subtotal: parseFloat(bill.subtotal) || 0,
      cgst_total: parseFloat(bill.cgstTotal) || 0,
      sgst_total: parseFloat(bill.sgstTotal) || 0,
      igst_total: parseFloat(bill.igstTotal) || 0,
      total_tax: parseFloat(bill.totalTax) || 0,
      grand_total: parseFloat(bill.grandTotal) || 0,
      payment_method: bill.paymentMethod || 'Cash',
      status: bill.status || 'Paid',
      advance_payment: parseFloat(bill.advancePayment) || 0,
      balance_due: parseFloat(bill.balanceDue) || 0,
      check_in_date: bill.checkInDate || null,
      check_out_date: bill.checkOutDate || null,
      nights: bill.nights || 0,
      notes: bill.notes || null
    };

    const { error } = await supabase
      .from('bills')
      .upsert(billData, { onConflict: 'tenant_id,bill_number' });

    if (error) {
      log.error(`Failed to migrate bill ${bill.billNumber}: ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  log.success(`Bills: ${successCount} migrated, ${errorCount} errors`);
};

// Migrate items
const migrateItems = async (tenantId) => {
  log.step('Migrating items/menu...');
  
  const items = readJSON('items.json');
  if (items.length === 0) {
    log.warning('No items to migrate');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    const itemData = {
      tenant_id: tenantId,
      name: item.name,
      category: item.category || null,
      rate: parseFloat(item.rate) || 0,
      hsn: item.hsn || null,
      cgst: parseFloat(item.cgst) || 0,
      sgst: parseFloat(item.sgst) || 0,
      igst: parseFloat(item.igst) || 0,
      description: item.description || null,
      is_active: item.isActive !== false
    };

    const { error } = await supabase
      .from('items')
      .upsert(itemData, { onConflict: 'tenant_id,name' });

    if (error) {
      log.error(`Failed to migrate item ${item.name}: ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  log.success(`Items: ${successCount} migrated, ${errorCount} errors`);
};

// Migrate settings
const migrateSettings = async (tenantId) => {
  log.step('Migrating hotel settings...');
  
  const settings = readJSON('settings.json');
  if (!settings || Object.keys(settings).length === 0) {
    log.warning('No settings to migrate');
    return;
  }

  const settingsData = {
    tenant_id: tenantId,
    hotel_name: settings.hotelName || null,
    invoice_prefix: settings.invoicePrefix || 'INV',
    next_bill_number: settings.nextBillNumber || 1,
    next_reservation_number: settings.nextReservationNumber || 1,
    tax_settings: settings.taxSettings || { cgst: 6, sgst: 6, igst: 12 },
    address: settings.address || {},
    contact: settings.contact || {},
    logo_url: settings.logoUrl || null,
    settings: settings
  };

  const { error } = await supabase
    .from('hotel_settings')
    .upsert(settingsData, { onConflict: 'tenant_id' });

  if (error) {
    log.error(`Failed to migrate settings: ${error.message}`);
  } else {
    log.success('Settings migrated successfully');
  }
};

// Main migration function
const runMigration = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('  BillSutra JSON → Supabase PostgreSQL Migration');
  console.log('='.repeat(60) + '\n');

  try {
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      log.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
      process.exit(1);
    }

    // Create backup
    const backupPath = createBackup();
    
    // Get tenant ID
    const tenantId = await getTenantId();

    // Run migrations in order
    await migrateRooms(tenantId);
    await migrateCustomers(tenantId);
    await migrateItems(tenantId);
    await migrateBookings(tenantId);
    await migrateBills(tenantId);
    await migrateSettings(tenantId);

    console.log('\n' + '='.repeat(60));
    log.success('Migration completed successfully! 🎉');
    console.log('='.repeat(60) + '\n');

    log.info(`Backup saved at: ${backupPath}`);
    log.info('Next steps:');
    log.info('1. Verify data in Supabase dashboard');
    log.info('2. Update repositories to use Supabase');
    log.info('3. Test application functionality');
    log.info('4. Remove JSON files once verified\n');

  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Run migration
runMigration();
