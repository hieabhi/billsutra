import { readJSON, writeJSON } from './server/utils/fileStore.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOMS_FILE = path.join(__dirname, 'server', 'data', 'rooms.json');

console.log('\n🔍 CHECKING ROOM 101 STATUS AFTER CHECKOUT\n');

const rooms = readJSON(ROOMS_FILE, []);
const room101 = rooms.find(r => r.number === '101');

console.log(`Total rooms: ${rooms.length}`);
console.log(`Looking for room with number='101'...`);

if (room101) {
  console.log(`Room 101:`);
  console.log(`  - Occupancy Status: ${room101.status}`);
  console.log(`  - Housekeeping Status: ${room101.housekeepingStatus}`);
  console.log(`\n✅ Expected after checkout: AVAILABLE + DIRTY`);
  console.log(`${room101.status === 'AVAILABLE' && room101.housekeepingStatus === 'DIRTY' ? '✅' : '❌'} Actual: ${room101.status} + ${room101.housekeepingStatus}\n`);
} else {
  console.log('❌ Room 101 not found\n');
}
