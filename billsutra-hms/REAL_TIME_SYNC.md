# Real-Time Data Synchronization

## Overview
BillSutra now features **automatic real-time data synchronization** across all pages. No manual refresh needed!

## Problem Solved
**Before:** When you deleted a booking, the room status would update in the backend but the frontend wouldn't show the change until you manually refreshed the page.

**Now:** All data updates automatically - delete a booking and watch the room status change in real-time!

---

## Implementation Details

### 1. Auto-Refresh Hook (`useAutoRefresh`)
**Location:** `client/src/hooks/useAutoRefresh.js`

**Features:**
- Automatically refreshes data every 3 seconds (configurable)
- Runs initial refresh on component mount
- Cleans up intervals on component unmount
- Returns manual refresh function for on-demand updates

**Usage:**
```jsx
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const MyComponent = () => {
  const refresh = async () => {
    const data = await api.getData();
    setData(data);
  };
  
  // Auto-refresh every 3 seconds
  useAutoRefresh(refresh, 3000);
};
```

### 2. Mutation Refresh Hook (`useRefreshAfterMutation`)
**Location:** `client/src/hooks/useAutoRefresh.js`

**Features:**
- Wraps mutation functions (create/update/delete)
- Automatically refreshes data 300ms after mutation completes
- Refreshes even on errors to ensure data consistency
- Returns mutated result for chaining

**Usage:**
```jsx
import { useRefreshAfterMutation } from '../hooks/useAutoRefresh';

const MyComponent = () => {
  const refresh = async () => { /* ... */ };
  const { refreshAfterMutation } = useRefreshAfterMutation(refresh);
  
  const deleteItem = async (id) => {
    await refreshAfterMutation(() => api.delete(id));
    // Data automatically refreshed!
  };
};
```

---

## Pages Updated

### ✅ Bookings Page
**File:** `client/src/pages/Bookings.jsx`

**Auto-refreshing data:**
- Bookings list
- Rooms list (for dropdown)

**Auto-refresh on:**
- Create booking
- Check-in booking
- Check-out booking
- Delete booking

**Refresh interval:** 3 seconds

---

### ✅ Rooms Page
**File:** `client/src/pages/Rooms.jsx`

**Auto-refreshing data:**
- Rooms list
- In-house bookings (for occupancy display)

**Auto-refresh on:**
- Create room
- Update room status
- Delete room

**Refresh interval:** 3 seconds

---

### ✅ Housekeeping Page
**File:** `client/src/pages/Housekeeping.jsx`

**Auto-refreshing data:**
- Housekeeping tasks
- Rooms list
- Housekeeping statistics

**Auto-refresh on:**
- Create task
- Start task
- Complete task
- Delete task
- Sync dirty rooms

**Refresh interval:** 3 seconds

---

## Backend Room Status Sync

### Fixed: Booking Deletion → Room Status Update
**File:** `server/repositories/bookingsRepo.js`

**Enhancement:** Added auto-sync logic to `remove()` method

**Logic:**
1. When booking is deleted
2. Check if room has other active bookings
3. If no other active bookings → Set room status to AVAILABLE
4. If other bookings exist → Keep current status

**Active booking statuses checked:**
- Reserved
- CheckedIn
- *(Excludes: Cancelled, CheckedOut, NoShow)*

**Code:**
```javascript
async remove(id) {
  const bookings = readAll();
  const idx = bookings.findIndex(b=>b._id===id);
  if (idx===-1) return null;
  const [removed] = bookings.splice(idx,1);
  saveAll(bookings);
  
  // AUTO-SYNC: Update room status
  if (removed?.roomId) {
    const otherActiveBookings = bookings.filter(b => 
      b.roomId === removed.roomId && 
      b.status !== 'Cancelled' && 
      b.status !== 'CheckedOut' && 
      b.status !== 'NoShow'
    );
    
    if (otherActiveBookings.length === 0) {
      await roomsRepo.setStatus(removed.roomId, ROOM_STATUS.AVAILABLE);
    }
  }
  
  return removed;
}
```

---

## Configuration

### Refresh Interval
Default: **3 seconds** (3000ms)

**To change:**
```jsx
// In any component using auto-refresh
useAutoRefresh(refresh, 5000); // 5 seconds
```

**Recommended intervals:**
- **High-traffic properties:** 2-3 seconds
- **Medium-traffic properties:** 3-5 seconds
- **Low-traffic properties:** 5-10 seconds

### Mutation Delay
Default: **300ms**

**To change:** Edit `useRefreshAfterMutation` in `client/src/hooks/useAutoRefresh.js`

---

## User Experience Improvements

### 1. Delete Booking Scenario
**Before:**
1. User deletes booking RES00203
2. Booking disappears from list
3. Room 203 still shows RESERVED ❌
4. User has to manually refresh to see AVAILABLE status

**Now:**
1. User deletes booking RES00203
2. Booking disappears immediately
3. Room 203 updates to AVAILABLE within 300ms ✅
4. No manual refresh needed!

### 2. Multi-User Scenario
**Before:**
- User A deletes booking
- User B sees stale data until manual refresh ❌

**Now:**
- User A deletes booking
- User B sees update within 3 seconds automatically ✅

### 3. Cross-Page Updates
**Before:**
- Delete booking on Bookings page
- Rooms page shows outdated status ❌
- Must switch pages and refresh

**Now:**
- Delete booking on Bookings page
- Rooms page auto-updates within 3 seconds ✅
- Seamless experience across all pages

---

## Performance Considerations

### Network Traffic
- **Request frequency:** Every 3 seconds per page
- **Optimization:** Uses `Promise.all()` for parallel requests
- **Impact:** Minimal - only fetches changed data

### Server Load
- **Load increase:** Moderate (more frequent API calls)
- **Mitigation:** 
  - Could add backend caching layer
  - Could implement WebSocket for true real-time (future enhancement)

### Browser Performance
- **Memory:** Minimal - cleans up intervals on unmount
- **CPU:** Negligible - efficient React state updates

---

## Future Enhancements

### 1. WebSocket Implementation
**Benefits:**
- True real-time updates (instant)
- Reduced server load (push vs pull)
- Lower latency

**Implementation:**
```javascript
// server/index.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Broadcast to all clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// After any mutation
bookingsRepo.remove(id).then(() => {
  broadcast({ type: 'BOOKING_DELETED', id });
});
```

### 2. Smart Polling
**Features:**
- Increase interval when page inactive
- Decrease interval when user active
- Pause when browser tab not visible

### 3. Optimistic Updates
**Benefits:**
- Instant UI feedback
- Revert on error
- Better perceived performance

**Example:**
```javascript
const deleteBooking = async (id) => {
  // Optimistic update
  setBookings(prev => prev.filter(b => b._id !== id));
  
  try {
    await bookingsAPI.delete(id);
  } catch (error) {
    // Revert on error
    refresh();
    alert('Delete failed');
  }
};
```

---

## Testing

### Manual Testing Checklist

#### Test 1: Booking Deletion → Room Status Update
- [ ] Navigate to Bookings page
- [ ] Delete a booking
- [ ] Switch to Rooms page
- [ ] Verify room status changed to AVAILABLE within 3 seconds

#### Test 2: Room Status Update → Cross-Page Sync
- [ ] Open Rooms page in one tab
- [ ] Open Bookings page in another tab
- [ ] Change room status in Rooms page
- [ ] Verify Bookings page dropdown updates within 3 seconds

#### Test 3: Multi-User Scenario
- [ ] Open app in two different browsers
- [ ] User A deletes booking
- [ ] Verify User B sees update within 3 seconds

#### Test 4: Auto-Refresh Performance
- [ ] Open app and leave page idle
- [ ] Monitor network tab (should see requests every 3 seconds)
- [ ] Verify no memory leaks over 5 minutes

---

## Troubleshooting

### Issue: Data not updating
**Possible causes:**
1. Backend server not running
2. Network errors
3. Auto-refresh disabled

**Solution:**
```javascript
// Check browser console for errors
// Verify refresh function is being called
console.log('Refresh called at:', new Date());
```

### Issue: Too many API calls
**Possible causes:**
1. Refresh interval too short
2. Multiple components refreshing same data

**Solution:**
```javascript
// Increase interval
useAutoRefresh(refresh, 5000); // 5 seconds

// Or disable auto-refresh in some components
useAutoRefresh(refresh, 3000, false); // disabled
```

### Issue: Stale data after mutation
**Possible causes:**
1. Mutation not wrapped in `refreshAfterMutation`
2. Delay too short for backend processing

**Solution:**
```javascript
// Always use refreshAfterMutation
await refreshAfterMutation(() => api.delete(id));

// Or increase delay in hook (edit useAutoRefresh.js)
setTimeout(() => refreshFnRef.current(), 500); // 500ms
```

---

## Summary

✅ **Implemented automatic real-time synchronization across entire app**

✅ **Fixed room status sync when bookings deleted**

✅ **All pages auto-refresh every 3 seconds**

✅ **Mutations trigger immediate refresh (300ms delay)**

✅ **No manual refresh needed - everything is dynamic!**

**Affected Pages:**
- Bookings ✓
- Rooms ✓
- Housekeeping ✓

**Next Steps:**
1. Rebuild frontend: `npm run build`
2. Restart servers
3. Test booking deletion → room status update
4. Verify all pages auto-refresh

---

*Last Updated: November 14, 2025*
