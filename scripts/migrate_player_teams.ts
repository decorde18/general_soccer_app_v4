import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { player_teams_status } from '../src/generated/client';

function parseSqlTuples(sql: string, tableName: string): (string | null)[][] {
  const regex = new RegExp(`INSERT INTO [\\\`"']?${tableName}[\\\`"']?\\s*(\\(.*?\\))?\\s*VALUES\\s*([\\s\\S]*?);`, 'gi');
  const matches = [...sql.matchAll(regex)];
  const tuples: (string | null)[][] = [];

  for (const match of matches) {
    const rawStr = match[2];
    let current = '';
    let inString = false;
    let escape = false;
    let depth = 0;

    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr[i];
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

export async function migratePlayerTeams() {
  console.log('=== STARTING BULK PLAYER_TEAMS (SEASONAL ROSTERS) MIGRATION ===');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found at ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 1. Season map
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

  // 2. People and Players map
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

  // 3. IHS Team Seasons map: (teamName, seasonId) -> tsId
  const ihsClub = await prisma.clubs.findFirst({
    where: { name: { contains: 'Independence' }, type: 'high_school' },
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

  // 4. Pre-load existing player_teams to ensure idempotency
  const existingPlayerTeams = await prisma.player_teams.findMany({
    select: { player_id: true, team_season_id: true }
  });
  const existingPtSet = new Set(existingPlayerTeams.map(pt => `${pt.player_id}|${pt.team_season_id}`));
  console.log(`Pre-loaded ${existingPlayerTeams.length} existing player_teams in database.`);

  // 5. Parse playerSeasons
  const psTuples = parseSqlTuples(sql, 'playerSeasons');
  console.log(`Processing ${psTuples.length} legacy playerSeasons tuples...`);

  const rosterEntriesToCreate: {
    player_id: number;
    team_season_id: number;
    jersey_number: number | null;
    alt_jersey_number: number | null;
    gk_number: number | null;
    grade: string | null;
    position: string | null;
    status: player_teams_status;
    captain: boolean;
    lives_with_parents: boolean;
    played_last_season: boolean | null;
    enrolled_last_year: boolean;
    is_active: boolean;
  }[] = [];

  const photosToUpdate: { personId: number; photoUrl: string }[] = [];

  for (const ps of psTuples) {
    const legPlayerId = Number(ps[2]);
    const legSeasonId = Number(ps[3]);
    const grade = ps[4] || null;
    const rosterNumber = ps[5] ? Number(ps[5]) : null;
    const legStatus = (ps[6] || 'interested').toLowerCase();
    const teamLevelRaw = ps[7];
    const altRoster = ps[8] ? Number(ps[8]) : null;
    const gkRoster = ps[9] ? Number(ps[9]) : null;
    const position = ps[10] || null;
    const livesWithParents = ps[12] === null ? true : Number(ps[12]) === 1;
    const returningPlayer = ps[13] ? Number(ps[13]) === 1 : null;
    const enrolledLastYear = ps[14] === null ? true : Number(ps[14]) === 1;
    const picture = ps[16] || null;
    const captain = ps[18] ? Number(ps[18]) === 1 : false;

    if (!legacyPlayerToDbPersonId.has(legPlayerId)) continue;
    if (!legacySeasonToDbSeason.has(legSeasonId)) continue;

    const personId = legacyPlayerToDbPersonId.get(legPlayerId)!;
    const dbSeasonId = legacySeasonToDbSeason.get(legSeasonId)!;

    if (picture && picture.trim()) {
      photosToUpdate.push({ personId, photoUrl: picture.trim() });
    }

    let levels = ['Varsity Girls'];
    if (teamLevelRaw) {
      try {
        const parsed = JSON.parse(teamLevelRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          levels = parsed.map(lvl => {
            const l = lvl.toLowerCase();
            if (l.includes('navy')) return 'JV Navy Girls';
            if (l.includes('gold')) return 'JV Gold Girls';
            if (l.includes('jv')) return 'JV Girls';
            return 'Varsity Girls';
          });
        }
      } catch (e) {}
    }

    let status: player_teams_status = 'rostered';
    if (legStatus.includes('interested')) status = 'interested';
    else if (legStatus.includes('trying')) status = 'trying_out';
    else if (legStatus.includes('not playing') || legStatus.includes('not_playing')) status = 'not_playing';

    for (const lvlName of levels) {
      const tsKey = `${lvlName.toLowerCase()}|${dbSeasonId}`;
      const tsId = ihsTeamSeasonMap.get(tsKey) || ihsTeamSeasonMap.get(`varsity girls|${dbSeasonId}`);
      if (!tsId) continue;

      const ptKey = `${personId}|${tsId}`;
      if (existingPtSet.has(ptKey)) continue;

      rosterEntriesToCreate.push({
        player_id: personId,
        team_season_id: tsId,
        jersey_number: rosterNumber,
        alt_jersey_number: altRoster,
        gk_number: gkRoster,
        grade: grade,
        position: position,
        status: status,
        captain: captain,
        lives_with_parents: livesWithParents,
        played_last_season: returningPlayer,
        enrolled_last_year: enrolledLastYear,
        is_active: true
      });
      existingPtSet.add(ptKey);
    }
  }

  console.log(`Bulk inserting ${rosterEntriesToCreate.length} seasonal roster entries (player_teams)...`);
  if (rosterEntriesToCreate.length > 0) {
    for (let i = 0; i < rosterEntriesToCreate.length; i += 500) {
      await prisma.player_teams.createMany({
        data: rosterEntriesToCreate.slice(i, i + 500),
        skipDuplicates: true
      });
    }
  }

  // Update photo URLs
  console.log(`Updating ${photosToUpdate.length} player photos...`);
  for (const p of photosToUpdate) {
    await prisma.people.update({
      where: { id: p.personId },
      data: {
        photo_url: p.photoUrl,
        photo_status: 'approved'
      }
    });
  }

  const finalPlayerTeamsCount = await prisma.player_teams.count();
  console.log(`=== MIGRATION COMPLETED ===`);
  console.log(`Total player_teams in database now: ${finalPlayerTeamsCount}`);

  return {
    rosterEntriesCreated: rosterEntriesToCreate.length,
    photosUpdated: photosToUpdate.length,
    totalPlayerTeamsInDb: finalPlayerTeamsCount
  };
}

if (require.main === module) {
  migratePlayerTeams()
    .then(results => {
      console.log('Results:', results);
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration Error:', err);
      process.exit(1);
    });
}
