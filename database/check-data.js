import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkData() {
  console.log('\n📊 Checking migrated data...\n');

  const tables = ['tenants', 'rooms', 'guests', 'bookings', 'items', 'housekeeping_tasks'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.log(`❌ ${table}: ERROR -`, error.message);
    } else {
      console.log(`✅ ${table}: ${data.length} records`);
    }
  }
}

checkData();
