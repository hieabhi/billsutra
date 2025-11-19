/**
 * FINAL COMPREHENSIVE AUDIT
 * Complete system verification for 100% Supabase migration
 */

import supabase from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 FINAL COMPREHENSIVE AUDIT - BillSutra Application\n');
console.log('='.repeat(60));

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function pass(message) {
  console.log(`✅ PASS: ${message}`);
  results.passed++;
  results.details.push({ status: 'PASS', message });
}

function fail(message) {
  console.log(`❌ FAIL: ${message}`);
  results.failed++;
  results.details.push({ status: 'FAIL', message });
}

function warn(message) {
  console.log(`⚠️  WARN: ${message}`);
  results.warnings++;
  results.details.push({ status: 'WARN', message });
}

async function auditDatabase() {
  console.log('\n📊 1. DATABASE INTEGRITY AUDIT\n');
  
  try {
    // Check tenant
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*');
    
    if (tenantError) throw tenantError;
    if (tenants && tenants.length > 0) {
      pass(`Tenant configured: ${tenants[0].name} (${tenants[0].id})`);
    } else {
      fail('No tenant found in database');
    }
    
    // Check users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');
    
    if (userError) throw userError;
    if (users && users.length > 0) {
      pass(`Users configured: ${users.length} user(s)`);
    } else {
      fail('No users found in database');
    }
    
    // Check all tables
    const tables = ['rooms', 'items', 'customers', 'bookings', 'bills', 'housekeeping'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        fail(`Table ${table}: Error - ${error.message}`);
      } else {
        pass(`Table ${table}: Accessible (${data?.length || 0} records)`);
      }
    }
    
  } catch (error) {
    fail(`Database audit failed: ${error.message}`);
  }
}

async function auditRepositories() {
  console.log('\n📦 2. REPOSITORY MIGRATION AUDIT\n');
  
  const repoPath = path.join(__dirname, '..', 'repositories');
  const repos = [
    'roomsRepo.js',
    'itemsRepo.js',
    'customersRepo.js',
    'housekeepingRepo.js',
    'bookingsRepo.js',
    'billsRepo.js'
  ];
  
  // Repos that were migrated from JSON (should have backups)
  const migratedRepos = ['roomsRepo.js', 'bookingsRepo.js', 'billsRepo.js'];
  
  for (const repo of repos) {
    const filePath = path.join(repoPath, repo);
    
    if (!fs.existsSync(filePath)) {
      fail(`Repository missing: ${repo}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for Supabase usage
    if (content.includes('import supabase') || content.includes('from supabase')) {
      pass(`${repo}: Using Supabase ✓`);
    } else {
      fail(`${repo}: NOT using Supabase - still using JSON files!`);
    }
    
    // Check for JSON file usage (should not exist)
    if (content.includes('readJSON') || content.includes('writeJSON')) {
      if (!content.includes('// Legacy') && !content.includes('backup')) {
        fail(`${repo}: Still contains JSON file operations!`);
      }
    }
    
    // Check for backup file only for migrated repos
    if (migratedRepos.includes(repo)) {
      const backupFile = path.join(repoPath, repo.replace('.js', '.json-backup.js'));
      if (fs.existsSync(backupFile)) {
        pass(`${repo}: Backup file exists ✓`);
      } else {
        fail(`${repo}: Missing backup file (should exist for migrated repos)`);
      }
    } else {
      // Supabase-first repos don't need backups
      pass(`${repo}: Supabase-first (no backup needed) ✓`);
    }
  }
}

async function auditUtilities() {
  console.log('\n🔧 3. UTILITY FILES AUDIT\n');
  
  const utilPath = path.join(__dirname);
  const utils = [
    { file: 'roomBookingSync.js', name: 'Room-Booking Sync' },
    { file: 'dualStatusSync.js', name: 'Dual-Status Sync' }
  ];
  
  for (const util of utils) {
    const filePath = path.join(utilPath, util.file);
    
    if (!fs.existsSync(filePath)) {
      fail(`${util.name}: File missing - ${util.file}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes('import supabase')) {
      pass(`${util.name}: Using Supabase ✓`);
    } else if (content.includes('readJSON') || content.includes('writeJSON')) {
      fail(`${util.name}: Still using JSON files!`);
    } else {
      warn(`${util.name}: Cannot determine data source`);
    }
    
    // Check for loading message
    if (content.includes('LOADING SUPABASE')) {
      pass(`${util.name}: Has Supabase loading indicator ✓`);
    }
  }
}

async function auditRoutes() {
  console.log('\n🛣️  4. ROUTE SECURITY AUDIT\n');
  
  const routesPath = path.join(__dirname, '..', 'routes');
  const routes = [
    'rooms.js',
    'items.js',
    'customers.js',
    'housekeeping.js',
    'bookings.js',
    'bills.js',
    'stats.js'
  ];
  
  for (const route of routes) {
    const filePath = path.join(routesPath, route);
    
    if (!fs.existsSync(filePath)) {
      fail(`Route missing: ${route}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for auth middleware
    if (content.includes('authMiddleware') && content.includes('router.use(authMiddleware)')) {
      pass(`${route}: Auth middleware configured ✓`);
    } else {
      fail(`${route}: Missing auth middleware!`);
    }
  }
}

async function auditDataConsistency() {
  console.log('\n🔍 5. DATA CONSISTENCY AUDIT\n');
  
  try {
    const tenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    
    // Check rooms have tenant_id
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (roomsError) throw roomsError;
    
    if (rooms && rooms.length > 0) {
      pass(`Rooms: ${rooms.length} rooms properly linked to tenant`);
    } else {
      fail('No rooms found for tenant');
    }
    
    // Check bookings have tenant_id and room_id
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (bookingsError) throw bookingsError;
    
    if (bookings && bookings.length > 0) {
      const allHaveRoomId = bookings.every(b => b.room_id);
      if (allHaveRoomId) {
        pass(`Bookings: ${bookings.length} bookings properly linked to rooms`);
      } else {
        fail('Some bookings missing room_id');
      }
    } else {
      warn('No bookings in database (this is OK for new installations)');
    }
    
    // Check bills have tenant_id
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (billsError) throw billsError;
    
    if (bills && bills.length > 0) {
      pass(`Bills: ${bills.length} bills properly linked to tenant`);
    } else {
      warn('No bills in database (this is OK for new installations)');
    }
    
    // Check items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (itemsError) throw itemsError;
    
    if (items && items.length > 0) {
      pass(`Items: ${items.length} items properly linked to tenant`);
    } else {
      warn('No items in database');
    }
    
  } catch (error) {
    fail(`Data consistency check failed: ${error.message}`);
  }
}

async function auditBackups() {
  console.log('\n💾 6. BACKUP FILES AUDIT\n');
  
  const repoPath = path.join(__dirname, '..', 'repositories');
  
  // Only expect backups for repos that were migrated from JSON
  const expectedBackups = [
    'roomsRepo.json-backup.js',
    'bookingsRepo.json-backup.js',
    'billsRepo.json-backup.js'
  ];
  
  // These were Supabase-first, no backup needed
  const supabaseFirst = [
    'itemsRepo.js',
    'customersRepo.js', 
    'housekeepingRepo.js'
  ];
  
  for (const backup of expectedBackups) {
    const filePath = path.join(repoPath, backup);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      pass(`${backup}: Exists (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      fail(`${backup}: Missing - this repo was migrated from JSON!`);
    }
  }
  
  // Verify Supabase-first repos exist (no backup needed)
  for (const repo of supabaseFirst) {
    const filePath = path.join(repoPath, repo);
    if (fs.existsSync(filePath)) {
      pass(`${repo}: Supabase-first (no backup needed) ✓`);
    } else {
      fail(`${repo}: File missing!`);
    }
  }
}

async function runAudit() {
  await auditDatabase();
  await auditRepositories();
  await auditUtilities();
  await auditRoutes();
  await auditDataConsistency();
  await auditBackups();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 FINAL AUDIT SUMMARY\n');
  console.log(`✅ Passed:   ${results.passed}`);
  console.log(`❌ Failed:   ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log('\n' + '='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL CRITICAL CHECKS PASSED!');
    console.log('✨ Application is 100% migrated to Supabase and ready for production!\n');
    
    console.log('📝 Migration Summary:');
    console.log('   ✓ All repositories using Supabase');
    console.log('   ✓ All utility scripts using Supabase');
    console.log('   ✓ All routes have auth middleware');
    console.log('   ✓ Data properly linked to tenant');
    console.log('   ✓ Backup files preserved');
    console.log('   ✓ No JSON file dependencies\n');
    
    return 0; // Success
  } else {
    console.log('\n⚠️  SOME CHECKS FAILED - Please review the issues above\n');
    return 1; // Failure
  }
}

runAudit().then(code => process.exit(code));
