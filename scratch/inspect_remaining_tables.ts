import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from '../scripts/migrate_events_and_subs';

const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const tablesToCheck = [
  'calendarEvents',
  'scheduleHelper',
  'uniforms',
  'uniformJerseys',
  'uniformSeasons',
  'uniformSeasonPlayers',
  'parents',
  'playerParents',
  'minorEvents',
  'schoolClassification',
  'dbDefaults'
];

console.log('=== INSPECTING UNIMPORTED / REMAINING LEGACY TABLES ===\n');

for (const tbl of tablesToCheck) {
  const tuples = parseSqlTuplesRobust(sql, tbl);
  const regex = new RegExp('CREATE TABLE [`"\']?' + tbl + '[`"\']?\\s*\\(([\\s\\S]*?)\\)\\s*ENGINE', 'i');
  const createMatch = sql.match(regex);
  const cols = createMatch
    ? createMatch[1]
        .split('\n')
        .filter(l => l.trim().startsWith('`'))
        .map(l => l.trim().split(' ')[0].replace(/[`\,]/g, ''))
    : [];

  console.log(`Table: ${tbl}`);
  console.log(`  Count: ${tuples.length}`);
  console.log(`  Columns (${cols.length}): ${cols.join(', ')}`);
  if (tuples.length > 0) {
    console.log(`  Sample Row 1:`, JSON.stringify(tuples[0]));
    if (tuples.length > 1) {
      console.log(`  Sample Row 2:`, JSON.stringify(tuples[1]));
    }
  }
  console.log('');
}
