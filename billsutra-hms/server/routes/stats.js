import express from 'express';
import { roomsRepo } from '../repositories/roomsRepo.js';
import { bookingsRepo } from '../repositories/bookingsRepo.js';
import { housekeepingRepo } from '../repositories/housekeepingRepo.js';
import { billsRepo } from '../repositories/billsRepo.js';

const router = express.Router();

// Root stats endpoint - returns same as dashboard for convenience
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().slice(0,10);

    const [rooms, bookingsAll, hkAll, billStats] = await Promise.all([
      roomsRepo.list(),
      bookingsRepo.list({}),
      housekeepingRepo.list({}),
      billsRepo.dashboardStats()
    ]);

    // Room Statistics
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r=>r.status==='OCCUPIED').length;
    const availableRooms = rooms.filter(r=>r.status==='AVAILABLE').length;
    const reservedRooms = rooms.filter(r=>r.status==='RESERVED').length;
    const dirtyRooms = rooms.filter(r=>r.housekeepingStatus==='DIRTY').length;
    const cleanRooms = rooms.filter(r=>r.housekeepingStatus==='CLEAN').length;
    
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
    
    // Booking Statistics
    const inHouse = bookingsAll.filter(b=>b.status==='CheckedIn');
    const inHouseCount = inHouse.length;
    const arrivalsToday = bookingsAll.filter(b=> b.status==='Reserved' && (new Date(b.checkInDate)).toISOString().slice(0,10)===todayStr).length;
    // Departed Today: Guests who checked out today (actualCheckOutDate === today)
    const departuresToday = bookingsAll.filter(b=> 
      b.status==='CheckedOut' && 
      b.actualCheckOutDate && 
      (new Date(b.actualCheckOutDate)).toISOString().slice(0,10)===todayStr
    ).length;
    const reserved = bookingsAll.filter(b=>b.status==='Reserved').length;
    const checkedOut = bookingsAll.filter(b=>b.status==='CheckedOut').length;
    
    // Housekeeping
    const hkPending = hkAll.filter(t=>t.status==='PENDING').length;
    const hkCompleted = hkAll.filter(t=>t.status==='COMPLETED').length;

    res.json({
      rooms: { 
        total: totalRooms,
        occupied: occupiedRooms, 
        available: availableRooms, 
        reserved: reservedRooms,
        dirty: dirtyRooms,
        clean: cleanRooms,
        occupancyRate: Number(occupancyRate)
      },
      bookings: { 
        total: bookingsAll.length,
        checkedIn: inHouseCount,
        reserved,
        checkedOut,
        arrivalsToday, 
        departuresToday
      },
      housekeeping: { 
        pending: hkPending,
        completed: hkCompleted
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().slice(0,10);
    
    // Get next 7 days dates
    const next7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0,10);
    });
    
    // Get last 7 days dates for comparison
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (7 - i));
      return d.toISOString().slice(0,10);
    });

    const [rooms, bookingsAll, hkAll, billStats] = await Promise.all([
      roomsRepo.list(),
      bookingsRepo.list({}),
      housekeepingRepo.list({}),
      billsRepo.dashboardStats()
    ]);

    // Room Statistics - DUAL STATUS SYSTEM (Industry Standard)
    const totalRooms = rooms.length;
    
    // OCCUPANCY STATUS (Who is in the room)
    const occupiedRooms = rooms.filter(r=>r.status==='OCCUPIED').length;
    const availableRooms = rooms.filter(r=>r.status==='AVAILABLE').length;
    const reservedRooms = rooms.filter(r=>r.status==='RESERVED').length;
    const blockedRooms = rooms.filter(r=>r.status==='BLOCKED').length;
    const outOfServiceRooms = rooms.filter(r=>r.status==='OUT_OF_SERVICE').length;
    
    // HOUSEKEEPING STATUS (Cleanliness state)
    const dirtyRooms = rooms.filter(r=>r.housekeepingStatus==='DIRTY').length;
    const cleanRooms = rooms.filter(r=>r.housekeepingStatus==='CLEAN').length;
    const inspectedRooms = rooms.filter(r=>r.housekeepingStatus==='INSPECTED').length;
    const pickupRooms = rooms.filter(r=>r.housekeepingStatus==='PICKUP').length;
    const maintenanceRooms = rooms.filter(r=>r.housekeepingStatus==='MAINTENANCE').length;
    
    // COMBINED STATUS COUNTS (For charts and reporting)
    const reservedDirty = rooms.filter(r=>r.status==='RESERVED' && r.housekeepingStatus==='DIRTY').length;
    const reservedClean = rooms.filter(r=>r.status==='RESERVED' && r.housekeepingStatus==='CLEAN').length;
    const availableDirty = rooms.filter(r=>r.status==='AVAILABLE' && r.housekeepingStatus==='DIRTY').length;
    const availableClean = rooms.filter(r=>r.status==='AVAILABLE' && r.housekeepingStatus==='CLEAN').length;
    
    // Occupancy Rate (Industry Standard KPI)
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
    
    // Booking Statistics
    const inHouse = bookingsAll.filter(b=>b.status==='CheckedIn');
    const inHouseCount = inHouse.length;
    const arrivalsToday = bookingsAll.filter(b=> b.status==='Reserved' && (new Date(b.checkInDate)).toISOString().slice(0,10)===todayStr).length;
    // Departed Today: Guests who checked out today (actualCheckOutDate === today)
    const departuresToday = bookingsAll.filter(b=> 
      b.status==='CheckedOut' && 
      b.actualCheckOutDate && 
      (new Date(b.actualCheckOutDate)).toISOString().slice(0,10)===todayStr
    ).length;
    
    // Next 7 Days Arrivals & Departures (Mews, Cloudbeds style)
    const upcomingArrivals = next7Days.map(date => ({
      date,
      count: bookingsAll.filter(b=> b.status==='Reserved' && (new Date(b.checkInDate)).toISOString().slice(0,10)===date).length
    }));
    
    const upcomingDepartures = next7Days.map(date => ({
      date,
      count: bookingsAll.filter(b=> b.status==='CheckedIn' && (new Date(b.checkOutDate)).toISOString().slice(0,10)===date).length
    }));
    
    // ADR - Average Daily Rate (Industry Standard)
    // ADR = Total Room Revenue ÷ Number of Occupied Rooms
    // Use 'rate' (daily rate) not 'amount' (total booking = rate × nights)
    const totalDailyRates = inHouse.reduce((sum, b) => sum + (b.rate || 0), 0);
    const adr = inHouseCount > 0 ? (totalDailyRates / inHouseCount).toFixed(2) : 0;
    
    // RevPAR - Revenue Per Available Room (Industry Standard)
    // RevPAR = ADR × Occupancy Rate = (Total Room Revenue ÷ Occupied Rooms) × (Occupied ÷ Total)
    // Which simplifies to: Total Room Revenue ÷ Total Rooms
    const revPAR = totalRooms > 0 ? (totalDailyRates / totalRooms).toFixed(2) : 0;
    
    // Outstanding Payments (Folio balances)
    const outstandingPayments = inHouse.reduce((sum, b) => sum + (b.folio?.balance || 0), 0);
    
    // Housekeeping Statistics (Industry Standard: Opera PMS, Mews, Cloudbeds)
    const hkPending = hkAll.filter(t=>t.status==='PENDING').length;
    const hkInProgress = hkAll.filter(t=>t.status==='IN_PROGRESS').length;
    const hkCompleted = hkAll.filter(t=>t.status==='COMPLETED').length;
    
    // Today's completed tasks (for dashboard display)
    const hkCompletedToday = hkAll.filter(t=> 
      t.status==='COMPLETED' && 
      t.completedTime && 
      t.completedTime.slice(0,10) === todayStr
    ).length;
    
    // High priority pending tasks (urgent attention needed)
    const hkUrgent = hkAll.filter(t=> 
      (t.status==='PENDING' || t.status==='IN_PROGRESS') && 
      (t.priority==='HIGH' || t.priority==='URGENT')
    ).length;
    
    // Last Week vs This Week Revenue Comparison
    const lastWeekRevenue = billStats.weeklyRevenue || 0;
    const thisWeekRevenue = billStats.todayRevenue || 0; // This would need to be enhanced in billsRepo
    const revenueTrend = lastWeekRevenue > 0 ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1) : 0;

    res.json({
      // Room Statistics - DUAL STATUS (Industry Standard)
      rooms: { 
        // Totals
        totalRooms,
        
        // Occupancy Status (Who is in the room)
        occupiedRooms, 
        availableRooms, 
        reservedRooms,
        blockedRooms,
        outOfServiceRooms,
        
        // Housekeeping Status (Cleanliness)
        dirtyRooms,
        cleanRooms,
        inspectedRooms,
        pickupRooms,
        maintenanceRooms,
        
        // Combined Status (for detailed reporting)
        reservedDirty,
        reservedClean,
        availableDirty,
        availableClean,
        
        // KPIs
        occupancyRate: Number(occupancyRate)
      },
      
      // Booking Statistics
      bookings: { 
        inHouse: inHouseCount, 
        arrivalsToday, 
        departuresToday,
        upcomingArrivals,
        upcomingDepartures
      },
      
      // Financial KPIs (Industry Standard)
      financial: {
        adr: Number(adr),
        revPAR: Number(revPAR),
        outstandingPayments: Number(outstandingPayments.toFixed(2)),
        revenueTrend: Number(revenueTrend)
      },
      
      // Housekeeping (Industry Standard KPIs)
      housekeeping: { 
        pending: hkPending,
        inProgress: hkInProgress,
        completed: hkCompleted,
        completedToday: hkCompletedToday,
        urgent: hkUrgent
      },
      
      // Billing
      billing: billStats
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
