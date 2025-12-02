import fs from 'fs';
import path from 'path';

const dataDir = 'server/data';
const allFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

console.log(`Checking ${allFiles.length} JSON files for BOM...\n`);

let fixedCount = 0;

allFiles.forEach(filename => {
  const filepath = path.join(dataDir, filename);
  let content = fs.readFileSync(filepath);
  
  // Remove UTF-8 BOM if present
  if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
    content = content.slice(3);
    fs.writeFileSync(filepath, content);
    console.log(`✅ Fixed BOM in ${filename}`);
    fixedCount++;
  } else {
    console.log(`ℹ️  ${filename} - No BOM`);
  }
});

console.log(`\n✅ Fixed ${fixedCount} file(s)`);
