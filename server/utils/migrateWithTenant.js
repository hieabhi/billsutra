/**
 * Migrate JSON data to Supabase with specific tenant_id
 * Run this AFTER creating the tenant in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const DATA_DIR = path.join(__dirname, '../data');

// IMPORTANT: Set this to match the tenant ID in your Supabase database
const TENANT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Demo Hotel

const readJSON = (filename) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
};

const migrateRooms = async () => {
  console.log('\n📦 Migrating Rooms...');
  const rooms = readJSON('rooms.json');
  
  for (const room of rooms) {
    const { error } = await supabase.from('rooms').insert({
      tenant_id: TENANT_ID,
      room_number: room.number,
      room_type: room.type || 'Standard',
      base_price: parseFloat(room.rate) || 0,
      status: room.status || 'AVAILABLE',
      housekeeping_status: room.housekeepingStatus || 'CLEAN'
    });
    
    if (error) console.error(`  ✗ Room ${room.number}:`, error.message);
    else console.log(`  ✓ Room ${room.number}`);
  }
};

const migrateItems = async () => {
  console.log('\n📦 Migrating Items...');
  const items = readJSON('items.json');
  
  for (const item of items) {
    const { error } = await supabase.from('items').insert({
      tenant_id: TENANT_ID,
      name: item.name,
      category: item.category || 'Other',
      price: parseFloat(item.rate) || 0,
      hsn: item.hsn || '',
      cgst: parseFloat(item.cgst) || 0,
      sgst: parseFloat(item.sgst) || 0,
      igst: parseFloat(item.igst) || 0,
      description: item.description || '',
      is_active: item.isActive !== false
    });
    
    if (error) console.error(`  ✗ Item ${item.name}:`, error.message);
    else console.log(`  ✓ Item ${item.name}`);
  }
};

const migrateCustomers = async () => {
  console.log('\n📦 Migrating Customers...');
  const customers = readJSON('customers.json');
  
  for (const customer of customers) {
    const { error } = await supabase.from('customers').insert({
      tenant_id: TENANT_ID,
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      id_proof_type: customer.idProofType || '',
      id_proof_number: customer.idProofNumber || '',
      gstin: customer.gstin || ''
    });
    
    if (error) console.error(`  ✗ Customer ${customer.name}:`, error.message);
    else console.log(`  ✓ Customer ${customer.name}`);
  }
};

const migrate = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('  BillSutra Data Migration to Supabase');
  console.log('  Tenant ID:', TENANT_ID);
  console.log('='.repeat(60));

  try {
    // Verify tenant exists
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', TENANT_ID)
      .single();

    if (error || !tenant) {
      console.error('\n❌ ERROR: Tenant not found in database!');
      console.log('\nPlease run add_demo_tenant.sql in Supabase first.');
      process.exit(1);
    }

    console.log(`\n✓ Found tenant: ${tenant.name}`);

    await migrateRooms();
    await migrateItems();
    await migrateCustomers();

    console.log('\n' + '='.repeat(60));
    console.log('  ✅ Migration Complete!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
