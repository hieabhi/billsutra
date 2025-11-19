import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

/**
 * Automated Backup System
 * CRITICAL: Run this daily to prevent data loss
 */

const createBackup = async () => {
  console.log('\n💾 MongoDB Backup Utility\n');
  console.log('='.repeat(60));

  if (!MONGODB_URI) {
    console.log('❌ ERROR: MONGODB_URI not configured');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected');

    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}`);
    
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`\n📦 Backing up ${collections.length} collections...`);

    let totalDocs = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      // Get all documents
      const documents = await collection.find({}).toArray();
      
      // Save to JSON file
      const filename = path.join(backupPath, `${collectionName}.json`);
      fs.writeFileSync(filename, JSON.stringify(documents, null, 2), 'utf8');
      
      console.log(`   ✅ ${collectionName}: ${documents.length} documents`);
      totalDocs += documents.length;
    }

    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      database: db.databaseName,
      collections: collections.length,
      totalDocuments: totalDocs,
      mongodbUri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'),
    };

    fs.writeFileSync(
      path.join(backupPath, '_metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ Backup Complete!');
    console.log('='.repeat(60));
    console.log(`📁 Location: ${backupPath}`);
    console.log(`📊 Collections: ${collections.length}`);
    console.log(`📄 Documents: ${totalDocs}`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log('='.repeat(60));

    // Cleanup old backups (keep last 7 days)
    cleanupOldBackups();

  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB\n');
  }
};

const cleanupOldBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => name.startsWith('backup_'))
    .map(name => ({
      name,
      path: path.join(BACKUP_DIR, name),
      time: fs.statSync(path.join(BACKUP_DIR, name)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  // Keep only last 7 backups
  if (backups.length > 7) {
    console.log('\n🧹 Cleaning up old backups...');
    const toDelete = backups.slice(7);
    
    toDelete.forEach(backup => {
      fs.rmSync(backup.path, { recursive: true, force: true });
      console.log(`   🗑️  Deleted: ${backup.name}`);
    });
    
    console.log(`✅ Kept ${7} most recent backups`);
  }
};

// Restore from backup
export const restoreBackup = async (backupName) => {
  console.log(`\n♻️  Restoring from backup: ${backupName}\n`);
  console.log('='.repeat(60));

  const backupPath = path.join(BACKUP_DIR, backupName);

  if (!fs.existsSync(backupPath)) {
    console.log(`❌ Backup not found: ${backupName}`);
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const files = fs.readdirSync(backupPath).filter(f => f.endsWith('.json') && f !== '_metadata.json');

    console.log(`\n📦 Restoring ${files.length} collections...`);

    const db = mongoose.connection.db;

    for (const file of files) {
      const collectionName = file.replace('.json', '');
      const filepath = path.join(backupPath, file);
      
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      if (data.length === 0) {
        console.log(`   ⏭️  ${collectionName}: empty, skipping`);
        continue;
      }

      // Drop existing collection
      try {
        await db.collection(collectionName).drop();
      } catch (e) {
        // Collection might not exist
      }

      // Insert documents
      await db.collection(collectionName).insertMany(data);
      console.log(`   ✅ ${collectionName}: ${data.length} documents restored`);
    }

    console.log('\n✅ Restore complete!');

  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB\n');
  }
};

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup();
}

export default createBackup;
