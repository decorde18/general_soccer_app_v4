import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from './inspect_minor_events';

const sql = fs.readFileSync(path.resolve(process.cwd(), 'u676616277_hs_original.sql'), 'utf8');

const legacyParents = parseSqlTuplesRobust(sql, 'parents');
const legacyPlayerParents = parseSqlTuplesRobust(sql, 'playerParents');
const legacyPlayers = parseSqlTuplesRobust(sql, 'players');
const legacyPeople = parseSqlTuplesRobust(sql, 'people');

console.log('=== AUDITING PARENTS AND PLAYER-PARENTS IN LEGACY SQL ===\n');
console.log('Legacy Parents count:', legacyParents.length);
console.log('Legacy PlayerParents count:', legacyPlayerParents.length);
console.log('Legacy Players count:', legacyPlayers.length);
console.log('Legacy People count:', legacyPeople.length);

// Map legacy player ID -> legacy person ID
const playerToPerson = new Map<number, number>();
legacyPlayers.forEach(p => {
  playerToPerson.set(Number(p[0]), Number(p[2]));
});

// Map legacy parent ID -> legacy person ID
// parents cols: [id, created_at, peopleId, updated_at]
const parentToPerson = new Map<number, number>();
legacyParents.forEach(p => {
  parentToPerson.set(Number(p[0]), Number(p[2]));
});

// People map
const peopleMap = new Map<number, string>();
legacyPeople.forEach(p => {
  peopleMap.set(Number(p[0]), `${p[3]} ${p[4]}`.trim());
});

let validLinks = 0;
let missingParentPerson = 0;
let missingPlayerPerson = 0;

const pairs: { playerPersonId: number; playerName: string; parentPersonId: number; parentName: string }[] = [];

legacyPlayerParents.forEach(pp => {
  const parentId = Number(pp[0]);
  const playerId = Number(pp[1]);

  const parentPersonId = parentToPerson.get(parentId);
  const playerPersonId = playerToPerson.get(playerId);

  if (!parentPersonId) {
    missingParentPerson++;
    return;
  }
  if (!playerPersonId) {
    missingPlayerPerson++;
    return;
  }

  validLinks++;
  pairs.push({
    playerPersonId,
    playerName: peopleMap.get(playerPersonId) || `Person ${playerPersonId}`,
    parentPersonId,
    parentName: peopleMap.get(parentPersonId) || `Person ${parentPersonId}`,
  });
});

console.log('\nMapping Results:');
console.log('  Valid player-parent person links:', validLinks);
console.log('  Missing parent person:', missingParentPerson);
console.log('  Missing player person:', missingPlayerPerson);
console.log('  Distinct Unique Relationships:', new Set(pairs.map(p => p.playerPersonId + '-' + p.parentPersonId)).size);
console.log('\nSample 10 Mapped Parent-Player Links:');
pairs.slice(0, 10).forEach((p, idx) => {
  console.log(`  ${idx + 1}. Player: ${p.playerName} (ID: ${p.playerPersonId}) <---> Parent: ${p.parentName} (ID: ${p.parentPersonId})`);
});
