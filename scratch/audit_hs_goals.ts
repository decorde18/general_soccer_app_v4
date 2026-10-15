import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { parseSqlTuplesRobust } from '../scripts/migrate_events_and_subs';

async function main() {
  console.log('=== AUDITING HS ORIGINAL GOALS AND GAMES ===\n');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 1. Inspect games table schema in SQL
  const gamesHeaderMatch = sql.match(/CREATE TABLE [`"']?games[`"']?\s*\(([\s\S]*?)\)\s*ENGINE/i);
  if (gamesHeaderMatch) {
    console.log('--- Legacy games Table Columns ---');
    console.log(gamesHeaderMatch[1].split('\n').filter(l => l.trim().startsWith('`')).map(l => l.trim()).join('\n'));
  }

  // 2. Parse legacy tables
  const legacyGames = parseSqlTuplesRobust(sql, 'games');
  const legacyGoalsFor = parseSqlTuplesRobust(sql, 'goalsFor');
  const legacyGoalsAgainst = parseSqlTuplesRobust(sql, 'goalsAgainst');
  const legacyStoppages = parseSqlTuplesRobust(sql, 'stoppages');
  const legacyPeriods = parseSqlTuplesRobust(sql, 'periods');
  const legacySeasons = parseSqlTuplesRobust(sql, 'seasons');

  console.log(`\nLegacy Counts:`);
  console.log(`  games: ${legacyGames.length}`);
  console.log(`  goalsFor: ${legacyGoalsFor.length}`);
  console.log(`  goalsAgainst: ${legacyGoalsAgainst.length}`);
  console.log(`  stoppages: ${legacyStoppages.length}`);
  console.log(`  periods: ${legacyPeriods.length}`);
  console.log(`  seasons: ${legacySeasons.length}`);

  // Inspect first tuple of each to know column indices
  console.log('\nSample legacy game tuple:');
  console.log(JSON.stringify(legacyGames[0]));

  console.log('\nSample legacy goalsFor tuple:');
  console.log(JSON.stringify(legacyGoalsFor[0]));

  console.log('\nSample legacy goalsAgainst tuple:');
  console.log(JSON.stringify(legacyGoalsAgainst[0]));

  console.log('\nSample legacy stoppage tuple:');
  console.log(JSON.stringify(legacyStoppages[0]));

  // Check how many goals are in current DB
  const dbGoalCount = await prisma.game_events_goals.count();
  const dbMajorEventCount = await prisma.game_events_major.count();
  const dbGameCount = await prisma.games.count();
  console.log(`\nCurrent DB Counts:`);
  console.log(`  games: ${dbGameCount}`);
  console.log(`  game_events_major: ${dbMajorEventCount}`);
  console.log(`  game_events_goals: ${dbGoalCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
