# 🔧 Quick Fix: Update Supabase Schema

Your existing Supabase tables are missing some columns. Follow these steps:

## Step 1: Run Schema Update SQL

1. **Open Supabase Dashboard**: https://app.supabase.com
2. **Go to SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Copy the entire content** from `supabase_schema_update.sql`
5. **Paste into SQL Editor**
6. **Click RUN** (or press Ctrl+Enter)

Wait for: ✅ "BillSutra schema updated successfully!"

## Step 2: Run Migration Again

After the SQL runs successfully:

```powershell
npm run db:migrate:supabase
```

This time it should work! You'll see:
```
✓ Rooms: 8 migrated, 0 errors
✓ Bookings: 3 migrated, 0 errors
✓ Bills: 3 migrated, 0 errors
```

## What the Update Does

### Adds to `rooms` table:
- `floor` column
- `amenities` column
- `notes` column
- `housekeeping_status` column

### Adds to `items` table:
- `cgst`, `sgst`, `igst` columns (tax rates)
- `hsn` column
- `description` column
- `is_active` column

### Adds to `bookings` table:
- `actual_check_in_date`, `actual_check_out_date`
- `guest_id_proof`, `guest_address`
- `guest_counts`, `additional_guests`
- `nights`, `advance_payment`
- `booking_source`, `payment_method`
- `special_requests`, `folio`
- `bill_id`, `bill_number`

### Creates new tables:
- ✅ `customers` - Customer database
- ✅ `bills` - Invoices and payments
- ✅ `hotel_settings` - System configuration
- ✅ `housekeeping` - Cleaning tasks
- ✅ `rate_plans` - Dynamic pricing

## If You Get Errors

### "function update_updated_at() does not exist"
The script creates it, just run the entire SQL again.

### "relation already exists"
That's okay! The script uses `IF NOT EXISTS` so it won't break anything.

### "column already exists"
That's fine too! The script uses `ADD COLUMN IF NOT EXISTS`.

---

**After running the SQL, immediately run:**
```powershell
npm run db:migrate:supabase
```

Your data will migrate successfully! ✅
