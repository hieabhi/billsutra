# 🔑 BillSutra License System - Complete Guide

## Overview

BillSutra uses a secure license key system to protect your software and manage customer activations. Each license key is encrypted and can be bound to a specific computer.

---

## 📋 License Types

### TRIAL
- **Duration**: 30 days
- **Max Rooms**: 10
- **Features**: Basic features only
- **Price**: FREE
- **Use**: For evaluation/testing

### BASIC
- **Duration**: 1 year
- **Max Rooms**: 20
- **Features**: Basic + Reports
- **Price**: ₹9,999
- **Use**: Small hotels, guesthouses

### PROFESSIONAL
- **Duration**: 1 year
- **Max Rooms**: 50
- **Features**: Basic + Reports + Advanced + Multi-user
- **Price**: ₹19,999
- **Use**: Medium hotels

### ENTERPRISE
- **Duration**: 1 year
- **Max Rooms**: Unlimited (999)
- **Features**: All features + API + Custom
- **Price**: ₹39,999
- **Use**: Large hotels, chains

---

## 🔧 Generating License Keys

### Method 1: Interactive CLI (Recommended)

```bash
cd "c:\Users\AbhijitVibhute\Desktop\BillSutra - Latest Backup"
node generate-license.js
```

Follow the prompts:
1. Select "Generate License Key"
2. Enter hotel name
3. Enter customer email
4. Select license type (1-4)
5. Choose machine binding (optional)
6. Copy the generated key

### Method 2: Programmatic Generation

```javascript
const { generateLicenseKey } = require('./license-utils');

// Generate a Basic license
const licenseKey = generateLicenseKey({
  hotelName: 'Grand Hotel',
  email: 'owner@grandhotel.com',
  type: 'BASIC'  // TRIAL, BASIC, PROFESSIONAL, ENTERPRISE
});

console.log('License Key:', licenseKey);
```

### Method 3: Machine-Bound License

```javascript
// Customer must provide their Machine ID first
const licenseKey = generateLicenseKey({
  hotelName: 'Grand Hotel',
  email: 'owner@grandhotel.com',
  type: 'PROFESSIONAL',
  machineId: 'abc123def456...'  // From customer's machine
});
```

---

## 📧 Customer Activation Process

### Step 1: Customer Installs BillSutra
- Download `BillSutra-Setup-1.0.0.exe`
- Run installer
- Complete installation

### Step 2: First Launch
- App opens activation window
- Shows Machine ID
- Customer sends Machine ID to you (optional for binding)

### Step 3: You Generate License
```bash
node generate-license.js
```
- Enter customer details
- Generate key
- Email license key to customer

### Step 4: Customer Activates
- Customer pastes license key
- Clicks "Activate BillSutra"
- App validates and starts

---

## 🔍 Validating License Keys

### CLI Validation
```bash
node generate-license.js
# Select option 2 (Validate License Key)
# Paste license key
```

### Programmatic Validation
```javascript
const { validateLicenseKey } = require('./license-utils');

const validation = validateLicenseKey(licenseKey, machineId);

if (validation.valid) {
  console.log('✅ Valid license');
  console.log('Days remaining:', validation.daysRemaining);
  console.log('Hotel:', validation.data.hotelName);
} else {
  console.log('❌ Invalid license');
  console.log('Reason:', validation.error);
}
```

---

## 💻 How It Works Technically

### 1. License Generation
```
Customer Data → Encrypt with AES → Base64 Encode → License Key
```

### 2. License Validation
```
License Key → Base64 Decode → Decrypt with AES → Verify Expiry + Machine
```

### 3. Machine Binding
- Uses `node-machine-id` to get unique hardware ID
- Combines CPU, motherboard, and MAC address
- Same ID across reboots
- Changes if hardware changes significantly

### 4. Storage
- License saved to: `%AppData%\BillSutra Hotel Management\license.dat`
- Encrypted on disk
- Validated on every app startup

---

## 🛡️ Security Features

1. **AES Encryption**: License data encrypted with AES-256
2. **Machine Binding**: Optional hardware-based locking
3. **Expiry Checking**: Automatic expiration validation
4. **Tamper Protection**: Encrypted storage prevents editing
5. **Offline Validation**: Works without internet (machine-bound only)

---

## 📊 Customer Management Workflow

### New Customer
1. Customer downloads installer
2. Installs and launches (shows activation screen)
3. Sends you: Hotel name, Email, Machine ID
4. You generate license key
5. Email license key to customer
6. Customer activates
7. **Record in spreadsheet**: Name, Email, Machine ID, License Type, Date, Expiry

### Renewal
1. Customer contacts you before expiry
2. You generate new license key (same type or upgrade)
3. Email new key
4. Customer deactivates old → activates new
5. **Update spreadsheet**: New expiry date

### Support
1. Customer can view license info in Settings → License tab
2. Shows: Type, Expiry, Days remaining, Machine ID
3. Warning shown 30 days before expiry

---

## 🔄 Common Scenarios

### Scenario 1: Free Trial
```bash
node generate-license.js
# Type: TRIAL
# No machine binding needed
# Send key immediately
```

### Scenario 2: Paid License
```bash
# After payment confirmed:
node generate-license.js
# Type: BASIC/PROFESSIONAL/ENTERPRISE
# Use machine ID from customer
# Email key with invoice
```

### Scenario 3: License Transfer (New Computer)
```bash
# Customer got new computer
# Generate new key with new Machine ID
# Deactivate old license (optional)
node generate-license.js
```

### Scenario 4: Lost License Key
- Check your records (spreadsheet)
- Re-generate with same details
- **Note**: Each generation creates different key (date changes)
- Better to keep original key saved

---

## 📝 Example Customer Email Template

```
Subject: Your BillSutra License Key

Dear [Hotel Name],

Thank you for purchasing BillSutra Hotel Management Software!

Your license details:
- License Type: Professional
- Valid Until: [Date + 1 year]
- Maximum Rooms: 50

Your License Key:
[PASTE KEY HERE - ONE LONG LINE]

ACTIVATION STEPS:
1. Launch BillSutra
2. Paste the license key in the activation window
3. Click "Activate BillSutra"
4. Start managing your hotel!

IMPORTANT:
- Keep this email safe for your records
- Your license is bound to Machine ID: [MACHINE ID]
- For support, contact us at: support@billsutra.com

Enjoy using BillSutra!

Best regards,
BillSutra Team
```

---

## 🚨 Troubleshooting

### "Invalid license key"
- Key was copied incorrectly (spaces/line breaks)
- Key is for different machine (machine binding)
- Secret key changed (don't change SECRET_KEY in production!)

### "License expired"
- Generate new license key
- Update expiry date logic if needed

### "Machine ID mismatch"
- Customer changed hardware significantly
- Generate new key with new Machine ID
- Or generate without machine binding

### Customer can't see Machine ID
- Machine ID shown in activation window
- Also shown in Settings → License tab (after activation)
- Or run: `node -e "console.log(require('node-machine-id').machineIdSync())"`

---

## 📦 Deployment Checklist

Before distributing:

- [ ] Change `SECRET_KEY` in `license-utils.js` to something unique
- [ ] Test license generation
- [ ] Test license activation
- [ ] Test expiry warnings
- [ ] Test machine binding
- [ ] Test deactivation
- [ ] Create customer database spreadsheet
- [ ] Prepare email templates
- [ ] Set up payment system
- [ ] Test full customer journey

---

## 🔐 CRITICAL: Change Secret Key Before Production!

**In `license-utils.js` line 5:**

```javascript
// BEFORE (Development)
const SECRET_KEY = 'BillSutra-2025-Hotel-PMS-Secret-Key-Change-This';

// AFTER (Production) - Use random long string
const SECRET_KEY = 'YourUniqueRandomSecretKey_DO_NOT_SHARE_THIS_xyz789!@#';
```

**⚠️ WARNING**: 
- Once you change this, old licenses won't work
- Set it ONCE before first customer
- NEVER change it again (all licenses will break)
- Keep it SECRET and SECURE

---

## 📊 License Tracking Spreadsheet Template

| Date | Hotel Name | Email | Phone | License Type | Machine ID | Expiry Date | Status | Notes |
|------|-----------|-------|-------|-------------|-----------|-------------|--------|-------|
| 2025-11-26 | Grand Hotel | owner@grand.com | +91-xxx | PROFESSIONAL | abc123... | 2026-11-26 | Active | Paid ₹19,999 |
| 2025-11-25 | City Inn | info@city.com | +91-yyy | BASIC | def456... | 2026-11-25 | Active | Paid ₹9,999 |

---

## 💡 Tips

1. **Always save generated keys** - Create a text file with all keys
2. **Use machine binding** - Prevents sharing between hotels
3. **Don't bind for trials** - Easier for evaluation
4. **Send renewal reminders** - 60 days, 30 days, 15 days before expiry
5. **Keep customer database** - Excel/Google Sheets is fine
6. **Test regularly** - Generate and validate test keys monthly

---

## 🎯 Revenue Optimization

### Upselling
- Trial (FREE) → Basic (₹9,999)
- Basic → Professional (₹19,999)
- Professional → Enterprise (₹39,999)

### Renewals
- Offer 10% discount for early renewal (60 days before expiry)
- Bundle 2 years for 1.8x price
- Lifetime license: 3x annual price

### Support Packages
- Basic: Email only (included)
- Pro: WhatsApp + Phone (₹2,999/year)
- Enterprise: On-site support (₹10,000/visit)

---

For questions or issues, check the code in:
- `license-utils.js` - Core functions
- `generate-license.js` - CLI tool
- `electron-license.js` - Electron integration
- `electron-main.js` - App activation flow
