import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Find where INSERT INTO `people` or `people` occurs
const matches = [...sql.matchAll(/INSERT INTO [`"']?people[`"']?\s*\((.*?)\)\s*VALUES/gi)];

if (matches.length > 0) {
  console.log('Columns header in INSERT statement:', matches[0][1]);
} else {
  console.log('No INSERT INTO people with column list found. Checking without column list...');
  const matches2 = [...sql.matchAll(/INSERT INTO [`"']?people[`"']?\s*VALUES\s*([\s\S]*?);/gi)];
  if (matches2.length > 0) {
    console.log('Found INSERT INTO people without column list! Sample value string snippet:');
    console.log(matches2[0][1].slice(0, 500));
  }
}
