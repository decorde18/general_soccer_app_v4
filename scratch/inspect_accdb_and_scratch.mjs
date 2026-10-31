import fs from 'fs';
import path from 'path';

const rootDir = 'd:/Development/general_soccer_app_v4';
const scratchDir = path.join(rootDir, 'scratch');

console.log('--- Root files matching accdb / sql / json ---');
for (const f of fs.readdirSync(rootDir)) {
  if (f.endsWith('.accdb') || f.endsWith('.mdb') || f.endsWith('.sql') || f.endsWith('.json')) {
    console.log('Root:', f);
  }
}

if (fs.existsSync(scratchDir)) {
  console.log('\n--- Scratch directory contents ---');
  for (const f of fs.readdirSync(scratchDir)) {
    const full = path.join(scratchDir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      console.log(`Dir: ${f}/ (${fs.readdirSync(full).length} items)`);
      for (const sf of fs.readdirSync(full).slice(0, 30)) {
        console.log(`  - ${sf}`);
      }
    } else {
      console.log(`File: ${f} (${stat.size} bytes)`);
    }
  }
}
