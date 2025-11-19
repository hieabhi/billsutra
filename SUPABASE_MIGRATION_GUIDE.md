# 🚀 Supabase Migration Guide

This guide walks you through migrating BillSutra from JSON files to Supabase PostgreSQL.

## 📋 Prerequisites

- [x] Supabase account (already have for users/tenants)
- [x] SUPABASE_URL in `.env`
- [x] SUPABASE_ANON_KEY in `.env`
- [ ] SUPABASE_SERVICE_KEY in `.env` (needed for migration)

## 🎯 Architecture Overview

```
Component          Hosted On              Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Code               GitHub                 To setup
Database           Supabase PostgreSQL    ✅ Online
Authentication     Firebase Auth          ✅ Online
Frontend App       Firebase Hosting       To deploy
Backend API        Cloud Run              To deploy
```

## 📊 Data Migration Map

```
JSON File              →  Supabase Table
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
rooms.json             →  rooms
customers.json         →  customers
bookings.json          →  bookings
bills.json             →  bills
items.json             →  items
settings.json          →  hotel_settings
```

## 🛠️ Step 1: Get Supabase Service Key

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy **service_role** key (NOT anon key)
5. Add to `.env`:

```env
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **WARNING**: Keep service key secret! Never commit to Git.

## 🗄️ Step 2: Create Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Open `supabase_schema.sql` from your project
3. Click **Run** to execute the entire script
4. Verify tables created:
   - rooms
   - room_types
   - customers
   - bookings
   - bills
   - items
   - housekeeping
   - rate_plans
   - hotel_settings

✅ You should see: **"BillSutra database schema created successfully!"**

## 🔄 Step 3: Run Migration

```powershell
# Install Supabase client (if not already)
npm install @supabase/supabase-js

# Run migration
npm run db:migrate:supabase
```

The migration will:
1. ✅ Backup all JSON files
2. ✅ Fetch your tenant_id
3. ✅ Migrate rooms
4. ✅ Migrate customers
5. ✅ Migrate items/menu
6. ✅ Migrate bookings
7. ✅ Migrate bills
8. ✅ Migrate settings

## 🔍 Step 4: Verify Migration

### Check in Supabase Dashboard

1. Go to **Table Editor**
2. Verify data in each table:
   - **rooms**: Check room numbers, types, status
   - **bookings**: Check reservations, dates, status
   - **bills**: Check bill numbers, amounts, payment status
   - **customers**: Check customer names, contacts
   - **items**: Check menu items, rates

### Run SQL Queries

```sql
-- Count records per table
SELECT 'rooms' as table_name, COUNT(*) as count FROM rooms
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'items', COUNT(*) FROM items;

-- Check a sample booking
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;

-- Verify tenant isolation
SELECT DISTINCT tenant_id FROM bookings;
```

## 🔧 Step 5: Update Repositories (Automatic)

The following files will be automatically updated to use Supabase:

- `server/repositories/roomsRepo.js`
- `server/repositories/bookingsRepo.js`
- `server/repositories/billsRepo.js`
- `server/repositories/customersRepo.js`
- `server/repositories/itemsRepo.js`
- `server/repositories/settingsRepo.js`

Each will use Supabase client instead of JSON file reads/writes.

## 🧪 Step 6: Test Application

### Start Servers

```powershell
# Terminal 1 - Backend
cd server
node index.js

# Terminal 2 - Frontend
cd client
npm run dev
```

### Test Checklist

- [ ] Login works (Firebase + Supabase users)
- [ ] Rooms page displays correctly
- [ ] Create new booking
- [ ] Add folio items
- [ ] Checkout process
- [ ] Generate invoice
- [ ] View bills section
- [ ] Housekeeping status updates
- [ ] Rate calendar

## 🔐 Row Level Security (RLS)

All tables have RLS enabled. Users can only see data for their tenant:

```sql
-- Example: Users see only their tenant's bookings
CREATE POLICY "Users see own tenant bookings" 
ON bookings FOR ALL 
USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

Your backend sets the tenant context:

```javascript
await supabase.rpc('set_config', {
  setting: 'app.current_tenant',
  value: user.hotelId
});
```

## 📈 Performance Features

### Indexes Created
- ✅ tenant_id on all tables (fast tenant filtering)
- ✅ status columns (fast status queries)
- ✅ date ranges (fast date searches)
- ✅ phone/email (fast customer lookup)

### Auto Triggers
- ✅ updated_at automatically updated
- ✅ UUID generation for IDs

## 💾 Backup & Rollback

### Migration Backup

Automatic backup created at:
```
server/data/backups/migration_backup_YYYY-MM-DDTHH-mm-ss/
```

### Restore from Backup

```javascript
// If needed, restore JSON files
const backupPath = 'server/data/backups/migration_backup_2025-11-18T10-30-00';
// Copy files back to server/data/
```

## 🚨 Troubleshooting

### Error: "Missing SUPABASE_SERVICE_KEY"

```powershell
# Add to .env
echo "SUPABASE_SERVICE_KEY=your-service-key" >> .env
```

### Error: "No tenant found"

- Ensure you have users in the `users` table
- Check that users have `tenant_id` set

### Error: "relation does not exist"

- Run the SQL schema script in Supabase dashboard
- Verify tables are created

### Migration runs but no data

- Check Supabase logs in dashboard
- Verify JSON files exist in `server/data/`
- Check tenant_id matches

## 📊 Database Comparison

| Feature | JSON Files | Supabase PostgreSQL |
|---------|-----------|---------------------|
| **Performance** | Slow (read entire file) | Fast (indexed queries) |
| **Concurrent Access** | File locks, conflicts | ACID transactions |
| **Backup** | Manual file copies | Automated snapshots |
| **Scalability** | Limited | 500MB free, scales to TB |
| **Security** | File system | Row Level Security |
| **Cost** | $0 | $0 (free tier) |
| **Multi-tenant** | Manual filtering | Built-in RLS |
| **Relationships** | Manual joins | Foreign keys |

## ✨ Benefits of Supabase

1. **Single Database**: Users + operational data in one place
2. **Already Authenticated**: Reuse existing Firebase + Supabase auth
3. **Row Level Security**: Automatic tenant isolation
4. **Real-time**: Can add real-time subscriptions later
5. **Auto Backups**: Daily automated backups
6. **Cloud Run Ready**: Perfect for serverless deployment
7. **PostgreSQL**: Industry-standard RDBMS

## 🎯 Next Steps

After successful migration:

1. **Remove MongoDB utilities** (not needed):
   ```powershell
   rm server/utils/testMongoConnection.js
   rm server/utils/migrateToMongo.js
   rm server/utils/mongoBackup.js
   rm MONGODB_SETUP_GUIDE.md
   rm WEEK2_DATABASE_MIGRATION_COMPLETE.md
   ```

2. **Update package.json**:
   ```json
   "db:migrate:supabase": "node server/utils/migrateToSupabase.js",
   "db:test": "node server/utils/testSupabaseConnection.js"
   ```

3. **Deploy to Cloud Run**:
   - Use Supabase connection from environment
   - No database to bundle or manage
   - Serverless scales automatically

4. **Week 3**: Email notifications (SendGrid)
5. **Week 4**: Payment gateway (Razorpay)
6. **Week 5**: Production launch 🚀

## 📞 Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify .env configuration
3. Review migration output
4. Check server/logs/audit.log

---

**Migration Time**: ~5 minutes  
**Zero Downtime**: JSON files kept as backup  
**Rollback Ready**: Can revert anytime  

🎉 **You're moving to production-grade infrastructure!**
