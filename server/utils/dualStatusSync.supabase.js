/**
 * DUAL STATUS SYNCHRONIZATION SYSTEM - SUPABASE VERSION
 * Industry Standard (Opera PMS, Maestro, Cloudbeds, Mews)
 * 
 * Rooms have TWO independent statuses:
 * 1. OCCUPANCY STATUS - Who is in the room (AVAILABLE, RESERVED, OCCUPIED, etc.)
 * 2. HOUSEKEEPING STATUS - Cleanliness state (CLEAN, DIRTY, INSPECTED, etc.)
 * 
 * Example: Room can be "RESERVED + DIRTY" (booked for tomorrow but needs cleaning)
 */

import supabase from '../config/supabase.js';
import { ROOM_STATUS, HOUSEKEEPING_STATUS } from '../models/Room.js';
import { TASK_TYPE } from '../models/HousekeepingTask.js';

console.log('🔄 LOADING SUPABASE DUAL-STATUS SYNC');

/**
 * Sync housekeeping status based on pending/active cleaning tasks
 */
export async function syncHousekeepingStatus() {
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');
    
    if (roomsError) throw roomsError;
    
    const { data: housekeeping, error: hkError } = await supabase
      .from('housekeeping')
      .select('*');
    
    if (hkError) throw hkError;
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*');
    
    if (bookingsError) throw bookingsError;
    
    const fixes = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const room of rooms || []) {
      let newHousekeepingStatus = room.housekeeping_status || HOUSEKEEPING_STATUS.CLEAN;
      const oldHousekeepingStatus = newHousekeepingStatus;

      // Check for pending/active tasks by type
      const activeTasks = (housekeeping || []).filter(task => 
        task.room_number === room.room_number && 
        (task.status === 'PENDING' || task.status === 'IN_PROGRESS')
      );

      // CRITICAL FIX: Also check if ALL tasks are completed
      const allTasksForRoom = (housekeeping || []).filter(task => task.room_number === room.room_number);
      const allTasksCompleted = allTasksForRoom.length > 0 && 
        allTasksForRoom.every(task => task.status === 'COMPLETED');

      // Categorize tasks
      const maintenanceTasks = activeTasks.filter(t => t.type === TASK_TYPE.MAINTENANCE);
      const cleaningTasks = activeTasks.filter(t => 
        t.type === TASK_TYPE.CLEANING || 
        t.type === TASK_TYPE.DEEP_CLEAN || 
        t.type === TASK_TYPE.TURNDOWN || 
        t.type === TASK_TYPE.LAUNDRY
      );
      const inspectionTasks = activeTasks.filter(t => t.type === TASK_TYPE.INSPECTION);

      // **INDUSTRY STANDARD PRIORITY** (Opera PMS, Maestro, Cloudbeds):
      // MAINTENANCE > DIRTY (needs cleaning) > INSPECTED > CLEAN
      if (maintenanceTasks.length > 0) {
        newHousekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
      } else if (cleaningTasks.length > 0) {
        newHousekeepingStatus = HOUSEKEEPING_STATUS.DIRTY;
      } else if (inspectionTasks.length > 0) {
        newHousekeepingStatus = HOUSEKEEPING_STATUS.INSPECTED;
      } else {
        // No active tasks - determine if CLEAN or DIRTY based on checkout status
        
        // FIX: If all existing tasks are completed, room should be CLEAN
        if (allTasksCompleted) {
          newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
        } else {
          // Check for completed checkout today (room becomes dirty after checkout)
          const todayCheckouts = (bookings || []).filter(booking =>
            booking.room_id === room.id &&
            booking.status === 'CheckedOut' &&
            booking.check_out_date?.startsWith(today)
          );

          if (todayCheckouts.length > 0) {
            const cleaningCompleted = (housekeeping || []).some(task =>
              task.room_id === room.id &&
              task.status === 'COMPLETED' &&
              (task.type === TASK_TYPE.CLEANING || task.type === TASK_TYPE.DEEP_CLEAN) &&
              task.completed_time &&
              task.completed_time.startsWith(today)
            );

            newHousekeepingStatus = cleaningCompleted 
              ? HOUSEKEEPING_STATUS.CLEAN 
              : HOUSEKEEPING_STATUS.DIRTY;
          } else {
            newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
          }
        }
      }

      // Update if changed
      if (newHousekeepingStatus !== oldHousekeepingStatus) {
        await supabase
          .from('rooms')
          .update({ 
            housekeeping_status: newHousekeepingStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', room.id);
        
        let reason = 'Status synchronized';
        if (maintenanceTasks.length > 0) {
          reason = 'Maintenance task pending';
        } else if (cleaningTasks.length > 0) {
          reason = 'Cleaning task pending';
        } else if (inspectionTasks.length > 0) {
          reason = 'Inspection task pending';
        }
        
        fixes.push({
          room: room.room_number,
          from: oldHousekeepingStatus || 'NONE',
          to: newHousekeepingStatus,
          reason: reason
        });
      }
    }

    return fixes;
  } catch (error) {
    console.error('[SYNC ERROR] syncHousekeepingStatus:', error);
    return [];
  }
}

/**
 * Sync occupancy status based on bookings
 */
export async function syncOccupancyStatus() {
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');
    
    if (roomsError) throw roomsError;
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*');
    
    if (bookingsError) throw bookingsError;
    
    const fixes = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const room of rooms || []) {
      let newOccupancyStatus = ROOM_STATUS.AVAILABLE;
      const oldOccupancyStatus = room.status;

      // Skip OUT_OF_SERVICE and BLOCKED rooms
      if (oldOccupancyStatus === ROOM_STATUS.OUT_OF_SERVICE || 
          oldOccupancyStatus === ROOM_STATUS.BLOCKED) {
        continue;
      }

      // Find active booking for this room
      const activeBooking = (bookings || []).find(booking =>
        booking.room_id === room.id &&
        booking.status === 'CheckedIn'
      );

      // Find future reservations
      const futureReservation = (bookings || []).find(booking =>
        booking.room_id === room.id &&
        booking.status === 'Reserved' &&
        booking.check_in_date >= today
      );

      if (activeBooking) {
        newOccupancyStatus = ROOM_STATUS.OCCUPIED;
      } else if (futureReservation) {
        newOccupancyStatus = ROOM_STATUS.RESERVED;
      } else {
        newOccupancyStatus = ROOM_STATUS.AVAILABLE;
      }

      // Update if changed
      if (newOccupancyStatus !== oldOccupancyStatus) {
        await supabase
          .from('rooms')
          .update({ 
            status: newOccupancyStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', room.id);
        
        fixes.push({
          room: room.room_number,
          from: oldOccupancyStatus,
          to: newOccupancyStatus,
          reason: activeBooking 
            ? `Checked-in booking found` 
            : futureReservation
              ? `Future reservation exists`
              : `No active bookings`
        });
      }
    }

    return fixes;
  } catch (error) {
    console.error('[SYNC ERROR] syncOccupancyStatus:', error);
    return [];
  }
}

/**
 * Initialize housekeepingStatus for rooms that don't have it
 */
export async function initializeHousekeepingStatus() {
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');
    
    if (roomsError) throw roomsError;
    
    let initialized = 0;

    for (const room of rooms || []) {
      if (!room.housekeeping_status) {
        let newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
        let newOccupancyStatus = room.status;
        
        // Map old DIRTY/CLEAN status to housekeepingStatus
        if (room.status === 'DIRTY') {
          newHousekeepingStatus = HOUSEKEEPING_STATUS.DIRTY;
          newOccupancyStatus = ROOM_STATUS.AVAILABLE; // Reset occupancy status
        } else if (room.status === 'CLEAN') {
          newHousekeepingStatus = HOUSEKEEPING_STATUS.CLEAN;
          newOccupancyStatus = ROOM_STATUS.AVAILABLE; // Reset occupancy status
        } else if (room.status === 'MAINTENANCE') {
          newHousekeepingStatus = HOUSEKEEPING_STATUS.MAINTENANCE;
          newOccupancyStatus = ROOM_STATUS.AVAILABLE; // Reset occupancy status
        }
        
        await supabase
          .from('rooms')
          .update({
            housekeeping_status: newHousekeepingStatus,
            status: newOccupancyStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', room.id);
        
        initialized++;
      }
    }

    return initialized;
  } catch (error) {
    console.error('[SYNC ERROR] initializeHousekeepingStatus:', error);
    return 0;
  }
}

/**
 * Auto-create cleaning tasks for dirty rooms (Opera PMS style)
 */
async function autoCreateCleaningTasks() {
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');
    
    if (roomsError) throw roomsError;
    
    const { data: housekeeping, error: hkError } = await supabase
      .from('housekeeping')
      .select('*');
    
    if (hkError) throw hkError;
    
    const tasksCreated = [];
    
    for (const room of rooms || []) {
      if (room.housekeeping_status === HOUSEKEEPING_STATUS.DIRTY) {
        // Check if room already has an active cleaning task
        const hasActiveTask = (housekeeping || []).some(task =>
          task.room_id === room.id &&
          (task.status === 'PENDING' || task.status === 'IN_PROGRESS') &&
          task.type === 'CLEANING'
        );
        
        if (!hasActiveTask) {
          // Auto-create cleaning task
          const { error: insertError } = await supabase
            .from('housekeeping')
            .insert({
              tenant_id: room.tenant_id,
              room_id: room.id,
              room_number: room.room_number,
              type: 'CLEANING',
              status: 'PENDING',
              priority: 'MEDIUM',
              assigned_to: null,
              assigned_to_name: '',
              description: 'Auto-generated cleaning task for dirty room',
              notes: '',
              reported_issues: [],
              checklist: [],
              estimated_duration: 30,
              actual_duration: 0,
              start_time: null,
              completed_time: null,
              verified_by: null,
              verified_time: null,
              next_arrival_time: null,
              booking_id: null
            });
          
          if (!insertError) {
            tasksCreated.push({ room: room.room_number });
          }
        }
      }
    }
    
    return tasksCreated;
  } catch (error) {
    console.error('[SYNC ERROR] autoCreateCleaningTasks:', error);
    return [];
  }
}

/**
 * Complete dual-status sync (runs on server startup and periodically)
 */
export async function runDualStatusSync() {
  console.log('\n🔄 DUAL STATUS SYNC - Industry Standard (Opera PMS, Maestro, Cloudbeds, Mews)');
  
  // Step 1: Initialize housekeeping status for rooms that don't have it
  const initialized = await initializeHousekeepingStatus();
  if (initialized > 0) {
    console.log(`   ✓ Initialized housekeepingStatus for ${initialized} rooms`);
  }

  // Step 2: Sync occupancy status (AVAILABLE, RESERVED, OCCUPIED)
  const occupancyFixes = await syncOccupancyStatus();
  if (occupancyFixes.length > 0) {
    console.log(`\n   📋 OCCUPANCY STATUS FIXES (${occupancyFixes.length}):`);
    occupancyFixes.forEach(fix => {
      console.log(`      Room ${fix.room}: ${fix.from} → ${fix.to} (${fix.reason})`);
    });
  }

  // Step 3: Sync housekeeping status (CLEAN, DIRTY, MAINTENANCE)
  const housekeepingFixes = await syncHousekeepingStatus();
  if (housekeepingFixes.length > 0) {
    console.log(`\n   🧹 HOUSEKEEPING STATUS FIXES (${housekeepingFixes.length}):`);
    housekeepingFixes.forEach(fix => {
      console.log(`      Room ${fix.room}: ${fix.from} → ${fix.to} (${fix.reason})`);
    });
  }
  
  // Step 4: Auto-create cleaning tasks for dirty rooms (Opera PMS style)
  const tasksCreated = await autoCreateCleaningTasks();
  if (tasksCreated.length > 0) {
    console.log(`\n   🔧 AUTO-CREATED CLEANING TASKS (${tasksCreated.length}):`);
    tasksCreated.forEach(t => {
      console.log(`      Room ${t.room}: Cleaning task auto-created`);
    });
  }

  const totalFixes = occupancyFixes.length + housekeepingFixes.length;
  
  if (totalFixes === 0 && initialized === 0 && tasksCreated.length === 0) {
    console.log('   ✓ All statuses synchronized, no tasks needed');
  }

  console.log('   ✓ Dual-status sync completed\n');

  return {
    initialized,
    occupancyFixes,
    housekeepingFixes,
    tasksCreated,
    totalFixes
  };
}

/**
 * Start periodic dual-status sync (every 5 minutes)
 */
export function startPeriodicDualStatusSync(intervalMinutes = 5) {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  setInterval(async () => {
    console.log(`\n⏰ Periodic dual-status sync (every ${intervalMinutes} mins)...`);
    await runDualStatusSync();
  }, intervalMs);

  console.log(`🔁 Periodic dual-status sync enabled (every ${intervalMinutes} minutes)\n`);
}
