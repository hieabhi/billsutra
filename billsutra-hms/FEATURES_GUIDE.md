# BillSutra - Features Overview

## 🎨 Application Screenshots & Features

### 🔐 Login Page
**Features:**
- Clean, modern login interface
- Gradient background (purple/indigo)
- Demo credentials displayed
- Simple authentication

**What you'll see:**
- Hotel icon with BillSutra branding
- Username and password fields
- Demo credentials: admin / admin123

---

### 📊 Dashboard
**Features:**
- Real-time statistics cards
- Today's revenue and bill count
- Monthly revenue summary
- Total bills count
- Recent bills table
- Beautiful color-coded stat cards

**Key Metrics Displayed:**
- Today's Revenue (green card)
- Monthly Revenue (purple card)
- Total Bills (orange card)
- Recent 5 bills with customer names

---

### 🧾 New Bill / Create Invoice
**Features:**
- Customer details section with auto-complete
- Dynamic item table with add/remove functionality
- Real-time GST calculations (CGST/SGST/IGST)
- HSN code support
- Automatic total calculation
- Payment method selection
- Notes field
- Save & Generate button

**Workflow:**
1. Enter customer details (name, phone, email, GST, address)
2. Add items - select from catalog or type manually
3. Set quantity and rate
4. GST auto-calculates per item
5. View running totals (Subtotal, CGST, SGST, IGST, Grand Total)
6. Select payment method
7. Add notes (optional)
8. Click "Save & Generate Invoice"

**Auto-calculations:**
- Subtotal = Sum of (Qty × Rate)
- CGST = Subtotal × CGST%
- SGST = Subtotal × SGST%
- IGST = Subtotal × IGST%
- Grand Total = Subtotal + All Taxes

---

### 🖨️ Invoice Preview & Print
**Features:**
- Professional GST-compliant invoice
- Hotel header with complete details
- "TAX INVOICE" heading
- Customer billing address
- Itemized table with:
  - S.No, Description, HSN, Qty, Rate
  - Amount, CGST, SGST, IGST, Total
- Tax breakdown by type
- Grand total with amount in words
- Payment method and status
- Bank details section
- Terms & conditions
- Signature areas
- Print button
- Print-optimized layout

**Invoice Sections:**
1. **Header:** Hotel name, address, contact, GST number
2. **Invoice Details:** Bill number, date
3. **Customer:** Bill to section
4. **Items Table:** Detailed line items with tax breakdown
5. **Totals:** Subtotal, taxes, grand total
6. **Amount in Words:** Indian format (Lakhs, Crores)
7. **Payment Info:** Method and status
8. **Bank Details:** For payment reference
9. **Terms:** Custom terms and conditions
10. **Signatures:** Customer and authorized signatory

---

### 📋 Bills List
**Features:**
- Searchable and filterable bill list
- Date range filtering
- Status filtering (Paid/Unpaid/Cancelled)
- Bill details table showing:
  - Bill number
  - Date
  - Customer name and phone
  - Item count
  - Amount
  - Payment method
  - Status badge
- Action buttons:
  - View (eye icon) - Opens invoice
  - Delete (trash icon) - Removes bill

**Color-coded Status:**
- 🟢 Paid - Green badge
- 🟡 Unpaid - Yellow badge
- 🔴 Cancelled - Red badge

---

### 📦 Items / Menu Management
**Features:**
- Complete item catalog
- Add/Edit/Delete items
- Category-based organization
- HSN code management
- GST rate configuration per item
- Active/Inactive status
- Modal-based add/edit form

**Item Fields:**
- Name, Category (Food/Beverage/Room Service/etc.)
- HSN/SAC code
- Rate (price)
- CGST %, SGST %, IGST %
- Description
- Active/Inactive status

**Table Columns:**
- Name, Category, HSN, Rate
- CGST %, SGST %, IGST %
- Status badge
- Edit and Delete actions

---

### 👥 Customer Management
**Features:**
- Customer database
- Add/Edit/Delete customers
- Customer type categorization
- Quick search and auto-complete
- GST number storage
- Contact details management

**Customer Fields:**
- Name (required)
- Phone, Email
- Address
- GST Number
- Type: Walk-in / Regular / Corporate

**Benefits:**
- Quick billing for repeat customers
- Maintain GST details for B2B
- Customer history tracking
- Auto-fill customer details in bills

---

### 📈 Reports & Analytics
**Features:**
- Date range filtering
- Statistics dashboard with 4 cards:
  - Total Revenue
  - Total Bills
  - Total Tax Collected
  - Average Bill Value
- Detailed sales summary table
- GST breakdown (CGST/SGST/IGST)
- CSV export functionality
- Period-wise comparison

**Report Table Shows:**
- Bill number, Date, Customer
- Subtotal
- CGST, SGST, IGST amounts
- Total tax
- Grand total
- Summary row with totals

**Export Feature:**
- Download as CSV file
- Includes all visible data
- Filename: sales-report-[date-range].csv

---

### ⚙️ Settings
**Features:**
- Hotel information configuration
- Contact details
- GST number setup
- Invoice customization
- Bank details management
- Terms & conditions editor

**Settings Sections:**

1. **Hotel Information:**
   - Hotel name
   - Address
   - Phone, Email
   - GST number
   - Invoice prefix

2. **Bank Details:**
   - Bank name
   - Account number
   - IFSC code
   - Branch

3. **Terms & Conditions:**
   - Custom invoice terms
   - Multi-line text editor

**Impact on Invoices:**
- All settings appear on printed invoices
- Updates reflect immediately
- Maintains professional branding

---

## 🎨 Design Elements

### Color Palette
- **Primary:** #4f46e5 (Indigo)
- **Secondary:** #10b981 (Green)
- **Danger:** #ef4444 (Red)
- **Warning:** #f59e0b (Amber)
- **Dark:** #1f2937 (Dark Gray)
- **Light:** #f3f4f6 (Light Gray)

### UI Components
- **Cards:** White background, rounded corners, subtle shadow
- **Buttons:** Multiple variants with hover effects
- **Tables:** Striped rows, hover highlighting
- **Forms:** Clean inputs with focus states
- **Modal:** Overlay with centered popup
- **Sidebar:** Dark gradient navigation

### Responsive Design
- **Desktop:** Full sidebar + main content
- **Tablet:** Collapsible sidebar
- **Mobile:** Bottom navigation, stacked layout

---

## 🚀 User Flow

### First-time Setup Flow:
1. Login → Dashboard
2. Settings → Configure hotel details
3. Items → Add menu items
4. Customers → Add regular customers (optional)
5. New Bill → Create first invoice

### Daily Operation Flow:
1. Login → Dashboard (view today's stats)
2. New Bill → Create customer invoice
3. Print invoice or email
4. View Bills → Check history
5. Reports → End-of-day/month review

### Month-end Flow:
1. Reports → Select month date range
2. Review GST breakdown
3. Export to CSV
4. File GST returns

---

## ✨ Key Benefits

✅ **Time-Saving:** Auto-calculations, templates, quick search  
✅ **GST Compliant:** Follows Indian GST invoice format  
✅ **Professional:** Beautiful invoices, hotel branding  
✅ **Easy to Use:** Intuitive interface, minimal training  
✅ **Reports Ready:** Built-in analytics and exports  
✅ **Offline Capable:** Works on local network  
✅ **Customizable:** Settings, terms, rates all editable  
✅ **Scalable:** Handles unlimited bills, items, customers  

---

**Experience the power of professional billing with BillSutra! 🎉**
