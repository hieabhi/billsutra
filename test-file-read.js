import { readJSON } from './server/utils/fileStore.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, 'server', 'data');
const roomsPath = path.join(dataDir, 'rooms.json');

console.log('Data dir:', dataDir);
console.log('Rooms file path:', roomsPath);
console.log('File exists:', fs.existsSync(roomsPath));

if (fs.existsSync(roomsPath)) {
  const raw = fs.readFileSync(roomsPath, 'utf-8');
  console.log('Raw file length:', raw.length);
  const parsed = JSON.parse(raw);
  console.log('Parsed rooms count:', parsed.length);
}

console.log('\nTesting readJSON:');
const rooms = readJSON('rooms.json', []);
console.log('readJSON result:', rooms.length, 'rooms');
