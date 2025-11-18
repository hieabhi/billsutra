/**
 * Test Room-Booking Sync Validation
 */

import { validateRoomBookingSync, printValidationReport } from './utils/validateRoomBookingSync.js';

console.log('🔍 Running Room-Booking Sync Validation...\n');

const report = await validateRoomBookingSync();
printValidationReport(report);

console.log('\n✅ Validation complete!\n');
