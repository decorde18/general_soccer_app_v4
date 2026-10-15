import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from '../scripts/migrate_parents_and_relationships';

const sql = fs.readFileSync(path.resolve(process.cwd(), 'u676616277_hs_original.sql'), 'utf8');

const minorEvents = parseSqlTuplesRobust(sql, 'minorEvents');
const periods = parseSqlTuplesRobust(sql, 'periods');
const games = parseSqlTuplesRobust(sql, 'games');

const periodToGame = new Map<number, number>();
periods.forEach(p => periodToGame.set(Number(p[0]), Number(p[1])));

console.log('=== AUDITING MINOR EVENTS MAPPING ===\n');
console.log('Total minorEvents:', minorEvents.length);

const byGame = new Map<number, any[]>();
let unmapped = 0;

minorEvents.forEach(me => {
  const [id, eventType, team, minute, player, pId, created, updated] = me;
  const gId = periodToGame.get(Number(pId));
  if (!gId) {
    unmapped++;
    return;
  }
  if (!byGame.has(gId)) byGame.set(gId, []);
  byGame.get(gId)!.push({ id, eventType, team, minute, pId });
});

console.log('Mapped to games:', minorEvents.length - unmapped);
console.log('Unmapped:', unmapped);
console.log('Games with minor events:', byGame.size);
for (const [gId, evts] of byGame.entries()) {
  console.log(`  Game ID ${gId}: ${evts.length} minor events`);
}
