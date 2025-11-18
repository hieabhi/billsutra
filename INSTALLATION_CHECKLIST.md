# Installation Checklist ✅

## Pre-Installation Requirements

- [ ] **Node.js** installed (v16+)
  - Check: Run `node --version` in PowerShell
  - Download: https://nodejs.org/

- [ ] **MongoDB** installed and running
  - Check: Run `mongod --version` in PowerShell
  - Download: https://www.mongodb.com/try/download/community

- [ ] **npm** installed (comes with Node.js)
  - Check: Run `npm --version` in PowerShell

## Installation Steps

### 1. Install Dependencies

```powershell
# Navigate to project folder
cd "c:\Users\AbhijitVibhute\Desktop\BillSutra"

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

**Expected Result:**
- [ ] No errors during installation
- [ ] `node_modules` folder created in root
- [ ] `node_modules` folder created in `client`

### 2. Verify Configuration

- [ ] `.env` file exists in root folder
- [ ] `.env` contains MongoDB URI
- [ ] Port 5000 is available for backend
- [ ] Port 5173 is available for frontend

### 3. Start MongoDB

```powershell
# Check if MongoDB is running
mongod --version
```

- [ ] MongoDB service is running

### 4. Run the Application

```powershell
# From project root
npm run dev
```

**Expected Output:**
```
[server] Server running on port 5000
[server] MongoDB connected successfully
[client] VITE v5.x.x ready in xxx ms
[client] ➜ Local: http://localhost:5173
```

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] MongoDB connection successful

### 5. Access the Application

Open browser and navigate to: **http://localhost:5173**

- [ ] Login page loads
- [ ] Can login with admin/admin123
- [ ] Dashboard displays
- [ ] All menu items are accessible

### 6. Test Core Features

- [ ] **Settings**: Can update hotel information
- [ ] **Items**: Can add a new item
- [ ] **Customers**: Can add a new customer
- [ ] **New Bill**: Can create a bill
- [ ] **Invoice**: Invoice preview and print works
- [ ] **Bills**: Can view bill list
- [ ] **Reports**: Can view reports

## File Verification

### Backend Files
- [ ] `server/index.js`
- [ ] `server/models/Bill.js`
- [ ] `server/models/Customer.js`
- [ ] `server/models/Item.js`
- [ ] `server/models/Settings.js`
- [ ] `server/routes/auth.js`
- [ ] `server/routes/bills.js`
- [ ] `server/routes/customers.js`
- [ ] `server/routes/items.js`
- [ ] `server/routes/settings.js`

### Frontend Files
- [ ] `client/src/App.jsx`
- [ ] `client/src/main.jsx`
- [ ] `client/src/api.js`
- [ ] `client/src/utils.js`
- [ ] `client/src/index.css`
- [ ] `client/src/components/Layout.jsx`
- [ ] `client/src/components/InvoicePreview.jsx`
- [ ] `client/src/pages/Login.jsx`
- [ ] `client/src/pages/Dashboard.jsx`
- [ ] `client/src/pages/NewBill.jsx`
- [ ] `client/src/pages/BillList.jsx`
- [ ] `client/src/pages/Items.jsx`
- [ ] `client/src/pages/Customers.jsx`
- [ ] `client/src/pages/Reports.jsx`
- [ ] `client/src/pages/Settings.jsx`

### Configuration Files
- [ ] `package.json` (root)
- [ ] `client/package.json`
- [ ] `client/vite.config.js`
- [ ] `.env`
- [ ] `.gitignore`

### Documentation Files
- [ ] `README.md`
- [ ] `QUICKSTART.md`
- [ ] `PROJECT_SUMMARY.md`
- [ ] `INSTALLATION_CHECKLIST.md` (this file)

## Troubleshooting

### MongoDB Connection Error
```
✗ Solution 1: Start MongoDB service
✗ Solution 2: Check MongoDB URI in .env
✗ Solution 3: Verify MongoDB is installed
```

### Port Already in Use
```
✗ Solution: Change PORT in .env file
✗ Or: Kill process using the port
```

### Module Not Found Error
```
✗ Solution: Delete node_modules and run npm install again
```

### Frontend Blank Page
```
✗ Solution 1: Clear browser cache
✗ Solution 2: Check browser console for errors
✗ Solution 3: Verify backend is running
```

## Success Indicators

✅ **You've successfully installed BillSutra when:**
1. Both servers start without errors
2. Login page loads at http://localhost:5173
3. Can login with demo credentials
4. Can navigate all pages
5. Can create a test bill
6. Invoice preview and print works

## Next Steps

Once installation is verified:
1. Go to **Settings** and configure your hotel details
2. Add your **Items/Menu** 
3. Add **Customers** (optional)
4. Create your first **Bill**
5. Explore **Reports** and analytics

---

**Need Help?**
- Check README.md for detailed documentation
- Review QUICKSTART.md for quick setup guide
- Check PROJECT_SUMMARY.md for feature overview

**Installation Complete! 🎉**
