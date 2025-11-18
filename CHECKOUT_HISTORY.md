# Checkout History System

## Overview

The checkout history system automatically tracks all guest checkouts, cancellations, and no-shows for each room. This provides a complete audit trail of all stays and allows hotels to:

- View all past guests who stayed in a room
- Track revenue history per room
- Identify frequent guests
- Analyze room occupancy patterns
- Review historical booking data

## How It Works

### Automatic History Tracking

Every time a guest checks out, the system automatically:

1. **Updates Booking Status** - Sets booking status to `CheckedOut`
2. **Updates Room Status** - Changes room to `DIRTY`
3. **Creates History Entry** - Adds checkout record to room's history array
4. **Creates Housekeeping Task** - Auto-generates cleaning task

### History Entry Structure

Each checkout history entry contains:

```javascript
{
  _id: "unique-id",
  type: "checkout",
  guestName: "Guest Name",
  reservationNumber: "RES00123",
  checkInDate: "2025-11-14",
  checkOutDate: "2025-11-15",
  nights: 1,
  rate: 3000,
  totalAmount: 3000,
  paymentMethod: "Cash",
  status: "CheckedOut", // or "Cancelled" or "NoShow"
  timestamp: "2025-11-14T10:30:00.000Z"
}
```

### Supported Statuses

The system tracks three types of completed bookings:

- **CheckedOut** - Normal checkout after stay
- **Cancelled** - Booking cancelled before/during stay
- **NoShow** - Guest didn't arrive for reservation

## Backend Implementation

### Location: `server/repositories/bookingsRepo.js`

The `checkOut()` method handles the complete checkout workflow:

```javascript
async checkOut(id) {
  // 1. Update booking status
  const booking = await this.update(id, { status: 'CheckedOut' });
  
  if (booking?.roomId) {
    // 2. Set room to DIRTY
    await roomsRepo.setStatus(booking.roomId, ROOM_STATUS.DIRTY);
    
    // 3. Add to room history
    await roomsRepo.addHistory(booking.roomId, {
      type: 'checkout',
      guestName: booking.guest?.name || 'Guest',
      reservationNumber: booking.reservationNumber,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights: booking.nights,
      rate: booking.rate,
      totalAmount: booking.amount,
      paymentMethod: booking.paymentMethod,
      timestamp: new Date().toISOString()
    });
    
    // 4. Create housekeeping task
    await housekeepingRepo.createFromCheckout(/* ... */);
  }
  
  return booking;
}
```

### Location: `server/repositories/roomsRepo.js`

Room history management methods:

```javascript
// Add history entry
async addHistory(roomId, historyEntry) {
  // Initialize history array if needed
  if (!room.history) room.history = [];
  
  // Add to beginning (most recent first)
  room.history.unshift(entry);
  
  // Keep only last 100 entries
  if (room.history.length > 100) {
    room.history = room.history.slice(0, 100);
  }
  
  return entry;
}

// Get room history
async getHistory(roomId, limit = 50) {
  return (room.history || []).slice(0, limit);
}

// Clear old history (maintenance)
async clearOldHistory(roomId, daysToKeep = 365) {
  // Remove entries older than cutoff date
}
```

### API Endpoint: `GET /api/rooms/:id/history`

```javascript
router.get('/:id/history', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  const history = await roomsRepo.getHistory(req.params.id, limit);
  res.json(history);
});
```

## Frontend Implementation

### Location: `client/src/pages/RoomDetail.jsx`

The room detail page displays checkout history in a dedicated section:

```javascript
// Fetch room history
useEffect(() => {
  if (roomId) {
    roomsAPI.getHistory(roomId, 100)
      .then(data => setCheckoutHistory(data))
      .catch(err => console.error('Failed to fetch checkout history:', err));
  }
}, [roomId]);

// Display in table
<table>
  <thead>
    <tr>
      <th>Guest</th>
      <th>Res No</th>
      <th>Check-in</th>
      <th>Check-out</th>
      <th>Nights</th>
      <th>Rate</th>
      <th>Total</th>
      <th>Payment</th>
      <th>Checkout Time</th>
    </tr>
  </thead>
  <tbody>
    {checkoutHistory.map(h => (
      <tr key={h._id}>
        <td>{h.guestName}</td>
        <td>{h.reservationNumber}</td>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

### Booking Status Filtering

The page now properly categorizes bookings:

```javascript
const history = useMemo(() => {
  const today = new Date();
  return {
    // Past: CheckedOut, Cancelled, NoShow, or past dates
    past: bookings.filter(b => 
      b.status === 'CheckedOut' || 
      b.status === 'Cancelled' || 
      b.status === 'NoShow' ||
      new Date(b.checkOutDate) < today
    ),
    
    // Current: Active bookings within stay dates
    current: bookings.filter(b => 
      b.status !== 'CheckedOut' && 
      b.status !== 'Cancelled' && 
      b.status !== 'NoShow' &&
      new Date(b.checkInDate) <= today && 
      today <= new Date(b.checkOutDate)
    ),
    
    // Future: Active upcoming bookings
    future: bookings.filter(b => 
      b.status !== 'CheckedOut' && 
      b.status !== 'Cancelled' && 
      b.status !== 'NoShow' &&
      new Date(b.checkInDate) > today
    )
  };
}, [bookings]);
```

## Migration Script

### Purpose

For existing systems with historical checkout data, use the migration script to populate room histories.

### Location: `server/migrate-checkout-history.js`

### How to Run

```bash
node server/migrate-checkout-history.js
```

### What It Does

1. **Scans All Bookings** - Finds CheckedOut, Cancelled, NoShow bookings
2. **Processes Each Room** - Iterates through all rooms
3. **Adds History Entries** - Creates history records for past checkouts
4. **Avoids Duplicates** - Skips entries already in history
5. **Maintains Limits** - Keeps last 100 entries per room
6. **Sorts by Date** - Most recent checkouts first

### Output Example

```
🔄 Starting Checkout History Migration...

📊 Found 6 completed bookings to migrate
🏨 Processing 8 rooms

✓ Room 101: Added 2 checkout(s) to history
✓ Room 201: Added 2 checkout(s) to history
✓ Room 301: Added 1 checkout(s) to history

✅ Migration Complete!

Summary:
  • Rooms updated: 3
  • History entries added: 5
  • Duplicates skipped: 1
  • Total completed bookings: 6

Checkout History by Room:
  Room 101: 2 total (2 checkouts)
  Room 201: 2 total (2 checkouts)
  Room 301: 1 total (1 checkout)
```

### Safe to Re-run

The migration script is **idempotent** - you can safely run it multiple times:
- Detects existing entries by reservation number, guest name, and dates
- Skips duplicates automatically
- Only adds new checkout records

## Data Structure

### Room Model with History

```javascript
{
  _id: "room-101",
  hotelId: "hotel-001",
  number: "101",
  status: "AVAILABLE",
  // ... other room fields
  
  history: [
    {
      _id: "hist-001",
      type: "checkout",
      guestName: "John Doe",
      reservationNumber: "RES00123",
      checkInDate: "2025-11-14",
      checkOutDate: "2025-11-15",
      nights: 1,
      rate: 3000,
      totalAmount: 3000,
      paymentMethod: "Cash",
      status: "CheckedOut",
      timestamp: "2025-11-15T10:30:00.000Z"
    },
    // ... up to 100 most recent entries
  ]
}
```

## Best Practices

### History Maintenance

**Keep Last 100 Entries**
- System automatically limits to 100 entries per room
- Oldest entries are removed when limit exceeded
- 100 entries typically covers 1-2 years of history

**Archive Old Data**
- For long-term storage, export old history periodically
- Use `clearOldHistory()` method to remove entries older than X days
- Example: Keep only last 365 days

```javascript
await roomsRepo.clearOldHistory(roomId, 365); // Keep last year only
```

### Performance Considerations

**History Array Size**
- 100 entries × 8 rooms = 800 total entries in memory
- Each entry ~300 bytes = ~240KB total
- Negligible performance impact

**Indexing** (Future Enhancement)
- If scaling to 100+ rooms, consider database indexing
- Index on timestamp for faster sorting
- Index on guestName for search functionality

### Data Integrity

**Automatic Addition**
- History is added automatically by `checkOut()` method
- No manual intervention required
- Cannot be deleted by users (read-only in UI)

**Validation**
- Guest name is required (falls back to "Guest")
- Reservation number must be unique
- Dates and amounts are validated

## Future Enhancements

### Planned Features

1. **Search & Filter**
   - Search checkout history by guest name
   - Filter by date range
   - Filter by payment method

2. **Export Functionality**
   - Export room history to CSV/Excel
   - Generate PDF reports per room
   - Email history reports

3. **Analytics**
   - Room revenue over time
   - Average length of stay
   - Repeat guest tracking
   - Occupancy rate calculation

4. **Guest Profiles**
   - Link to customer database
   - Track guest preferences
   - Loyalty program integration

5. **Performance Optimization**
   - Move to database with proper indexing
   - Pagination for large histories
   - Lazy loading of old entries

## Troubleshooting

### History Not Showing

**Problem:** Checkout history is empty for a room

**Solutions:**
1. Run migration script: `node server/migrate-checkout-history.js`
2. Check if bookings have `status: 'CheckedOut'`
3. Verify `roomId` matches in booking and room records

### Duplicate Entries

**Problem:** Same checkout appears multiple times

**Solutions:**
1. Migration script should skip duplicates automatically
2. Check for different reservation numbers (legitimate separate stays)
3. Manually remove duplicates from `rooms.json` if needed

### Missing Recent Checkouts

**Problem:** Recent checkout not in history but older ones are

**Solutions:**
1. Check if checkout was completed (status = CheckedOut)
2. Verify backend server is running
3. Check browser console for API errors
4. Refresh browser (Ctrl+F5)

### Performance Issues

**Problem:** Slow loading on room detail page

**Solutions:**
1. Limit history to 50 entries: `getHistory(roomId, 50)`
2. Check if room has excessive history entries (>100)
3. Clear old history: `clearOldHistory(roomId, 365)`

## API Reference

### Get Room History

```http
GET /api/rooms/:id/history?limit=50
```

**Response:**
```json
[
  {
    "_id": "hist-001",
    "type": "checkout",
    "guestName": "John Doe",
    "reservationNumber": "RES00123",
    "checkInDate": "2025-11-14",
    "checkOutDate": "2025-11-15",
    "nights": 1,
    "rate": 3000,
    "totalAmount": 3000,
    "paymentMethod": "Cash",
    "status": "CheckedOut",
    "timestamp": "2025-11-15T10:30:00.000Z"
  }
]
```

## Summary

The checkout history system provides:
- ✅ **Automatic tracking** - No manual effort required
- ✅ **Complete audit trail** - All checkouts, cancellations, no-shows
- ✅ **Data integrity** - Validated, structured data
- ✅ **Performance** - Efficient storage and retrieval
- ✅ **Migration support** - Easy to populate existing data
- ✅ **Extensible** - Ready for future analytics features

**Key Files:**
- `server/repositories/bookingsRepo.js` - Checkout workflow
- `server/repositories/roomsRepo.js` - History management
- `server/routes/rooms.js` - History API endpoint
- `server/migrate-checkout-history.js` - Migration script
- `client/src/pages/RoomDetail.jsx` - History display
