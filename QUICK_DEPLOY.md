# 🚀 Quick Deployment Commands

## 📤 Initial Setup (Do Once)

### 1. Install Tools
```powershell
# Install Firebase CLI
npm install -g firebase-tools

# Install Google Cloud SDK
# Download from: https://cloud.google.com/sdk/docs/install
```

### 2. Login to Services
```powershell
# Login to Firebase
firebase login

# Login to Google Cloud
gcloud init
```

### 3. Create GitHub Repository
```powershell
# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/billsutra-hms.git
git branch -M main
git push -u origin main
```

---

## 🌐 Deploy Frontend (Firebase Hosting)

```powershell
cd C:\Users\AbhijitVibhute\Desktop\BillSutra
cd client
npm run build
cd ..
firebase deploy --only hosting
```

**Result:** https://billsutra-hms.web.app

---

## ☁️ Deploy Backend (Cloud Run)

```powershell
cd C:\Users\AbhijitVibhute\Desktop\BillSutra
cd server
gcloud run deploy billsutra-api --source . --region us-central1 --allow-unauthenticated
```

**Result:** https://billsutra-api-XXXXX-uc.a.run.app

---

## 🔄 Update After Code Changes

### Frontend Only:
```powershell
cd client
npm run build
cd ..
firebase deploy --only hosting
```

### Backend Only:
```powershell
cd server
gcloud run deploy billsutra-api --source . --region us-central1
```

### Both:
```powershell
# Frontend
cd client
npm run build
cd ..
firebase deploy --only hosting

# Backend
cd server
gcloud run deploy billsutra-api --source . --region us-central1
```

---

## 🐛 View Logs

### Frontend (Firebase Hosting):
```powershell
firebase hosting:channel:list
```

### Backend (Cloud Run):
```powershell
gcloud run logs read --service=billsutra-api --limit=50
```

---

## 🔧 Manage Environment Variables

### Cloud Run:
```powershell
# Set single variable
gcloud run services update billsutra-api --set-env-vars KEY=VALUE

# Set multiple variables from file
gcloud run services update billsutra-api --env-vars-file .env.production
```

### View current variables:
```powershell
gcloud run services describe billsutra-api --format="value(spec.template.spec.containers[0].env)"
```

---

## 📊 Check Deployment Status

### Firebase Hosting:
```powershell
firebase hosting:sites:list
```

### Cloud Run:
```powershell
gcloud run services list
```

---

## 🆘 Troubleshooting

### Test Backend Locally:
```powershell
cd server
node index.js
# Visit http://localhost:5051
```

### Test Frontend Locally:
```powershell
cd client
npm run dev
# Visit http://localhost:5173
```

### Check Docker Build:
```powershell
cd server
docker build -t billsutra-api .
docker run -p 8080:8080 billsutra-api
```

---

## 📱 Your Live URLs

- **Frontend:** https://billsutra-hms.web.app
- **Backend:** https://billsutra-api-XXXXX-uc.a.run.app (update after first deployment)
- **Firebase Console:** https://console.firebase.google.com/project/billsutra-hms
- **Cloud Console:** https://console.cloud.google.com/run?project=billsutra-hms
- **Supabase:** https://supabase.com/dashboard/project/tpbbhstshioyggintazl

---

## 💡 Pro Tips

1. **Always test locally first** before deploying
2. **Commit to Git** before each deployment
3. **Keep .env file safe** - never commit it
4. **Check logs** if something doesn't work
5. **Use Firebase preview channels** for testing:
   ```powershell
   firebase hosting:channel:deploy preview
   ```

---

## 🤖 Chat-Based Workflow

**You:** "Make the checkout button red"  
**Me:** *makes change*  
**You:** *tests locally* "Looks good, deploy it"  
**Me:** *pushes to GitHub*  
**You:** Run deployment command  
**Result:** Live in 2 minutes! 🚀
