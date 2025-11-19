# 🚀 BillSutra Supabase Setup - Quick Start

This is your roadmap to migrate to Supabase PostgreSQL and prepare for Cloud Run deployment.

## ✅ Current Status

| Component | Platform | Status |
|-----------|----------|--------|
| Code | GitHub | 📦 To setup |
| Database | Supabase PostgreSQL | ✅ Online |
| Authentication | Firebase Auth | ✅ Online |
| Frontend | Firebase Hosting | 🚀 To deploy |
| Backend | Cloud Run | 🚀 To deploy |

## 📋 Pre-Migration Checklist

### 1. Supabase Configuration

- [ ] Go to [Supabase Dashboard](https://app.supabase.com)
- [ ] Copy your project URL (Settings → API)
- [ ] Copy **service_role** key (Settings → API → service_role)
- [ ] Add to `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Already have
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ADD THIS
```

⚠️ **IMPORTANT**: The service key is different from anon key!

### 2. Install Dependencies

```powershell
# Install Supabase client (if not already)
npm install @supabase/supabase-js
```

### 3. Create Database Schema

1. Open Supabase Dashboard → **SQL Editor**
2. Create new query
3. Copy **entire content** from `supabase_schema.sql`
4. Click **RUN**
5. Wait for: ✅ "BillSutra database schema created successfully!"

This creates 9 tables:
- ✅ rooms
- ✅ room_types
- ✅ customers
- ✅ bookings
- ✅ bills
- ✅ items
- ✅ housekeeping
- ✅ rate_plans
- ✅ hotel_settings

## 🔄 Migration Steps

### Step 1: Test Connection

```powershell
npm run db:test:supabase
```

Expected output:
```
✓ Connected to Supabase successfully!
✓ Table 'users' exists
✓ Table 'rooms' exists
...
○ rooms              0 records
○ bookings           0 records
```

### Step 2: Run Migration

```powershell
npm run db:migrate:supabase
```

What happens:
1. ✅ Backs up all JSON files to `server/data/backups/`
2. ✅ Fetches your tenant_id from users table
3. ✅ Migrates rooms → Supabase
4. ✅ Migrates customers → Supabase
5. ✅ Migrates items → Supabase
6. ✅ Migrates bookings → Supabase
7. ✅ Migrates bills → Supabase
8. ✅ Migrates settings → Supabase

Expected output:
```
✓ Backed up rooms.json
✓ Backed up bookings.json
...
✓ Using tenant ID: 12345678-1234-1234-1234-123456789abc
✓ Rooms: 10 migrated, 0 errors
✓ Bookings: 25 migrated, 0 errors
...
✓ Migration completed successfully! 🎉
```

### Step 3: Verify in Supabase

1. Go to **Table Editor** in Supabase
2. Click on **rooms** table → See your rooms
3. Click on **bookings** table → See your reservations
4. Click on **bills** table → See your invoices

Run this query in SQL Editor:
```sql
-- Count all records
SELECT 
  'rooms' as table_name, COUNT(*) as count FROM rooms
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'items', COUNT(*) FROM items;
```

### Step 4: Test Connection Again

```powershell
npm run db:test:supabase
```

Now you should see:
```
✓ rooms              10 records
✓ bookings           25 records
✓ bills              15 records
...
✓ Database ready with 50 records!
```

## 🎯 Next: Update Repositories

After migration succeeds, update these files to use Supabase:

```
server/repositories/
├── roomsRepo.js        → Use Supabase instead of JSON
├── bookingsRepo.js     → Use Supabase instead of JSON
├── billsRepo.js        → Use Supabase instead of JSON
├── customersRepo.js    → Use Supabase instead of JSON
├── itemsRepo.js        → Use Supabase instead of JSON
└── settingsRepo.js     → Use Supabase instead of JSON
```

I'll help you update these files once migration is complete!

## 🧹 Cleanup (After Verification)

Once you've tested and verified everything works:

```powershell
# Remove MongoDB utilities (not needed)
rm server/utils/testMongoConnection.js
rm server/utils/migrateToMongo.js
rm server/utils/mongoBackup.js
rm setup-mongodb.ps1
rm MONGODB_SETUP_GUIDE.md
rm WEEK2_DATABASE_MIGRATION_COMPLETE.md

# Keep JSON files as backup for now
# (can delete after 1 week of production use)
```

## 🚨 Troubleshooting

### "Missing SUPABASE_SERVICE_KEY"

```powershell
# Get from Supabase Dashboard → Settings → API
echo "SUPABASE_SERVICE_KEY=your-key-here" >> .env
```

### "No tenant found"

Your `users` table needs at least one user with `tenant_id`:

```sql
-- Check users
SELECT id, email, tenant_id FROM users LIMIT 5;

-- If tenant_id is null, you need to create tenants first
```

### "relation 'rooms' does not exist"

You didn't run the schema SQL script:
1. Go to Supabase SQL Editor
2. Run `supabase_schema.sql`
3. Try migration again

### "Migration failed: Connection timeout"

Check your internet connection and Supabase status:
- https://status.supabase.com

## 📊 Benefits Summary

✅ **Single Database**: Everything in Supabase (users + operational data)  
✅ **Already Authenticated**: Reuse existing Firebase + Supabase setup  
✅ **Row Level Security**: Automatic tenant isolation  
✅ **No More JSON**: Real database with ACID guarantees  
✅ **Cloud Run Ready**: Perfect for serverless deployment  
✅ **Free Tier**: 500MB storage, 2GB bandwidth, 50,000 rows  
✅ **Auto Backups**: Daily snapshots included  
✅ **Real-time**: Can add subscriptions later  

## 🎉 After Migration Success

1. ✅ Data migrated to Supabase
2. ✅ Backup created automatically
3. ⏭️ Update repositories to use Supabase
4. ⏭️ Test application end-to-end
5. ⏭️ Deploy to Cloud Run
6. ⏭️ Deploy frontend to Firebase Hosting
7. ⏭️ Push code to GitHub

---

**Estimated Time**: 15-20 minutes  
**Difficulty**: Easy (follow steps)  
**Rollback**: JSON backups created automatically  

Need help? Check `SUPABASE_MIGRATION_GUIDE.md` for detailed troubleshooting!
