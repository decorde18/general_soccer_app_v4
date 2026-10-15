import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from '../scripts/migrate_events_and_subs';

function main() {
  console.log('=== VARSITY VS JV GAMES WITH/WITHOUT GOALS ===\n');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const legacyGames = parseSqlTuplesRobust(sql, 'games');
  const legacyGoalsFor = parseSqlTuplesRobust(sql, 'goalsFor');
  const legacyGoalsAgainst = parseSqlTuplesRobust(sql, 'goalsAgainst');
  const legacyStoppages = parseSqlTuplesRobust(sql, 'stoppages');
  const legacyPeriods = parseSqlTuplesRobust(sql, 'periods');
  const legacySeasons = parseSqlTuplesRobust(sql, 'seasons');
  const legacySchools = parseSqlTuplesRobust(sql, 'schools');

  const seasonsMap = new Map<number, string>();
  legacySeasons.forEach(s => seasonsMap.set(Number(s[0]), (s[2] || s[1] || '').trim()));

  const schoolsMap = new Map<number, string>();
  legacySchools.forEach(s => schoolsMap.set(Number(s[0]), (s[1] || '').trim()));

  const periodToGame = new Map<number, number>();
  legacyPeriods.forEach(p => periodToGame.set(Number(p[0]), Number(p[1])));

  const stoppageToGame = new Map<number, number>();
  legacyStoppages.forEach(s => {
    const pId = Number(s[1]);
    if (periodToGame.has(pId)) stoppageToGame.set(Number(s[0]), periodToGame.get(pId)!);
  });

  const gamesWithGoals = new Set<number>();
  legacyGoalsFor.forEach(gf => {
    const gId = stoppageToGame.get(Number(gf[1]));
    if (gId) gamesWithGoals.add(gId);
  });
  legacyGoalsAgainst.forEach(ga => {
    const gId = stoppageToGame.get(Number(ga[1]));
    if (gId) gamesWithGoals.add(gId);
  });

  const varsityMissing: any[] = [];
  const jvMissing: any[] = [];
  const otherMissing: any[] = [];

  let varsityWithGoals = 0;
  let jvWithGoals = 0;

  legacyGames.forEach(g => {
    const gId = Number(g[0]);
    const date = g[2];
    const sId = Number(g[4]);
    const sName = seasonsMap.get(sId) || `Season ${sId}`;
    const oppId = g[6] ? Number(g[6]) : null;
    const oppName = oppId ? (schoolsMap.get(oppId) || `Opponent ${oppId}`) : 'TBD';
    const teamType = (g[11] || 'Varsity').trim();
    const comment = g[16] || '';
    const status = (g[28] || '').toLowerCase().trim();

    const hasGoals = gamesWithGoals.has(gId);
    const isCompleted = status === 'completed' || status === 'final';

    if (teamType.toLowerCase() === 'varsity') {
      if (hasGoals) varsityWithGoals++;
      else if (isCompleted) varsityMissing.push({ gId, date, sName, oppName, teamType, comment });
    } else if (teamType.toLowerCase().includes('jv')) {
      if (hasGoals) jvWithGoals++;
      else if (isCompleted) jvMissing.push({ gId, date, sName, oppName, teamType, comment });
    } else {
      if (!hasGoals && isCompleted) otherMissing.push({ gId, date, sName, oppName, teamType, comment });
    }
  });

  console.log(`Varsity Games: ${varsityWithGoals} with goals, ${varsityMissing.length} completed without goals`);
  console.log(`JV Games: ${jvWithGoals} with goals, ${jvMissing.length} completed without goals`);
  console.log(`Other Games: ${otherMissing.length} completed without goals`);

  console.log('\n--- Breakdown of Varsity Games Missing Goals by Season ---');
  const varsityMissingBySeason = new Map<string, any[]>();
  varsityMissing.forEach(g => {
    if (!varsityMissingBySeason.has(g.sName)) varsityMissingBySeason.set(g.sName, []);
    varsityMissingBySeason.get(g.sName)!.push(g);
  });

  [...varsityMissingBySeason.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([sName, games]) => {
      console.log(`  ${sName}: ${games.length} varsity games missing goals`);
      if (games.length <= 5) {
        games.forEach(g => console.log(`     -> ID ${g.gId}: vs ${g.oppName} on ${g.date} (Comment: "${g.comment}")`));
      }
    });
}

main();
