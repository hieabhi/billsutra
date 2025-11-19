import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAllData() {
  console.log('🔍 CHECKING ALL SUPABASE DATA...\n');
  
  const tables = ['tenants', 'users', 'rooms', 'items', 'customers', 'bookings', 'bills', 'housekeeping'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${count} records`);
      if (count > 0 && count <= 5) {
        console.log(`   Sample:`, JSON.stringify(data.slice(0, 2), null, 2));
      }
    }
  }
  
  // Check specific tenant data
  console.log('\n🏨 CHECKING TENANT DATA (f47ac10b-58cc-4372-a567-0e02b2c3d479)...\n');
  
  const tenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const tenantTables = ['rooms', 'items', 'customers', 'bookings', 'bills', 'housekeeping'];
  
  for (const table of tenantTables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`✅ ${table} (tenant): ${count} records`);
    }
  }
}

checkAllData().catch(console.error);
