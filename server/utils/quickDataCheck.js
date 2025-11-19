import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkData() {
  const tenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  
  console.log('\n=== SUPABASE DATA CHECK ===\n');
  
  const tables = ['rooms', 'items', 'customers', 'bookings', 'bills', 'housekeeping'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    console.log(`${table.toUpperCase()}: ${data?.length || 0} records`);
    if (error) console.error(`  Error: ${error.message}`);
    if (data && data.length > 0) {
      console.log(`  Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
    }
  }
  
  process.exit(0);
}

checkData();
