# BillSutra API Quick Reference

## Base URL
```
http://localhost:5051/api
```

## Authentication

All endpoints except `/auth/login` and `/auth/register` require JWT token:
```
Authorization: Bearer <your_jwt_token>
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "admin123"
}

Response: {
  "token": "eyJhbGc...",
  "user": { "userId": "...", "hotelId": "...", "role": "..." }
}
```

---

## Hotels

### Onboard New Hotel
```http
POST /hotels/onboard
Authorization: Bearer <superadmin_token>

{
  "hotelInfo": {
    "name": "Grand Hotel",
    "code": "GRAND001",
    "email": "info@grandhotel.com",
    "phone": "+91-9876543210",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001",
    "gstNumber": "27AABCU9603R1Z5"
  },
  "floors": [
    { "name": "Ground Floor", "number": 0 },
    { "name": "First Floor", "number": 1 }
  ],
  "roomTypes": [
    { "name": "Standard", "baseRate": 2000, "maxOccupancy": 2 },
    { "name": "Deluxe", "baseRate": 3500, "maxOccupancy": 3 }
  ],
  "pricing": {
    "checkInTime": "14:00",
    "checkOutTime": "11:00"
  },
  "admin": {
    "username": "admin@grand",
    "email": "admin@grandhotel.com",
    "password": "SecurePass123",
    "fullName": "Hotel Manager"
  }
}
```

### List All Hotels (Super Admin)
```http
GET /hotels
Authorization: Bearer <superadmin_token>
```

---

## Rooms

### Create Room
```http
POST /rooms
Authorization: Bearer <hotel_token>

{
  "number": "101",
  "floorId": "floor-id-here",
  "typeId": "room-type-id",
  "maxOccupancy": 2,
  "baseRate": 2000,
  "amenities": ["WiFi", "TV", "AC"]
}
```

### Get Available Rooms
```http
GET /rooms/available?checkInDate=2025-11-20&checkOutDate=2025-11-22
Authorization: Bearer <hotel_token>
```

### Change Room Status
```http
POST /rooms/:roomId/status
Authorization: Bearer <hotel_token>

{
  "status": "OCCUPIED"
}

Valid statuses:
- AVAILABLE
- RESERVED
- OCCUPIED
- DIRTY
- CLEAN
- OUT_OF_SERVICE
- MAINTENANCE
- BLOCKED
```

### Block Room
```http
POST /rooms/:roomId/block
Authorization: Bearer <hotel_token>

{
  "blockedUntil": "2025-12-31",
  "reason": "Renovation"
}
```

### Bulk Status Update
```http
POST /rooms/bulk-status
Authorization: Bearer <hotel_token>

{
  "roomIds": ["room-id-1", "room-id-2"],
  "status": "CLEAN"
}
```

---

## Room Types

### Create Room Type
```http
POST /room-types
Authorization: Bearer <hotel_token>

{
  "name": "Executive Suite",
  "baseRate": 5000,
  "maxOccupancy": 4,
  "defaultAmenities": ["WiFi", "TV", "AC", "Mini Bar", "Bathtub"]
}
```

### Calculate GST
```http
POST /room-types/calculate-gst
Authorization: Bearer <hotel_token>

{
  "amount": 3000,
  "typeId": "optional-room-type-id"
}

Response: {
  "rate": 18,
  "cgst": 9,
  "sgst": 9,
  "igst": 18,
  "total": 540
}

GST Slabs:
- < ₹1,000:       0%
- ₹1,000-2,499:  12%
- ₹2,500-7,499:  18%
- ≥ ₹7,500:      28%
```

---

## Rate Plans

### Create Rate Plan
```http
POST /rate-plans
Authorization: Bearer <hotel_admin_token>

{
  "name": "Weekend Special",
  "type": "WEEKEND",
  "roomTypeId": "optional-specific-type",
  "baseRateAdjustment": 20,
  "adjustmentType": "PERCENTAGE",
  "validFrom": "2025-11-01",
  "validTo": "2025-12-31",
  "daysOfWeek": [5, 6],
  "minStay": 2,
  "priority": 10,
  "active": true
}

Types: BASE, SEASONAL, CORPORATE, WEEKEND, PROMOTIONAL
Adjustment Types: PERCENTAGE, FIXED
Days: 0=Sunday, 1=Monday, ..., 6=Saturday
```

### Calculate Best Rate
```http
POST /rate-plans/calculate-rate
Authorization: Bearer <hotel_token>

{
  "roomTypeId": "room-type-id",
  "baseRate": 3000,
  "checkInDate": "2025-11-15",
  "nights": 2
}

Response: {
  "baseRate": 3000,
  "finalRate": 3600,
  "adjustment": 600,
  "ratePlan": { "name": "Weekend Special", ... }
}
```

### Get Active Plans
```http
GET /rate-plans/active?date=2025-11-15
Authorization: Bearer <hotel_token>
```

---

## Housekeeping

### Create Task
```http
POST /housekeeping
Authorization: Bearer <hotel_token>

{
  "roomId": "room-id",
  "roomNumber": "101",
  "type": "CLEANING",
  "priority": "HIGH",
  "description": "Standard cleaning",
  "assignedTo": "user-id",
  "nextArrivalTime": "2025-11-14T15:00:00Z"
}

Types: CLEANING, INSPECTION, MAINTENANCE, TURNDOWN, DEEP_CLEAN, LAUNDRY
Priority: LOW, MEDIUM, HIGH, URGENT
```

### Get Pending Tasks
```http
GET /housekeeping/pending
Authorization: Bearer <hotel_token>

Response: [
  {
    "_id": "task-id",
    "roomNumber": "101",
    "type": "CLEANING",
    "status": "PENDING",
    "priority": "HIGH",
    "priorityScore": 7,
    ...
  }
]
```

### Start Task
```http
POST /housekeeping/:taskId/start
Authorization: Bearer <housekeeping_token>

Response: {
  "status": "IN_PROGRESS",
  "startTime": "2025-11-14T10:30:00Z",
  "assignedTo": "current-user-id"
}
```

### Complete Task
```http
POST /housekeeping/:taskId/complete
Authorization: Bearer <housekeeping_token>

{
  "notes": "Room cleaned successfully",
  "reportedIssues": ["Broken lamp in bedroom"]
}

Response: {
  "status": "COMPLETED",
  "completedTime": "2025-11-14T11:00:00Z",
  "actualDuration": 30
}
```

### Verify Task
```http
POST /housekeeping/:taskId/verify
Authorization: Bearer <frontdesk_token>

Response: {
  "status": "VERIFIED",
  "verifiedBy": "supervisor-id",
  "verifiedTime": "2025-11-14T11:15:00Z"
}
```

### Get My Tasks
```http
GET /housekeeping/my-tasks
Authorization: Bearer <user_token>
```

### Get Statistics
```http
GET /housekeeping/stats
Authorization: Bearer <hotel_token>

Response: {
  "total": 45,
  "pending": 12,
  "inProgress": 8,
  "completed": 20,
  "verified": 5,
  "highPriority": 3
}
```

---

## Bookings

### Create Booking
```http
POST /bookings
Authorization: Bearer <hotel_token>

{
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+91-9876543210",
  "roomId": "room-id",
  "roomNumber": "101",
  "roomTypeId": "type-id",
  "checkInDate": "2025-11-20",
  "checkOutDate": "2025-11-22",
  "adults": 2,
  "children": 1,
  "ratePerNight": 3000,
  "specialRequests": "Late check-in",
  "source": "WALK_IN"
}

Status Flow: INQUIRY → TENTATIVE → CONFIRMED → CHECKED_IN → CHECKED_OUT
Source: WALK_IN, ONLINE, PHONE, AGENT
```

### Check In
```http
POST /bookings/:bookingId/checkin
Authorization: Bearer <frontdesk_token>

- Sets booking status to CHECKED_IN
- Changes room status to OCCUPIED
- Records actualCheckInTime
```

### Check Out
```http
POST /bookings/:bookingId/checkout
Authorization: Bearer <frontdesk_token>

- Sets booking status to CHECKED_OUT
- Changes room status to DIRTY
- Auto-creates housekeeping task
- Generates bill/folio
```

---

## Common Filters

Most list endpoints support filtering:
```http
GET /rooms?status=AVAILABLE
GET /housekeeping?status=PENDING&roomNumber=101
GET /bookings?status=CONFIRMED&date=2025-11-20
```

---

## Error Responses

```json
{
  "message": "Error description"
}
```

Status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request / Validation error
- `401` - Unauthorized (no token or invalid)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

---

## Role Permissions

| Endpoint | superAdmin | hotelAdmin | frontDesk | housekeeping | accounts |
|----------|------------|------------|-----------|--------------|----------|
| Hotels   | ✓          | View own   | View own  | View own     | View own |
| Rooms    | ✓          | ✓          | ✓         | View/Status  | View     |
| Room Types | ✓        | ✓          | View      | View         | ✓        |
| Rate Plans | ✓        | ✓          | View      | -            | ✓        |
| Housekeeping | ✓      | ✓          | ✓         | ✓            | View     |
| Bookings | ✓          | ✓          | ✓         | View         | ✓        |
| Users    | ✓          | Hotel only | -         | -            | -        |

---

## Testing Workflow

1. **Login as superadmin**
   ```bash
   POST /auth/login
   { "username": "superadmin", "password": "admin123" }
   ```

2. **Onboard a hotel**
   ```bash
   POST /hotels/onboard
   # Creates hotel, floors, room types, and admin user
   ```

3. **Login as hotel admin**
   ```bash
   POST /auth/login
   { "username": "admin@grand", "password": "SecurePass123" }
   ```

4. **Create rooms**
   ```bash
   POST /rooms/bulk
   { "rooms": [{ "number": "101", ... }, ...] }
   ```

5. **Create rate plan**
   ```bash
   POST /rate-plans
   { "name": "Weekend Special", ... }
   ```

6. **Test booking flow**
   ```bash
   POST /bookings { ... }
   POST /bookings/:id/checkin
   POST /bookings/:id/checkout
   # → Auto-creates housekeeping task
   ```

7. **Complete housekeeping**
   ```bash
   POST /housekeeping/:taskId/start
   POST /housekeeping/:taskId/complete
   POST /housekeeping/:taskId/verify
   # → Room status changes to AVAILABLE
   ```

---

**Complete API documentation**: See COMPLETE_IMPLEMENTATION.md
