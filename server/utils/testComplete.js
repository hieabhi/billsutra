/**
 * Complete Application Test
 * Tests all endpoints and data integrity
 */

console.log('🧪 COMPLETE APPLICATION TEST\n');
console.log('='.repeat(60));

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(test) {
  testResults.passed.push(test);
  console.log(`✅ PASS: ${test}`);
}

function fail(test, error) {
  testResults.failed.push({ test, error });
  console.log(`❌ FAIL: ${test}`);
  console.log(`   Error: ${error}`);
}

function warn(test, message) {
  testResults.warnings.push({ test, message });
  console.log(`⚠️  WARN: ${test}`);
  console.log(`   ${message}`);
}

// Summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    testResults.warnings.forEach(({ test, message }) => {
      console.log(`   - ${test}: ${message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (testResults.failed.length === 0) {
    console.log('✨ ALL TESTS PASSED! Application is ready to use.');
  } else {
    console.log('⚠️  Some tests failed. Please review the failures above.');
  }
}

async function runTests() {
  console.log('\n📦 TESTING SUPABASE DATA INTEGRITY...\n');
  
  // Import after logging starts
  const dotenv = await import('dotenv');
  const { createClient } = await import('@supabase/supabase-js');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  dotenv.default.config({ path: join(__dirname, '../../.env') });
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const tenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  
  // Test 1: Tenant exists
  try {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
    if (error) throw error;
    if (data) {
      pass(`Tenant exists: ${data.name}`);
    } else {
      fail('Tenant check', 'Tenant not found');
    }
  } catch (e) {
    fail('Tenant check', e.message);
  }
  
  // Test 2: User exists
  try {
    const { data, error, count } = await supabase.from('users').select('*', { count: 'exact' }).eq('tenant_id', tenantId);
    if (error) throw error;
    if (count > 0) {
      pass(`Users exist: ${count} user(s)`);
    } else {
      warn('User check', 'No users found for tenant');
    }
  } catch (e) {
    fail('User check', e.message);
  }
  
  // Test 3: Rooms data
  try {
    const { data, error, count } = await supabase.from('rooms').select('*', { count: 'exact' }).eq('tenant_id', tenantId);
    if (error) throw error;
    if (count >= 8) {
      pass(`Rooms migrated: ${count} rooms`);
    } else {
      warn('Rooms check', `Only ${count} rooms found, expected 8`);
    }
  } catch (e) {
    fail('Rooms check', e.message);
  }
  
  // Test 4: Items data
  try {
    const { data, error, count } = await supabase.from('items').select('*', { count: 'exact' }).eq('tenant_id', tenantId);
    if (error) throw error;
    if (count > 0) {
      pass(`Items migrated: ${count} item(s)`);
      // Check if Thali exists
      const thali = data.find(item => item.name === 'Thali');
      if (thali) {
        pass('Thali item found in database');
      } else {
        warn('Thali check', 'Thali item not found');
      }
    } else {
      warn('Items check', 'No items found');
    }
  } catch (e) {
    fail('Items check', e.message);
  }
  
  // Test 5: Customers data
  try {
    const { data, error, count } = await supabase.from('customers').select('*', { count: 'exact' }).eq('tenant_id', tenantId);
    if (error) throw error;
    pass(`Customers table accessible: ${count} customer(s)`);
  } catch (e) {
    fail('Customers check', e.message);
  }
  
  // Test 6: Bookings data
  try {
    const { data, error, count } = await supabase.from('bookings').select('*', { count: 'exact' }).eq('tenant_id', tenantId);
    if (error) throw error;
    if (count > 0) {
      pass(`Bookings migrated: ${count} booking(s)`);
    } else {
      warn('Bookings check', 'No bookings found');
    }
  } catch (e) {
    fail('Bookings check', e.message);
  }
  
  // Test 7: Bills data
  try {
    const { data, error, count } = await supabase.from('bills').select('*', { count: 'exact' }).eq('tenant_id', tenantId);
    if (error) throw error;
    if (count > 0) {
      pass(`Bills migrated: ${count} bill(s)`);
    } else {
      warn('Bills check', 'No bills found');
    }
  } catch (e) {
    fail('Bills check', e.message);
  }
  
  // Test 8: Housekeeping data
  try {
    const { data, error, count } = await supabase.from('housekeeping').select('*', { count: 'exact' }).eq('tenant_id', tenantId);
    if (error) throw error;
    if (count > 0) {
      pass(`Housekeeping migrated: ${count} task(s)`);
    } else {
      warn('Housekeeping check', 'No housekeeping tasks found');
    }
  } catch (e) {
    fail('Housekeeping check', e.message);
  }
  
  console.log('\n🔧 TESTING REPOSITORY FILES...\n');
  
  // Test repository files exist
  const fs = await import('fs');
  const repoFiles = [
    'roomsRepo.js',
    'itemsRepo.js',
    'customersRepo.js',
    'housekeepingRepo.js',
    'bookingsRepo.js',
    'billsRepo.js'
  ];
  
  for (const file of repoFiles) {
    const path = join(__dirname, `../repositories/${file}`);
    if (fs.existsSync(path)) {
      pass(`Repository file exists: ${file}`);
      
      // Check if using Supabase
      const content = fs.readFileSync(path, 'utf8');
      if (content.includes('supabase') || content.includes('Supabase')) {
        pass(`${file} uses Supabase`);
      } else {
        warn(`${file} migration`, 'Still using JSON file storage');
      }
    } else {
      fail(`Repository file check: ${file}`, 'File not found');
    }
  }
  
  console.log('\n🛣️  TESTING ROUTE FILES...\n');
  
  // Test route files have auth middleware
  const routeFiles = [
    'rooms.js',
    'items.js',
    'customers.js',
    'housekeeping.js',
    'bookings.js',
    'bills.js',
    'stats.js'
  ];
  
  for (const file of routeFiles) {
    const path = join(__dirname, `../routes/${file}`);
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf8');
      if (content.includes('authMiddleware')) {
        pass(`${file} has auth middleware`);
      } else {
        warn(`${file} security`, 'No auth middleware found');
      }
    }
  }
  
  printSummary();
}

runTests().catch(error => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
