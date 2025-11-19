# 🚀 BillSutra Cloud Deployment Plan

**Target Architecture: Google Cloud Platform**

## 📊 Deployment Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BILLSUTRA STACK                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐         ┌─────────────────┐         │
│  │   GitHub     │────────▶│  Cloud Build    │         │
│  │  Repository  │         │  (CI/CD Auto)   │         │
│  └──────────────┘         └─────────────────┘         │
│                                    │                    │
│                     ┌──────────────┴───────────────┐   │
│                     ▼                              ▼   │
│          ┌─────────────────┐           ┌──────────────┐│
│          │ Firebase Hosting│           │  Cloud Run   ││
│          │   (Frontend)    │           │  (Backend)   ││
│          │  React + Vite   │◀─────────│  Node/Express││
│          └─────────────────┘   API     └──────────────┘│
│                                               │         │
│  ┌──────────────┐                            │         │
│  │ Firebase Auth│◀───────────────────────────┘         │
│  │   (Users)    │                                      │
│  └──────────────┘                                      │
│          │                                              │
│          ▼                                              │
│  ┌──────────────────────────────────────┐             │
│  │      Supabase PostgreSQL              │             │
│  │  ┌──────────┬──────────┬──────────┐  │             │
│  │  │  Users   │ Bookings │  Bills   │  │             │
│  │  │ Tenants  │  Rooms   │  Items   │  │             │
│  │  └──────────┴──────────┴──────────┘  │             │
│  │         (All Application Data)        │             │
│  └──────────────────────────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Deployment Targets

| Component | Platform | URL Pattern | Cost |
|-----------|----------|-------------|------|
| **Code Repository** | GitHub | github.com/your-username/billsutra | Free |
| **Database** | Supabase PostgreSQL | Auto-managed | Free (500MB) |
| **Authentication** | Firebase Auth | Auto-managed | Free (10k users) |
| **Frontend** | Firebase Hosting | billsutra.web.app | Free (10GB/month) |
| **Backend API** | Cloud Run | billsutra-api-xxx.run.app | Pay-per-use (~$5-10/mo) |

**Total Monthly Cost**: ~$5-10 for typical small hotel usage

## ✅ Pre-Deployment Checklist

### Phase 1: Database Migration ⏳

- [ ] Get Supabase service key
- [ ] Run SQL schema in Supabase dashboard
- [ ] Test connection: `npm run db:test:supabase`
- [ ] Run migration: `npm run db:migrate:supabase`
- [ ] Verify data in Supabase dashboard
- [ ] Update repositories to use Supabase
- [ ] Test application locally

### Phase 2: GitHub Setup 📦

- [ ] Create GitHub account (if needed)
- [ ] Create new repository `billsutra`
- [ ] Initialize git in project:
  ```powershell
  git init
  git add .
  git commit -m "Initial commit: BillSutra Hotel PMS"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/billsutra.git
  git push -u origin main
  ```
- [ ] Verify `.gitignore` excludes:
  - [ ] `.env` files
  - [ ] `node_modules/`
  - [ ] `server/data/*.json`
  - [ ] `server/logs/`

### Phase 3: Frontend Deployment (Firebase Hosting) 🌐

- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`
- [ ] Initialize hosting: `firebase init hosting`
  - [ ] Select your Firebase project
  - [ ] Public directory: `client/dist`
  - [ ] Single-page app: Yes
  - [ ] GitHub Actions: Yes (optional)
- [ ] Build frontend: `cd client && npm run build`
- [ ] Deploy: `firebase deploy --only hosting`
- [ ] Test: `https://your-project.web.app`

### Phase 4: Backend Deployment (Cloud Run) 🏃

#### 4a. Prepare Backend

- [ ] Create `Dockerfile` in server/:
  ```dockerfile
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  EXPOSE 8080
  CMD ["node", "index.js"]
  ```

- [ ] Create `.dockerignore`:
  ```
  node_modules/
  npm-debug.log
  .env
  data/*.json
  logs/
  ```

- [ ] Update `server/index.js` to use PORT from env:
  ```javascript
  const PORT = process.env.PORT || 8080;
  ```

#### 4b. Deploy to Cloud Run

- [ ] Install Google Cloud SDK
- [ ] Login: `gcloud auth login`
- [ ] Set project: `gcloud config set project YOUR_PROJECT_ID`
- [ ] Build and deploy:
  ```powershell
  cd server
  gcloud run deploy billsutra-api \
    --source . \
    --platform managed \
    --region asia-south1 \
    --allow-unauthenticated \
    --set-env-vars "SUPABASE_URL=...,SUPABASE_ANON_KEY=...,FIREBASE_PROJECT_ID=..."
  ```
- [ ] Copy Cloud Run URL (e.g., `https://billsutra-api-xxx.run.app`)

#### 4c. Update Frontend to Use Cloud Run API

- [ ] Update `client/src/config.js`:
  ```javascript
  export const API_BASE_URL = import.meta.env.PROD 
    ? 'https://billsutra-api-xxx.run.app/api'
    : 'http://localhost:5051/api';
  ```
- [ ] Rebuild and redeploy frontend

### Phase 5: Domain & SSL (Optional) 🔒

- [ ] Purchase domain (e.g., billsutra.com)
- [ ] Configure Firebase Hosting custom domain
- [ ] Configure Cloud Run custom domain
- [ ] SSL certificates (automatic via Firebase/GCP)

## 🔐 Environment Variables Setup

### Cloud Run Environment Variables

Set these in Cloud Run deployment:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Optional (for features)
SENDGRID_API_KEY=your-key
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

Set via gcloud CLI:
```powershell
gcloud run services update billsutra-api \
  --set-env-vars "SUPABASE_URL=...,SUPABASE_ANON_KEY=..."
```

Or via Cloud Console:
1. Go to Cloud Run → billsutra-api
2. Click **EDIT & DEPLOY NEW REVISION**
3. **Variables & Secrets** → Add each variable

## 🔄 CI/CD Pipeline (Optional but Recommended)

### GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GCP

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
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
      - run: gcloud run deploy billsutra-api --source ./server
```

## 📈 Monitoring & Analytics

### Set Up Monitoring

- [ ] **Firebase Analytics**: Track user behavior
- [ ] **Cloud Monitoring**: Track API performance
- [ ] **Error Tracking**: Sentry or Cloud Error Reporting
- [ ] **Uptime Monitoring**: UptimeRobot or Pingdom

### Create Alerts

- [ ] API response time > 2s
- [ ] Error rate > 5%
- [ ] Database CPU > 80%
- [ ] Disk usage > 80%

## 🧪 Pre-Launch Testing

### Test Checklist

- [ ] User registration/login works
- [ ] Rooms page loads correctly
- [ ] Create booking from production UI
- [ ] Add folio items
- [ ] Checkout process
- [ ] Generate invoice PDF
- [ ] Bill payment status updates
- [ ] Multi-tenant isolation verified
- [ ] Mobile responsiveness
- [ ] Performance (Lighthouse score > 90)

### Load Testing

```powershell
# Install artillery
npm install -g artillery

# Create load-test.yml
artillery quick --count 10 --num 50 https://your-api.run.app/api/health
```

## 🚀 Launch Day

1. **Final Deployment**
   ```powershell
   # Frontend
   cd client
   npm run build
   firebase deploy --only hosting

   # Backend
   cd ../server
   gcloud run deploy billsutra-api --source .
   ```

2. **Smoke Tests**
   - [ ] Visit production URL
   - [ ] Create test booking
   - [ ] Verify checkout
   - [ ] Check database

3. **Monitoring**
   - [ ] Open Cloud Run logs
   - [ ] Open Firebase Hosting dashboard
   - [ ] Monitor error rates

4. **Announce**
   - [ ] Notify users
   - [ ] Share URL
   - [ ] Celebrate! 🎉

## 💰 Cost Estimates

### Free Tier Limits

| Service | Free Tier | Typical Usage | Cost if Exceeded |
|---------|-----------|---------------|------------------|
| **Firebase Hosting** | 10GB/month | 2GB | $0.15/GB |
| **Cloud Run** | 2M requests/month | 100k | $0.40/M requests |
| **Supabase** | 500MB DB, 2GB bandwidth | 200MB, 1GB | $25/month (Pro) |
| **Firebase Auth** | 10k users | 50 users | Free up to 50k |

**Expected monthly cost for small hotel**: **$0-5**  
**Expected monthly cost at scale (10 hotels)**: **$10-25**

## 🔒 Security Checklist

- [x] Helmet security headers
- [x] Rate limiting (100 req/15min)
- [x] Input validation
- [x] SQL injection prevention
- [x] XSS protection
- [x] Audit logging
- [ ] HTTPS only (automatic on Firebase/Cloud Run)
- [ ] Environment secrets management
- [ ] Row-level security (Supabase RLS)
- [ ] Regular security audits

## 📞 Support & Maintenance

### Weekly Tasks
- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Backup verification

### Monthly Tasks
- [ ] Security updates
- [ ] Dependency updates
- [ ] Performance optimization

### Quarterly Tasks
- [ ] Feature releases
- [ ] User feedback review
- [ ] Cost optimization

## 🎯 Success Metrics

After deployment, track:
- ✅ Uptime > 99.9%
- ✅ Response time < 500ms
- ✅ Error rate < 1%
- ✅ User satisfaction > 4.5/5
- ✅ Mobile usage > 40%

---

## 📚 Resources

- **Firebase Docs**: https://firebase.google.com/docs/hosting
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Actions**: https://docs.github.com/actions

---

**Current Progress**: Database migration ready → Next: Deploy! 🚀
