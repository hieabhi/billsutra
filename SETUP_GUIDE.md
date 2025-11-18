# 🚀 BillSutra HMS - Auth & Database Setup Guide

## 📋 Prerequisites Checklist

- [ ] Supabase account created
- [ ] Firebase account created  
- [ ] Supabase project initialized
- [ ] Firebase project initialized
- [ ] Phone authentication enabled in Firebase
- [ ] Google authentication enabled in Firebase

---

## STEP 1: Supabase Setup (5 minutes)

### 1.1 Create Account & Project

1. Go to **https://supabase.com**
2. Click "Start your project" → Sign up with GitHub
3. Create new organization (or use existing)
4. Click "New project"
   - **Name**: `billsutra-hms`
   - **Database Password**: (create strong password - SAVE THIS!)
   - **Region**: Singapore (closest to India)
   - **Pricing plan**: Free
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning...

### 1.2 Get API Keys

1. Once project is ready, go to **Settings** (left sidebar)
2. Click **API**
3. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Run Database Schema

1. Click **SQL Editor** in left sidebar
2. Click "+ New query"
3. Copy entire contents of `database/schema.sql`
4. Paste into SQL editor
5. Click **Run** (bottom right)
6. Wait for success message ✅

**Verify Tables Created:**
- Click **Table Editor** (left sidebar)
- You should see 11 tables: tenants, users, rooms, bookings, etc.

---

## STEP 2: Firebase Setup (5 minutes)

### 2.1 Create Project

1. Go to **https://console.firebase.google.com**
2. Sign in with Google account
3. Click "Add project" or "Create a project"
4. **Project name**: `billsutra-hms`
5. **Google Analytics**: Enable (optional, can skip)
6. Click "Create project"
7. Wait 1-2 minutes...

### 2.2 Enable Authentication

1. Click **Authentication** in left menu (Build section)
2. Click "Get started"
3. Click **Sign-in method** tab

**Enable Phone Authentication:**
1. Click "Phone" → Click "Enable" toggle
2. Click "Save"
3. ✅ Phone provider enabled

**Enable Google Authentication:**
1. Click "Google" → Click "Enable" toggle
2. **Project support email**: (select your email)
3. Click "Save"
4. ✅ Google provider enabled

**Enable Email/Password (optional):**
1. Click "Email/Password" → Enable
2. Click "Save"

### 2.3 Get Web Config

1. Go to **Project Overview** (gear icon ⚙️ → Project settings)
2. Scroll down to "Your apps"
3. Click **Web** icon `</>`
4. **App nickname**: `billsutra-web`
5. Click "Register app"
6. Copy the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "billsutra-hms.firebaseapp.com",
  projectId: "billsutra-hms",
  storageBucket: "billsutra-hms.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

### 2.4 Get Admin SDK Credentials (for backend)

1. Still in **Project Settings**
2. Click **Service accounts** tab
3. Click "Generate new private key"
4. Click "Generate key"
5. Download JSON file (save as `firebase-admin-key.json`)
6. **KEEP THIS SECURE - DO NOT COMMIT TO GIT!**

---

## STEP 3: Configure Environment Variables

### 3.1 Create `.env` file

```bash
# In BillSutra root directory
cp .env.example .env
```

### 3.2 Fill in Supabase Values

Open `.env` and add your Supabase credentials:

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci... (anon public key)
SUPABASE_SERVICE_KEY=eyJhbGci... (service_role secret)
```

### 3.3 Fill in Firebase Values

Add Firebase config from Step 2.3:

```env
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=billsutra-hms.firebaseapp.com
FIREBASE_PROJECT_ID=billsutra-hms
FIREBASE_STORAGE_BUCKET=billsutra-hms.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3.4 Fill in Firebase Admin SDK

From the downloaded JSON file (Step 2.4):

```env
FIREBASE_ADMIN_PROJECT_ID=billsutra-hms
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@billsutra-hms.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"
```

**Note:** Keep the quotes around the private key!

---

## STEP 4: Install Dependencies

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Install Firebase clients
npm install firebase firebase-admin

# Install other dependencies
npm install dotenv jsonwebtoken bcrypt
```

---

## STEP 5: Migrate JSON Data to PostgreSQL

```bash
# Run migration script
cd database
node migrate-json-to-postgres.js
```

**Expected output:**
```
✅ Connected to Supabase
📦 Migrating Tenant...
✅ Tenant created: Demo Hotel
🏠 Migrating Rooms...
✅ Migrated 6 rooms
👥 Migrating Guests...
✅ Migrated 3 guests
📅 Migrating Bookings...
✅ Migrated 5 bookings
🎉 Migration completed successfully!
```

**Verify in Supabase:**
1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Click `rooms` → should see your rooms
4. Click `bookings` → should see your bookings

---

## STEP 6: Test Authentication (Optional)

### Test Firebase Phone Auth

```bash
# In client directory
npm run dev
```

1. Open http://localhost:5173
2. Click "Login"
3. Enter phone number: +919876543210
4. Firebase will send OTP
5. Enter OTP code
6. ✅ Should see user logged in

### Test in Firebase Console

1. Go to Firebase Console → Authentication
2. Click "Users" tab
3. Should see your test user listed

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `firebase-admin-key.json` is in `.gitignore`
- [ ] Never commit API keys to GitHub
- [ ] Use `SUPABASE_SERVICE_KEY` only on backend (not frontend)
- [ ] Firebase private key has escaped `\n` characters

---

## 📝 Next Steps

After completing setup:

1. ✅ Test login with phone number
2. ✅ Test login with Google
3. ✅ Verify user created in Supabase `users` table
4. ✅ Create first booking through new auth flow
5. ✅ Verify multi-tenant isolation works

---

## 🆘 Troubleshooting

### Supabase Issues

**Error: "relation does not exist"**
- Schema not created properly
- Re-run `schema.sql` in SQL Editor

**Error: "JWT expired"**
- Keys copied incorrectly
- Get fresh keys from Settings → API

### Firebase Issues

**Error: "auth/configuration-not-found"**
- Phone auth not enabled
- Go to Authentication → Sign-in method → Enable Phone

**Error: "auth/invalid-api-key"**
- Wrong API key in `.env`
- Re-check Firebase config object

**Error: "private key must be a string"**
- Private key not escaped properly
- Ensure `\n` characters are in the string

### Migration Issues

**Error: "Cannot find module '@supabase/supabase-js'"**
- Run `npm install @supabase/supabase-js`

**Error: "Invalid credentials"**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`

---

## 📚 Documentation Links

- [Supabase Docs](https://supabase.com/docs)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth)

---

## ✅ Setup Complete!

Once all steps are done, you'll have:

- ✅ PostgreSQL database with all tables
- ✅ Multi-tenant Row Level Security
- ✅ Firebase phone + Google authentication
- ✅ All JSON data migrated
- ✅ Environment configured
- ✅ Ready for development!

**Next:** Build login UI and auth middleware! 🚀
