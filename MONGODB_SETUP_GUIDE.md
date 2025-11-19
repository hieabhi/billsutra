/**
 * MongoDB Atlas Setup Guide
 * Follow these steps to get your free MongoDB cluster
 */

# 🚀 MongoDB Atlas Setup (5 minutes)

## Step 1: Create Free Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or Email
3. Select "Shared" (FREE tier)
4. Choose provider: **AWS**
5. Region: **Mumbai (ap-south-1)** or closest to you
6. Cluster Name: **billsutra-cluster**
7. Click **Create Cluster** (takes 3-5 minutes)

## Step 2: Create Database User
1. Click **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Username: `billsutra_admin`
4. Password: Generate secure password (save it!)
5. Database User Privileges: **Atlas Admin**
6. Click **Add User**

## Step 3: Whitelist Your IP
1. Click **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
   - For production, restrict to your server IP only!
4. Click **Confirm**

## Step 4: Get Connection String
1. Go back to **Database** (left sidebar)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string:
   ```
   mongodb+srv://billsutra_admin:<password>@billsutra-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add database name: `...mongodb.net/billsutra?retryWrites=...`

## Step 5: Update Your .env File
Open `server/.env` and add:

```env
# MongoDB Atlas Connection (Production Database)
MONGODB_URI=mongodb+srv://billsutra_admin:YOUR_PASSWORD_HERE@billsutra-cluster.xxxxx.mongodb.net/billsutra?retryWrites=true&w=majority
```

## Step 6: Test Connection
```bash
cd server
node utils/testMongoConnection.js
```

You should see: ✅ MongoDB connected successfully!

## Step 7: Migrate Data
```bash
node utils/migrateToMongo.js
```

This will:
- ✅ Read all JSON files
- ✅ Import to MongoDB
- ✅ Verify data integrity
- ✅ Create backup of JSON files

## 💰 Pricing

**Free Tier (Shared M0):**
- Storage: 512 MB
- RAM: Shared
- Cost: **$0/month**
- Perfect for: 1-5 hotels, up to 1000 bookings

**Upgrade Options:**
- M10 (Dedicated): $0.08/hour (~$57/month)
  - 2 GB RAM, 10 GB storage
  - Good for: 10-50 hotels
  
- M20 (Dedicated): $0.20/hour (~$146/month)
  - 4 GB RAM, 20 GB storage
  - Good for: 50-200 hotels

## 🔒 Security Best Practices

1. **Never commit connection string to Git**
   - Already protected in .gitignore ✅

2. **Use IP Whitelist in Production**
   - Don't use 0.0.0.0/0 for production!
   - Add only your server's IP

3. **Rotate password every 90 days**
   - Set calendar reminder

4. **Enable Audit Logs** (paid feature)
   - Tracks all database operations

## 📊 Monitoring

MongoDB Atlas provides:
- ✅ Real-time performance metrics
- ✅ Slow query alerts
- ✅ Disk space monitoring
- ✅ Automated backups (paid)

Access at: https://cloud.mongodb.com

## ⚡ What Happens Next

Once configured:
1. ✅ App will use MongoDB automatically
2. ✅ JSON files become backup only
3. ✅ Better performance
4. ✅ Automatic scaling
5. ✅ Data replication across regions

## 🆘 Troubleshooting

**Connection Error: "Authentication failed"**
- Check password (no spaces, special chars escaped)
- Verify database user exists

**Connection Error: "Network timeout"**
- Check IP whitelist (0.0.0.0/0 or your IP)
- Firewall blocking MongoDB port 27017?

**Connection String Invalid:**
- Format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname?options`
- Database name must be after the `.net/`

## 📞 Support

- MongoDB Support: https://support.mongodb.com
- Community Forum: https://community.mongodb.com
- Documentation: https://docs.mongodb.com/manual/

---

**Next:** After setting up MongoDB, run the migration script to move your data!
