import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

function readJSON(filename) {
  const filePath = path.join(__dirname, '..', 'server', 'data', filename);
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function migrate() {
  console.log('\n🚀 Starting migration...\n');

  // Migrate Rooms
  console.log('📦 Migrating rooms...');
  const rooms = readJSON('rooms.json');
  const roomsData = rooms.map(r => ({
    id: uuid(),
    tenant_id: TENANT_ID,
    room_number: r.number,
    room_type: r.type || 'standard',
    base_price: parseFloat(r.price) || 1000,
    max_occupancy: r.capacity || 2,
    status: r.status || 'AVAILABLE',
    housekeeping_status: r.housekeepingStatus || 'CLEAN'
  }));
  
  const { data: insertedRooms, error: roomsError } = await supabase
    .from('rooms')
    .upsert(roomsData)
    .select();
  
  if (roomsError) throw roomsError;
  console.log(`✅ Migrated ${insertedRooms.length} rooms\n`);

  // Migrate Items
  console.log('📦 Migrating items...');
  const items = readJSON('items.json');
  const itemsData = items.map(i => ({
    id: uuid(),
    tenant_id: TENANT_ID,
    name: i.name,
    category: i.category || 'food',
    price: parseFloat(i.price) || 0,
    is_available: true
  }));
  
  const { data: insertedItems, error: itemsError } = await supabase
    .from('items')
    .upsert(itemsData)
    .select();
  
  if (itemsError) throw itemsError;
  console.log(`✅ Migrated ${insertedItems.length} items\n`);

  console.log('🎉 Migration complete!\n');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
