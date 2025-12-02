# BillSutra - Complete Business Management Solutions

BillSutra is an all-in-one platform for hotel management, restaurant POS, pharmacy management, and GST-compliant billing.

## 🌟 Key Features

### Hotel Management System (HMS)
- **Online Booking Engine** - Integrated reservations with real-time availability
- **Room Management** - Visual floor plans with 8-state workflow (Available, Occupied, Dirty, Clean, Inspected, Maintenance)
- **Front Desk Operations** - Quick check-in/check-out, guest management, group bookings
- **Housekeeping Automation** - Auto-task generation, priority scoring, staff tracking
- **Smart Billing** - GST-compliant invoicing, multiple payment methods, folio management
- **Advanced Analytics** - Real-time KPIs (Occupancy Rate, ADR, RevPAR), 30-day trends

### Restaurant Management System
- Complete POS with table management
- Kitchen display system
- Inventory tracking
- Online ordering integration
- GST-compliant billing

### Pharmacy Management System  
- Inventory management with expiry alerts
- Prescription tracking
- Stock control
- Compliance management
- POS integration

## 📁 Project Structure

```
BillSutra/
├── billsutra-website/          # Next.js marketing website
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── products/       # Product pages (HMS, POS, Pharmacy)
│   │   │   ├── demo/           # Demo page with video & download links
│   │   │   ├── hms-demo/       # Interactive HMS demo
│   │   │   └── ...
│   │   ├── components/         # Reusable components
│   │   └── styles/             # Global styles & animations
│   └── public/
│       └── downloads/          # HMS desktop app installer
│
├── billsutra-hms/              # Electron desktop application
│   ├── client/                 # React Vite frontend
│   │   ├── src/
│   │   │   ├── pages/         # Dashboard, Rooms, Bookings, etc.
│   │   │   ├── components/    # Folio, Invoice, Modals
│   │   │   └── api.js         # API integration
│   │   └── vite.config.js
│   │
│   ├── server/                 # Node.js Express backend
│   │   ├── routes/            # API endpoints
│   │   ├── models/            # Data models
│   │   ├── repositories/      # File-based data storage
│   │   └── index.js           # Express server
│   │
│   ├── electron-main.js       # Electron main process
│   ├── electron-builder.json  # Installer configuration
│   └── package.json
│
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Windows 10+ (for desktop app)

### Option 1: Download Desktop App (Easiest)

1. Visit the [demo page](https://billsutra.com/demo)
2. Click **"Download Desktop App"**
3. Run the installer: `BillSutra-HMS-Setup.exe`
4. Launch the application

**Demo Credentials:**
- Username: `admin`
- Password: `admin123`

### Option 2: Run Website Locally

```bash
# Navigate to website directory
cd billsutra-website

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Option 3: Run HMS App from Source

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
cd ..

# Start server and client
npm run dev

# For Electron desktop app
npm run electron:dev
```

## 📦 Building the Desktop App

```bash
# Build client
npm run build:client

# Build Windows installer
npm run dist:win

# Build for macOS
npm run dist:mac

# Build for Linux
npm run dist:linux
```

The installer will be created in `dist-electron/` folder.

## 🌐 Website Tech Stack

- **Framework**: Next.js 16.0.5 with Turbopack
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion v12
- **Icons**: Lucide React
- **Typography**: Inter font
- **Deployment**: Vercel-ready

### Design System
- **Dark Mode**: Premium dark theme (#030712)
- **Colors**: Aurora gradients (blue, indigo, purple)
- **Effects**: Glassmorphism, mesh gradients, 3D transforms
- **Animations**: Smooth parallax, micro-interactions, entrance effects

## 💻 Desktop App Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Node.js Express
- **Desktop**: Electron 39
- **Database**: File-based JSON storage
- **Security**: JWT authentication, BCrypt hashing
- **License**: Machine ID binding with master keys

## 🔐 Features

### Authentication
- Secure login with JWT tokens
- Master license keys system
- Machine ID binding for license validation
- Role-based access control (SuperAdmin, HotelAdmin, Staff)

### Data Management
- Real-time synchronization
- Backup and restore functionality
- Multi-property support
- Guest history tracking

### Reporting & Analytics
- GST-compliant invoicing
- Revenue analytics
- Occupancy trends
- Guest statistics
- Customizable reports

## 📄 Documentation

- [API Reference](./billsutra-hms/API_REFERENCE.md) - Complete API documentation
- [Features Guide](./billsutra-hms/FEATURES_GUIDE.md) - Detailed feature overview
- [Quick Start Guide](./billsutra-hms/QUICKSTART.md) - Get started in 5 minutes
- [Manual Testing Guide](./billsutra-hms/MANUAL_TESTING_GUIDE.md) - Testing procedures

## 🎯 Pricing

### Hotel Management System
- **Basic**: ₹9,999/year (20 rooms)
- **Professional**: ₹19,999/year (50 rooms)  
- **Enterprise**: ₹39,999/year (unlimited rooms)

All plans include 14-day free trial with no credit card required.

## 🤝 Support

- **Email**: support@billsutra.com
- **Website**: https://billsutra.com
- **Demo Page**: https://billsutra.com/demo
- **Interactive Demo**: https://billsutra.com/hms-demo

## 📄 License

BillSutra uses a master key licensing system. See LICENSE.txt for details.

## 🔗 Links

- **Website**: [billsutra.com](https://billsutra.com)
- **Download**: [Get Desktop App](https://billsutra.com/demo)
- **API Docs**: [billsutra.com/api](https://billsutra.com)
- **Support**: [contact@billsutra.com](mailto:contact@billsutra.com)

---

**Made with ❤️ for business owners who want better solutions.**

*Last Updated: January 2025*
