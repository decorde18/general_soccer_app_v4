import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const regex = /INSERT INTO [`"']?(\w+)[`"']?\s*\((.*?)\)\s*VALUES/gi;
const tableHeaders = new Map<string, string[]>();

for (const match of sql.matchAll(regex)) {
  const table = match[1];
  const columns = match[2].split(',').map(c => c.replace(/[`"'\s]/g, ''));
  if (!tableHeaders.has(table)) {
    tableHeaders.set(table, columns);
  }
}

console.log('=== ALL LEGACY TABLE COLUMN HEADERS ===\n');
for (const [table, cols] of tableHeaders.entries()) {
  console.log(`Table: ${table}`);
  cols.forEach((col, idx) => console.log(`  [${idx}] ${col}`));
  console.log('');
}
