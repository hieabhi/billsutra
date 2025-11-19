# 🚀 SETUP INSTRUCTIONS - Follow These Steps

## ✅ Step 1: Create GitHub Repository (2 minutes)

1. **Go to GitHub**: https://github.com/new
2. **Repository settings**:
   - Repository name: `billsutra-hms`
   - Description: `Hotel Management System with AI Deployment`
   - Visibility: **Private** (recommended)
   - ❌ Do NOT initialize with README (we have code already)
3. Click **Create repository**

---

## ✅ Step 2: Push Code to GitHub (1 minute)

Copy your GitHub username from the repository page, then run:

```powershell
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/billsutra-hms.git
git branch -M main
git push -u origin main
```

**Enter your GitHub credentials when prompted.**

---

## ✅ Step 3: Create Google Cloud Service Account (5 minutes)

### 3.1 Open Google Cloud Console
🔗 https://console.cloud.google.com/iam-admin/serviceaccounts?project=billsutra-hms

### 3.2 Create Service Account
1. Click **+ CREATE SERVICE ACCOUNT**
2. **Service account name**: `github-deploy`
3. **Service account ID**: `github-deploy` (auto-fills)
4. Click **CREATE AND CONTINUE**

### 3.3 Grant These Roles (Click "Add Another Role" for each):
- ✅ **Cloud Run Admin**
- ✅ **Service Account User**
- ✅ **Cloud Build Editor**
- ✅ **Storage Admin**

Click **CONTINUE**, then **DONE**

### 3.4 Download JSON Key
1. Click on the `github-deploy@billsutra-hms.iam.gserviceaccount.com` service account
2. Go to **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON**
5. Click **CREATE**
6. **Save the downloaded JSON file** (you'll need it in Step 5)

---

## ✅ Step 4: Create Firebase Service Account (2 minutes)

### 4.1 Open Firebase Console
🔗 https://console.firebase.google.com/project/billsutra-hms/settings/serviceaccounts/adminsdk

### 4.2 Generate Private Key
1. Click **Generate new private key**
2. Click **Generate key** in the popup
3. **Save the downloaded JSON file** (you'll need it in Step 5)

---

## ✅ Step 5: Add GitHub Secrets (5 minutes)

### 5.1 Open GitHub Secrets Page
🔗 Replace YOUR_USERNAME: `https://github.com/YOUR_USERNAME/billsutra-hms/settings/secrets/actions`

### 5.2 Add Each Secret (Click "New repository secret")

#### Secret 1: GCP_SA_KEY
- **Name**: `GCP_SA_KEY`
- **Value**: Open the **Google Cloud JSON file** (from Step 3.4) in Notepad
  - Copy **entire contents** (from `{` to `}`)
  - Paste into the secret value
- Click **Add secret**

#### Secret 2: FIREBASE_SERVICE_ACCOUNT
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: Open the **Firebase JSON file** (from Step 4.2) in Notepad
  - Copy **entire contents** (from `{` to `}`)
  - Paste into the secret value
- Click **Add secret**

#### Secret 3: SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Value**: `https://tpbbhstshioyggintazl.supabase.co`
- Click **Add secret**

#### Secret 4: SUPABASE_ANON_KEY
- **Name**: `SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwYmJoc3RzaGlveWdnaW50YXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MTIzOTUsImV4cCI6MjA0NzQ4ODM5NX0.a1cnWLN9ujm0n4jZlSYGkGLUkzsQJU47kCrpU0qsEzw`
- Click **Add secret**

#### Secret 5: SUPABASE_SERVICE_KEY
- **Name**: `SUPABASE_SERVICE_KEY`
- **How to get**: 
  1. Go to: https://supabase.com/dashboard/project/tpbbhstshioyggintazl/settings/api
  2. Scroll to **Project API keys**
  3. Copy the **service_role** key (click the eye icon to reveal)
- **Value**: Paste the service_role key
- Click **Add secret**

#### Secret 6: BACKEND_URL (Temporary - will update later)
- **Name**: `BACKEND_URL`
- **Value**: `https://billsutra-backend-temp.run.app`
- Click **Add secret**
- ⚠️ **Note**: We'll update this after first deployment

#### Secrets 7-13: Firebase Configuration
Add each of these:

| Secret Name | Value |
|------------|-------|
| `FIREBASE_API_KEY` | `AIzaSyBFOtpqy_k6QD8TS5XSF4Ea3u5ItNf4l7U` |
| `FIREBASE_AUTH_DOMAIN` | `billsutra-hms.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `billsutra-hms` |
| `FIREBASE_STORAGE_BUCKET` | `billsutra-hms.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `498830549959` |
| `FIREBASE_APP_ID` | `1:498830549959:web:f54aaaea5a37f1b8f8dbd7` |
| `FIREBASE_MEASUREMENT_ID` | `G-3HQVHKV7SM` |

---

## ✅ Step 6: First Deployment (3 minutes)

### 6.1 Go to GitHub Actions
🔗 `https://github.com/YOUR_USERNAME/billsutra-hms/actions`

### 6.2 Enable Workflows
- Click **I understand my workflows, go ahead and enable them**

### 6.3 Run Manual Deployment
1. Click **Deploy on Demand** workflow (left sidebar)
2. Click **Run workflow** dropdown (right side)
3. Select:
   - **deploy_target**: `backend` (deploy backend first)
   - **environment**: `production`
4. Click green **Run workflow** button
5. Wait 2-3 minutes for deployment to complete

### 6.4 Get Backend URL
1. After deployment completes, go to: https://console.cloud.google.com/run?project=billsutra-hms
2. Click **billsutra-backend** service
3. Copy the URL (e.g., `https://billsutra-backend-xxxxx-uc.a.run.app`)

### 6.5 Update BACKEND_URL Secret
1. Go back to: `https://github.com/YOUR_USERNAME/billsutra-hms/settings/secrets/actions`
2. Click on **BACKEND_URL** secret
3. Click **Update secret**
4. Paste the Cloud Run URL from Step 6.4
5. Click **Update secret**

### 6.6 Deploy Frontend
1. Go to: `https://github.com/YOUR_USERNAME/billsutra-hms/actions`
2. Click **Deploy on Demand**
3. Click **Run workflow**
4. Select:
   - **deploy_target**: `frontend`
   - **environment**: `production`
5. Click **Run workflow**
6. Wait 2-3 minutes

---

## ✅ Step 7: Configure CORS & Auth (2 minutes)

### 7.1 Update Firebase Authorized Domains
1. Go to: https://console.firebase.google.com/project/billsutra-hms/authentication/settings
2. Scroll to **Authorized domains**
3. Click **Add domain**
4. Add your Cloud Run backend domain (without https://):
   - Example: `billsutra-backend-xxxxx-uc.a.run.app`
5. Click **Add**

### 7.2 Update Supabase CORS
1. Go to: https://supabase.com/dashboard/project/tpbbhstshioyggintazl/settings/api
2. Scroll to **CORS**
3. Add these allowed origins (one per line):
   ```
   https://billsutra-hms.web.app
   https://billsutra-hms.firebaseapp.com
   https://billsutra-backend-xxxxx-uc.a.run.app
   ```
   (Replace xxxxx with your actual Cloud Run URL)
4. Click **Save**

---

## 🎉 Step 8: Test Your Live Application!

### 8.1 Open Your Application
🔗 https://billsutra-hms.web.app

### 8.2 Login
- Email: `abhijitvibhute1998@gmail.com`
- Use Google Sign-In or Phone OTP

### 8.3 Verify Data
You should see:
- ✅ 8 rooms
- ✅ 3 bookings
- ✅ 3 bills
- ✅ Real-time updates working

---

## 🚀 Step 9: Enable Auto-Deploy (Optional)

From now on, any code push will auto-deploy! Try it:

```powershell
# Make a small change (e.g., edit a comment in a file)
git add .
git commit -m "Test auto-deploy"
git push

# Watch it deploy automatically at:
# https://github.com/YOUR_USERNAME/billsutra-hms/actions
```

---

## 📱 Step 10: Setup GitHub Codespaces (Optional - Work from Any Device)

### 10.1 Create Codespace
1. Go to: `https://github.com/YOUR_USERNAME/billsutra-hms`
2. Click **Code** button (green)
3. Click **Codespaces** tab
4. Click **Create codespace on main**

### 10.2 Wait for Setup
- GitHub will create a full VS Code environment in your browser
- Takes ~2 minutes first time
- Installs all dependencies automatically

### 10.3 Access from Anywhere
Now you can:
- Edit code from your phone: `github.com/codespaces`
- Edit from tablet
- Edit from any computer
- I (AI) can deploy from chat!

---

## ✅ CHECKLIST - Mark as Complete

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Created Google Cloud service account
- [ ] Created Firebase service account
- [ ] Added all 13 GitHub secrets
- [ ] Deployed backend to Cloud Run
- [ ] Updated BACKEND_URL secret
- [ ] Deployed frontend to Firebase Hosting
- [ ] Updated Firebase authorized domains
- [ ] Updated Supabase CORS
- [ ] Tested live application
- [ ] Created GitHub Codespace (optional)

---

## 🆘 Need Help?

If you get stuck:

1. **Check deployment logs**: `https://github.com/YOUR_USERNAME/billsutra-hms/actions`
2. **Check Cloud Run logs**: https://console.cloud.google.com/run/detail/us-central1/billsutra-backend/logs
3. **Verify secrets**: `https://github.com/YOUR_USERNAME/billsutra-hms/settings/secrets/actions`

---

## 🎯 What's Next?

After setup, you can:
- ✅ Push code → Auto-deploys
- ✅ Deploy from chat with AI
- ✅ Work from any device with Codespaces
- ✅ Make database changes live
- ✅ Deploy specific parts (backend only, frontend only)

**Total setup time: ~20 minutes**
**Future deployments: 2-3 minutes (automatic!)**

---

## 💰 Cost: $0/month

All services are on free tier! 🎉
