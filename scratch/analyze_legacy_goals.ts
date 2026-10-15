import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from '../scripts/migrate_events_and_subs';

function main() {
  console.log('=== ANALYZING ALL GOALS AND GAMES IN LEGACY SQL ===\n');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // List all tables
  const tableMatches = [...sql.matchAll(/CREATE TABLE [`"']?(\w+)[`"']?/g)].map(m => m[1]);
  console.log('Tables found in legacy SQL:', tableMatches);

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

  // Map periods to games
  // periods columns: [id, gameId, periodNumber, ...]
  const periodToGame = new Map<number, number>();
  legacyPeriods.forEach(p => {
    periodToGame.set(Number(p[0]), Number(p[1]));
  });

  // Map stoppages to games
  // stoppages columns: [id, periodId, time, eventType, ...]
  const stoppageToGame = new Map<number, number>();
  const stoppageToPeriod = new Map<number, number>();
  legacyStoppages.forEach(s => {
    const sId = Number(s[0]);
    const pId = Number(s[1]);
    stoppageToPeriod.set(sId, pId);
    if (periodToGame.has(pId)) {
      stoppageToGame.set(sId, periodToGame.get(pId)!);
    }
  });

  console.log(`\nStoppages mapped to games: ${stoppageToGame.size} / ${legacyStoppages.length}`);
  const unmappedStoppages = legacyStoppages.filter(s => !stoppageToGame.has(Number(s[0])));
  if (unmappedStoppages.length > 0) {
    console.log(`Unmapped stoppages count: ${unmappedStoppages.length}`);
  }

  // Count goals per game
  // goalsFor columns: [id, stoppageId (event_id), scorerPlayerId, assistPlayerId, ...]
  const gfByGame = new Map<number, any[]>();
  let unmappedGoalsFor = 0;
  legacyGoalsFor.forEach(gf => {
    const sId = Number(gf[1]);
    const gId = stoppageToGame.get(sId);
    if (gId) {
      if (!gfByGame.has(gId)) gfByGame.set(gId, []);
      gfByGame.get(gId)!.push(gf);
    } else {
      unmappedGoalsFor++;
    }
  });

  // goalsAgainst columns: [id, stoppageId (event_id), gkPlayerId, ...]
  const gaByGame = new Map<number, any[]>();
  let unmappedGoalsAgainst = 0;
  legacyGoalsAgainst.forEach(ga => {
    const sId = Number(ga[1]);
    const gId = stoppageToGame.get(sId);
    if (gId) {
      if (!gaByGame.has(gId)) gaByGame.set(gId, []);
      gaByGame.get(gId)!.push(ga);
    } else {
      unmappedGoalsAgainst++;
    }
  });

  console.log(`\nGoals For: ${legacyGoalsFor.length} total, ${unmappedGoalsFor} unmapped to a game`);
  console.log(`Goals Against: ${legacyGoalsAgainst.length} total, ${unmappedGoalsAgainst} unmapped to a game`);

  // Analyze all games
  // games: [id, calId, date, time, season, departureTime, opponent, classification, location, home, district, teamType, gameType, seasonTime, gk_current, gk_starter, comment, so_if_tied, ot_if_tied, min_ot, max_ot, ot1, ot2, reg_periods, reg_period_min, created, updated, veo, status]
  let completedGamesCount = 0;
  let gamesWithGoalsCount = 0;
  let gamesWithZeroGoals = 0;
  const gamesMissingScores: any[] = [];
  const gamesWithExtractedScores: any[] = [];

  for (const g of legacyGames) {
    const gId = Number(g[0]);
    const date = g[2];
    const seasonId = Number(g[4]);
    const seasonName = seasonsMap.get(seasonId) || `Season ${seasonId}`;
    const oppId = g[6] ? Number(g[6]) : null;
    const oppName = oppId ? (schoolsMap.get(oppId) || `Opponent ${oppId}`) : 'TBD';
    const teamType = g[11] || 'Varsity';
    const comment = g[16] || '';
    const status = (g[28] || '').toLowerCase().trim();

    const gf = gfByGame.get(gId) || [];
    const ga = gaByGame.get(gId) || [];

    const isCompleted = status === 'completed' || status === 'final';
    if (isCompleted) completedGamesCount++;

    if (gf.length > 0 || ga.length > 0) {
      gamesWithGoalsCount++;
    } else {
      gamesWithZeroGoals++;
      // Check if comment or notes contain score information!
      // Examples: "W 3-1", "Won 2-0", "Lost 1-3", "Tie 0-0", "3-2", "Score: 4-1"
      const scoreRegex = /(?:([WwLlTt]|Win|Loss|Tie|Won|Lost)\s*)?(\d+)\s*[-–]\s*(\d+)/;
      const match = comment.match(scoreRegex);
      if (match) {
        gamesWithExtractedScores.push({
          gId,
          date,
          seasonName,
          teamType,
          oppName,
          status,
          comment,
          parsedScore: `${match[2]}-${match[3]}`
        });
      } else if (isCompleted) {
        gamesMissingScores.push({
          gId,
          date,
          seasonName,
          teamType,
          oppName,
          status,
          comment
        });
      }
    }
  }

  console.log(`\nGame Statistics:`);
  console.log(`  Total Games: ${legacyGames.length}`);
  console.log(`  Completed Games: ${completedGamesCount}`);
  console.log(`  Games WITH goal events in goalsFor/goalsAgainst: ${gamesWithGoalsCount}`);
  console.log(`  Games WITHOUT goal events: ${gamesWithZeroGoals}`);
  console.log(`  Games without goal events that have scores in comments: ${gamesWithExtractedScores.length}`);
  console.log(`  Completed games with ZERO score anywhere: ${gamesMissingScores.length}`);

  if (gamesWithExtractedScores.length > 0) {
    console.log(`\n--- Sample Games without goal events but score found in comments (${gamesWithExtractedScores.length} total) ---`);
    gamesWithExtractedScores.slice(0, 15).forEach(g => {
      console.log(`  Game ID ${g.gId} (${g.seasonName} ${g.teamType} vs ${g.oppName} on ${g.date}) -> Parsed: ${g.parsedScore} | Comment: "${g.comment}"`);
    });
  }

  if (gamesMissingScores.length > 0) {
    console.log(`\n--- Sample Completed Games missing ANY score (${gamesMissingScores.length} total) ---`);
    gamesMissingScores.slice(0, 15).forEach(g => {
      console.log(`  Game ID ${g.gId} (${g.seasonName} ${g.teamType} vs ${g.oppName} on ${g.date}) | Status: ${g.status} | Comment: "${g.comment}"`);
    });
  }
}

main();
