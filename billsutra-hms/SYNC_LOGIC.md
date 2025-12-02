# BillSutra - Interdependency & Synchronization Logic

## Overview
This document explains how different modules auto-sync in the BillSutra hotel management system, following industry best practices.

---

## 1. Room Status ↔ Housekeeping Synchronization

### Room Status Changes → Auto-Create Housekeeping Tasks

**Trigger**: When room status changes to `DIRTY`

**Actions**:
1. System auto-creates a housekeeping CLEANING task
2. Task is marked as `PENDING`
3. Priority is set based on next arrival time
   - **HIGH**: If next guest arrives within 4 hours
   - **MEDIUM**: Standard checkout cleaning
   - **LOW**: Routine cleaning

**Implementation**: `roomsRepo.update()` → `housekeepingRepo.createFromRoomStatus()`

**Example**:
```
Room 103 checkout → Status = DIRTY → Auto-creates "Clean Room 103" task
```

---

### Housekeeping Task Completion → Auto-Update Room Status

**Trigger**: When CLEANING task is marked `COMPLETED`

**Actions**:
1. System checks if room is still `DIRTY`
2. If yes, auto-updates room status to `CLEAN`
3. Room becomes available for booking

**Implementation**: `housekeepingRepo.complete()` → `roomsRepo.setStatus('CLEAN')`

**Example**:
```
Task "Clean Room 103" → COMPLETED → Room 103 status = CLEAN
```

---

## 2. Booking ↔ Room Status Synchronization

### Check-In → Room Status Update

**Trigger**: Booking check-in

**Actions**:
1. Booking status → `CheckedIn`
2. Room status → `OCCUPIED`
3. Room is blocked from new bookings

**Implementation**: `bookingsRepo.checkIn()` → `roomsRepo.setStatus('OCCUPIED')`

---

### Check-Out → Room Status + Housekeeping Task Creation

**Trigger**: Booking check-out

**Actions**:
1. Booking status → `CheckedOut`
2. Room status → `DIRTY`
3. **Auto-creates housekeeping task** for checkout cleaning
4. Priority set based on next reservation
5. Invoice auto-generated

**Implementation**: 
```javascript
bookingsRepo.checkOut() →
  1. roomsRepo.setStatus('DIRTY')
  2. housekeepingRepo.createFromCheckout(roomId, nextArrivalTime)
  3. billsRepo.create(invoiceData)
```

**Example Flow**:
```
Guest checks out Room 102 → 
  Room 102 = DIRTY → 
  Creates "Priority Clean - Next guest at 2 PM" →
  Generates Invoice INV00042
```

---

## 3. Booking Conflict Detection (Phase 8 - Upcoming)

### Overlapping Reservation Prevention

**Trigger**: Creating/updating booking

**Checks**:
1. Query all bookings for same room
2. Check date overlaps: `(newCheckIn < existingCheckOut) AND (newCheckOut > existingCheckIn)`
3. Reject if conflict found

**Status Check**:
- Only bookings with status `Reserved`, `CheckedIn`, or `Confirmed` block dates
- `CheckedOut` and `Cancelled` bookings don't block

---

## 4. Dynamic Pricing Integration

### Rate Calculation Workflow

**When**: Creating/modifying booking

**Steps**:
1. Get room's base `roomTypeId`
2. Query `ratePlansAPI` for date-specific overrides
3. Apply seasonal pricing
4. Apply day-of-week multipliers
5. Calculate GST based on room rate slabs
6. Return final rate

**GST Slabs (Indian Tax Law)**:
- < ₹1000: 0% GST
- ₹1000-2499: 12% GST
- ₹2500-7499: 18% GST
- ≥ ₹7500: 28% GST

---

## 5. Manual Sync Endpoint

### Sync Dirty Rooms Button

**Purpose**: Handle edge cases where auto-sync fails

**Functionality**:
```
POST /api/housekeeping/sync-dirty-rooms
```

**Actions**:
1. Find all rooms with status = `DIRTY`
2. Check if they have active housekeeping tasks
3. Create tasks for rooms without tasks
4. Return count of tasks created

**Use Cases**:
- System restart/recovery
- Bulk import of room statuses
- Staff manually marks rooms dirty

---

## 6. Room Status Workflow (Enforced Transitions)

### Valid Status Transitions

```
AVAILABLE → RESERVED (new booking created)
RESERVED → OCCUPIED (check-in)
OCCUPIED → DIRTY (checkout)
DIRTY → CLEAN (housekeeping completes)
CLEAN → AVAILABLE (verified by front desk)
ANY → MAINTENANCE (manual block)
MAINTENANCE → DIRTY (work completed, needs cleaning)
```

### Blocked Transitions
- OCCUPIED → AVAILABLE ❌ (must checkout first)
- DIRTY → AVAILABLE ❌ (must clean first)
- RESERVED → DIRTY ❌ (logical error)

---

## 7. Folio Management Integration

### Auto-Folio Line Items

**Check-Out Triggers**:
1. Room rent added to folio
2. Mini-bar charges (if any)
3. Laundry services (if any)
4. GST calculated and added
5. Total computed with tax

**Implementation**:
```javascript
bookingsRepo.checkOut() →
  Adds folio lines for all charges →
  Calculates GST →
  Generates final invoice
```

---

## 8. Future Enhancements (Phases 8-10)

### Phase 8: Smart Booking Conflicts
- Real-time availability calendar
- Block out-of-service rooms
- Handle early check-in/late checkout

### Phase 9: Advanced Folio
- Split billing
- Corporate accounts
- Credit card pre-authorization
- Partial payments tracking

### Phase 10: Analytics Dashboard
- Occupancy rates by room type
- Revenue per available room (RevPAR)
- Housekeeping efficiency metrics
- Average Daily Rate (ADR)

---

## Testing the Synchronization

### Test Scenario 1: Checkout Flow
1. Check out booking for Room 102
2. ✅ Room 102 status = DIRTY
3. ✅ Housekeeping task auto-created
4. ✅ Invoice generated
5. Complete housekeeping task
6. ✅ Room 102 status = CLEAN

### Test Scenario 2: Manual Room Dirty
1. Manually set Room 101 to DIRTY
2. ✅ Housekeeping task auto-created
3. Or click "Sync Dirty Rooms" button
4. ✅ Task appears in housekeeping list

### Test Scenario 3: Check-In
1. Check in reserved booking
2. ✅ Room status = OCCUPIED
3. ✅ Room blocked from new bookings

---

## API Endpoints Summary

### Synchronization Endpoints
```
POST /api/housekeeping/sync-dirty-rooms        # Manual sync
POST /api/bookings/:id/check-in                # Auto: room → OCCUPIED
POST /api/bookings/:id/check-out               # Auto: room → DIRTY + task
POST /api/housekeeping/:id/complete            # Auto: room → CLEAN
POST /api/rooms/:id/status                     # Manual status change
```

---

## Best Practices from Top Hotel Systems

### Inspired by: Hotelogix, Opera PMS, Protel

1. **Auto-Task Creation**: Never rely on manual task entry
2. **Priority Queues**: High priority for same-day turnovers
3. **Status Workflow**: Enforce valid state transitions
4. **Audit Trail**: Log all status changes with timestamps
5. **Real-time Updates**: WebSocket notifications (future)
6. **Mobile App**: Housekeeping staff mobile interface (future)

---

## Implementation Status

✅ Room ↔ Housekeeping sync
✅ Booking ↔ Room status sync  
✅ Auto-task creation on checkout
✅ Auto-room status update on task completion
✅ Manual sync endpoint
⏳ Booking conflict detection (Phase 8)
⏳ Advanced folio management (Phase 9)
⏳ Analytics dashboard (Phase 10)

---

**Last Updated**: November 14, 2025
**Version**: 1.0
