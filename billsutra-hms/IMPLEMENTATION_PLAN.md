# BillSutra Multi-Tenant Hotel Management System - Implementation Plan

## Executive Summary
Transform BillSutra into a comprehensive multi-tenant SaaS hotel management system with complete property setup, room inventory management, dynamic pricing, integrated housekeeping, and automated billing workflows.

---

## 1. MULTI-TENANT ARCHITECTURE

### Database Schema Changes

#### New Tables/Collections:

**hotels** (tenants)
```json
{
  "id": "uuid",
  "name": "Hotel Paradise",
  "code": "HP001",
  "status": "active|trial|suspended",
  "address": {...},
  "contact": {...},
  "gstNumber": "",
  "subscription": {
    "plan": "basic|premium|enterprise",
    "startDate": "",
    "endDate": "",
    "maxRooms": 50
  },
  "settings": {
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "defaultCheckIn": "14:00",
    "defaultCheckOut": "11:00"
  },
  "createdAt": "",
  "createdBy": "superAdminId"
}
```

**floors**
```json
{
  "id": "uuid",
  "hotelId": "hotelId",
  "name": "Ground Floor",
  "number": 0,
  "displayOrder": 0
}
```

**users** (enhanced)
```json
{
  "id": "uuid",
  "hotelId": "hotelId|null", // null for super admin
  "username": "",
  "email": "",
  "password": "hashed",
  "role": "superAdmin|hotelAdmin|frontDesk|housekeeping|accounts",
  "permissions": [],
  "status": "active|inactive",
  "createdAt": ""
}
```

---

## 2. HOTEL ONBOARDING WIZARD

### Step 1: Basic Information
- Hotel name, address, contact
- GST number, PAN
- Logo upload
- Timezone, currency

### Step 2: Property Structure
- Define floors (G, 1, 2, 3...)
- Rooms per floor
- Room numbering pattern

### Step 3: Room Types & Configuration
- Room type setup (Deluxe, Suite, Standard)
- Amenities per type
- Occupancy limits (single/double/triple)
- Base pricing per type

### Step 4: Pricing & Tax Configuration
- GST rates per room category
  - <₹1000: 0%
  - ₹1000-₹2499: 12%
  - ₹2500-₹7499: 18%
  - ₹7500+: 28%
- Seasonal rate plans
- Discount policies

### Step 5: User Setup
- Create hotel admin account
- Add staff users (front desk, housekeeping)
- Assign roles & permissions

---

## 3. ROOM INVENTORY & STATUS MANAGEMENT

### Room Status Workflow
```
AVAILABLE (Green) → can be booked
  ↓
RESERVED (Blue) → booking confirmed, not checked in
  ↓
OCCUPIED (Red) → guest checked in
  ↓
DIRTY (Orange) → guest checked out, needs cleaning
  ↓
INSPECTING (Yellow) → housekeeping cleaning
  ↓
CLEAN (Green) → ready to be assigned
  ↓
OUT OF SERVICE (Gray) → maintenance/blocked

AVAILABLE ←─┘
```

### Booking Rules
1. **Cannot book if:**
   - Status: OCCUPIED, DIRTY, OUT OF SERVICE
   - Room blocked by admin
   - Overlapping reservation exists

2. **Can book if:**
   - Status: AVAILABLE or CLEAN
   - No conflicts in date range
   - Room type available

3. **Automatic status updates:**
   - On check-in: RESERVED → OCCUPIED
   - On check-out: OCCUPIED → DIRTY
   - After housekeeping: DIRTY → CLEAN → AVAILABLE

---

## 4. RESERVATION MANAGEMENT

### Reservation States
```
INQUIRY → Not confirmed, just checking
  ↓
TENTATIVE → Hold without payment
  ↓
CONFIRMED → Booking confirmed with advance
  ↓
CHECKED_IN → Guest arrived
  ↓
CHECKED_OUT → Guest departed
  ↓
CANCELLED → Booking cancelled
NO_SHOW → Guest didn't arrive
```

### Booking Validation Logic
```javascript
function canBookRoom(roomId, checkIn, checkOut) {
  const room = getRoomStatus(roomId);
  
  // Check current status
  if (room.status === 'OUT_OF_SERVICE') return false;
  if (room.status === 'OCCUPIED') return false;
  if (room.isBlocked) return false;
  
  // Check overlapping reservations
  const overlapping = checkOverlappingBookings(roomId, checkIn, checkOut);
  if (overlapping.length > 0) return false;
  
  // Check if dirty and checkout is soon
  if (room.status === 'DIRTY' && checkIn < moment().add(2, 'hours')) {
    return false; // Not enough time to clean
  }
  
  return true;
}
```

---

## 5. HOUSEKEEPING INTEGRATION

### Automatic Task Generation
- On guest checkout → Create cleaning task
- Priority based on next reservation
- Assign to available housekeeping staff

### Room Blocking Logic
```javascript
// Dirty rooms are automatically blocked from new bookings
if (room.status === 'DIRTY' || room.status === 'INSPECTING') {
  room.availableForBooking = false;
}

// Only clean/available rooms shown in booking
function getAvailableRooms(checkIn, checkOut) {
  return rooms.filter(r => 
    (r.status === 'AVAILABLE' || r.status === 'CLEAN') &&
    !hasOverlappingBooking(r.id, checkIn, checkOut) &&
    !r.isBlocked
  );
}
```

### Housekeeping Dashboard
- Rooms to clean (sorted by priority)
- Check-out schedule for today
- Expected arrivals (ensure rooms ready)
- Maintenance requests

---

## 6. DYNAMIC PRICING SYSTEM

### Rate Structure
```json
{
  "roomTypeId": "deluxe-001",
  "baseRates": {
    "single": 2500,
    "double": 3000,
    "triple": 3500
  },
  "gstRate": 18, // Auto-calculated based on price slab
  "ratePlans": [
    {
      "name": "Rack Rate",
      "type": "standard",
      "markup": 0
    },
    {
      "name": "Corporate",
      "type": "corporate",
      "discount": 15
    },
    {
      "name": "Weekend Package",
      "type": "package",
      "validDays": ["Fri", "Sat"],
      "price": 3500,
      "includes": ["Breakfast", "Late Checkout"]
    }
  ],
  "seasonalRates": [
    {
      "name": "Peak Season",
      "startDate": "2024-12-20",
      "endDate": "2025-01-05",
      "multiplier": 1.5
    }
  ]
}
```

### GST Auto-Calculation
```javascript
function calculateGST(roomRate) {
  if (roomRate < 1000) return { rate: 0, amount: 0 };
  if (roomRate < 2500) return { rate: 12, amount: roomRate * 0.12 };
  if (roomRate < 7500) return { rate: 18, amount: roomRate * 0.18 };
  return { rate: 28, amount: roomRate * 0.28 };
}
```

---

## 7. BILLING & FOLIO MANAGEMENT

### Folio Structure
```json
{
  "folioId": "F-2024-001",
  "reservationId": "RES-001",
  "guestId": "guest-001",
  "hotelId": "hotel-001",
  "status": "open|settled|cancelled",
  "charges": [
    {
      "date": "2024-11-14",
      "type": "room",
      "description": "Deluxe Room - Night 1",
      "amount": 3000,
      "gstRate": 18,
      "gstAmount": 540,
      "total": 3540
    },
    {
      "date": "2024-11-14",
      "type": "service",
      "description": "Breakfast",
      "amount": 500,
      "gstRate": 5,
      "gstAmount": 25,
      "total": 525
    }
  ],
  "payments": [
    {
      "date": "2024-11-13",
      "type": "advance",
      "method": "upi",
      "amount": 2000
    }
  ],
  "summary": {
    "subtotal": 3500,
    "gst": 565,
    "total": 4065,
    "paid": 2000,
    "balance": 2065
  }
}
```

### Automatic Charge Posting
- Daily room rent posted at checkout time
- Additional services posted immediately
- GST calculated per line item
- Running balance maintained

---

## 8. ROLE-BASED ACCESS CONTROL

### User Roles & Permissions

**Super Admin** (Platform Owner)
- Manage all hotels
- View all properties
- Subscription management
- System configuration

**Hotel Admin**
- Full control of their hotel
- Manage users
- Configure pricing
- View all reports

**Front Desk**
- Create/modify reservations
- Check-in/check-out guests
- Process payments
- View room availability

**Housekeeping**
- View assigned tasks
- Update room status
- Mark rooms clean
- Report maintenance issues

**Accounts**
- View bills & folios
- Generate reports
- Manage payments
- GST returns

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Multi-Tenant Foundation (Week 1-2)
- [ ] Add hotels table and multi-tenant schema
- [ ] User authentication with hotel isolation
- [ ] Hotel onboarding wizard UI
- [ ] Super admin dashboard

### Phase 2: Room & Inventory (Week 3-4)
- [ ] Floor and room management
- [ ] Room status workflow
- [ ] Real-time availability checking
- [ ] Room blocking/unblocking

### Phase 3: Pricing & Configuration (Week 5)
- [ ] Rate management system
- [ ] GST configuration per room
- [ ] Seasonal pricing
- [ ] Rate plans

### Phase 4: Reservations (Week 6-7)
- [ ] Enhanced booking flow with validation
- [ ] Reservation states
- [ ] Conflict detection
- [ ] Waitlist management

### Phase 5: Housekeeping Integration (Week 8)
- [ ] Task generation on checkout
- [ ] Status-based room blocking
- [ ] Priority assignment
- [ ] Housekeeping dashboard

### Phase 6: Billing & Folio (Week 9-10)
- [ ] Complete folio management
- [ ] Automatic charge posting
- [ ] GST calculation engine
- [ ] Payment tracking

### Phase 7: Reports & Analytics (Week 11)
- [ ] Occupancy reports
- [ ] Revenue analytics
- [ ] GST reports
- [ ] Performance metrics

### Phase 8: Testing & Refinement (Week 12)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] User training materials
- [ ] Deployment

---

## 10. KEY BUSINESS LOGIC RULES

### Rule 1: Room Assignment Priority
1. Match room type preference
2. Check floor preference
3. Avoid dirty rooms for same-day checkin
4. Balance occupancy across floors

### Rule 2: Pricing Rules
1. Base rate from room type
2. Apply rate plan discount/markup
3. Apply seasonal adjustment
4. Calculate GST based on final amount
5. Round to nearest rupee

### Rule 3: Housekeeping Priority
1. Rooms with incoming reservations (highest)
2. Walk-in possibility (medium)
3. Regular maintenance (low)

### Rule 4: Overbooking Prevention
- Never allow double booking of same room
- Check availability before confirmation
- Validate on check-in
- Suggest alternatives if conflict

### Rule 5: Data Isolation
- All queries filtered by hotelId
- Users can only access their hotel data
- Super admin can switch between hotels
- Audit logs per tenant

---

## Technologies & Tools

**Backend:**
- Node.js + Express (existing)
- File-based JSON storage (current) → Later migrate to MongoDB/PostgreSQL
- JWT for multi-tenant auth
- Role-based middleware

**Frontend:**
- React 18 (existing)
- Add wizard components
- Enhanced state management
- Real-time status updates

**Additional Libraries:**
- moment.js for date handling
- lodash for data manipulation
- chart.js for analytics
- react-dnd for drag-drop (housekeeping)

---

## Success Metrics

1. **Onboarding Time**: Hotel setup in < 15 minutes
2. **Zero Conflicts**: No double bookings
3. **Housekeeping Efficiency**: Clean rooms ready before checkin
4. **Billing Accuracy**: 100% GST compliance
5. **User Satisfaction**: Easy-to-use interface
6. **Multi-tenant Isolation**: Complete data security

---

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Create detailed database schema
4. Build hotel onboarding wizard
5. Implement room status workflow
6. Integrate all modules progressively

This implementation will transform BillSutra into a world-class, multi-tenant hotel management system comparable to industry leaders like Opera PMS and Cloudbeds.
