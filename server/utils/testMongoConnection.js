import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('\n🔍 MongoDB Connection Test\n');
console.log('='.repeat(50));

if (!MONGODB_URI) {
  console.log('❌ ERROR: MONGODB_URI not found in .env file');
  console.log('\n📋 To fix this:');
  console.log('1. Create MongoDB Atlas account (free)');
  console.log('2. Get connection string');
  console.log('3. Add to server/.env:');
  console.log('   MONGODB_URI=mongodb+srv://...');
  console.log('\nSee MONGODB_SETUP_GUIDE.md for detailed steps');
  process.exit(1);
}

// Hide password in logs
const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log(`📡 Connecting to: ${safeUri}`);
console.log('⏳ Please wait...\n');

async function testConnection() {
  try {
    // Connect with timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully!\n');
    
    // Get database info
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // List databases
    const { databases } = await admin.listDatabases();
    console.log('📊 Available Databases:');
    databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Get current database
    const dbName = db.databaseName;
    console.log(`\n📁 Current Database: ${dbName}`);

    // List collections
    const collections = await db.listCollections().toArray();
    if (collections.length > 0) {
      console.log(`\n📚 Collections in ${dbName}:`);
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   - ${col.name}: ${count} documents`);
      }
    } else {
      console.log(`\n📚 No collections yet in ${dbName}`);
      console.log('   (They will be created when you migrate data)');
    }

    // Test write permission
    console.log('\n✍️  Testing write permission...');
    const testCol = db.collection('_connection_test');
    await testCol.insertOne({ test: true, timestamp: new Date() });
    await testCol.deleteOne({ test: true });
    console.log('✅ Write permission verified');

    // Connection stats
    const stats = await db.stats();
    console.log('\n📈 Database Stats:');
    console.log(`   - Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Collections: ${stats.collections}`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests passed! MongoDB is ready to use.');
    console.log('\n📌 Next Steps:');
    console.log('1. Run migration: node utils/migrateToMongo.js');
    console.log('2. Restart server: node index.js');
    console.log('3. Test application');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.log('❌ Connection failed!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Fix: Check your username and password in MONGODB_URI');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Fix: Check your IP whitelist in MongoDB Atlas');
      console.log('   - Go to Network Access');
      console.log('   - Add 0.0.0.0/0 (for testing) or your IP');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Fix: Check your connection string format');
      console.log('   Should be: mongodb+srv://user:pass@cluster.mongodb.net/dbname');
    }
    
    console.log('\n📖 See MONGODB_SETUP_GUIDE.md for detailed help');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testConnection();
