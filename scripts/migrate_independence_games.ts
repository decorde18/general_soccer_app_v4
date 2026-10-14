import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { games_status, games_game_type, player_games_game_status, teams_gender } from '../src/generated/client';
import { parseGameDatesAndTimesUTC } from '../src/lib/utils/dateTimeUtils';

function parseSqlTuples(sql: string, tableName: string): (string | null)[][] {
  const insertRegex = new RegExp(`INSERT INTO [\\\`"']?${tableName}[\\\`"']?\\s*(\\(.*?\\))?\\s*VALUES`, 'gi');
  const tuples: (string | null)[][] = [];

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const startIdx = match.index + match[0].length;
    // Find the real closing semicolon that is NOT inside quotes
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = startIdx; i < sql.length; i++) {
      const c = sql[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === "'" || c === '"') { inString = !inString; continue; }
      if (!inString && c === ';') {
        endIdx = i;
        break;
      }
    }

    if (endIdx === -1) endIdx = sql.length;

    const valuesStr = sql.slice(startIdx, endIdx);

    // Extract each tuple (...)
    let current = '';
    inString = false;
    escape = false;
    let depth = 0;

    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i];
      if (escape) { current += char; escape = false; continue; }
      if (char === '\\') { current += char; escape = true; continue; }
      if (char === "'" || char === '"') { inString = !inString; current += char; continue; }
      if (!inString) {
        if (char === '(') {
          depth++;
          if (depth === 1) { current = ''; continue; }
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            tuples.push(parseTupleFields(current));
            current = '';
            continue;
          }
        }
      }
      if (depth > 0) current += char;
    }
  }

  return tuples;
}

function parseTupleFields(tupleStr: string): (string | null)[] {
  const fields: string[] = [];
  let field = '';
  let inStr = false;
  let esc = false;

  for (let i = 0; i < tupleStr.length; i++) {
    const c = tupleStr[i];
    if (esc) { field += c; esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === "'") { inStr = !inStr; continue; }
    if (c === ',' && !inStr) { fields.push(field.trim()); field = ''; continue; }
    field += c;
  }
  fields.push(field.trim());

  return fields.map(f => {
    if (f === 'NULL' || f === 'null') return null;
    return f.replace(/^'|'$/g, '');
  });
}

export async function migrateGamesStep1And2() {
  console.log('=== ULTRA-FAST BULK GAMES & PLAYER_GAMES MIGRATION (STEPS 1 & 2) ===');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found at ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 1. Locate Independence High School Club and Teams
  const ihsClub = await prisma.clubs.findFirst({
    where: {
      OR: [
        { name: { equals: 'Independence High School' } },
        { name: { contains: 'Independence' } }
      ],
      type: 'high_school'
    },
    include: {
      teams: {
        include: {
          team_seasons: {
            include: { seasons: true }
          }
        }
      }
    }
  });

  if (!ihsClub) {
    throw new Error('Independence High School club not found in database.');
  }

  console.log(`Found IHS Club ID: ${ihsClub.id}`);

  // Build Independence Team Season Lookup: (teamName, seasonId) -> team_season_id
  const ihsTeamSeasonMap = new Map<string, number>();
  ihsClub.teams.forEach(t => {
    t.team_seasons.forEach(ts => {
      ihsTeamSeasonMap.set(`${t.team_name.toLowerCase()}|${ts.season_id}`, ts.id);
    });
  });

  // 2. Map Seasons
  const legacySeasonsTuples = parseSqlTuples(sql, 'seasons');
  const dbSeasons = await prisma.seasons.findMany();
  const dbSeasonByName = new Map<string, number>();
  dbSeasons.forEach(s => dbSeasonByName.set(s.season_name.trim(), s.id));

  const legacySeasonToDbSeason = new Map<number, number>();
  legacySeasonsTuples.forEach(s => {
    const legId = Number(s[0]);
    const schoolYear = (s[2] || '').trim();
    if (dbSeasonByName.has(schoolYear)) {
      legacySeasonToDbSeason.set(legId, dbSeasonByName.get(schoolYear)!);
    }
  });
  console.log(`Mapped ${legacySeasonToDbSeason.size} legacy seasons.`);

  // 3. Map Opponent Schools & Locations
  const legacySchoolsTuples = parseSqlTuples(sql, 'schools');
  let dbClubs = await prisma.clubs.findMany();
  const clubLookupByName = new Map<string, typeof dbClubs[0]>();
  const clubLookupByAbbr = new Map<string, typeof dbClubs[0]>();
  dbClubs.forEach(c => {
    clubLookupByName.set(c.name.trim().toLowerCase(), c);
    if (c.abbreviation) clubLookupByAbbr.set(c.abbreviation.trim().toLowerCase(), c);
  });

  const legacySchoolToClubId = new Map<number, number>();
  const clubsToCreate: { name: string; abbreviation: string | null; type: any; is_active: boolean }[] = [];

  for (const s of legacySchoolsTuples) {
    const legId = Number(s[0]);
    const name = (s[1] || '').trim();
    const abbr = (s[2] || '').trim();
    const club = clubLookupByName.get(name.toLowerCase()) || (abbr ? clubLookupByAbbr.get(abbr.toLowerCase()) : null);
    if (club) {
      legacySchoolToClubId.set(legId, club.id);
    } else if (name) {
      clubsToCreate.push({
        name,
        abbreviation: abbr || null,
        type: 'high_school',
        is_active: true
      });
    }
  }

  if (clubsToCreate.length > 0) {
    console.log(`Bulk inserting ${clubsToCreate.length} missing schools...`);
    await prisma.clubs.createMany({ data: clubsToCreate, skipDuplicates: true });
    dbClubs = await prisma.clubs.findMany();
    dbClubs.forEach(c => {
      clubLookupByName.set(c.name.trim().toLowerCase(), c);
      if (c.abbreviation) clubLookupByAbbr.set(c.abbreviation.trim().toLowerCase(), c);
    });
    for (const s of legacySchoolsTuples) {
      const legId = Number(s[0]);
      const name = (s[1] || '').trim().toLowerCase();
      const abbr = (s[2] || '').trim().toLowerCase();
      const club = clubLookupByName.get(name) || (abbr ? clubLookupByAbbr.get(abbr) : null);
      if (club) legacySchoolToClubId.set(legId, club.id);
    }
  }

  // Fallback club
  const fallbackClub = await prisma.clubs.upsert({
    where: { id: 999999 },
    update: {},
    create: { id: 999999, name: 'Unknown Opponent', type: 'high_school', is_active: false }
  });

  // Map Locations
  const legacyLocTuples = parseSqlTuples(sql, 'locations');
  const dbLocations = await prisma.locations.findMany();
  const locLookupByName = new Map<string, number>();
  dbLocations.forEach(l => locLookupByName.set(l.name.trim().toLowerCase(), l.id));

  const legacyLocToDbLocId = new Map<number, number>();
  for (const l of legacyLocTuples) {
    const legId = Number(l[0]);
    const name = (l[1] || '').trim().toLowerCase();
    if (locLookupByName.has(name)) {
      legacyLocToDbLocId.set(legId, locLookupByName.get(name)!);
    }
  }

  // 4. Map People and Players
  const legacyPeopleTuples = parseSqlTuples(sql, 'people');
  const dbPeople = await prisma.people.findMany();
  const peopleLookup = new Map<string, number>();
  dbPeople.forEach(p => {
    const key = `${p.first_name.trim().toLowerCase()}|${p.last_name.trim().toLowerCase()}`;
    peopleLookup.set(key, p.id);
  });

  const legacyPersonToDbPersonId = new Map<number, number>();
  legacyPeopleTuples.forEach(p => {
    const legId = Number(p[0]);
    const first = (p[3] || '').trim().toLowerCase();
    const last = (p[4] || '').trim().toLowerCase();
    const key = `${first}|${last}`;
    if (peopleLookup.has(key)) {
      legacyPersonToDbPersonId.set(legId, peopleLookup.get(key)!);
    }
  });

  const legacyPlayersTuples = parseSqlTuples(sql, 'players');
  const legacyPlayerToDbPersonId = new Map<number, number>();
  legacyPlayersTuples.forEach(p => {
    const legPlayerId = Number(p[0]);
    const legPersonId = Number(p[2]);
    if (legacyPersonToDbPersonId.has(legPersonId)) {
      legacyPlayerToDbPersonId.set(legPlayerId, legacyPersonToDbPersonId.get(legPersonId)!);
    }
  });

  // 5. Pre-ensure ALL opponent teams and team_seasons in bulk
  console.log('Ensuring all opponent teams and team_seasons upfront...');
  const distinctOpponentClubIds = new Set<number>();
  legacySchoolsTuples.forEach(s => {
    const legId = Number(s[0]);
    if (legacySchoolToClubId.has(legId)) distinctOpponentClubIds.add(legacySchoolToClubId.get(legId)!);
  });
  distinctOpponentClubIds.add(fallbackClub.id);

  let existingTeams = await prisma.teams.findMany({ where: { gender: 'FEMALE' } });
  const existingTeamSet = new Set(existingTeams.map(t => `${t.club_id}|${t.team_name.toLowerCase()}`));

  const teamsToCreate: { club_id: number; team_name: string; gender: teams_gender; is_active: boolean }[] = [];
  const requiredTeamNames = ['Varsity Girls', 'JV Girls', 'JV Navy Girls', 'JV Gold Girls'];

  distinctOpponentClubIds.forEach(cId => {
    requiredTeamNames.forEach(tName => {
      const key = `${cId}|${tName.toLowerCase()}`;
      if (!existingTeamSet.has(key)) {
        teamsToCreate.push({ club_id: cId, team_name: tName, gender: 'FEMALE', is_active: true });
        existingTeamSet.add(key);
      }
    });
  });

  if (teamsToCreate.length > 0) {
    console.log(`Bulk creating ${teamsToCreate.length} opponent teams...`);
    await prisma.teams.createMany({ data: teamsToCreate, skipDuplicates: true });
    existingTeams = await prisma.teams.findMany({ where: { gender: 'FEMALE' } });
  }

  const teamLookup = new Map<string, number>();
  existingTeams.forEach(t => teamLookup.set(`${t.club_id}|${t.team_name.toLowerCase()}`, t.id));

  let existingTeamSeasons = await prisma.team_seasons.findMany();
  const existingTsSet = new Set(existingTeamSeasons.map(ts => `${ts.team_id}|${ts.season_id}`));

  const teamSeasonsToCreate: { team_id: number; season_id: number; is_active: boolean }[] = [];
  distinctOpponentClubIds.forEach(cId => {
    requiredTeamNames.forEach(tName => {
      const tId = teamLookup.get(`${cId}|${tName.toLowerCase()}`);
      if (tId) {
        dbSeasons.forEach(s => {
          const tsKey = `${tId}|${s.id}`;
          if (!existingTsSet.has(tsKey)) {
            teamSeasonsToCreate.push({ team_id: tId, season_id: s.id, is_active: true });
            existingTsSet.add(tsKey);
          }
        });
      }
    });
  });

  if (teamSeasonsToCreate.length > 0) {
    console.log(`Bulk creating ${teamSeasonsToCreate.length} opponent team_seasons in chunks...`);
    for (let i = 0; i < teamSeasonsToCreate.length; i += 1000) {
      await prisma.team_seasons.createMany({
        data: teamSeasonsToCreate.slice(i, i + 1000),
        skipDuplicates: true
      });
    }
    existingTeamSeasons = await prisma.team_seasons.findMany();
  }

  const teamSeasonLookup = new Map<string, number>();
  existingTeamSeasons.forEach(ts => teamSeasonLookup.set(`${ts.team_id}|${ts.season_id}`, ts.id));
  console.log('All opponent teams and team_seasons verified.');

  // 6. Pre-load existing games
  const existingDbGames = await prisma.games.findMany({
    select: { id: true, season_id: true, home_team_season_id: true, away_team_season_id: true, start_date: true }
  });
  const existingGameLookup = new Map<string, number>();
  existingDbGames.forEach(eg => {
    const dStr = eg.start_date.toISOString().split('T')[0];
    existingGameLookup.set(`${eg.season_id}|${eg.home_team_season_id}|${eg.away_team_season_id}|${dStr}`, eg.id);
  });
  console.log(`Found ${existingDbGames.length} existing games in database.`);

  // 7. Parse legacy games and create missing games
  const legacyGamesTuples = parseSqlTuples(sql, 'games');
  const gamesToCreate: any[] = [];
  const gameMetadataMap = new Map<string, { legGameId: number; ihsTeamSeasonId: number; dateStr: string }>();

  for (const g of legacyGamesTuples) {
    const legGameId = Number(g[0]);
    const calId = g[1] || null;
    const dateStr = g[2];
    const timeStr = g[3];
    const legSeasonId = Number(g[4]);
    const legOpponentId = g[6] ? Number(g[6]) : null;
    const legLocationId = g[8] ? Number(g[8]) : null;
    const isHome = Number(g[9]) === 1;
    const teamType = (g[11] || 'Varsity').trim();
    const legGameType = (g[12] || '').trim();
    const comment = g[16] || null;
    const soIfTied = Number(g[17]) === 1;
    const otIfTied = Number(g[18]) === 1;
    const regPeriods = Number(g[23]) || 2;
    const regPeriodMinutes = Number(g[24]) || 2400;
    const veoLink = g[27] || null;
    const legStatus = (g[28] || 'to be played').toLowerCase().trim();

    if (!dateStr || !legSeasonId || !legacySeasonToDbSeason.has(legSeasonId)) continue;
    const dbSeasonId = legacySeasonToDbSeason.get(legSeasonId)!;

    let ihsTeamName = 'Varsity Girls';
    if (teamType.toLowerCase().includes('navy')) ihsTeamName = 'JV Navy Girls';
    else if (teamType.toLowerCase().includes('gold')) ihsTeamName = 'JV Gold Girls';
    else if (teamType.toLowerCase().includes('jv')) ihsTeamName = 'JV Girls';

    const ihsTeamSeasonId = ihsTeamSeasonMap.get(`${ihsTeamName.toLowerCase()}|${dbSeasonId}`);
    if (!ihsTeamSeasonId) continue;

    const oppClubId = (legOpponentId && legacySchoolToClubId.has(legOpponentId))
      ? legacySchoolToClubId.get(legOpponentId)!
      : fallbackClub.id;

    const oppTeamId = teamLookup.get(`${oppClubId}|${ihsTeamName.toLowerCase()}`) || fallbackClub.id;
    const oppTeamSeasonId = teamSeasonLookup.get(`${oppTeamId}|${dbSeasonId}`) || ihsTeamSeasonId;

    const homeTeamSeasonId = isHome ? ihsTeamSeasonId : oppTeamSeasonId;
    const awayTeamSeasonId = isHome ? oppTeamSeasonId : ihsTeamSeasonId;

    const { startDate, startTime, endDate, endTime } = parseGameDatesAndTimesUTC(dateStr, timeStr || undefined);
    const dKey = startDate.toISOString().split('T')[0];
    const gameMatchKey = `${dbSeasonId}|${homeTeamSeasonId}|${awayTeamSeasonId}|${dKey}`;

    gameMetadataMap.set(gameMatchKey, { legGameId, ihsTeamSeasonId, dateStr });

    if (!existingGameLookup.has(gameMatchKey)) {
      let status: games_status = 'scheduled';
      if (legStatus === 'completed' || legStatus === 'final') status = 'completed';
      else if (legStatus === 'in progress') status = 'in_progress';
      else if (legStatus === 'canceled' || legStatus === 'cancelled') status = 'cancelled';

      let gameType: games_game_type = 'league';
      if (legGameType.toLowerCase().includes('tournament')) gameType = 'tournament';
      else if (legGameType.toLowerCase().includes('friendly')) gameType = 'friendly';

      const locationId = legLocationId && legacyLocToDbLocId.has(legLocationId) ? legacyLocToDbLocId.get(legLocationId)! : null;
      const nominalPeriodSec = regPeriodMinutes > 100 ? Math.round(regPeriodMinutes / regPeriods) : regPeriodMinutes * 60;

      gamesToCreate.push({
        season_id: dbSeasonId,
        home_team_season_id: homeTeamSeasonId,
        away_team_season_id: awayTeamSeasonId,
        status: status,
        game_type: gameType,
        notes: comment,
        default_reg_periods: regPeriods,
        period_duration: nominalPeriodSec,
        ot_if_tied: otIfTied,
        ot_duration: 600,
        so_if_tied: soIfTied,
        video_link: veoLink,
        google_cal_id: calId,
        location_id: locationId,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime
      });
      // Mark placeholder to avoid duplicates
      existingGameLookup.set(gameMatchKey, -1);
    }
  }

  if (gamesToCreate.length > 0) {
    console.log(`Bulk inserting ${gamesToCreate.length} missing games...`);
    await prisma.games.createMany({ data: gamesToCreate, skipDuplicates: true });
  }

  // Refresh all games to get their real IDs
  const allDbGames = await prisma.games.findMany({
    select: { id: true, season_id: true, home_team_season_id: true, away_team_season_id: true, start_date: true }
  });
  const finalGameLookup = new Map<string, number>();
  allDbGames.forEach(g => {
    const dStr = g.start_date.toISOString().split('T')[0];
    finalGameLookup.set(`${g.season_id}|${g.home_team_season_id}|${g.away_team_season_id}|${dStr}`, g.id);
  });

  const legacyGameIdToDbGameId = new Map<number, number>();
  const legacyGameIdToIhsTeamSeasonId = new Map<number, number>();
  const legacyGameIdToDateStr = new Map<number, string>();

  gameMetadataMap.forEach((meta, matchKey) => {
    if (finalGameLookup.has(matchKey)) {
      const dbId = finalGameLookup.get(matchKey)!;
      legacyGameIdToDbGameId.set(meta.legGameId, dbId);
      legacyGameIdToIhsTeamSeasonId.set(meta.legGameId, meta.ihsTeamSeasonId);
      legacyGameIdToDateStr.set(meta.legGameId, meta.dateStr);
    }
  });
  console.log(`Successfully mapped ${legacyGameIdToDbGameId.size} legacy games to database games.`);

  // 8. Bulk Insert Periods
  const existingPeriods = await prisma.game_periods.findMany({ select: { game_id: true, period_number: true } });
  const existingPeriodSet = new Set(existingPeriods.map(p => `${p.game_id}|${p.period_number}`));

  const legacyPeriodsTuples = parseSqlTuples(sql, 'periods');
  const periodsToCreate: any[] = [];

  for (const p of legacyPeriodsTuples) {
    const legGameId = Number(p[1]);
    const periodNum = Number(p[2]) || 1;
    if (!legacyGameIdToDbGameId.has(legGameId)) continue;
    const dbGameId = legacyGameIdToDbGameId.get(legGameId)!;
    const periodKey = `${dbGameId}|${periodNum}`;
    if (existingPeriodSet.has(periodKey)) continue;

    const rawStart = p[3];
    const rawEnd = p[4];
    const dateStr = legacyGameIdToDateStr.get(legGameId);
    let startEpochMs: bigint | null = null;
    let endEpochMs: bigint | null = null;

    if (rawStart && dateStr) {
      const { startTime: pStart } = parseGameDatesAndTimesUTC(dateStr, rawStart);
      if (pStart) startEpochMs = BigInt(pStart.getTime());
    }
    if (rawEnd && dateStr) {
      const { startTime: pEnd } = parseGameDatesAndTimesUTC(dateStr, rawEnd);
      if (pEnd) endEpochMs = BigInt(pEnd.getTime());
    }

    periodsToCreate.push({
      game_id: dbGameId,
      period_number: periodNum,
      start_time: startEpochMs,
      end_time: endEpochMs
    });
    existingPeriodSet.add(periodKey);
  }

  if (periodsToCreate.length > 0) {
    console.log(`Bulk inserting ${periodsToCreate.length} game periods...`);
    await prisma.game_periods.createMany({ data: periodsToCreate, skipDuplicates: true });
  }

  // 9. Bulk Insert Player Games
  const existingPgs = await prisma.player_games.findMany({ select: { game_id: true, player_id: true } });
  const existingPgSet = new Set(existingPgs.map(pg => `${pg.game_id}|${pg.player_id}`));
  console.log(`Found ${existingPgs.length} existing player_games in DB.`);

  const legacyPlayerGamesTuples = parseSqlTuples(sql, 'playerGames');
  const playerGamesToCreate: any[] = [];

  for (const pg of legacyPlayerGamesTuples) {
    const legPlayerId = Number(pg[0]);
    const legGameId = Number(pg[1]);
    if (!legacyGameIdToDbGameId.has(legGameId) || !legacyPlayerToDbPersonId.has(legPlayerId)) continue;

    const dbGameId = legacyGameIdToDbGameId.get(legGameId)!;
    const personId = legacyPlayerToDbPersonId.get(legPlayerId)!;
    const pgKey = `${dbGameId}|${personId}`;
    if (existingPgSet.has(pgKey)) continue;

    const ihsTeamSeasonId = legacyGameIdToIhsTeamSeasonId.get(legGameId)!;
    const isStart = Number(pg[2]) === 1;
    const isDressed = Number(pg[3]) === 1;
    const isInjured = Number(pg[4]) === 1;
    const isUnavailable = Number(pg[5]) === 1;
    const isGkStarter = Number(pg[9]) === 1;

    let rosterStatus: player_games_game_status = 'not_dressed';
    if (isGkStarter) rosterStatus = 'goalkeeper';
    else if (isStart) rosterStatus = 'starter';
    else if (isDressed) rosterStatus = 'dressed';
    else if (isInjured) rosterStatus = 'injured';
    else if (isUnavailable) rosterStatus = 'unavailable';

    playerGamesToCreate.push({
      game_id: dbGameId,
      player_id: personId,
      team_season_id: ihsTeamSeasonId,
      started: isStart || isGkStarter,
      game_status: rosterStatus,
      is_guest: false
    });
    existingPgSet.add(pgKey);
  }

  if (playerGamesToCreate.length > 0) {
    console.log(`Bulk inserting ${playerGamesToCreate.length} player_games in fast chunks of 1000...`);
    for (let i = 0; i < playerGamesToCreate.length; i += 1000) {
      await prisma.player_games.createMany({
        data: playerGamesToCreate.slice(i, i + 1000),
        skipDuplicates: true
      });
    }
  }

  const finalGames = await prisma.games.count();
  const finalPeriods = await prisma.game_periods.count();
  const finalPgs = await prisma.player_games.count();

  console.log('=== STEPS 1 & 2 BULK MIGRATION COMPLETED SUCCESSFULLY ===');
  console.log(`Total Games in DB: ${finalGames}`);
  console.log(`Total Game Periods in DB: ${finalPeriods}`);
  console.log(`Total Player Games in DB: ${finalPgs}`);

  return {
    totalGamesInDb: finalGames,
    totalPeriodsInDb: finalPeriods,
    totalPlayerGamesInDb: finalPgs
  };
}

if (require.main === module) {
  migrateGamesStep1And2()
    .then(results => {
      console.log('Results:', results);
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration Error:', err);
      process.exit(1);
    });
}
