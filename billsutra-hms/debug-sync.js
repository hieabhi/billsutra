import { validateAndFixRoomBookingSync } from './server/utils/roomBookingSync.js';

console.log('Starting manual sync debug...');
try {
    const result = await validateAndFixRoomBookingSync();
    console.log('Sync result:', JSON.stringify(result, null, 2));
} catch (error) {
    console.error('Sync failed:', error);
}
console.log('Done.');
