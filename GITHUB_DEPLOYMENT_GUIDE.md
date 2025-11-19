# 🚀 GitHub Actions Deployment Guide
## Deploy BillSutra Without Installing Anything Locally!

---

## 📋 Overview

This guide will help you deploy your application using **GitHub Actions** - everything happens automatically in the cloud when you push code to GitHub.

**No local installations required!** ✅

---

## 🎯 Step 1: Push Code to GitHub

### 1.1 Create a new repository on GitHub
1. Go to https://github.com/new
2. Repository name: `billsutra-hms`
3. Keep it **Private** (recommended)
4. Don't initialize with README (we already have code)
5. Click **Create repository**

### 1.2 Push your code from VS Code terminal

```powershell
cd C:\Users\AbhijitVibhute\Desktop\BillSutra

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - BillSutra HMS"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/billsutra-hms.git

# Push to GitHub
git push -u origin main
```

---

## 🎯 Step 2: Create Google Cloud Service Account

### 2.1 Open Google Cloud Console
- Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=billsutra-hms

### 2.2 Create Service Account
1. Click **+ CREATE SERVICE ACCOUNT**
2. Service account name: `github-actions`
3. Service account ID: `github-actions` (auto-fills)
4. Click **CREATE AND CONTINUE**

### 2.3 Grant Permissions
Add these roles:
- **Cloud Run Admin**
- **Service Account User**
- **Cloud Build Editor**
- **Storage Admin**

Click **CONTINUE**, then **DONE**

### 2.4 Create Service Account Key
1. Click on the newly created service account
2. Go to **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON**
5. Click **CREATE**
6. A JSON file will download - **save this file!**

---

## 🎯 Step 3: Create Firebase Service Account

### 3.1 Open Firebase Console
- Go to: https://console.firebase.google.com/project/billsutra-hms/settings/serviceaccounts/adminsdk

### 3.2 Generate New Private Key
1. Click **Generate new private key**
2. Click **Generate key**
3. A JSON file will download - **save this file!**

---

## 🎯 Step 4: Add Secrets to GitHub

### 4.1 Go to Your GitHub Repository
- URL: https://github.com/YOUR_USERNAME/billsutra-hms/settings/secrets/actions

### 4.2 Click "New repository secret" and add these secrets:

#### Secret 1: GCP_SA_KEY
- Name: `GCP_SA_KEY`
- Value: **Entire contents** of the Google Cloud service account JSON file
- Click **Add secret**

#### Secret 2: FIREBASE_SERVICE_ACCOUNT
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: **Entire contents** of the Firebase service account JSON file
- Click **Add secret**

#### Secret 3: SUPABASE_URL
- Name: `SUPABASE_URL`
- Value: `https://tpbbhstshioyggintazl.supabase.co`
- Click **Add secret**

#### Secret 4: SUPABASE_ANON_KEY
- Name: `SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwYmJoc3RzaGlveWdnaW50YXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MTIzOTUsImV4cCI6MjA0NzQ4ODM5NX0.a1cnWLN9ujm0n4jZlSYGkGLUkzsQJU47kCrpU0qsEzw`
- Click **Add secret**

#### Secret 5: BACKEND_URL
- Name: `BACKEND_URL`
- Value: `https://billsutra-backend-xxxxx-uc.a.run.app` (you'll update this after first deployment)
- Click **Add secret**

#### Secret 6-12: Firebase Config
Add all these Firebase secrets:

| Secret Name | Value |
|-------------|-------|
| `FIREBASE_API_KEY` | `AIzaSyBFOtpqy_k6QD8TS5XSF4Ea3u5ItNf4l7U` |
| `FIREBASE_AUTH_DOMAIN` | `billsutra-hms.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `billsutra-hms` |
| `FIREBASE_STORAGE_BUCKET` | `billsutra-hms.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `498830549959` |
| `FIREBASE_APP_ID` | `1:498830549959:web:f54aaaea5a37f1b8f8dbd7` |
| `FIREBASE_MEASUREMENT_ID` | `G-3HQVHKV7SM` |

---

## 🎯 Step 5: Enable GitHub Actions

### 5.1 Go to Actions Tab
- URL: https://github.com/YOUR_USERNAME/billsutra-hms/actions

### 5.2 Enable Workflows
- Click **I understand my workflows, go ahead and enable them**

---

## 🎯 Step 6: Deploy!

### Option A: Automatic Deployment (on every push)
Just push code to GitHub:
```powershell
git add .
git commit -m "Deploy to production"
git push
```

### Option B: Manual Deployment (from GitHub UI)
1. Go to **Actions** tab in your repository
2. Click **Deploy to Firebase & Cloud Run** workflow
3. Click **Run workflow** dropdown
4. Click green **Run workflow** button

---

## 🎯 Step 7: Monitor Deployment

### 7.1 Watch GitHub Actions
- Go to: https://github.com/YOUR_USERNAME/billsutra-hms/actions
- You'll see two jobs running:
  - ✅ Deploy Backend to Cloud Run
  - ✅ Deploy Frontend to Firebase Hosting

### 7.2 Get Backend URL
After backend deployment completes:
1. Go to Cloud Run console: https://console.cloud.google.com/run?project=billsutra-hms
2. Click **billsutra-backend**
3. Copy the URL (e.g., `https://billsutra-backend-xxxxx-uc.a.run.app`)

### 7.3 Update BACKEND_URL Secret
1. Go to: https://github.com/YOUR_USERNAME/billsutra-hms/settings/secrets/actions
2. Click on `BACKEND_URL` secret
3. Click **Update secret**
4. Paste the Cloud Run URL
5. Click **Update secret**

### 7.4 Re-run Deployment
- Go to **Actions** tab
- Run workflow again to rebuild frontend with correct backend URL

---

## 🎯 Step 8: Configure CORS & Authorized Domains

### 8.1 Update Firebase Authorized Domains
1. Go to: https://console.firebase.google.com/project/billsutra-hms/authentication/settings
2. Navigate to **Authentication → Settings → Authorized Domains**
3. Add your Cloud Run backend URL (without https://):
   - `billsutra-backend-xxxxx-uc.a.run.app`

### 8.2 Update Supabase CORS
1. Go to: https://supabase.com/dashboard/project/tpbbhstshioyggintazl/settings/api
2. Navigate to **Settings → API → CORS**
3. Add these origins:
   - `https://billsutra-hms.web.app`
   - `https://billsutra-hms.firebaseapp.com`
   - `https://billsutra-backend-xxxxx-uc.a.run.app` (your Cloud Run URL)

---

## 🎉 Step 9: Access Your Live Application!

**Your application is now live at:**
- Frontend: https://billsutra-hms.web.app
- Backend API: https://billsutra-backend-xxxxx-uc.a.run.app/api/health

### Test Login:
- Email: `abhijitvibhute1998@gmail.com`
- Should see: 8 rooms, 3 bookings, 3 bills

---

## 🔄 Future Deployments

Just push to GitHub and it auto-deploys! 🚀

```powershell
git add .
git commit -m "Your changes"
git push
```

GitHub Actions will automatically:
1. Build backend Docker image
2. Deploy to Cloud Run
3. Build frontend
4. Deploy to Firebase Hosting

---

## 💰 Cost Breakdown

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| GitHub Actions | 2,000 minutes/month | ~10 min/deploy | $0 |
| Firebase Hosting | 10GB storage, 360MB/day | ~100MB | $0 |
| Google Cloud Run | 2M requests/month | ~10k/month | $0 |
| Supabase | 500MB database | ~50MB | $0 |
| Firebase Auth | 10k verifications/month | ~100/month | $0 |
| **TOTAL** | | | **$0/month** |

---

## 🆘 Troubleshooting

### Deployment fails with authentication error:
- Check that `GCP_SA_KEY` and `FIREBASE_SERVICE_ACCOUNT` secrets are correct
- Verify service account has correct permissions

### Frontend shows "Failed to fetch":
- Update `BACKEND_URL` secret with correct Cloud Run URL
- Check Supabase CORS settings include your domains

### Backend deployment fails:
- Check Cloud Run logs: https://console.cloud.google.com/run/detail/us-central1/billsutra-backend/logs

---

## 📞 Need Help?

Check these resources:
- GitHub Actions logs: https://github.com/YOUR_USERNAME/billsutra-hms/actions
- Cloud Run logs: https://console.cloud.google.com/run?project=billsutra-hms
- Firebase console: https://console.firebase.google.com/project/billsutra-hms

---

**That's it! No local installations required - everything deploys from GitHub! 🎉**
