# 🚀 Cloud Deployment Guide - BillSutra

## ✅ Current Status
- **Database**: ✅ Supabase (Already Online - PostgreSQL)
- **Backend**: ❌ Local (Port 5051) → Deploy to Vercel
- **Frontend**: ❌ Local (Port 5173) → Deploy to Vercel

## 📋 Deployment Steps

### Step 1: Prepare for Deployment

**1. Install Vercel CLI**
```powershell
npm install -g vercel
```

**2. Login to Vercel**
```powershell
vercel login
```

### Step 2: Deploy to Vercel

**Deploy Command:**
```powershell
cd C:\Users\AbhijitVibhute\Desktop\BillSutra
vercel
```

**Follow prompts:**
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **billsutra-hms**
- Directory? **./** (press Enter)
- Override settings? **N**

### Step 3: Set Environment Variables

**In Vercel Dashboard:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add these variables:

```
SUPABASE_URL=https://tpbbhstshioyggintazl.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>

FIREBASE_API_KEY=<from .env>
FIREBASE_AUTH_DOMAIN=<from .env>
FIREBASE_PROJECT_ID=<from .env>
FIREBASE_STORAGE_BUCKET=<from .env>
FIREBASE_MESSAGING_SENDER_ID=<from .env>
FIREBASE_APP_ID=<from .env>

NODE_ENV=production
PORT=5051
```

### Step 4: Update Frontend API URL

**Edit `client/src/config/api.js`:**
```javascript
const API_URL = import.meta.env.PROD
  ? 'https://your-project.vercel.app/api'
  : 'http://localhost:5051/api';
```

### Step 5: Deploy Again
```powershell
vercel --prod
```

## 🌐 Alternative: Separate Deployments

### Option A: Backend on Railway
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variables
4. Get deployment URL

### Option B: Backend on Render
1. Go to [render.com](https://render.com)
2. New Web Service → Connect repo
3. Build Command: `npm install`
4. Start Command: `node server/index.js`
5. Add environment variables

## ✅ What's Already Online

**Supabase Database:**
- URL: `https://tpbbhstshioyggintazl.supabase.co`
- Status: ✅ Live and working
- RLS: Disabled (development mode)
- Data: 8 rooms, 3 bookings, 3 bills, 2 items

**Firebase Auth:**
- Already configured
- User: abhijitvibhute1998@gmail.com
- Status: ✅ Working

## 🔧 Post-Deployment

**1. Test your deployment:**
```
https://billsutra-hms.vercel.app
```

**2. Update Firebase Auth domains:**
- Go to Firebase Console
- Authentication → Settings → Authorized domains
- Add: `billsutra-hms.vercel.app`

**3. Update Supabase CORS:**
- Go to Supabase Dashboard
- Settings → API → CORS
- Add: `https://billsutra-hms.vercel.app`

## 💰 Cost

- **Supabase**: FREE (500MB database, 2GB bandwidth)
- **Vercel**: FREE (100GB bandwidth, unlimited deployments)
- **Firebase Auth**: FREE (50K users)

**Total Monthly Cost: $0** 🎉

## 🚨 Important Notes

1. **No local files needed** - Everything will be in the cloud
2. **Automatic scaling** - Handles traffic automatically
3. **Global CDN** - Fast worldwide
4. **HTTPS by default** - Secure
5. **Auto-deployments** - Push to GitHub = auto deploy

## 📱 Access Your App

After deployment:
- **Your URL**: `https://billsutra-hms.vercel.app`
- **API**: `https://billsutra-hms.vercel.app/api`
- **Database**: Supabase (already live)

---

**Ready to deploy? Run:** `vercel`
