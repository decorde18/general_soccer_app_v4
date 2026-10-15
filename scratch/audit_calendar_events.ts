import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from './inspect_minor_events';

const sql = fs.readFileSync(path.resolve(process.cwd(), 'u676616277_hs_original.sql'), 'utf8');
const calEvents = parseSqlTuplesRobust(sql, 'calendarEvents');
const seasons = parseSqlTuplesRobust(sql, 'seasons');

const seasonMap = new Map<number, string>();
seasons.forEach(s => seasonMap.set(Number(s[0]), s[2] || s[1] || ''));

console.log('=== CALENDAR EVENTS IN LEGACY SQL ===\n');
calEvents.forEach(ce => {
  const [id, created, summary, start, end, seasonId, updated, calId, calType, allDay, phase, loc, desc] = ce;
  console.log(`Event ID ${id}: "${summary}"`);
  console.log(`  Season: ${seasonMap.get(Number(seasonId))} (ID: ${seasonId})`);
  console.log(`  Range: ${start} -> ${end} (All Day: ${allDay})`);
  console.log(`  Type: ${calType} | Phase: ${phase} | CalId: ${calId}`);
  console.log(`  Location: ${loc} | Description: "${desc}"\n`);
});
