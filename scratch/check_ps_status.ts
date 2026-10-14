import fs from 'fs';
import { parseSqlTuplesRobust } from '../scripts/migrate_events_and_subs';

const sql = fs.readFileSync('u676616277_hs_original.sql', 'utf8');
const psTuples = parseSqlTuplesRobust(sql, 'playerSeasons');

const statuses = new Map<string, number>();
for (const ps of psTuples) {
  const status = ps[6] || 'null';
  statuses.set(status, (statuses.get(status) || 0) + 1);
}

console.log('Distinct playerSeasons.status counts:');
console.log(Object.fromEntries(statuses));
