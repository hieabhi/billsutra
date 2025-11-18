import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', 'data');

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function readJSON(fileName, defaultValue = []) {
  try {
    ensureDir();
    const filePath = path.join(dataDir, fileName);
    console.log('[DEBUG] readJSON - filePath:', filePath);
    console.log('[DEBUG] readJSON - exists:', fs.existsSync(filePath));
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf-8');
    console.log('[DEBUG] readJSON - raw length:', raw?.length);
    const parsed = raw ? JSON.parse(raw) : defaultValue;
    console.log('[DEBUG] readJSON - parsed count:', Array.isArray(parsed) ? parsed.length : 'not array');
    return parsed;
  } catch (err) {
    console.error('[ERROR] readJSON -', fileName, err.message);
    return defaultValue;
  }
}

export function writeJSON(fileName, data) {
  ensureDir();
  const filePath = path.join(dataDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
