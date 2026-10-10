import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { club_staff_role, team_staff_role, teams_gender, seasons_status } from '../src/generated/client';
import { normalizeGender } from '../src/lib/utils/gender';

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
        current += char;
        continue;
      }
      if (!inString) {
        if (char === '(') {
          depth++;
          if (depth === 1) {
            current = '';
            continue;
          }
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            tuples.push(parseTupleFields(current));
            current = '';
            continue;
          }
        }
      }
      if (depth > 0) {
        current += char;
      }
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
    if (esc) {
      field += c;
      esc = false;
      continue;
    }
    if (c === '\\') {
      esc = true;
      continue;
    }
    if (c === "'") {
      inStr = !inStr;
      continue;
    }
    if (c === ',' && !inStr) {
      fields.push(field.trim());
      field = '';
      continue;
    }
    field += c;
  }
  fields.push(field.trim());

  return fields.map(f => {
    if (f === 'NULL' || f === 'null') return null;
    return f;
  });
}

function parseJsonArray(str: string | null): number[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map(v => Number(v)).filter(v => !isNaN(v) && v > 0);
    }
  } catch (e) {}
  return [];
}

export async function migrateIndependenceSeasons() {
  console.log('=== STARTING BULK INDEPENDENCE SEASONS & STAFF MIGRATION ===');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found at ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 1. Locate Independence High School Club
  let ihsClub = await prisma.clubs.findFirst({
    where: {
      OR: [
        { name: { equals: 'Independence High School' } },
        { name: { contains: 'Independence' } }
      ],
      type: 'high_school'
    }
  });

  if (!ihsClub) {
    ihsClub = await prisma.clubs.create({
      data: {
        name: 'Independence High School',
        abbreviation: 'IHS',
        type: 'high_school',
        is_active: true
      }
    });
  }

  console.log(`Independence High School Club ID: ${ihsClub.id}`);

  // 2. Ensure Teams for Independence High School
  const requiredTeams = [
    { name: 'Varsity Girls', gender: 'FEMALE' as teams_gender },
    { name: 'JV Girls', gender: 'FEMALE' as teams_gender },
    { name: 'JV Gold Girls', gender: 'FEMALE' as teams_gender },
    { name: 'JV Navy Girls', gender: 'FEMALE' as teams_gender }
  ];

  const teamMap = new Map<string, number>();
  for (const rt of requiredTeams) {
    let t = await prisma.teams.findFirst({
      where: {
        club_id: ihsClub.id,
        team_name: rt.name
      }
    });
    if (!t) {
      t = await prisma.teams.create({
        data: {
          club_id: ihsClub.id,
          team_name: rt.name,
          gender: rt.gender,
          is_active: true
        }
      });
    }
    teamMap.set(rt.name, t.id);
  }
  console.log('Independence Teams mapped:', Object.fromEntries(teamMap.entries()));

  // 3. Bulk parse & import legacy people
  const legacyPeopleTuples = parseSqlTuples(sql, 'people');
  console.log(`Parsed ${legacyPeopleTuples.length} legacy people tuples.`);

  let existingPeople = await prisma.people.findMany();
  const personIdMap = new Map<number, number>();
  const peopleLookup = new Map<string, typeof existingPeople[0]>();

  existingPeople.forEach(p => {
    const key = `${p.first_name.trim().toLowerCase()}|${p.last_name.trim().toLowerCase()}`;
    peopleLookup.set(key, p);
  });

  const peopleToCreate: { first_name: string; last_name: string; nickname: string | null; email: string | null; alternate_emails?: any; phone: string | null; gender: string | null; title: string | null; is_active: boolean }[] = [];
  const pendingLegacyPeople: { legacyId: number; key: string }[] = [];

  for (const tuple of legacyPeopleTuples) {
    const legacyId = Number(tuple[0]) || 0;
    const title = (tuple[2] || '').trim() || null;
    const firstName = (tuple[3] || '').trim();
    const lastName = (tuple[4] || '').trim();
    const rawEmailStr = (tuple[5] || '').trim();
    const phone = (tuple[6] || '').trim() || null;
    const otherLastName = (tuple[7] || '').trim() || null;
    const nickname = (tuple[8] || '').trim() || null;
    const rawDob = (tuple[10] || '').trim() || null;
    const rawGender = (tuple[11] || '').trim() || null;

    if (!legacyId || !firstName || !lastName) continue;

    let primaryEmail: string | null = null;
    let alternateEmails: string[] = [];
    if (rawEmailStr) {
      const parsedEmails = rawEmailStr.split(/[,;\s]+/).map(e => e.trim()).filter(e => e.includes('@'));
      if (parsedEmails.length > 0) {
        primaryEmail = parsedEmails[0];
        if (parsedEmails.length > 1) {
          alternateEmails = parsedEmails.slice(1);
        }
      }
    }

    let dob: Date | null = null;
    if (rawDob && rawDob !== '0000-00-00' && rawDob !== '0000-00-00 00:00:00') {
      const parsed = new Date(rawDob);
      if (!isNaN(parsed.getTime())) {
        dob = parsed;
      }
    }

    const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}`;
    if (peopleLookup.has(key)) {
      const existing = peopleLookup.get(key)!;
      personIdMap.set(legacyId, existing.id);
    } else {
      peopleToCreate.push({
        first_name: firstName,
        last_name: lastName,
        nickname: nickname,
        email: primaryEmail,
        alternate_emails: alternateEmails.length > 0 ? alternateEmails : null,
        phone: phone,
        gender: rawGender ? normalizeGender(rawGender) : null,
        title: title,
        is_active: true
      });
      pendingLegacyPeople.push({ legacyId, key });
    }
  }

  if (peopleToCreate.length > 0) {
    console.log(`Bulk creating ${peopleToCreate.length} new people records...`);
    await prisma.people.createMany({
      data: peopleToCreate
    });

    existingPeople = await prisma.people.findMany();
    existingPeople.forEach(p => {
      const key = `${p.first_name.trim().toLowerCase()}|${p.last_name.trim().toLowerCase()}`;
      peopleLookup.set(key, p);
    });

    for (const pending of pendingLegacyPeople) {
      if (peopleLookup.has(pending.key)) {
        personIdMap.set(pending.legacyId, peopleLookup.get(pending.key)!.id);
      }
    }
  }
  console.log(`Legacy people imported. Total mapped: ${personIdMap.size}`);

  // 4. Parse legacy seasons tuples
  const seasonsTuples = parseSqlTuples(sql, 'seasons');
  console.log(`Parsed ${seasonsTuples.length} legacy seasons tuples.`);

  let existingSeasons = await prisma.seasons.findMany();
  const seasonLookup = new Map<string, typeof existingSeasons[0]>();
  existingSeasons.forEach(s => seasonLookup.set(s.season_name.trim(), s));

  const seasonsToCreate: { season_name: string; start_date: Date; end_date: Date; status: seasons_status }[] = [];
  const pendingSeasons: string[] = [];

  for (const tuple of seasonsTuples) {
    const legacySeasonId = Number(tuple[0]) || 0;
    const seasonYear = Number(tuple[1]) || 0;
    const schoolYear = (tuple[2] || '').trim();
    const seasonPhase = (tuple[14] || '').trim();

    if (!legacySeasonId || !schoolYear) continue;

    if (!seasonLookup.has(schoolYear)) {
      const startYear = seasonYear || Number(schoolYear.split('-')[0]) || 2004;
      const endYear = startYear + 1;
      const startDate = new Date(`${startYear}-08-01T00:00:00.000Z`);
      const endDate = new Date(`${endYear}-07-31T00:00:00.000Z`);

      let status: seasons_status = 'completed';
      if (seasonPhase === 'active') status = 'active';
      else if (seasonPhase === 'pre-Tryout' || seasonPhase === 'upcoming') status = 'upcoming';

      seasonsToCreate.push({
        season_name: schoolYear,
        start_date: startDate,
        end_date: endDate,
        status: status
      });
      pendingSeasons.push(schoolYear);
    }
  }

  if (seasonsToCreate.length > 0) {
    console.log(`Bulk creating ${seasonsToCreate.length} new seasons...`);
    await prisma.seasons.createMany({
      data: seasonsToCreate
    });
    existingSeasons = await prisma.seasons.findMany();
    existingSeasons.forEach(s => seasonLookup.set(s.season_name.trim(), s));
  }

  // 5. Build team_seasons and staff assignments
  let existingTeamSeasons = await prisma.team_seasons.findMany();
  const teamSeasonMap = new Map<string, number>(); // "teamId|seasonId" -> team_season_id
  existingTeamSeasons.forEach(ts => {
    teamSeasonMap.set(`${ts.team_id}|${ts.season_id}`, ts.id);
  });

  const teamSeasonsToCreate: { team_id: number; season_id: number; is_active: boolean }[] = [];
  const pendingTeamSeasonsKeys: { key: string; teamId: number; seasonId: number }[] = [];

  const teamStaffToCreate: { person_id: number; team_season_id: number; role: team_staff_role; title: string; access_level: string; is_active: boolean }[] = [];
  const clubStaffToCreate: { person_id: number; club_id: number; role: club_staff_role; title: string; access_level: string; is_active: boolean }[] = [];

  for (const tuple of seasonsTuples) {
    const legacySeasonId = Number(tuple[0]) || 0;
    const schoolYear = (tuple[2] || '').trim();
    const legacyHeadCoachId = tuple[7] ? Number(tuple[7]) : null;
    const teamLevelsStr = tuple[13];
    const assistantCoachIds = parseJsonArray(tuple[15]);
    const trainerIds = parseJsonArray(tuple[16]);
    const principalIds = parseJsonArray(tuple[17]);
    const managerIds = parseJsonArray(tuple[18]);
    const assistantPrincipalIds = parseJsonArray(tuple[19]);
    const athleticDirectorIds = parseJsonArray(tuple[20]);

    if (!legacySeasonId || !schoolYear || !seasonLookup.has(schoolYear)) continue;

    const seasonObj = seasonLookup.get(schoolYear)!;

    let levels: string[] = ['Varsity', 'JV'];
    if (teamLevelsStr) {
      try {
        const parsed = JSON.parse(teamLevelsStr);
        if (Array.isArray(parsed)) levels = parsed;
      } catch (e) {}
    }

    for (const lvl of levels) {
      let teamNameKey = 'Varsity Girls';
      if (lvl.toLowerCase().includes('navy')) teamNameKey = 'JV Navy Girls';
      else if (lvl.toLowerCase().includes('gold')) teamNameKey = 'JV Gold Girls';
      else if (lvl.toLowerCase().includes('jv')) teamNameKey = 'JV Girls';

      const teamId = teamMap.get(teamNameKey) || teamMap.get('Varsity Girls')!;
      const key = `${teamId}|${seasonObj.id}`;

      if (!teamSeasonMap.has(key)) {
        teamSeasonsToCreate.push({
          team_id: teamId,
          season_id: seasonObj.id,
          is_active: true
        });
        pendingTeamSeasonsKeys.push({ key, teamId, seasonId: seasonObj.id });
      }
    }
  }

  if (teamSeasonsToCreate.length > 0) {
    console.log(`Bulk creating ${teamSeasonsToCreate.length} new team_seasons...`);
    await prisma.team_seasons.createMany({
      data: teamSeasonsToCreate,
      skipDuplicates: true
    });

    existingTeamSeasons = await prisma.team_seasons.findMany();
    existingTeamSeasons.forEach(ts => {
      teamSeasonMap.set(`${ts.team_id}|${ts.season_id}`, ts.id);
    });
  }

  // 6. Now attach staff assignments to resolved team_seasons and club
  const teamStaffSet = new Set<string>();
  const clubStaffSet = new Set<string>();

  for (const tuple of seasonsTuples) {
    const legacySeasonId = Number(tuple[0]) || 0;
    const schoolYear = (tuple[2] || '').trim();
    const legacyHeadCoachId = tuple[7] ? Number(tuple[7]) : null;
    const teamLevelsStr = tuple[13];
    const assistantCoachIds = parseJsonArray(tuple[15]);
    const trainerIds = parseJsonArray(tuple[16]);
    const principalIds = parseJsonArray(tuple[17]);
    const managerIds = parseJsonArray(tuple[18]);
    const assistantPrincipalIds = parseJsonArray(tuple[19]);
    const athleticDirectorIds = parseJsonArray(tuple[20]);

    if (!legacySeasonId || !schoolYear || !seasonLookup.has(schoolYear)) continue;

    const seasonObj = seasonLookup.get(schoolYear)!;

    let levels: string[] = ['Varsity', 'JV'];
    if (teamLevelsStr) {
      try {
        const parsed = JSON.parse(teamLevelsStr);
        if (Array.isArray(parsed)) levels = parsed;
      } catch (e) {}
    }

    for (const lvl of levels) {
      let teamNameKey = 'Varsity Girls';
      if (lvl.toLowerCase().includes('navy')) teamNameKey = 'JV Navy Girls';
      else if (lvl.toLowerCase().includes('gold')) teamNameKey = 'JV Gold Girls';
      else if (lvl.toLowerCase().includes('jv')) teamNameKey = 'JV Girls';

      const teamId = teamMap.get(teamNameKey) || teamMap.get('Varsity Girls')!;
      const key = `${teamId}|${seasonObj.id}`;
      const tsId = teamSeasonMap.get(key);

      if (!tsId) continue;

      // Head Coach
      if (legacyHeadCoachId && personIdMap.has(legacyHeadCoachId)) {
        const pId = personIdMap.get(legacyHeadCoachId)!;
        const sKey = `${pId}|${tsId}|head_coach`;
        if (!teamStaffSet.has(sKey)) {
          teamStaffToCreate.push({
            person_id: pId,
            team_season_id: tsId,
            role: 'head_coach' as team_staff_role,
            title: 'Head Coach',
            access_level: 'coach',
            is_active: true
          });
          teamStaffSet.add(sKey);
        }
      }

      // Assistant Coaches
      for (const legacyAcId of assistantCoachIds) {
        if (personIdMap.has(legacyAcId)) {
          const pId = personIdMap.get(legacyAcId)!;
          const sKey = `${pId}|${tsId}|assistant_coach`;
          if (!teamStaffSet.has(sKey)) {
            teamStaffToCreate.push({
              person_id: pId,
              team_season_id: tsId,
              role: 'assistant_coach' as team_staff_role,
              title: 'Assistant Coach',
              access_level: 'coach',
              is_active: true
            });
            teamStaffSet.add(sKey);
          }
        }
      }

      // Athletic Trainers
      for (const legacyTrId of trainerIds) {
        if (personIdMap.has(legacyTrId)) {
          const pId = personIdMap.get(legacyTrId)!;
          const sKey = `${pId}|${tsId}|athletic_trainer`;
          if (!teamStaffSet.has(sKey)) {
            teamStaffToCreate.push({
              person_id: pId,
              team_season_id: tsId,
              role: 'athletic_trainer' as team_staff_role,
              title: 'Certified Athletic Trainer',
              access_level: 'trainer',
              is_active: true
            });
            teamStaffSet.add(sKey);
          }
        }
      }

      // Student Managers
      for (const legacyMgrId of managerIds) {
        if (personIdMap.has(legacyMgrId)) {
          const pId = personIdMap.get(legacyMgrId)!;
          const sKey = `${pId}|${tsId}|student_manager`;
          if (!teamStaffSet.has(sKey)) {
            teamStaffToCreate.push({
              person_id: pId,
              team_season_id: tsId,
              role: 'student_manager' as team_staff_role,
              title: 'Student Team Manager',
              access_level: 'stats_keeper',
              is_active: true
            });
            teamStaffSet.add(sKey);
          }
        }
      }
    }

    // Club Staff Assignments (Athletic Directors, Principals, Assistant Principals)
    for (const legacyAdId of athleticDirectorIds) {
      if (personIdMap.has(legacyAdId)) {
        const pId = personIdMap.get(legacyAdId)!;
        const cKey = `${pId}|${ihsClub.id}|athletic_director`;
        if (!clubStaffSet.has(cKey)) {
          clubStaffToCreate.push({
            person_id: pId,
            club_id: ihsClub.id,
            role: 'athletic_director' as club_staff_role,
            title: 'Athletic Director',
            access_level: 'club_admin',
            is_active: false
          });
          clubStaffSet.add(cKey);
        }
      }
    }

    for (const legacyPrId of principalIds) {
      if (personIdMap.has(legacyPrId)) {
        const pId = personIdMap.get(legacyPrId)!;
        const cKey = `${pId}|${ihsClub.id}|principal`;
        if (!clubStaffSet.has(cKey)) {
          clubStaffToCreate.push({
            person_id: pId,
            club_id: ihsClub.id,
            role: 'principal' as club_staff_role,
            title: 'Principal',
            access_level: 'club_admin',
            is_active: false
          });
          clubStaffSet.add(cKey);
        }
      }
    }

    for (const legacyApId of assistantPrincipalIds) {
      if (personIdMap.has(legacyApId)) {
        const pId = personIdMap.get(legacyApId)!;
        const cKey = `${pId}|${ihsClub.id}|assistant_principal`;
        if (!clubStaffSet.has(cKey)) {
          clubStaffToCreate.push({
            person_id: pId,
            club_id: ihsClub.id,
            role: 'assistant_principal' as club_staff_role,
            title: 'Assistant Principal',
            access_level: 'club_admin',
            is_active: false
          });
          clubStaffSet.add(cKey);
        }
      }
    }
  }

  if (teamStaffToCreate.length > 0) {
    console.log(`Bulk creating ${teamStaffToCreate.length} team_staff assignments...`);
    await prisma.team_staff.createMany({
      data: teamStaffToCreate,
      skipDuplicates: true
    });
  }

  if (clubStaffToCreate.length > 0) {
    console.log(`Bulk creating ${clubStaffToCreate.length} club_staff assignments...`);
    await prisma.club_staff.createMany({
      data: clubStaffToCreate,
      skipDuplicates: true
    });
  }

  console.log('=== COMPLETED BULK INDEPENDENCE SEASONS & STAFF MIGRATION ===');
  return {
    seasonsCreated: seasonsToCreate.length,
    teamSeasonsCreated: teamSeasonsToCreate.length,
    teamStaffAssignmentsCreated: teamStaffToCreate.length,
    clubStaffAssignmentsCreated: clubStaffToCreate.length
  };
}

if (require.main === module) {
  migrateIndependenceSeasons()
    .then(results => {
      console.log('Results:', results);
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration Error:', err);
      process.exit(1);
    });
}
