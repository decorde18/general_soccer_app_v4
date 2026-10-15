import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from '../scripts/migrate_events_and_subs';

function main() {
  console.log('=== AUDITING GOAL MAPPING INTEGRITY ===\n');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const legacyGames = parseSqlTuplesRobust(sql, 'games');
  const legacyGoalsFor = parseSqlTuplesRobust(sql, 'goalsFor');
  const legacyGoalsAgainst = parseSqlTuplesRobust(sql, 'goalsAgainst');
  const legacyStoppages = parseSqlTuplesRobust(sql, 'stoppages');
  const legacyPeriods = parseSqlTuplesRobust(sql, 'periods');
  const legacySeasons = parseSqlTuplesRobust(sql, 'seasons');
  const legacySchools = parseSqlTuplesRobust(sql, 'schools');
  const legacyPeople = parseSqlTuplesRobust(sql, 'people');
  const legacyPlayers = parseSqlTuplesRobust(sql, 'players');

  // People map: personId -> name
  const peopleMap = new Map<number, string>();
  legacyPeople.forEach(p => peopleMap.set(Number(p[0]), `${p[3]} ${p[4]}`));

  // Player map: playerId -> personId
  const playerToPerson = new Map<number, number>();
  legacyPlayers.forEach(pl => playerToPerson.set(Number(pl[0]), Number(pl[2])));

  const periodToGame = new Map<number, number>();
  const periodNumberMap = new Map<number, number>();
  legacyPeriods.forEach(p => {
    periodToGame.set(Number(p[0]), Number(p[1]));
    periodNumberMap.set(Number(p[0]), Number(p[2]) || 1);
  });

  const stoppageMap = new Map<number, { gameId: number; periodNum: number; time: number; desc: string }>();
  legacyStoppages.forEach(s => {
    const sId = Number(s[0]);
    const pId = Number(s[1]);
    const time = Number(s[4]) ?? Number(s[2]) ?? 0;
    const desc = s[3] || '';
    if (periodToGame.has(pId)) {
      stoppageMap.set(sId, {
        gameId: periodToGame.get(pId)!,
        periodNum: periodNumberMap.get(pId) || 1,
        time,
        desc
      });
    }
  });

  // Track each goalFor
  let gfValid = 0;
  let gfMissingStoppage = 0;
  let gfMissingPlayer = 0;
  const gfPerGame = new Map<number, { scorer: string; assist: string | null; time: number; type: string }[]>();

  legacyGoalsFor.forEach((gf, idx) => {
    const sId = Number(gf[1]);
    const scorerPlId = Number(gf[2]);
    const assistPlId = gf[3] ? Number(gf[3]) : null;
    const goalType = gf[13] || 'Run of Play';

    const stop = stoppageMap.get(sId);
    if (!stop) {
      gfMissingStoppage++;
      return;
    }

    const scorerPersonId = playerToPerson.get(scorerPlId);
    const scorerName = scorerPersonId ? (peopleMap.get(scorerPersonId) || `Person ${scorerPersonId}`) : `Unknown Player ${scorerPlId}`;
    if (!scorerPersonId) gfMissingPlayer++;

    let assistName: string | null = null;
    if (assistPlId) {
      const aPersonId = playerToPerson.get(assistPlId);
      assistName = aPersonId ? (peopleMap.get(aPersonId) || `Person ${aPersonId}`) : `Unknown Player ${assistPlId}`;
    }

    gfValid++;
    if (!gfPerGame.has(stop.gameId)) gfPerGame.set(stop.gameId, []);
    gfPerGame.get(stop.gameId)!.push({
      scorer: scorerName,
      assist: assistName,
      time: stop.time,
      type: goalType
    });
  });

  // Track each goalAgainst
  let gaValid = 0;
  let gaMissingStoppage = 0;
  const gaPerGame = new Map<number, { gk: string | null; time: number; type: string }[]>();

  legacyGoalsAgainst.forEach((ga, idx) => {
    const sId = Number(ga[1]);
    const gkPlId = ga[2] ? Number(ga[2]) : null;
    const goalType = ga[11] || 'Run of Play';

    const stop = stoppageMap.get(sId);
    if (!stop) {
      gaMissingStoppage++;
      return;
    }

    let gkName: string | null = null;
    if (gkPlId) {
      const gkPersonId = playerToPerson.get(gkPlId);
      gkName = gkPersonId ? (peopleMap.get(gkPersonId) || `Person ${gkPersonId}`) : `Unknown GK ${gkPlId}`;
    }

    gaValid++;
    if (!gaPerGame.has(stop.gameId)) gaPerGame.set(stop.gameId, []);
    gaPerGame.get(stop.gameId)!.push({
      gk: gkName,
      time: stop.time,
      type: goalType
    });
  });

  console.log(`Goals For Audit:`);
  console.log(`  Total in SQL: ${legacyGoalsFor.length}`);
  console.log(`  Valid (mapped to stoppage & game): ${gfValid}`);
  console.log(`  Missing Stoppage: ${gfMissingStoppage}`);
  console.log(`  Missing Player Link: ${gfMissingPlayer}`);

  console.log(`\nGoals Against Audit:`);
  console.log(`  Total in SQL: ${legacyGoalsAgainst.length}`);
  console.log(`  Valid (mapped to stoppage & game): ${gaValid}`);
  console.log(`  Missing Stoppage: ${gaMissingStoppage}`);

  console.log(`\nDistinct Games with Goals:`);
  const allGameIdsWithGoals = new Set([...gfPerGame.keys(), ...gaPerGame.keys()]);
  console.log(`  Total games with at least 1 goal in legacy SQL: ${allGameIdsWithGoals.size}`);

  // Summary by season
  const seasonsMap = new Map<number, string>();
  legacySeasons.forEach(s => seasonsMap.set(Number(s[0]), (s[2] || s[1] || '').trim()));

  const gamesMap = new Map<number, any>();
  legacyGames.forEach(g => gamesMap.set(Number(g[0]), g));

  const goalsBySeason = new Map<string, { games: number; gf: number; ga: number }>();
  allGameIdsWithGoals.forEach(gId => {
    const g = gamesMap.get(gId);
    if (!g) return;
    const sId = Number(g[4]);
    const sName = seasonsMap.get(sId) || `Season ${sId}`;
    if (!goalsBySeason.has(sName)) goalsBySeason.set(sName, { games: 0, gf: 0, ga: 0 });
    const st = goalsBySeason.get(sName)!;
    st.games++;
    st.gf += (gfPerGame.get(gId) || []).length;
    st.ga += (gaPerGame.get(gId) || []).length;
  });

  console.log('\n--- Season-by-Season Goal Breakdown from Legacy SQL ---');
  [...goalsBySeason.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([sName, st]) => {
      console.log(`  ${sName.padEnd(12)}: ${String(st.games).padStart(2)} games | ${String(st.gf).padStart(3)} Goals For | ${String(st.ga).padStart(3)} Goals Against | Total: ${st.gf + st.ga}`);
    });
}

main();
