# Quick Start Guide - BillSutra

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

Open PowerShell in the BillSutra folder and run:

```powershell
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Start MongoDB

Make sure MongoDB is installed and running. If you have MongoDB installed as a Windows service, it should already be running. Otherwise:

```powershell
# Start MongoDB (if not running as a service)
mongod
```

### Step 3: Run the Application

```powershell
npm run dev
```

This will start both the backend (port 5000) and frontend (port 5173).

### Step 4: Access the Application

Open your browser and go to: **http://localhost:5173**

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

### Step 5: Initial Setup

1. **Settings** → Enter your hotel details
2. **Items** → Add your menu items/services
3. **New Bill** → Create your first invoice!

## 📌 Important Notes

- **MongoDB Required**: Ensure MongoDB is installed and running
- **Node.js**: Version 16 or higher required
- **Ports**: Make sure ports 5173 and 5000 are available

## 🎯 Key Features to Try

1. ✅ Create a bill with GST calculations
2. ✅ Print professional invoices
3. ✅ View sales reports and analytics
4. ✅ Manage customers and items
5. ✅ Export reports to CSV

## ❓ Need Help?

Check the main README.md for detailed documentation and troubleshooting.

---

Happy Billing! 🎉
