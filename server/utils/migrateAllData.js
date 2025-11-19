import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const TENANT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

async function migrateAllData() {
  try {
    console.log('🚀 Starting complete data migration to Supabase...\n');

    // Read all JSON files
    const dataDir = path.resolve(__dirname, '../data');
    const items = JSON.parse(fs.readFileSync(path.join(dataDir, 'items.json'), 'utf8'));
    const bookings = JSON.parse(fs.readFileSync(path.join(dataDir, 'bookings.json'), 'utf8'));
    const bills = JSON.parse(fs.readFileSync(path.join(dataDir, 'bills.json'), 'utf8'));
    const housekeeping = JSON.parse(fs.readFileSync(path.join(dataDir, 'housekeeping.json'), 'utf8'));
    const customers = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf8'));

    console.log(`📊 Data to migrate:`);
    console.log(`   Items: ${items.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log(`   Bills: ${bills.length}`);
    console.log(`   Housekeeping: ${housekeeping.length}\n`);

    // 1. Migrate Items
    if (items.length > 0) {
      console.log('📦 Migrating items...');
      const itemsData = items.map(item => ({
        id: item._id,
        tenant_id: TENANT_ID,
        name: item.name,
        category: item.category || null,
        price: parseFloat(item.rate || item.price || 0),
        hsn: item.hsn || null,
        cgst: parseFloat(item.cgst || 0),
        sgst: parseFloat(item.sgst || 0),
        igst: parseFloat(item.igst || 0),
        description: item.description || null,
        is_active: item.isActive !== false,
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: item.updatedAt || new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('items')
        .upsert(itemsData, { onConflict: 'id' });

      if (error) {
        console.error('❌ Items migration failed:', error.message);
      } else {
        console.log(`✅ Migrated ${itemsData.length} items`);
      }
    }

    // 2. Migrate Customers
    if (customers.length > 0) {
      console.log('👥 Migrating customers...');
      const customersData = customers.map(customer => ({
        id: customer._id,
        tenant_id: TENANT_ID,
        name: customer.name,
        phone: customer.phone || null,
        email: customer.email || null,
        address: customer.address || null,
        id_proof_type: customer.idProofType || null,
        id_proof_number: customer.idProofNumber || null,
        gstin: customer.gstNumber || customer.gstin || null,
        created_at: customer.createdAt || new Date().toISOString(),
        updated_at: customer.updatedAt || new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('customers')
        .upsert(customersData, { onConflict: 'id' });

      if (error) {
        console.error('❌ Customers migration failed:', error.message);
      } else {
        console.log(`✅ Migrated ${customersData.length} customers`);
      }
    }

    // 3. Get room mappings (JSON room IDs to Supabase room IDs)
    console.log('🏠 Fetching room mappings...');
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_number')
      .eq('tenant_id', TENANT_ID);

    if (roomsError) {
      console.error('❌ Failed to fetch rooms:', roomsError.message);
      return;
    }

    const roomMap = {};
    rooms.forEach(room => {
      roomMap[room.room_number] = room.id;
    });

    // 4. Migrate Bookings
    if (bookings.length > 0) {
      console.log('📅 Migrating bookings...');
      const bookingsData = bookings.map(booking => ({
        id: booking._id,
        tenant_id: TENANT_ID,
        room_id: roomMap[booking.roomNumber] || null,
        guest_id: null, // Will link if customer exists
        check_in_date: booking.checkInDate,
        check_out_date: booking.checkOutDate,
        status: booking.status || 'Reserved',
        adults: booking.guestsCount || 1,
        children: 0,
        total_amount: parseFloat(booking.amount || 0),
        paid_amount: parseFloat(booking.folio?.total || booking.amount || 0) - parseFloat(booking.folio?.balance || booking.balance || 0),
        notes: booking.notes || `Guest: ${booking.guest?.name || 'Unknown'}`,
        created_at: booking.createdAt || new Date().toISOString(),
        updated_at: booking.updatedAt || new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('bookings')
        .upsert(bookingsData, { onConflict: 'id' });

      if (error) {
        console.error('❌ Bookings migration failed:', error.message);
      } else {
        console.log(`✅ Migrated ${bookingsData.length} bookings`);
      }
    }

    // 5. Migrate Bills
    if (bills.length > 0) {
      console.log('🧾 Migrating bills...');
      
      // First, get customer mappings if we have customers
      let customerMap = {};
      if (customers.length > 0) {
        const { data: dbCustomers } = await supabase
          .from('customers')
          .select('id, phone')
          .eq('tenant_id', TENANT_ID);
        
        dbCustomers?.forEach(c => {
          if (c.phone) customerMap[c.phone] = c.id;
        });
      }

      const billsData = bills.map(bill => ({
        id: bill._id,
        tenant_id: TENANT_ID,
        booking_id: null, // Will link if booking exists
        customer_id: bill.customer?.phone ? customerMap[bill.customer.phone] : null,
        bill_number: bill.billNumber,
        bill_date: bill.date || bill.createdAt || new Date().toISOString(),
        items: JSON.stringify(bill.items || []),
        subtotal: parseFloat(bill.subtotal || 0),
        cgst_amount: parseFloat(bill.cgstTotal || 0),
        sgst_amount: parseFloat(bill.sgstTotal || 0),
        igst_amount: parseFloat(bill.igstTotal || 0),
        total_amount: parseFloat(bill.grandTotal || bill.totalAmount || 0),
        payment_method: bill.paymentMethod || 'Cash',
        payment_status: bill.status === 'Paid' ? 'PAID' : 'PENDING',
        created_at: bill.createdAt || new Date().toISOString(),
        updated_at: bill.updatedAt || new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('bills')
        .upsert(billsData, { onConflict: 'id' });

      if (error) {
        console.error('❌ Bills migration failed:', error.message);
      } else {
        console.log(`✅ Migrated ${billsData.length} bills`);
      }
    }

    // 6. Migrate Housekeeping
    if (housekeeping.length > 0) {
      console.log('🧹 Migrating housekeeping tasks...');
      const housekeepingData = housekeeping.map(task => ({
        id: task._id,
        tenant_id: TENANT_ID,
        room_id: roomMap[task.roomNumber] || null,
        task_type: task.type || 'CLEANING',
        priority: task.priority || 'MEDIUM',
        assigned_to: task.assignedTo || null,
        status: task.status || 'PENDING',
        notes: task.description || task.notes || null,
        created_at: task.createdAt || new Date().toISOString(),
        updated_at: task.updatedAt || new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('housekeeping')
        .upsert(housekeepingData, { onConflict: 'id' });

      if (error) {
        console.error('❌ Housekeeping migration failed:', error.message);
      } else {
        console.log(`✅ Migrated ${housekeepingData.length} housekeeping tasks`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Final counts in Supabase:');
    
    // Verify counts
    const { count: itemsCount } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
    const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
    const { count: bookingsCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
    const { count: billsCount } = await supabase.from('bills').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
    const { count: housekeepingCount } = await supabase.from('housekeeping').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
    
    console.log(`   Items: ${itemsCount}`);
    console.log(`   Customers: ${customersCount}`);
    console.log(`   Bookings: ${bookingsCount}`);
    console.log(`   Bills: ${billsCount}`);
    console.log(`   Housekeeping: ${housekeepingCount}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

migrateAllData();
