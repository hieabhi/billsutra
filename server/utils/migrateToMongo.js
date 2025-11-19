import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import models
import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';
import Item from '../models/Item.js';
import Room from '../models/Room.js';
import Settings from '../models/Settings.js';

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(__dirname, '..', 'data_backup_' + Date.now());

const MONGODB_URI = process.env.MONGODB_URI;

console.log('\n🔄 MongoDB Data Migration Utility\n');
console.log('='.repeat(60));

if (!MONGODB_URI) {
  console.log('❌ ERROR: MONGODB_URI not found in .env file');
  console.log('   Run: node utils/testMongoConnection.js first');
  process.exit(1);
}

// Helper to read JSON file
const readJSON = (filename) => {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  ${filename} not found, skipping...`);
    return [];
  }
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.log(`❌ Error reading ${filename}:`, error.message);
    return [];
  }
};

// Backup JSON files
const backupJSONFiles = () => {
  console.log('\n📦 Creating backup of JSON files...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  let backedUp = 0;

  files.forEach(file => {
    const src = path.join(DATA_DIR, file);
    const dest = path.join(BACKUP_DIR, file);
    fs.copyFileSync(src, dest);
    backedUp++;
  });

  console.log(`✅ Backed up ${backedUp} files to: ${path.basename(BACKUP_DIR)}`);
};

// Migration functions for each collection
const migrateBills = async () => {
  console.log('\n💰 Migrating Bills...');
  const bills = readJSON('bills.json');
  
  if (bills.length === 0) {
    console.log('   ⏭️  No bills to migrate');
    return { success: 0, failed: 0 };
  }

  let success = 0, failed = 0;

  for (const bill of bills) {
    try {
      await Bill.create(bill);
      success++;
    } catch (error) {
      console.log(`   ❌ Failed to migrate bill ${bill._id}:`, error.message);
      failed++;
    }
  }

  console.log(`   ✅ Migrated ${success} bills (${failed} failed)`);
  return { success, failed };
};

const migrateCustomers = async () => {
  console.log('\n👥 Migrating Customers...');
  const customers = readJSON('customers.json');
  
  if (customers.length === 0) {
    console.log('   ⏭️  No customers to migrate');
    return { success: 0, failed: 0 };
  }

  let success = 0, failed = 0;

  for (const customer of customers) {
    try {
      await Customer.create(customer);
      success++;
    } catch (error) {
      console.log(`   ❌ Failed to migrate customer ${customer._id}:`, error.message);
      failed++;
    }
  }

  console.log(`   ✅ Migrated ${success} customers (${failed} failed)`);
  return { success, failed };
};

const migrateItems = async () => {
  console.log('\n🍽️  Migrating Items...');
  const items = readJSON('items.json');
  
  if (items.length === 0) {
    console.log('   ⏭️  No items to migrate');
    return { success: 0, failed: 0 };
  }

  let success = 0, failed = 0;

  for (const item of items) {
    try {
      await Item.create(item);
      success++;
    } catch (error) {
      console.log(`   ❌ Failed to migrate item ${item._id}:`, error.message);
      failed++;
    }
  }

  console.log(`   ✅ Migrated ${success} items (${failed} failed)`);
  return { success, failed };
};

const migrateRooms = async () => {
  console.log('\n🏨 Migrating Rooms...');
  const rooms = readJSON('rooms.json');
  
  if (rooms.length === 0) {
    console.log('   ⏭️  No rooms to migrate');
    return { success: 0, failed: 0 };
  }

  let success = 0, failed = 0;

  for (const room of rooms) {
    try {
      await Room.create(room);
      success++;
    } catch (error) {
      console.log(`   ❌ Failed to migrate room ${room._id}:`, error.message);
      failed++;
    }
  }

  console.log(`   ✅ Migrated ${success} rooms (${failed} failed)`);
  return { success, failed };
};

const migrateSettings = async () => {
  console.log('\n⚙️  Migrating Settings...');
  const settings = readJSON('settings.json');
  
  if (!settings || Object.keys(settings).length === 0) {
    console.log('   ⏭️  No settings to migrate');
    return { success: 0, failed: 0 };
  }

  try {
    await Settings.create(settings);
    console.log('   ✅ Migrated settings');
    return { success: 1, failed: 0 };
  } catch (error) {
    console.log('   ❌ Failed to migrate settings:', error.message);
    return { success: 0, failed: 1 };
  }
};

// Main migration function
const migrate = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Backup first
    backupJSONFiles();

    // Confirm migration
    console.log('\n⚠️  WARNING: This will import all JSON data into MongoDB');
    console.log('   Existing MongoDB data may be overwritten if IDs match!');
    console.log('\n   Backup created at:', BACKUP_DIR);
    console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n' + '='.repeat(60));
    console.log('🚀 Starting Migration...');
    console.log('='.repeat(60));

    const results = {
      bills: await migrateBills(),
      customers: await migrateCustomers(),
      items: await migrateItems(),
      rooms: await migrateRooms(),
      settings: await migrateSettings(),
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    
    let totalSuccess = 0, totalFailed = 0;

    Object.entries(results).forEach(([collection, stats]) => {
      console.log(`${collection.padEnd(15)}: ${stats.success} success, ${stats.failed} failed`);
      totalSuccess += stats.success;
      totalFailed += stats.failed;
    });

    console.log('-'.repeat(60));
    console.log(`TOTAL:           ${totalSuccess} success, ${totalFailed} failed`);
    console.log('='.repeat(60));

    if (totalFailed === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📌 Next Steps:');
      console.log('1. Restart server: node index.js');
      console.log('2. Test application thoroughly');
      console.log('3. Keep JSON backup for safety: ' + path.basename(BACKUP_DIR));
      console.log('\n💡 Your app will now use MongoDB automatically!');
    } else {
      console.log('\n⚠️  Migration completed with some failures');
      console.log('   Check the errors above and retry if needed');
      console.log('   JSON backup available at: ' + path.basename(BACKUP_DIR));
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Your JSON files are safe in:', BACKUP_DIR);
    console.error('   No changes were made to production data');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB\n');
  }
};

// Run migration
migrate();
