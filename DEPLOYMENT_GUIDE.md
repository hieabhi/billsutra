# 🚀 BillSutra HMS - Deployment Guide

## Overview
This guide will help you deploy BillSutra Hotel Management System to Google Cloud (Firebase Hosting + Cloud Run).

---

## 📋 Prerequisites

1. **Google Cloud Account** (free tier available)
2. **Firebase Project** - Already created: `billsutra-hms`
3. **GitHub Account** - Your existing account
4. **Git installed** - Already done ✅
5. **Firebase CLI** - Will install in Step 1

---

## 🎯 Architecture After Deployment

```
┌─────────────────────────────┐
│  Firebase Hosting           │  ← Frontend (React App)
│  billsutra-hms.web.app      │
└──────────┬──────────────────┘
           │
           ↓ API Calls
┌─────────────────────────────┐
│  Cloud Run                  │  ← Backend (Node.js API)
│  billsutra-api.run.app      │
└──────────┬──────────────────┘
           │
           ↓ Database Queries
┌─────────────────────────────┐
│  Supabase PostgreSQL        │  ← Database
│  (Already Online)           │
└─────────────────────────────┘
           ↑
           │ Auth Verification
┌─────────────────────────────┐
│  Firebase Auth              │  ← Authentication
│  (Already Online)           │
└─────────────────────────────┘
```

---

## 📦 Step 1: Install Firebase CLI

Open PowerShell and run:

```powershell
npm install -g firebase-tools
firebase --version
```

---

## 🔐 Step 2: Login to Firebase

```powershell
firebase login
```

This will open a browser window. Login with your Google account (the one you used for Firebase Console).

---

## 📤 Step 3: Push Code to GitHub

### A. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `billsutra-hms`
3. Description: `Multi-tenant Hotel Management System with Firebase Auth & Supabase`
4. **Keep it Private** (recommended)
5. **DO NOT** initialize with README (we already have code)
6. Click "Create repository"

### B. Push Code

GitHub will show you commands. Run these in PowerShell:

```powershell
cd C:\Users\AbhijitVibhute\Desktop\BillSutra

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/billsutra-hms.git

# Push code
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## 🌐 Step 4: Deploy Frontend to Firebase Hosting

### A. Build Frontend

```powershell
cd client
npm run build
```

This creates optimized production files in `client/dist/`

### B. Deploy to Firebase Hosting

```powershell
cd ..
firebase deploy --only hosting
```

**Output will show:**
```
✔  Deploy complete!

Hosting URL: https://billsutra-hms.web.app
```

🎉 **Your frontend is now LIVE!**

---

## ☁️ Step 5: Deploy Backend to Google Cloud Run

### A. Enable Cloud Run API

1. Go to https://console.cloud.google.com
2. Select project: `billsutra-hms`
3. Search for "Cloud Run API"
4. Click "Enable"

### B. Install Google Cloud SDK

Download and install: https://cloud.google.com/sdk/docs/install

After installation, run:

```powershell
gcloud --version
gcloud init
```

Select:
- Login with your Google account
- Project: `billsutra-hms`
- Region: `us-central1` (or closest to you)

### C. Build and Deploy Backend

```powershell
cd server

# Build Docker image and deploy to Cloud Run
gcloud run deploy billsutra-api `
  --source . `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars "SUPABASE_URL=$env:SUPABASE_URL,SUPABASE_SERVICE_KEY=$env:SUPABASE_SERVICE_KEY,FIREBASE_PROJECT_ID=$env:FIREBASE_PROJECT_ID"
```

**Note:** You'll be prompted to:
- Confirm region: Press Enter
- Allow unauthenticated: Press Enter (yes)

**Output will show:**
```
Service [billsutra-api] revision [...] has been deployed and is serving 100% of traffic.
Service URL: https://billsutra-api-XXXXX-uc.a.run.app
```

🎉 **Your backend is now LIVE!**

### D. Set Environment Variables in Cloud Run

The above command sets basic env vars. For complete setup:

1. Go to https://console.cloud.google.com/run
2. Click `billsutra-api`
3. Click "EDIT & DEPLOY NEW REVISION"
4. Scroll to "CONTAINER, VARIABLES & SECRETS"
5. Add all variables from your `.env` file:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
6. Click "DEPLOY"

---

## 🔗 Step 6: Connect Frontend to Backend

### A. Update Frontend API URL

Edit `client/src/config/env.js`:

```javascript
const ENV = {
  development: {
    API_URL: 'http://localhost:5051'
  },
  production: {
    API_URL: 'https://billsutra-api-XXXXX-uc.a.run.app' // ← Your Cloud Run URL
  }
};
```

Replace with YOUR actual Cloud Run URL from Step 5C.

### B. Rebuild and Redeploy Frontend

```powershell
cd client
npm run build
cd ..
firebase deploy --only hosting
```

---

## 🔐 Step 7: Update Firebase Authorized Domains

1. Go to https://console.firebase.google.com
2. Select `billsutra-hms`
3. Go to **Authentication → Settings → Authorized domains**
4. Add your production domain: `billsutra-hms.web.app`

---

## ✅ Step 8: Test Your Live Application

Visit: **https://billsutra-hms.web.app**

1. Click "Continue with Google"
2. Login with your account
3. Check Dashboard loads
4. Click "Test Backend Auth" - should show ✅ Success

---

## 🔄 Future Deployments (After Initial Setup)

### Update Frontend:
```powershell
cd client
npm run build
cd ..
firebase deploy --only hosting
```

### Update Backend:
```powershell
cd server
gcloud run deploy billsutra-api --source . --region us-central1
```

---

## 🤖 Automated Deployment with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd client && npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: billsutra-hms

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
      - run: cd server && gcloud run deploy billsutra-api --source .
```

---

## 💰 Cost Estimate

**Monthly costs for ~50 bookings/month:**

| Service | Free Tier | Expected Cost |
|---------|-----------|---------------|
| Firebase Hosting | 10GB storage, 360MB/day | $0 |
| Firebase Auth | 50,000 MAU | $0 |
| Cloud Run | 2M requests/month | $0-2 |
| Supabase | 500MB DB, Unlimited API | $0 |
| **Total** | | **$0-2/month** |

---

## 🆘 Troubleshooting

### Frontend shows "Failed to fetch"
- Check Cloud Run URL is correct in `client/src/config/env.js`
- Verify CORS is allowing your Firebase Hosting domain
- Check browser console for errors

### Backend deployment fails
- Ensure Docker is enabled in Cloud Run
- Check all environment variables are set
- View logs: `gcloud run logs read --service=billsutra-api`

### Authentication not working
- Verify Firebase authorized domains include production URL
- Check Firebase config in frontend matches Firebase Console
- Ensure backend has correct FIREBASE_PROJECT_ID

---

## 📞 Support

If you encounter issues:
1. Check Cloud Run logs: https://console.cloud.google.com/run
2. Check Firebase logs: https://console.firebase.google.com
3. Ask me for help in our chat!

---

## 🎉 Success Checklist

- [ ] Git repository initialized
- [ ] Code pushed to GitHub
- [ ] Frontend deployed to Firebase Hosting
- [ ] Backend deployed to Cloud Run
- [ ] Environment variables configured
- [ ] Frontend connected to backend
- [ ] Firebase authorized domains updated
- [ ] Tested login with Google OAuth
- [ ] Dashboard loads with live data

---

**Your BillSutra HMS is now running in the cloud! 🚀**
