/**
 * Test Supabase Connection and Setup Database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('\n🔧 Supabase Configuration Test\n');
console.log('URL:', SUPABASE_URL);
console.log('Service Key:', SUPABASE_SERVICE_KEY ? '✅ Found' : '❌ Missing');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('\n❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testConnection() {
  console.log('\n📡 Testing Supabase connection...\n');

  try {
    // Test basic query
    const { data, error } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Tables not created yet. Will create schema now...\n');
        return { tablesExist: false };
      }
      throw error;
    }

    console.log('✅ Connected to Supabase successfully!');
    console.log('✅ Tables already exist');
    return { tablesExist: true };

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    throw error;
  }
}

async function runSchema() {
  console.log('\n📋 Creating database schema...\n');

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('✅ Schema file loaded');
    console.log('\n⚠️  IMPORTANT: You need to run the schema manually in Supabase SQL Editor');
    console.log('\nSteps:');
    console.log('1. Go to https://tpbbhstshioyggintazl.supabase.co');
    console.log('2. Click "SQL Editor" in left sidebar');
    console.log('3. Click "+ New query"');
    console.log('4. Copy the entire contents of: database/schema.sql');
    console.log('5. Paste into the SQL editor');
    console.log('6. Click "Run" button');
    console.log('7. Wait for success message ✅');
    console.log('\nAfter that, run this script again to verify!\n');

  } catch (error) {
    console.error('❌ Error reading schema:', error.message);
  }
}

async function checkTables() {
  console.log('\n📊 Checking created tables...\n');

  const tables = [
    'tenants',
    'users',
    'rooms',
    'guests',
    'bookings',
    'folio_lines',
    'payments',
    'housekeeping_tasks',
    'items',
    'subscriptions',
    'audit_logs'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: NOT FOUND`);
      } else {
        console.log(`✅ ${table}: EXISTS`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ERROR`);
    }
  }
}

// Main execution
async function main() {
  try {
    const { tablesExist } = await testConnection();

    if (!tablesExist) {
      await runSchema();
    } else {
      await checkTables();
      console.log('\n🎉 Database is ready!');
      console.log('\n📝 Next steps:');
      console.log('1. Setup Firebase Authentication');
      console.log('2. Run migration: node database/migrate-json-to-postgres.js');
      console.log('3. Start building auth UI\n');
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

main();
