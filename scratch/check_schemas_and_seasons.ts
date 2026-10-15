import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from '../scripts/migrate_events_and_subs';

function main() {
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Check table schemas for playerGames, playerSeasons, calendarEvents, minorEvents
  const tables = ['playerGames', 'playerSeasons', 'calendarEvents', 'minorEvents', 'seasons'];
  for (const t of tables) {
    const m = sql.match(new RegExp(`CREATE TABLE [\`"']?${t}[\`"']?\\s*\\(([\\s\\S]*?)\\)\\s*ENGINE`, 'i'));
    if (m) {
      console.log(`\n--- Table: ${t} ---`);
      console.log(m[1].split('\n').filter(l => l.trim().startsWith('`')).map(l => l.trim()).join('\n'));
    }
  }

  // Check seasons breakdown of games with goals vs games without goals
  const legacyGames = parseSqlTuplesRobust(sql, 'games');
  const legacyGoalsFor = parseSqlTuplesRobust(sql, 'goalsFor');
  const legacyGoalsAgainst = parseSqlTuplesRobust(sql, 'goalsAgainst');
  const legacyStoppages = parseSqlTuplesRobust(sql, 'stoppages');
  const legacyPeriods = parseSqlTuplesRobust(sql, 'periods');
  const legacySeasons = parseSqlTuplesRobust(sql, 'seasons');

  const seasonsMap = new Map<number, string>();
  legacySeasons.forEach(s => seasonsMap.set(Number(s[0]), (s[2] || s[1] || '').trim()));

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

  // Group games by season
  const seasonStats = new Map<string, { total: number; completed: number; withGoals: number; withoutGoals: number }>();
  legacyGames.forEach(g => {
    const seasonId = Number(g[4]);
    const seasonName = seasonsMap.get(seasonId) || `Season ${seasonId}`;
    if (!seasonStats.has(seasonName)) {
      seasonStats.set(seasonName, { total: 0, completed: 0, withGoals: 0, withoutGoals: 0 });
    }
    const stat = seasonStats.get(seasonName)!;
    stat.total++;
    const isCompleted = (g[28] || '').toLowerCase().trim() === 'completed';
    if (isCompleted) stat.completed++;

    if (gamesWithGoals.has(Number(g[0]))) {
      stat.withGoals++;
    } else {
      stat.withoutGoals++;
    }
  });

  console.log('\n--- Season Breakdown: Games with Detailed Goals vs Without ---');
  [...seasonStats.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([season, st]) => {
      console.log(`  ${season.padEnd(12)}: Total ${String(st.total).padStart(2)} | Completed ${String(st.completed).padStart(2)} | With Goal Events: ${String(st.withGoals).padStart(2)} | No Goal Events: ${String(st.withoutGoals).padStart(2)}`);
    });
}

main();
