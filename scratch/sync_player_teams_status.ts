import fs from 'fs';
import prisma from '../src/lib/prisma';
import { parseSqlTuplesRobust } from '../scripts/migrate_events_and_subs';

async function fastSyncPlayerTeamsStatus() {
  console.log('--- Fast Syncing player_teams status from legacy playerSeasons ---');
  const sql = fs.readFileSync('u676616277_hs_original.sql', 'utf8');

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

  // 2. People & Players
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

  // 3. IHS Club and Team Seasons
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

  // 4. Parse playerSeasons and bucket by status
  const psTuples = parseSqlTuplesRobust(sql, 'playerSeasons');
  console.log(`Processing ${psTuples.length} legacy playerSeasons tuples...`);

  const statusBuckets = new Map<string, Array<{ personId: number; tsId: number }>>();

  for (const ps of psTuples) {
    const legPlayerId = Number(ps[2]);
    const legSeasonId = Number(ps[3]);
    const legStatus = (ps[6] || 'interested').toLowerCase();
    const teamLevelRaw = ps[7];

    if (!legacyPlayerToDbPersonId.has(legPlayerId)) continue;
    if (!legacySeasonToDbSeason.has(legSeasonId)) continue;

    const personId = legacyPlayerToDbPersonId.get(legPlayerId)!;
    const dbSeasonId = legacySeasonToDbSeason.get(legSeasonId)!;

    let dbStatus = 'rostered';
    if (legStatus.includes('interested')) dbStatus = 'interested';
    else if (legStatus.includes('trying')) dbStatus = 'trying out';
    else if (legStatus.includes('not playing') || legStatus.includes('not_playing')) dbStatus = 'not playing';
    else if (legStatus.includes('quit')) dbStatus = 'quit';
    else if (legStatus.includes('cut')) dbStatus = 'cut';
    else if (legStatus.includes('roster')) dbStatus = 'rostered';

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

    for (const lvlName of levels) {
      const tsKey = `${lvlName.toLowerCase()}|${dbSeasonId}`;
      const tsId = ihsTeamSeasonMap.get(tsKey) || ihsTeamSeasonMap.get(`varsity girls|${dbSeasonId}`);
      if (!tsId) continue;

      if (!statusBuckets.has(dbStatus)) {
        statusBuckets.set(dbStatus, []);
      }
      statusBuckets.get(dbStatus)!.push({ personId, tsId });
    }
  }

  // 5. Fast Bulk UPDATE in batches of 500
  for (const [status, items] of statusBuckets.entries()) {
    console.log(`Updating ${items.length} records to status '${status}'...`);
    for (let i = 0; i < items.length; i += 500) {
      const chunk = items.slice(i, i + 500);
      const conditions = chunk.map(c => `(${c.personId}, ${c.tsId})`).join(',');
      await prisma.$executeRawUnsafe(
        `UPDATE player_teams SET status = '${status}' WHERE (player_id, team_season_id) IN (${conditions})`
      );
    }
  }

  console.log('All player_teams statuses updated!');

  // Breakdown of statuses in DB
  const breakdown: any = await prisma.$queryRawUnsafe(
    "SELECT status, COUNT(*) as count FROM player_teams GROUP BY status"
  );
  console.log('Current DB player_teams breakdown by status:');
  console.log(breakdown);
}

fastSyncPlayerTeamsStatus();
