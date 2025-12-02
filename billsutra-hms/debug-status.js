import { readJSON } from './server/utils/fileStore.js';

const rooms = readJSON('rooms.json', []);
const room201 = rooms.find(r => r.number === '201' || r.number === 201);

if (room201) {
    console.log(`Room 201 Status in DB: ${room201.status}`);
} else {
    console.log('Room 201 not found');
}
