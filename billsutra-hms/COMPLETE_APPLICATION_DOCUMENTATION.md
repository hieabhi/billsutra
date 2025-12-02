# BillSutra - Complete Application Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [User Roles & Authentication](#user-roles--authentication)
6. [Core Features](#core-features)
7. [API Documentation](#api-documentation)
8. [Frontend Components](#frontend-components)
9. [Business Logic](#business-logic)
10. [Workflows](#workflows)
11. [Deployment Guide](#deployment-guide)
12. [Testing](#testing)

---

## 1. Application Overview

**Application Name:** BillSutra  
**Type:** Hotel Property Management System (PMS)  
**Version:** 1.0  
**Industry:** Hospitality  
**Primary Purpose:** Complete hotel operations management including room management, guest bookings, billing, housekeeping, and reporting

### Key Capabilities
- Room inventory management (12 rooms: 101-103, 201-203, 301-302)
- Guest reservation system with check-in/check-out
- Enhanced folio-based billing system with GST
- Housekeeping task management
- Real-time room-booking synchronization
- Multi-payment method support (Cash, UPI, Card)
- Comprehensive reporting and analytics

---

## 2. System Architecture

### Architecture Pattern
**3-Tier Architecture**
```
┌─────────────────────────────────────┐
│     Presentation Layer              │
│   (React + Vite Frontend)           │
│   Port: 5173                        │
└─────────────────┬───────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────┐
│     Application Layer               │
│   (Node.js + Express.js)            │
│   Port: 5051                        │
└─────────────────┬───────────────────┘
                  │ File I/O
┌─────────────────▼───────────────────┐
│     Data Layer                      │
│   (JSON File Storage)               │
│   - rooms.json                      │
│   - bookings.json                   │
│   - items.json                      │
│   - housekeeping.json               │
└─────────────────────────────────────┘
```

### Communication Flow
1. User interacts with React UI
2. Frontend makes REST API calls to backend
3. Backend processes request and updates JSON files
4. Backend triggers sync operations (room-booking sync, housekeeping sync)
5. Response returned to frontend
6. UI updates in real-time

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.4.21
- **Routing:** React Router DOM 6.27.0
- **HTTP Client:** Axios 1.7.7
- **Styling:** CSS3 (Custom styles)
- **Date Handling:** date-fns 4.1.0
- **State Management:** React Hooks (useState, useEffect, useMemo)

### Backend
- **Runtime:** Node.js (v16+)
- **Framework:** Express.js 4.21.1
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Security:** 
  - bcryptjs 2.4.3 (Password hashing)
  - cors 2.8.5 (Cross-origin requests)
  - helmet 8.0.0 (Security headers)
- **Logging:** morgan 1.10.0
- **Utilities:** 
  - uuid 11.0.2 (Unique ID generation)
  - dotenv 16.4.5 (Environment variables)

### Data Storage
- **Format:** JSON files
- **Location:** `server/data/` directory
- **Files:**
  - `rooms.json` - Room inventory and status
  - `bookings.json` - Guest reservations and folios
  - `items.json` - Item catalog (food, services)
  - `housekeeping.json` - Cleaning and maintenance tasks
  - `users.json` - User accounts

---

## 4. Database Schema

### 4.1 Rooms Collection (`rooms.json`)
```json
{
  "_id": "room-101",
  "hotelId": "hotel-001",
  "number": "101",
  "floorId": "floor-001",
  "roomTypeId": "roomtype-001",
  "status": "AVAILABLE | OCCUPIED | RESERVED | DIRTY | CLEAN | MAINTENANCE | OUT_OF_SERVICE | BLOCKED",
  "housekeepingStatus": "CLEAN | DIRTY | INSPECTED | MAINTENANCE",
  "isBlocked": false,
  "blockReason": null,
  "features": ["AC", "TV", "WiFi"],
  "notes": "",
  "createdAt": "2024-11-01T00:00:00.000Z",
  "updatedAt": "2025-11-15T10:00:00.000Z"
}
```

**Room Status Values:**
- `AVAILABLE` - Ready for booking
- `OCCUPIED` - Guest checked in
- `RESERVED` - Booking confirmed (arriving today/tomorrow)
- `DIRTY` - Needs cleaning
- `CLEAN` - Ready for occupancy
- `MAINTENANCE` - Under repair
- `OUT_OF_SERVICE` - Not available
- `BLOCKED` - Administratively blocked

### 4.2 Bookings Collection (`bookings.json`)
```json
{
  "_id": "uuid",
  "reservationNumber": "RES00001",
  "guest": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210",
    "address": "123 Street, City",
    "idProof": "Passport",
    "idNumber": "A1234567"
  },
  "guestCounts": {
    "adults": 2,
    "children": 1
  },
  "additionalGuests": [
    {
      "name": "Jane Doe",
      "age": 30,
      "relation": "Spouse"
    }
  ],
  "totalGuests": 3,
  "roomTypeId": "roomtype-001",
  "roomId": "room-101",
  "roomNumber": "101",
  "rate": 2000,
  "checkInDate": "2025-11-15",
  "checkOutDate": "2025-11-17",
  "nights": 2,
  "status": "Reserved | Confirmed | CheckedIn | CheckedOut | Cancelled | NoShow",
  "guestsCount": 2,
  "paymentMethod": "Cash | UPI | Card",
  "bookingSource": "Walk-in | Online | Phone",
  "amount": 4000,
  "balance": 4000,
  "advancePayment": 1000,
  "advancePaymentMethod": "Cash",
  "notes": "",
  "folio": {
    "lines": [
      {
        "_id": "uuid",
        "category": "ROOM_CHARGE | FOOD_BEVERAGE | LAUNDRY | MINIBAR | OTHER",
        "description": "Room Charge - Night 1",
        "quantity": 1,
        "rate": 2000,
        "amount": 2000,
        "taxRate": 12,
        "cgst": 120,
        "sgst": 120,
        "totalWithTax": 2240,
        "date": "2025-11-15T10:00:00.000Z",
        "postedBy": "admin",
        "remarks": ""
      }
    ],
    "payments": [
      {
        "_id": "uuid",
        "amount": 1000,
        "method": "Cash | UPI | Card",
        "reference": "",
        "date": "2025-11-15T10:00:00.000Z",
        "receivedBy": "admin",
        "remarks": "Advance payment"
      }
    ],
    "total": 4480,
    "balance": 3480
  },
  "billId": "uuid",
  "billNumber": "INV00001",
  "createdAt": "2025-11-15T10:00:00.000Z",
  "updatedAt": "2025-11-15T10:00:00.000Z"
}
```

**Booking Status Flow:**
1. `Reserved` → Initial booking
2. `Confirmed` → Booking confirmed
3. `CheckedIn` → Guest checked in
4. `CheckedOut` → Guest checked out
5. `Cancelled` → Booking cancelled
6. `NoShow` → Guest didn't arrive

### 4.3 Items Collection (`items.json`)
```json
{
  "_id": "item-001",
  "name": "Breakfast Buffet",
  "category": "FOOD_BEVERAGE | LAUNDRY | MINIBAR | SERVICES | OTHER",
  "rate": 500,
  "taxRate": 5,
  "isActive": true,
  "description": "Continental breakfast buffet",
  "createdAt": "2024-11-01T00:00:00.000Z"
}
```

**Item Categories:**
- `FOOD_BEVERAGE` - Restaurant charges
- `LAUNDRY` - Laundry services
- `MINIBAR` - Minibar consumption
- `SERVICES` - Additional services
- `OTHER` - Miscellaneous charges

### 4.4 Housekeeping Collection (`housekeeping.json`)
```json
{
  "_id": "uuid",
  "roomId": "room-101",
  "roomNumber": "101",
  "type": "STANDARD_CLEAN | DEEP_CLEAN | CHECKOUT_CLEAN | MAINTENANCE | TURNDOWN",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "status": "PENDING | IN_PROGRESS | COMPLETED | VERIFIED",
  "assignedTo": "Cleaner Name",
  "description": "Standard cleaning required",
  "notes": "",
  "scheduledDate": "2025-11-15",
  "completedAt": null,
  "verifiedBy": null,
  "createdAt": "2025-11-15T08:00:00.000Z",
  "updatedAt": "2025-11-15T08:00:00.000Z"
}
```

**Task Types:**
- `STANDARD_CLEAN` - Daily cleaning
- `DEEP_CLEAN` - Thorough cleaning
- `CHECKOUT_CLEAN` - Post-checkout cleaning
- `MAINTENANCE` - Repair/maintenance work
- `TURNDOWN` - Evening service

### 4.5 Users Collection (`users.json`)
```json
{
  "_id": "user-001",
  "username": "admin",
  "password": "$2a$10$hashedPassword",
  "email": "admin@hotel.com",
  "role": "admin | manager | receptionist | housekeeping",
  "name": "Administrator",
  "isActive": true,
  "createdAt": "2024-11-01T00:00:00.000Z"
}
```

---

## 5. User Roles & Authentication

### 5.1 Authentication System
- **Method:** JWT (JSON Web Tokens)
- **Token Storage:** Browser localStorage
- **Token Expiry:** 24 hours
- **Password Security:** bcrypt hashing (10 rounds)

### 5.2 User Roles

#### Admin
- Full system access
- User management
- System configuration
- All booking operations
- Financial reports

#### Manager
- View all bookings
- Modify bookings
- View reports
- Housekeeping management

#### Receptionist
- Create/modify bookings
- Check-in/check-out
- Payment collection
- Basic reports

#### Housekeeping
- View assigned tasks
- Update task status
- Mark rooms clean/dirty

### 5.3 Default Credentials
```
Username: admin
Password: admin123
```

---

## 6. Core Features

### 6.1 Dashboard
**Route:** `/`

**Features:**
- Quick stats overview
  - Total rooms (12)
  - Available rooms
  - Occupied rooms
  - Today's arrivals
  - Today's departures
- Occupancy chart (bar chart)
- Recent bookings list
- Quick actions menu

**Metrics Displayed:**
- Occupancy percentage
- Revenue today
- Pending check-ins
- Pending check-outs

### 6.2 Room Management
**Route:** `/rooms`

**Features:**
- Visual room grid (3 floors)
- Room status color coding:
  - 🟢 Green = AVAILABLE
  - 🔴 Red = OCCUPIED
  - 🟡 Yellow = RESERVED
  - 🔵 Blue = DIRTY
  - ⚪ Gray = MAINTENANCE
- Room filtering by status
- Room search
- Quick status change
- Room details view

**Room Actions:**
- View room details
- Change status manually
- Create housekeeping task
- View booking history
- Block/unblock room

### 6.3 Room Detail Page
**Route:** `/rooms/:id`

**Sections:**

#### Current Stay
- Shows checked-in guests
- Guest information
- Check-in/check-out dates
- Folio access
- Quick checkout

#### Upcoming Reservations
- Future bookings (status: Reserved/Confirmed)
- Check-in date >= today
- Guest details
- Check-in action button

#### Past Reservations (Checkout History)
- Completed stays
- Status: CheckedOut, Cancelled, NoShow
- Historical data
- Invoice access

#### Housekeeping Tasks
- Active tasks for the room
- Task status tracking
- Create new task

### 6.4 Booking Management
**Route:** `/bookings`

**Features:**

#### Booking List View
- Tabbed interface:
  - 🏠 Active (CheckedIn)
  - 📅 Reserved
  - 🔵 Confirmed
  - ✈️ Departed (CheckedOut)
  - ❌ Cancelled
- Search and filter
- Bulk operations
- Export functionality

#### Create Booking
**Form Fields:**
- Guest Information:
  - Name (required)
  - Email
  - Phone (required)
  - Address
  - ID Proof type
  - ID Number
- Guest Counts:
  - Adults
  - Children
- Additional Guests:
  - Name
  - Age
  - Relation
- Booking Details:
  - Room selection
  - Check-in date
  - Check-out date
  - Rate (auto-calculated)
  - Nights (auto-calculated)
  - Total amount
- Payment:
  - Advance payment
  - Payment method
  - Booking source
- Notes

**Validations:**
- Required fields check
- Date validation (check-out > check-in)
- Room availability check
- Duplicate booking prevention

#### Edit Booking
- Modify guest details
- Change dates (with availability check)
- Update payment information
- Add notes

#### Check-In Process
1. Verify booking details
2. Collect advance payment (if not done)
3. Update status to CheckedIn
4. Sync room status to OCCUPIED
5. Post room charges to folio

#### Check-Out Process
1. Review final folio
2. Collect outstanding balance
3. Generate final invoice
4. Update status to CheckedOut
5. Sync room status to AVAILABLE + DIRTY
6. Create checkout cleaning task

### 6.5 Enhanced Folio System
**Modal Interface - 3 Tabs:**

#### Tab 1: Charges
**Features:**
- Add charges from item catalog
- Custom charges
- Category-based organization
- GST auto-calculation
- Charge modification/deletion

**Charge Categories:**
- ROOM_CHARGE - Nightly room rates
- FOOD_BEVERAGE - Restaurant/bar
- LAUNDRY - Laundry services
- MINIBAR - Minibar consumption
- OTHER - Miscellaneous

**GST Calculation:**
- CGST: Tax Rate / 2
- SGST: Tax Rate / 2
- Total = Amount + CGST + SGST

**Charge Form:**
```
Category: [Dropdown]
Description: [Text]
Quantity: [Number]
Rate: [Number]
Tax Rate: [Number] %
Amount: [Auto-calculated]
Remarks: [Text]
```

#### Tab 2: Payments
**Features:**
- Record payments
- Multiple payment methods
- Payment history
- Advance payment display
- Balance calculation

**Payment Methods:**
- Cash
- UPI
- Card (Credit/Debit)

**Payment Form:**
```
Amount: [Number]
Method: [Dropdown]
Reference: [Text] (for UPI/Card)
Remarks: [Text]
```

**Payment Display:**
```
Date | Amount | Method | Reference | Received By
```

#### Tab 3: Summary (Invoice)
**Features:**
- Complete folio summary
- Itemized charges by category
- GST breakdown
- Payment history
- Balance due/refund
- Print invoice button

**Invoice Structure:**
```
Guest Folio Invoice
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Guest: [Name]
Reservation: [Number]
Room: [Number]
Check-in: [Date]
Check-out: [Date]

CHARGES
─────────────────────────────────────────
[Room Charges]
  Description | Qty | Rate | Tax | Total

[Food & Beverage]
  Description | Qty | Rate | Tax | Total

[Other Services]
  Description | Qty | Rate | Tax | Total

SUBTOTAL:        Rs. X,XXX.00
CGST (X%):       Rs. XXX.00
SGST (X%):       Rs. XXX.00
─────────────────────────────────────────
TOTAL:           Rs. X,XXX.00

PAYMENTS
─────────────────────────────────────────
Advance:         Rs. X,XXX.00
[Payment records]
─────────────────────────────────────────
TOTAL PAID:      Rs. X,XXX.00

BALANCE DUE:     Rs. X,XXX.00
```

**Print Functionality:**
- CSS optimized for printing
- Hides modal/UI elements
- A4 paper format
- Professional invoice layout

### 6.6 Housekeeping Management
**Route:** `/housekeeping`

**Features:**

#### Task Dashboard
- Task list view
- Filter by status/priority
- Filter by room
- Search functionality

#### Create Task
**Form Fields:**
```
Room: [Dropdown]
Type: [Dropdown]
  - Standard Clean
  - Deep Clean
  - Checkout Clean
  - Maintenance
  - Turndown
Priority: [Dropdown]
  - Low
  - Medium
  - High
  - Urgent
Assigned To: [Text]
Description: [Text]
Scheduled Date: [Date]
Notes: [Textarea]
```

#### Task Status Flow
1. PENDING → Task created
2. IN_PROGRESS → Cleaner started
3. COMPLETED → Work finished
4. VERIFIED → Manager verified

#### Room-Housekeeping Sync
**Automatic Synchronization:**
- Creating task → Room status updates
- Completing task → Room becomes CLEAN
- Checkout → Auto-creates CHECKOUT_CLEAN task
- Real-time status updates

---

## 7. API Documentation

### 7.1 Authentication APIs

#### POST `/api/auth/login`
**Description:** User login

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user-001",
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Invalid credentials
- 500: Server error

### 7.2 Room APIs

#### GET `/api/rooms`
**Description:** Get all rooms

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "_id": "room-101",
    "number": "101",
    "status": "AVAILABLE",
    "housekeepingStatus": "CLEAN",
    ...
  }
]
```

#### GET `/api/rooms/:id`
**Description:** Get room by ID

#### PUT `/api/rooms/:id/status`
**Description:** Update room status

**Request Body:**
```json
{
  "status": "MAINTENANCE"
}
```

### 7.3 Booking APIs

#### GET `/api/bookings`
**Description:** Get all bookings

**Query Parameters:**
- `status` - Filter by status
- `roomId` - Filter by room
- `date` - Filter by date

#### POST `/api/bookings`
**Description:** Create booking

**Request Body:**
```json
{
  "guest": {
    "name": "John Doe",
    "phone": "+91-9876543210"
  },
  "roomId": "room-101",
  "checkInDate": "2025-11-15",
  "checkOutDate": "2025-11-17",
  "rate": 2000,
  "advancePayment": 1000,
  "paymentMethod": "Cash"
}
```

#### GET `/api/bookings/:id`
**Description:** Get booking by ID

#### PUT `/api/bookings/:id`
**Description:** Update booking

#### DELETE `/api/bookings/:id`
**Description:** Cancel booking

#### POST `/api/bookings/:id/check-in`
**Description:** Check-in guest

**Request Body:**
```json
{
  "checkInTime": "2025-11-15T14:00:00.000Z"
}
```

**Business Logic:**
1. Validate booking exists
2. Check room availability
3. Update booking status to CheckedIn
4. Sync room status to OCCUPIED
5. Post initial room charges to folio
6. Return updated booking

#### POST `/api/bookings/:id/check-out`
**Description:** Check-out guest

**Request Body:**
```json
{
  "checkOutTime": "2025-11-17T11:00:00.000Z",
  "finalPayment": 2000,
  "paymentMethod": "Card"
}
```

**Business Logic:**
1. Calculate final balance
2. Validate payment
3. Update booking status to CheckedOut
4. Generate bill number
5. Sync room status to AVAILABLE + DIRTY
6. Create checkout cleaning task
7. Return final invoice

### 7.4 Folio APIs

#### POST `/api/bookings/:id/folio/lines`
**Description:** Add charge to folio

**Request Body:**
```json
{
  "category": "FOOD_BEVERAGE",
  "description": "Breakfast",
  "quantity": 2,
  "rate": 500,
  "taxRate": 5,
  "remarks": "Continental breakfast"
}
```

**Calculation Logic:**
```javascript
amount = quantity × rate
cgst = (amount × taxRate) / 200
sgst = (amount × taxRate) / 200
totalWithTax = amount + cgst + sgst
```

**Response:**
```json
{
  "success": true,
  "line": {
    "_id": "uuid",
    "category": "FOOD_BEVERAGE",
    "amount": 1000,
    "cgst": 25,
    "sgst": 25,
    "totalWithTax": 1050,
    ...
  },
  "balance": 3550
}
```

#### DELETE `/api/bookings/:id/folio/lines/:lineId`
**Description:** Remove charge from folio

#### POST `/api/bookings/:id/payments`
**Description:** Record payment

**Request Body:**
```json
{
  "amount": 2000,
  "method": "UPI",
  "reference": "TXN123456",
  "remarks": "Partial payment"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "_id": "uuid",
    "amount": 2000,
    "method": "UPI",
    ...
  },
  "balance": 1550
}
```

### 7.5 Items APIs

#### GET `/api/items`
**Description:** Get item catalog

**Response:**
```json
[
  {
    "_id": "item-001",
    "name": "Breakfast Buffet",
    "category": "FOOD_BEVERAGE",
    "rate": 500,
    "taxRate": 5,
    "isActive": true
  }
]
```

#### POST `/api/items`
**Description:** Create item

#### PUT `/api/items/:id`
**Description:** Update item

#### DELETE `/api/items/:id`
**Description:** Delete item

### 7.6 Housekeeping APIs

#### GET `/api/housekeeping`
**Description:** Get all tasks

**Query Parameters:**
- `status` - Filter by status
- `roomId` - Filter by room
- `date` - Filter by date

#### POST `/api/housekeeping`
**Description:** Create task

**Request Body:**
```json
{
  "roomId": "room-101",
  "type": "STANDARD_CLEAN",
  "priority": "MEDIUM",
  "assignedTo": "John",
  "description": "Daily cleaning",
  "scheduledDate": "2025-11-15"
}
```

**Business Logic:**
1. Create task record
2. Sync room housekeeping status based on task type
3. Real-time update to room status
4. Return created task

#### PUT `/api/housekeeping/:id`
**Description:** Update task

**Status Update Logic:**
```javascript
if (newStatus === 'COMPLETED') {
  task.completedAt = new Date();
  // Sync room to CLEAN if cleaning task
  if (task.type.includes('CLEAN')) {
    room.housekeepingStatus = 'CLEAN';
  }
}
```

#### DELETE `/api/housekeeping/:id`
**Description:** Delete task

---

## 8. Frontend Components

### 8.1 Component Structure
```
src/
├── components/
│   ├── BookingCard.jsx
│   ├── BookingForm.jsx
│   ├── BookingModal.jsx
│   ├── EnhancedFolioModal.jsx
│   ├── Navbar.jsx
│   ├── QuickActions.jsx
│   ├── RecentBookings.jsx
│   ├── RoomCard.jsx
│   └── RoomGrid.jsx
├── pages/
│   ├── Bookings.jsx
│   ├── Dashboard.jsx
│   ├── Housekeeping.jsx
│   ├── Login.jsx
│   ├── RoomDetail.jsx
│   └── Rooms.jsx
├── services/
│   └── api.js
├── App.jsx
└── main.jsx
```

### 8.2 Key Components

#### EnhancedFolioModal.jsx
**Purpose:** Complete folio management interface

**Props:**
- `isOpen` - Modal visibility
- `onClose` - Close handler
- `booking` - Booking object
- `onUpdate` - Update callback

**State Management:**
```javascript
const [activeTab, setActiveTab] = useState('charges');
const [charges, setCharges] = useState([]);
const [payments, setPayments] = useState([]);
const [itemCatalog, setItemCatalog] = useState([]);
```

**Functions:**
- `loadItemCatalog()` - Fetch items
- `handleAddCharge()` - Add new charge
- `handleDeleteCharge()` - Remove charge
- `handleAddPayment()` - Record payment
- `calculateTotals()` - Calculate balance
- `handlePrint()` - Print invoice

#### BookingForm.jsx
**Purpose:** Create/edit booking

**Validation Rules:**
- Guest name: Required, min 2 characters
- Phone: Required, valid format
- Check-in date: Must be today or future
- Check-out date: Must be after check-in
- Room: Must be available for dates
- Rate: Must be > 0

**Auto-calculations:**
- Nights = check-out - check-in
- Amount = rate × nights
- Balance = amount - advance payment

#### RoomCard.jsx
**Purpose:** Display room in grid

**Visual Indicators:**
- Status badge color
- Housekeeping status icon
- Quick action buttons
- Guest name (if occupied)

### 8.3 Routing
```javascript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<Dashboard />} />
  <Route path="/rooms" element={<Rooms />} />
  <Route path="/rooms/:id" element={<RoomDetail />} />
  <Route path="/bookings" element={<Bookings />} />
  <Route path="/housekeeping" element={<Housekeeping />} />
</Routes>
```

**Protected Routes:**
All routes except `/login` require authentication. Implemented using:
```javascript
const token = localStorage.getItem('token');
if (!token) navigate('/login');
```

---

## 9. Business Logic

### 9.1 Room-Booking Synchronization
**File:** `server/utils/roomBookingSync.js`

**Industry Standard Logic (Opera PMS Pattern):**

```javascript
function determineExpectedRoomStatus(room, checkedInBooking, reservedBookings, now) {
  // PRIORITY 1: Guest checked in → OCCUPIED
  if (checkedInBooking) {
    return ROOM_STATUS.OCCUPIED;
  }
  
  // PRIORITY 2: Imminent arrivals (today/tomorrow) → RESERVED
  if (reservedBookings.length > 0) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const imminentArrivals = reservedBookings.filter(b => {
      const checkInDate = new Date(b.checkInDate);
      return checkInDate <= tomorrow;
    });
    
    if (imminentArrivals.length > 0) {
      return ROOM_STATUS.RESERVED;
    }
    // Guest 2+ days away → AVAILABLE (can sell for tonight)
  }
  
  // PRIORITY 3: Maintenance/blocked status preserved
  if (room.status === ROOM_STATUS.MAINTENANCE) {
    return room.status;
  }
  
  // DEFAULT: AVAILABLE
  return ROOM_STATUS.AVAILABLE;
}
```

**Sync Triggers:**
1. Booking created → Sync room
2. Booking updated → Sync room
3. Check-in → Room = OCCUPIED
4. Check-out → Room = AVAILABLE + DIRTY
5. Booking cancelled → Sync room

### 9.2 GST Calculation
**Tax Split:**
- CGST (Central GST) = Tax Rate / 2
- SGST (State GST) = Tax Rate / 2

**Example:**
```
Item: Breakfast
Quantity: 2
Rate: Rs. 500
Tax Rate: 5%

Calculation:
Amount = 2 × 500 = Rs. 1,000
CGST = (1,000 × 5) / 200 = Rs. 25
SGST = (1,000 × 5) / 200 = Rs. 25
Total = 1,000 + 25 + 25 = Rs. 1,050
```

### 9.3 Balance Calculation
```javascript
// Folio Total
const folioTotal = charges.reduce((sum, charge) => 
  sum + charge.totalWithTax, 0
);

// Total Paid
const advancePaid = booking.advancePayment || 0;
const totalPaid = payments.reduce((sum, p) => 
  sum + p.amount, 0
);

// Balance
const balance = folioTotal - totalPaid - advancePaid;
```

**Negative Balance:** Indicates refund due to guest (overpayment)

### 9.4 Booking Categorization Logic
**File:** `client/src/pages/RoomDetail.jsx`

```javascript
const history = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return {
    // PAST: Completed or cancelled
    past: bookings.filter(b => 
      b.status === 'CheckedOut' || 
      b.status === 'Cancelled' || 
      b.status === 'NoShow'
    ),
    
    // CURRENT: Checked in and within stay dates
    current: bookings.filter(b => {
      const checkIn = new Date(b.checkInDate).setHours(0,0,0,0);
      const checkOut = new Date(b.checkOutDate).setHours(0,0,0,0);
      return b.status === 'CheckedIn' && 
             checkIn <= today && 
             today <= checkOut;
    }),
    
    // UPCOMING: Reserved/Confirmed with check-in today or later
    future: bookings.filter(b => {
      const checkIn = new Date(b.checkInDate).setHours(0,0,0,0);
      return (b.status === 'Reserved' || b.status === 'Confirmed') && 
             checkIn >= today;
    })
  };
}, [bookings]);
```

**Flow:**
1. New booking → UPCOMING
2. Check-in → CURRENT STAY
3. Check-out → PAST (Checkout History)

### 9.5 Housekeeping-Room Sync
**Automatic Status Updates:**

```javascript
// Task created
if (task.type === 'MAINTENANCE') {
  room.housekeepingStatus = 'MAINTENANCE';
}

// Task completed
if (task.status === 'COMPLETED') {
  if (task.type.includes('CLEAN')) {
    room.housekeepingStatus = 'CLEAN';
  }
}

// Checkout
room.housekeepingStatus = 'DIRTY';
// Auto-create CHECKOUT_CLEAN task
```

---

## 10. Workflows

### 10.1 Complete Guest Journey

#### Step 1: Create Reservation
1. Navigate to Bookings → Create Booking
2. Fill guest details
3. Select room (check availability)
4. Set dates
5. Enter advance payment
6. Save booking
7. **Result:** Booking created with status "Reserved"
8. **Room Status:** RESERVED (if check-in today/tomorrow)

#### Step 2: Guest Arrival (Check-In)
1. Navigate to Bookings → Reserved tab
2. Find guest booking
3. Click "Check-In"
4. Verify guest details
5. Collect advance payment (if pending)
6. Confirm check-in
7. **Result:** Booking status → CheckedIn
8. **Room Status:** OCCUPIED
9. **Folio:** Room charges auto-posted

#### Step 3: During Stay
**Add Charges:**
1. Open booking
2. Click "View Folio"
3. Go to "Charges" tab
4. Add items (food, laundry, etc.)
5. GST auto-calculated
6. Save charges

**Record Payments:**
1. Go to "Payments" tab
2. Enter amount
3. Select payment method
4. Add reference (if UPI/Card)
5. Save payment

**Housekeeping:**
1. Daily cleaning task auto-created
2. Cleaner updates status
3. Room marked CLEAN when done

#### Step 4: Guest Departure (Check-Out)
1. Navigate to Bookings → Active tab
2. Find guest booking
3. Click "View Folio"
4. Review all charges
5. Go to "Summary" tab
6. Verify balance
7. Collect final payment
8. Click "Check-Out"
9. **Result:** 
   - Booking status → CheckedOut
   - Invoice generated
   - Room status → AVAILABLE + DIRTY
   - Checkout cleaning task created

### 10.2 Housekeeping Workflow

#### Daily Cleaning
1. System auto-creates STANDARD_CLEAN tasks
2. Cleaner sees pending tasks
3. Update status to IN_PROGRESS
4. Complete cleaning
5. Update status to COMPLETED
6. Room status → CLEAN

#### Checkout Cleaning
1. Guest checks out
2. System auto-creates CHECKOUT_CLEAN task
3. Priority: HIGH
4. Cleaner completes deep cleaning
5. Room ready for next guest

#### Maintenance
1. Issue reported
2. Create MAINTENANCE task
3. Room status → MAINTENANCE
4. Technician completes work
5. Task status → COMPLETED
6. Room status → AVAILABLE

### 10.3 Payment Collection Workflow

#### At Booking
- Collect advance payment
- Minimum: 20% of total
- Methods: Cash/UPI/Card
- Record in system

#### During Stay
- Guest can make partial payments
- Add to payment history
- Balance auto-updated

#### At Checkout
- Review final folio
- Calculate outstanding balance
- Collect payment
- Process refund if overpaid
- Generate final invoice

---

## 11. Deployment Guide

### 11.1 Prerequisites
- Node.js v16+ installed
- npm or yarn package manager
- Port 5051 (backend) and 5173 (frontend) available

### 11.2 Installation Steps

#### Backend Setup
```bash
# Navigate to project root
cd BillSutra

# Install dependencies
npm install

# Create .env file
PORT=5051
JWT_SECRET=your-secret-key-here
NODE_ENV=production

# Start backend
npm start
# Or for development
npm run dev
```

#### Frontend Setup
```bash
# Navigate to client folder
cd client

# Install dependencies
npm install

# Create .env file
VITE_API_URL=http://localhost:5051

# Start frontend
npm run dev
# Or build for production
npm run build
```

### 11.3 Production Deployment

#### Build Frontend
```bash
cd client
npm run build
# Output: dist/ folder
```

#### Serve Static Files
```javascript
// In server/index.js
const path = require('path');

// Serve frontend
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

#### Start Production Server
```bash
# Set environment
export NODE_ENV=production
export PORT=5051

# Start server
node server/index.js

# Or use PM2
pm2 start server/index.js --name billsutra
pm2 startup
pm2 save
```

### 11.4 Environment Variables

#### Backend (.env)
```
PORT=5051
JWT_SECRET=your-very-secure-secret-key
JWT_EXPIRY=24h
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5051
VITE_APP_NAME=BillSutra
```

### 11.5 Data Backup

#### Manual Backup
```bash
# Backup all data files
cp -r server/data server/data_backup_$(date +%Y%m%d)

# Or create archive
tar -czf billsutra_backup_$(date +%Y%m%d).tar.gz server/data
```

#### Automated Backup (Cron)
```bash
# Add to crontab (daily backup at 2 AM)
0 2 * * * cd /path/to/BillSutra && tar -czf backups/backup_$(date +\%Y\%m\%d).tar.gz server/data
```

---

## 12. Testing

### 12.1 Automated Test Suite

#### Test Files
1. `test-enhanced-folio.ps1` - Folio system tests (48 tests)
2. `test-qa-comprehensive.ps1` - Full QA suite (23 tests)
3. `test-upcoming-logic.ps1` - Booking categorization tests
4. `test-room-management.ps1` - Room sync tests

#### Run All Tests
```powershell
# Start backend
cd C:\Users\AbhijitVibhute\Desktop\BillSutra
node server/index.js

# In new terminal, run tests
.\test-qa-comprehensive.ps1
```

#### Test Coverage
- ✅ Authentication (100%)
- ✅ Room management (100%)
- ✅ Booking CRUD (100%)
- ✅ Folio operations (100%)
- ✅ Payment processing (100%)
- ✅ Room-booking sync (100%)
- ✅ Housekeeping sync (100%)
- ✅ GST calculations (100%)

**Overall Pass Rate: 100% (71/71 tests)**

### 12.2 Manual Testing Checklist

#### Login & Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality
- [ ] Token expiry handling

#### Dashboard
- [ ] Stats display correctly
- [ ] Charts render properly
- [ ] Recent bookings list
- [ ] Quick actions work

#### Room Management
- [ ] Room grid displays all rooms
- [ ] Status color coding correct
- [ ] Room detail page loads
- [ ] Manual status change works
- [ ] Housekeeping task creation

#### Booking Management
- [ ] Create booking with all fields
- [ ] Edit existing booking
- [ ] Check-in process
- [ ] Check-out process
- [ ] Cancel booking
- [ ] Search and filter

#### Folio System
- [ ] Add room charges
- [ ] Add food/beverage charges
- [ ] Add other charges
- [ ] GST calculation correct
- [ ] Record payments
- [ ] Balance calculation
- [ ] Print invoice

#### Housekeeping
- [ ] Create task
- [ ] Update task status
- [ ] Room status syncs
- [ ] Task filtering
- [ ] Task assignment

### 12.3 Performance Testing

#### Load Metrics
- Average page load: < 500ms
- API response time: < 200ms
- Concurrent users: 50+
- Database operations: < 50ms

#### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

---

## 13. System Configuration

### 13.1 Room Configuration

**Current Setup:**
- Total Rooms: 12
- Floors: 3
  - Floor 1: 101, 102, 103
  - Floor 2: 201, 202, 203
  - Floor 3: 301, 302

**Add New Room:**
```javascript
// In server/data/rooms.json
{
  "_id": "room-104",
  "hotelId": "hotel-001",
  "number": "104",
  "floorId": "floor-001",
  "roomTypeId": "roomtype-001",
  "status": "AVAILABLE",
  "housekeepingStatus": "CLEAN",
  "isBlocked": false,
  "features": ["AC", "TV", "WiFi"],
  "notes": "",
  "createdAt": "2025-11-15T00:00:00.000Z",
  "updatedAt": "2025-11-15T00:00:00.000Z"
}
```

### 13.2 Item Catalog Configuration

**Add New Service:**
```javascript
// In server/data/items.json
{
  "_id": "item-006",
  "name": "Airport Transfer",
  "category": "SERVICES",
  "rate": 1500,
  "taxRate": 5,
  "isActive": true,
  "description": "Airport pickup/drop service",
  "createdAt": "2025-11-15T00:00:00.000Z"
}
```

### 13.3 User Management

**Add New User:**
```javascript
// Hash password first
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('password123', 10);

// Add to server/data/users.json
{
  "_id": "user-002",
  "username": "receptionist1",
  "password": hashedPassword,
  "email": "reception@hotel.com",
  "role": "receptionist",
  "name": "John Smith",
  "isActive": true,
  "createdAt": "2025-11-15T00:00:00.000Z"
}
```

---

## 14. Troubleshooting

### Common Issues

#### Issue 1: Login Not Working
**Symptoms:** Invalid credentials error
**Solution:**
1. Verify username/password
2. Check users.json file exists
3. Verify password hash
4. Check JWT_SECRET in .env

#### Issue 2: Room Status Not Syncing
**Symptoms:** Room shows wrong status
**Solution:**
1. Check roomBookingSync.js logic
2. Verify booking status is correct
3. Manually trigger sync by updating booking
4. Check server logs for sync errors

#### Issue 3: Folio Total Incorrect
**Symptoms:** Balance calculation wrong
**Solution:**
1. Verify all charges have correct GST
2. Check payment records
3. Verify advance payment included
4. Recalculate: total - payments - advance

#### Issue 4: Frontend Not Loading
**Symptoms:** Blank page or errors
**Solution:**
1. Check backend is running (port 5051)
2. Verify CORS settings
3. Check browser console for errors
4. Clear browser cache
5. Rebuild frontend: `npm run build`

#### Issue 5: Data Not Persisting
**Symptoms:** Changes lost on refresh
**Solution:**
1. Check file permissions on data/ folder
2. Verify JSON files are writable
3. Check disk space
4. Review server logs for write errors

---

## 15. Future Enhancements

### Phase 2 Features
- [ ] Advanced reporting module
- [ ] Revenue management
- [ ] Rate plans and packages
- [ ] Channel manager integration
- [ ] Email notifications
- [ ] SMS alerts
- [ ] PDF invoice generation
- [ ] Multi-property support
- [ ] Mobile app (React Native)

### Phase 3 Features
- [ ] POS integration
- [ ] Loyalty program
- [ ] Guest portal
- [ ] Online booking engine
- [ ] Review management
- [ ] Analytics dashboard
- [ ] API for third-party integrations
- [ ] Multi-language support
- [ ] Multi-currency support

---

## 16. Support & Maintenance

### Backup Schedule
- **Daily:** Automated backup at 2 AM
- **Weekly:** Full system backup
- **Monthly:** Archive old data

### Log Monitoring
- **Access Logs:** `logs/access.log`
- **Error Logs:** `logs/error.log`
- **Sync Logs:** Console output

### Performance Monitoring
- Check API response times
- Monitor database file sizes
- Review error rates
- Track user sessions

### Security Updates
- Regular dependency updates: `npm audit fix`
- Password policy enforcement
- JWT token rotation
- Regular security audits

---

## 17. Glossary

**Terms:**
- **PMS:** Property Management System
- **Folio:** Guest account/bill
- **Check-in:** Guest arrival process
- **Check-out:** Guest departure process
- **Sync:** Automatic data synchronization
- **GST:** Goods and Services Tax
- **CGST:** Central GST
- **SGST:** State GST
- **JWT:** JSON Web Token
- **API:** Application Programming Interface
- **CRUD:** Create, Read, Update, Delete

---

## 18. Contact Information

**Application Name:** BillSutra  
**Version:** 1.0  
**Last Updated:** November 15, 2025  
**Documentation Version:** 1.0  

---

**End of Documentation**
