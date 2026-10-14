import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { game_events_discipline_card_type } from '../src/generated/client';

function parseTupleFields(rawTuple: string): (string | null)[] {
  const fields: (string | null)[] = [];
  let current = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < rawTuple.length; i++) {
    const char = rawTuple[i];
    if (escape) {
      current += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      current += char;
      escape = true;
      continue;
    }
    if (char === "'" || char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString && char === ',') {
      const val = current.trim();
      fields.push(val.toUpperCase() === 'NULL' ? null : val);
      current = '';
      continue;
    }
    current += char;
  }
  const lastVal = current.trim();
  fields.push(lastVal.toUpperCase() === 'NULL' ? null : lastVal);
  return fields;
}

export function parseSqlTuplesRobust(sql: string, tableName: string): (string | null)[][] {
  const insertRegex = new RegExp(`INSERT INTO [\\\`"']?${tableName}[\\\`"']?\\s*(\\(.*?\\))?\\s*VALUES`, 'gi');
  const tuples: (string | null)[][] = [];

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const startIdx = match.index + match[0].length;
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

function normalizeGoalTypes(rawType: string | null): string {
  if (!rawType) return JSON.stringify(['open_play']);
  const t = rawType.toLowerCase();
  const types: string[] = [];
  if (t.includes('corner')) types.push('corner_kick');
  if (t.includes('penalty') || t.includes('pk')) types.push('penalty');
  if (t.includes('direct')) types.push('free_kick_direct');
  if (t.includes('indirect')) types.push('free_kick_indirect');
  if (t.includes('throw')) types.push('throw_in');
  if (t.includes('head')) types.push('header');
  if (t.includes('volley')) types.push('volley');
  if (types.length === 0) types.push('open_play');
  return JSON.stringify(types);
}

export async function migrateEventsAndSubs() {
  console.log('=== BULK MIGRATION OF MAJOR EVENTS, GOALS, DISCIPLINE & SUBS ===');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 1. Seasons
  const legacySeasonsTuples = parseSqlTuplesRobust(sql, 'seasons');
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

  // 2. Independence High School Club and Team Seasons
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
          team_seasons: true
        }
      }
    }
  });

  if (!ihsClub) throw new Error('IHS Club not found');

  const ihsTeamSeasonMap = new Map<string, number>();
  ihsClub.teams.forEach(t => {
    t.team_seasons.forEach(ts => {
      ihsTeamSeasonMap.set(`${t.team_name.toLowerCase()}|${ts.season_id}`, ts.id);
    });
  });

  // 3. People and Players Lookup
  const legacyPeopleTuples = parseSqlTuplesRobust(sql, 'people');
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

  const legacyPlayersTuples = parseSqlTuplesRobust(sql, 'players');
  const legacyPlayerToDbPersonId = new Map<number, number>();
  legacyPlayersTuples.forEach(p => {
    const legPlayerId = Number(p[0]);
    const legPersonId = Number(p[2]);
    if (legacyPersonToDbPersonId.has(legPersonId)) {
      legacyPlayerToDbPersonId.set(legPlayerId, legacyPersonToDbPersonId.get(legPersonId)!);
    }
  });

  // 4. Map Games
  const legacyGames = parseSqlTuplesRobust(sql, 'games');
  const allDbGames = await prisma.games.findMany({
    select: { id: true, season_id: true, home_team_season_id: true, away_team_season_id: true, start_date: true }
  });

  const legacyGameIdToDbGameId = new Map<number, number>();
  const legacyGameIdToIhsTsId = new Map<number, number>();
  const legacyGameIdToOppTsId = new Map<number, number>();

  for (const g of legacyGames) {
    const legGameId = Number(g[0]);
    const dateStr = g[2];
    const legSeasonId = Number(g[4]);
    const teamType = (g[11] || 'Varsity').toLowerCase();
    const dbSeasonId = legacySeasonToDbSeason.get(legSeasonId);
    if (!dateStr || !dbSeasonId) continue;

    const ihsTeamName = teamType.includes('jv') ? 'jv girls' : 'varsity girls';
    const ihsTeamSeasonId = ihsTeamSeasonMap.get(`${ihsTeamName}|${dbSeasonId}`);
    if (!ihsTeamSeasonId) continue;

    const dStr = dateStr.split('T')[0];
    const match = allDbGames.find(dbg =>
      dbg.season_id === dbSeasonId &&
      dbg.start_date.toISOString().split('T')[0] === dStr &&
      (dbg.home_team_season_id === ihsTeamSeasonId || dbg.away_team_season_id === ihsTeamSeasonId)
    );

    if (match) {
      legacyGameIdToDbGameId.set(legGameId, match.id);
      legacyGameIdToIhsTsId.set(legGameId, ihsTeamSeasonId);
      const oppTsId = match.home_team_season_id === ihsTeamSeasonId ? match.away_team_season_id : match.home_team_season_id;
      legacyGameIdToOppTsId.set(legGameId, oppTsId);
    }
  }

  console.log(`Mapped ${legacyGameIdToDbGameId.size} legacy games to DB games.`);

  // 5. Map Periods
  const legacyPeriods = parseSqlTuplesRobust(sql, 'periods');
  const periodMap = new Map<number, { dbGameId: number; periodNumber: number; ihsTsId: number; oppTsId: number }>();
  legacyPeriods.forEach(p => {
    const legPeriodId = Number(p[0]);
    const legGameId = Number(p[1]);
    const periodNum = Number(p[2]) || 1;
    if (legacyGameIdToDbGameId.has(legGameId)) {
      periodMap.set(legPeriodId, {
        dbGameId: legacyGameIdToDbGameId.get(legGameId)!,
        periodNumber: periodNum,
        ihsTsId: legacyGameIdToIhsTsId.get(legGameId)!,
        oppTsId: legacyGameIdToOppTsId.get(legGameId)!,
      });
    }
  });

  // 6. Map Player Games
  const allDbPlayerGames = await prisma.player_games.findMany({
    select: { id: true, game_id: true, player_id: true }
  });
  const pgMap = new Map<string, number>();
  allDbPlayerGames.forEach(pg => {
    pgMap.set(`${pg.game_id}|${pg.player_id}`, pg.id);
  });

  const legacyPlayerGames = parseSqlTuplesRobust(sql, 'playerGames');
  const legPgToDbPgId = new Map<number, number>();
  legacyPlayerGames.forEach(pg => {
    const legPlayerId = Number(pg[0]);
    const legGameId = Number(pg[1]);
    const legPgId = Number(pg[8]);
    const dbGameId = legacyGameIdToDbGameId.get(legGameId);
    const personId = legacyPlayerToDbPersonId.get(legPlayerId);
    if (dbGameId && personId) {
      const dbPgId = pgMap.get(`${dbGameId}|${personId}`);
      if (dbPgId) {
        legPgToDbPgId.set(legPgId, dbPgId);
      }
    }
  });

  console.log(`Mapped ${legPgToDbPgId.size} legacy player games to modern player_games.`);

  // 7. Bulk Insert game_events_major (from stoppages)
  const stoppages = parseSqlTuplesRobust(sql, 'stoppages');
  console.log(`Preparing ${stoppages.length} major events from stoppages...`);

  const majorEventsToCreate: any[] = [];
  const stoppageToMajorEventId = new Map<number, number>();

  for (const s of stoppages) {
    const legStopId = Number(s[0]);
    const legPeriodId = Number(s[1]);
    const pInfo = periodMap.get(legPeriodId);
    if (!pInfo) continue;

    const rawEvent = (s[3] || '').trim();
    const beginSec = Number(s[4]) ?? Number(s[2]) ?? 0;
    const endSec = s[5] !== null ? Number(s[5]) : null;
    const clockStopped = Number(s[6]) === 1;
    const details = s[7] || null;
    const createdAt = s[8] ? new Date(s[8]) : new Date();

    let eventType = 'stoppage';
    if (rawEvent === 'Goal Scored' || rawEvent === 'Goal Against') {
      eventType = 'goal';
    } else if (rawEvent.toLowerCase().includes('card')) {
      eventType = 'card';
    } else if (rawEvent.toLowerCase().includes('penalty kick') || rawEvent.toLowerCase().includes('pk')) {
      eventType = 'penalty';
    }

    const majorEventId = 10000 + legStopId;
    stoppageToMajorEventId.set(legStopId, majorEventId);

    majorEventsToCreate.push({
      id: majorEventId,
      game_id: pInfo.dbGameId,
      event_type: eventType,
      game_time: beginSec,
      end_time: endSec,
      period: pInfo.periodNumber,
      clock_should_run: !clockStopped,
      details: details,
      created_at: createdAt,
      modified_at: createdAt
    });
  }

  console.log(`Bulk inserting ${majorEventsToCreate.length} game_events_major records...`);
  for (let i = 0; i < majorEventsToCreate.length; i += 1000) {
    await prisma.game_events_major.createMany({
      data: majorEventsToCreate.slice(i, i + 1000),
      skipDuplicates: true
    });
  }
  console.log('game_events_major inserted successfully.');

  // 8. Bulk Insert Goals (from goalsFor and goalsAgainst)
  const goalsFor = parseSqlTuplesRobust(sql, 'goalsFor');
  const goalsAgainst = parseSqlTuplesRobust(sql, 'goalsAgainst');
  console.log(`Preparing goals (${goalsFor.length} goalsFor, ${goalsAgainst.length} goalsAgainst)...`);

  const goalsToCreate: any[] = [];

  // Goals For
  for (const gf of goalsFor) {
    const legEventId = Number(gf[1]);
    const majorEventId = stoppageToMajorEventId.get(legEventId);
    if (!majorEventId) continue;

    const legScorerId = Number(gf[2]);
    const legAssisterId = gf[3] !== null ? Number(gf[3]) : null;
    const goalType = gf[13] || 'Run of Play';

    // Find the stoppage to get period info
    const stopRow = stoppages.find(s => Number(s[0]) === legEventId);
    if (!stopRow) continue;
    const pInfo = periodMap.get(Number(stopRow[1]));
    if (!pInfo) continue;

    const scorerPersonId = legacyPlayerToDbPersonId.get(legScorerId);
    const scorerPgId = scorerPersonId ? pgMap.get(`${pInfo.dbGameId}|${scorerPersonId}`) : null;

    let assistPgId: number | null = null;
    if (legAssisterId) {
      const assistPersonId = legacyPlayerToDbPersonId.get(legAssisterId);
      if (assistPersonId) {
        assistPgId = pgMap.get(`${pInfo.dbGameId}|${assistPersonId}`) ?? null;
      }
    }

    goalsToCreate.push({
      major_event_id: majorEventId,
      team_season_id: pInfo.ihsTsId,
      scorer_player_game_id: scorerPgId ?? null,
      assist_player_game_id: assistPgId,
      defending_gk_player_game_id: null,
      is_own_goal: false,
      goal_types: normalizeGoalTypes(goalType),
    });
  }

  // Goals Against
  for (const ga of goalsAgainst) {
    const legEventId = Number(ga[1]);
    const majorEventId = stoppageToMajorEventId.get(legEventId);
    if (!majorEventId) continue;

    const legGkId = Number(ga[2]);
    const goalType = ga[11] || 'Run of Play';

    const stopRow = stoppages.find(s => Number(s[0]) === legEventId);
    if (!stopRow) continue;
    const pInfo = periodMap.get(Number(stopRow[1]));
    if (!pInfo) continue;

    const gkPersonId = legacyPlayerToDbPersonId.get(legGkId);
    const gkPgId = gkPersonId ? pgMap.get(`${pInfo.dbGameId}|${gkPersonId}`) : null;

    goalsToCreate.push({
      major_event_id: majorEventId,
      team_season_id: pInfo.oppTsId,
      scorer_player_game_id: null,
      assist_player_game_id: null,
      defending_gk_player_game_id: gkPgId ?? null,
      is_own_goal: false,
      goal_types: normalizeGoalTypes(goalType),
    });
  }

  console.log(`Bulk inserting ${goalsToCreate.length} game_events_goals records...`);
  for (let i = 0; i < goalsToCreate.length; i += 1000) {
    await prisma.game_events_goals.createMany({
      data: goalsToCreate.slice(i, i + 1000),
      skipDuplicates: true
    });
  }
  console.log('game_events_goals inserted successfully.');

  // 9. Bulk Insert Discipline / Cards
  const disciplineToCreate: any[] = [];
  for (const s of stoppages) {
    const legStopId = Number(s[0]);
    const majorEventId = stoppageToMajorEventId.get(legStopId);
    if (!majorEventId) continue;

    const rawEvent = (s[3] || '').trim();
    if (!rawEvent.toLowerCase().includes('card')) continue;

    const pInfo = periodMap.get(Number(s[1]));
    if (!pInfo) continue;

    const isRed = rawEvent.toLowerCase().includes('red');
    const cardType: game_events_discipline_card_type = isRed ? 'red' : 'yellow';
    const cardReason = s[7] || null;

    disciplineToCreate.push({
      major_event_id: majorEventId,
      team_season_id: pInfo.ihsTsId,
      player_game_id: null,
      card_type: cardType,
      card_reason: cardReason
    });
  }

  if (disciplineToCreate.length > 0) {
    console.log(`Bulk inserting ${disciplineToCreate.length} game_events_discipline records...`);
    await prisma.game_events_discipline.createMany({
      data: disciplineToCreate,
      skipDuplicates: true
    });
    console.log('game_events_discipline inserted successfully.');
  }

  // 10. Bulk Insert Subs
  const subs = parseSqlTuplesRobust(sql, 'subs');
  console.log(`Preparing ${subs.length} substitutions...`);

  const subsToCreate: any[] = [];
  for (const sub of subs) {
    const legPeriodId = Number(sub[1]);
    const pInfo = periodMap.get(legPeriodId);
    if (!pInfo) continue;

    const gameMinute = Number(sub[2]) || 0;
    const subOutLegPgId = sub[3] !== null ? Number(sub[3]) : null;
    const subInLegPgId = sub[4] !== null ? Number(sub[4]) : null;
    const isGkSub = Number(sub[5]) === 1;
    const createdAt = sub[6] ? new Date(sub[6]) : new Date();

    const dbInPgId = subInLegPgId ? legPgToDbPgId.get(subInLegPgId) ?? null : null;
    const dbOutPgId = subOutLegPgId ? legPgToDbPgId.get(subOutLegPgId) ?? null : null;

    subsToCreate.push({
      game_id: pInfo.dbGameId,
      in_player_id: dbInPgId,
      out_player_id: dbOutPgId,
      sub_time: gameMinute,
      period: pInfo.periodNumber,
      gk_sub: isGkSub,
      is_swap: false,
      created_at: createdAt,
      modified_at: createdAt
    });
  }

  console.log(`Bulk inserting ${subsToCreate.length} game_subs records in chunks of 1000...`);
  for (let i = 0; i < subsToCreate.length; i += 1000) {
    await prisma.game_subs.createMany({
      data: subsToCreate.slice(i, i + 1000),
      skipDuplicates: true
    });
  }
  console.log('game_subs inserted successfully.');

  // 11. Final Count Verification
  const totalMajorEvents = await prisma.game_events_major.count();
  const totalGoals = await prisma.game_events_goals.count();
  const totalDiscipline = await prisma.game_events_discipline.count();
  const totalSubs = await prisma.game_subs.count();

  console.log('=== MIGRATION OF EVENTS & SUBS COMPLETED SUCCESSFULLY ===');
  console.log(`Total game_events_major in DB: ${totalMajorEvents}`);
  console.log(`Total game_events_goals in DB: ${totalGoals}`);
  console.log(`Total game_events_discipline in DB: ${totalDiscipline}`);
  console.log(`Total game_subs in DB: ${totalSubs}`);

  return {
    totalMajorEvents,
    totalGoals,
    totalDiscipline,
    totalSubs
  };
}

if (require.main === module) {
  migrateEventsAndSubs()
    .catch(e => {
      console.error('Migration failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
