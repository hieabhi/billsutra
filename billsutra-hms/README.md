# BillSutra - Hotel GST Billing Software

A beautiful, modern, and fully-featured web-based GST billing application designed specifically for hotels. Built with React, Node.js, Express, and MongoDB.

## ✨ Features

### 🧾 Billing & Invoicing
- **Create GST-Compliant Invoices** - Generate tax invoices with CGST, SGST, and IGST calculations
- **Professional Invoice Templates** - Beautiful, printable invoices with hotel branding
- **Auto Bill Numbering** - Automatic sequential invoice numbering with custom prefix
- **Multiple Payment Methods** - Support for Cash, Card, UPI, and other payment modes
- **Amount in Words** - Automatic conversion of totals to words for Indian currency

### 📊 GST Calculations
- **Accurate Tax Calculations** - Automatic CGST, SGST, and IGST computation
- **HSN/SAC Code Support** - Full support for HSN and SAC codes
- **Item-wise Tax Breakdown** - Detailed tax calculations for each line item
- **Tax Reports** - Comprehensive GST summaries and reports

### 📦 Inventory Management
- **Item/Menu Catalog** - Manage your products and services
- **Category Management** - Organize items by Food, Beverage, Room Service, etc.
- **Rate Management** - Easy price updates
- **Tax Configuration** - Set custom GST rates per item

### 👥 Customer Management
- **Customer Database** - Store customer information for quick billing
- **GST Details** - Maintain customer GST numbers
- **Customer Types** - Categorize as Walk-in, Regular, or Corporate
- **Quick Search** - Auto-complete customer selection

### 📈 Reports & Analytics
- **Dashboard** - Real-time sales overview with today's and monthly revenue
- **Sales Reports** - Date-wise sales summaries
- **GST Reports** - Tax collection reports with CGST/SGST/IGST breakdown
- **Export Functionality** - Download reports as CSV files

### ⚙️ Settings & Configuration
- **Hotel Profile** - Configure hotel name, address, GST number
- **Bank Details** - Add bank account information for invoices
- **Custom Terms** - Set invoice terms and conditions
- **Invoice Customization** - Custom invoice prefix and numbering

## 🚀 Tech Stack

### Frontend
- **React** - Modern UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons
- **CSS3** - Custom styling with modern design

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** - Comes with Node.js

## 🛠️ Installation

### 1. Clone or Navigate to the Project

```bash
cd "c:\Users\AbhijitVibhute\Desktop\BillSutra"
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure Environment Variables

The `.env` file is already created with default values. You can modify it as needed:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/billsutra
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
# If MongoDB is installed as a service, it should start automatically
# Otherwise, run:
mongod
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 6. Migrate Checkout History (One-time)

If you have existing checked-out bookings, run this migration to populate room histories:

```bash
node server/migrate-checkout-history.js
```

This will:
- Scan all CheckedOut/Cancelled/NoShow bookings
- Add them to respective room's checkout history
- Safe to run multiple times (skips duplicates)
- Keeps last 100 entries per room

**Note:** All future checkouts automatically add to room history. This migration is only needed once for existing data.

### 7. Run the Application

#### Development Mode (Recommended)

Run both frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:5173`

#### Production Mode

Build the frontend and run the server:

```bash
npm run build
npm start
```

## 📱 Usage

### First Time Setup

1. **Access the Application**
   - Open your browser and navigate to `http://localhost:5173`

2. **Login**
   - Username: `admin`
   - Password: `admin123`

3. **Configure Settings**
   - Go to Settings page
   - Enter your hotel details (name, address, GST number)
   - Add bank details (optional)
   - Set invoice terms and conditions

4. **Add Items**
   - Navigate to Items page
   - Click "Add Item"
   - Add your menu items/services with rates and GST rates

5. **Add Customers** (Optional)
   - Go to Customers page
   - Add regular customers for quick billing

### Creating a Bill

1. Click "New Bill" from the sidebar
2. Enter customer details (or select from existing customers)
3. Add line items:
   - Select item from catalog or type manually
   - Set quantity and rate
   - GST rates auto-populate from item master
4. Review totals (automatically calculated)
5. Select payment method
6. Add notes (optional)
7. Click "Save & Generate Invoice"
8. Print or save the invoice

### Viewing Reports

1. Navigate to Reports page
2. Select date range
3. View sales summary and GST breakdown
4. Export to CSV if needed

## 🎨 Features Breakdown

### Dashboard
- Today's revenue and bill count
- Monthly revenue statistics
- Recent bills list
- Quick overview cards

### Billing
- Multi-item billing
- Real-time GST calculations
- Customer auto-complete
- Item auto-complete from catalog
- Print-ready invoices

### Invoice Format
- Hotel header with logo space
- Customer billing details
- Itemized list with HSN codes
- Tax breakdown (CGST/SGST/IGST)
- Amount in words
- Bank details
- Terms & conditions
- Signature sections

### Reports
- Date-wise filtering
- Revenue summaries
- Tax collection reports
- CSV export functionality

## 🔐 Security Note

⚠️ **Important for Production:**
- Change the default admin credentials
- Update `JWT_SECRET` in `.env` file
- Implement proper authentication
- Use HTTPS in production
- Secure MongoDB with authentication
- Never commit `.env` file to version control

## 📂 Project Structure

```
BillSutra/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── api.js         # API configuration
│   │   ├── utils.js       # Utility functions
│   │   ├── App.jsx        # Main app component
│   │   └── index.css      # Global styles
│   └── package.json
├── server/                 # Backend Express app
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   └── index.js           # Server entry point
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Customization

### Adding New Item Categories
Edit `server/models/Item.js` and add to the enum array:
```javascript
category: {
  type: String,
  enum: ['Food', 'Beverage', 'Your Category', ...],
}
```

### Changing GST Rates
Default GST rates can be modified in the Item model or per-item basis through the UI.

### Invoice Customization
Edit `client/src/components/InvoicePreview.jsx` and corresponding CSS for custom invoice layouts.

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify MongoDB service status

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

### Frontend Not Loading
- Clear browser cache
- Check if backend is running
- Verify proxy settings in `vite.config.js`

## 📝 License

MIT License - Free to use for personal and commercial projects

## 🤝 Support

For issues and questions:
- Check the documentation
- Review error logs in console
- Ensure all dependencies are installed

## 🎯 Roadmap

Future enhancements:
- Multi-user support with roles
- Inventory stock management
- SMS/Email invoice delivery
- Payment gateway integration
- Mobile app version
- Multi-language support
- Cloud deployment guide

---

**Made with ❤️ for Hotels**

Enjoy using BillSutra for your hotel billing needs!
