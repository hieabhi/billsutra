// Run Room-Booking Sync
import { validateAndFixRoomBookingSync } from './server/utils/roomBookingSync.js';

console.log('\n🔄 Running Room-Booking Synchronization...\n');

const result = await validateAndFixRoomBookingSync();

console.log('✅ SYNC RESULTS:\n');
console.log(`   Fixed: ${result.fixed} rooms\n`);

if (result.details.length > 0) {
  console.log('📋 DETAILS:\n');
  result.details.forEach(d => {
    console.log(`   Room ${d.roomNumber}: ${d.from} → ${d.to}`);
    console.log(`   Reason: ${d.reason}\n`);
  });
} else {
  console.log('   ✓ All rooms already synchronized!\n');
}

console.log('✅ SYNC COMPLETE!\n');
