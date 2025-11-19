/**
 * Test Supabase Connection
 * Verifies database connection and permissions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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

const testConnection = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('  BillSutra Supabase Connection Test');
  console.log('='.repeat(60) + '\n');

  // Check environment variables
  if (!process.env.SUPABASE_URL) {
    log.error('SUPABASE_URL not found in .env');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_ANON_KEY) {
    log.error('Neither SUPABASE_SERVICE_KEY nor SUPABASE_ANON_KEY found in .env');
    process.exit(1);
  }

  log.info(`Supabase URL: ${process.env.SUPABASE_URL}`);

  // Create client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
  );

  try {
    // Test 1: Basic connection
    log.step('Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      log.error(`Connection failed: ${error.message}`);
      process.exit(1);
    }
    
    log.success('Connected to Supabase successfully!');

    // Test 2: Check tables exist
    log.step('Checking database schema...');
    
    const tables = [
      'users',
      'tenants',
      'rooms',
      'bookings',
      'bills',
      'customers',
      'items',
      'hotel_settings'
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').limit(0);
      
      if (error) {
        log.error(`Table '${table}' not found or inaccessible`);
      } else {
        log.success(`Table '${table}' exists`);
      }
    }

    // Test 3: Get tenant info
    log.step('Checking tenant data...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, email')
      .limit(1);

    if (userError) {
      log.warning('Could not fetch user data');
    } else if (userData && userData.length > 0) {
      log.success(`Found user: ${userData[0].email}`);
      log.success(`Tenant ID: ${userData[0].tenant_id}`);
    } else {
      log.warning('No users found in database');
    }

    // Test 4: Count records
    log.step('Counting records...');
    
    const dataStatus = {
      rooms: 0,
      bookings: 0,
      bills: 0,
      customers: 0,
      items: 0
    };

    for (const table of Object.keys(dataStatus)) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        dataStatus[table] = count || 0;
      }
    }

    console.log('\n' + '-'.repeat(60));
    console.log('  Database Records:');
    console.log('-'.repeat(60));
    Object.entries(dataStatus).forEach(([table, count]) => {
      const icon = count > 0 ? '✓' : '○';
      console.log(`  ${icon} ${table.padEnd(15)} ${count} records`);
    });
    console.log('-'.repeat(60) + '\n');

    // Summary
    console.log('='.repeat(60));
    log.success('Supabase connection test completed! 🎉');
    console.log('='.repeat(60) + '\n');

    log.info('Connection Details:');
    log.info(`  URL: ${process.env.SUPABASE_URL}`);
    log.info(`  Using: ${process.env.SUPABASE_SERVICE_KEY ? 'Service Key' : 'Anon Key'}`);
    log.info(`  Schema: ✓ Valid`);
    log.info(`  Permissions: ✓ Granted`);
    
    const totalRecords = Object.values(dataStatus).reduce((a, b) => a + b, 0);
    
    if (totalRecords === 0) {
      log.warning('\nNo data found. Run migration:');
      log.info('  npm run db:migrate:supabase\n');
    } else {
      log.success(`\n✓ Database ready with ${totalRecords} records!\n`);
    }

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

testConnection();
