<<<<<<< HEAD
import { ensureLegacyExtrasMigrated } from "../src/lib/db/ensureLegacyExtrasMigrated";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Running legacy extras schema creation and data migration...");
  await ensureLegacyExtrasMigrated();

  const kits = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`uniform_kits\``
  );
  const jerseys = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`uniform_jerseys\``
  );
  const seasonKits = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`uniform_season_kits\``
  );
  const assignments = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`uniform_player_assignments\``
  );
  const leads = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`schedule_leads\``
  );
  const letters = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`player_season_letters\``
  );

  console.log(`Migration summary:
  - uniform_kits: ${Number(kits[0]?.cnt || 0)}
  - uniform_jerseys: ${Number(jerseys[0]?.cnt || 0)}
  - uniform_season_kits: ${Number(seasonKits[0]?.cnt || 0)}
  - uniform_player_assignments: ${Number(assignments[0]?.cnt || 0)}
  - schedule_leads: ${Number(leads[0]?.cnt || 0)}
  - player_season_letters: ${Number(letters[0]?.cnt || 0)}
  `);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
=======
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

function parseSqlValues(sql: string, tableName: string): any[][] {
  const results: any[][] = [];
  const regex = new RegExp(`INSERT INTO \`${tableName}\`[^V]+VALUES\\s*([\\s\\S]+?);`, 'g');
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const rawValues = match[1];
    let i = 0;
    const len = rawValues.length;
    while (i < len) {
      while (i < len && rawValues[i] !== '(') i++;
      if (i >= len) break;
      i++; // skip '('
      const row: any[] = [];
      while (i < len && rawValues[i] !== ')') {
        while (i < len && /\s/.test(rawValues[i])) i++;
        if (rawValues[i] === "'") {
          i++; // skip "'"
          let str = '';
          while (i < len) {
            if (rawValues[i] === '\\') {
              i++;
              if (i < len) {
                if (rawValues[i] === 'n') str += '\n';
                else if (rawValues[i] === 'r') str += '\r';
                else if (rawValues[i] === 't') str += '\t';
                else str += rawValues[i];
                i++;
              }
            } else if (rawValues[i] === "'") {
              if (i + 1 < len && rawValues[i + 1] === "'") {
                str += "'";
                i += 2;
              } else {
                i++;
                break;
              }
            } else {
              str += rawValues[i];
              i++;
            }
          }
          row.push(str);
        } else {
          let token = '';
          while (i < len && rawValues[i] !== ',' && rawValues[i] !== ')') {
            token += rawValues[i];
            i++;
          }
          token = token.trim();
          if (token.toUpperCase() === 'NULL') row.push(null);
          else if (!isNaN(Number(token)) && token !== '') row.push(Number(token));
          else row.push(token);
        }
        while (i < len && /\s/.test(rawValues[i])) i++;
        if (rawValues[i] === ',') i++;
      }
      if (rawValues[i] === ')') i++;
      results.push(row);
    }
  }
  return results;
}

async function ensureSchemaTablesExist() {
  console.log('1. Ensuring new schema tables exist in MySQL...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`player_season_letters\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`player_id\` INT NOT NULL,
      \`season_id\` INT NOT NULL,
      \`team_season_id\` INT NULL,
      \`varsity_letter\` BOOLEAN NOT NULL DEFAULT false,
      \`number_patch\` INT NULL,
      \`certificate\` BOOLEAN NOT NULL DEFAULT false,
      \`bar\` BOOLEAN NOT NULL DEFAULT false,
      \`ball\` BOOLEAN NOT NULL DEFAULT false,
      \`number_patch_needed\` BOOLEAN NOT NULL DEFAULT false,
      \`varsity_patch_needed\` BOOLEAN NOT NULL DEFAULT false,
      \`notes\` VARCHAR(255) NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`player_season_letters_player_id_season_id_key\`(\`player_id\`, \`season_id\`),
      INDEX \`player_season_letters_season_id_idx\`(\`season_id\`),
      INDEX \`player_season_letters_team_season_id_idx\`(\`team_season_id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`uniform_kits\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`club_id\` INT NOT NULL,
      \`type\` VARCHAR(50) NOT NULL,
      \`brand\` VARCHAR(100) NULL,
      \`style\` VARCHAR(100) NULL,
      \`color\` VARCHAR(100) NULL,
      \`year\` VARCHAR(25) NULL,
      \`is_active\` BOOLEAN NOT NULL DEFAULT true,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`uniform_kits_club_id_idx\`(\`club_id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`uniform_jerseys\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`uniform_kit_id\` INT NOT NULL,
      \`jersey_number\` INT NOT NULL,
      \`size\` VARCHAR(25) NULL,
      \`is_lost\` BOOLEAN NOT NULL DEFAULT false,
      \`notes\` VARCHAR(255) NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`uniform_jerseys_uniform_kit_id_idx\`(\`uniform_kit_id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`uniform_season_kits\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`season_id\` INT NOT NULL,
      \`team_season_id\` INT NULL,
      \`squad_level\` VARCHAR(50) NOT NULL,
      \`uniform_kit_id\` INT NOT NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`uniform_season_kits_season_id_idx\`(\`season_id\`),
      INDEX \`uniform_season_kits_team_season_id_idx\`(\`team_season_id\`),
      INDEX \`uniform_season_kits_uniform_kit_id_idx\`(\`uniform_kit_id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`uniform_player_assignments\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`player_team_id\` INT NOT NULL,
      \`uniform_jersey_id\` INT NOT NULL,
      \`assignment_type\` VARCHAR(50) NOT NULL DEFAULT 'Main',
      \`returned\` BOOLEAN NOT NULL DEFAULT false,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`uniform_player_assignments_player_team_id_idx\`(\`player_team_id\`),
      INDEX \`uniform_player_assignments_uniform_jersey_id_idx\`(\`uniform_jersey_id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`schedule_leads\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`season_id\` INT NOT NULL,
      \`team_season_id\` INT NULL,
      \`opponent_club_id\` INT NOT NULL,
      \`likelihood\` INT NOT NULL DEFAULT 3,
      \`status\` VARCHAR(50) NOT NULL DEFAULT 'Prospect',
      \`preferred_home_away\` VARCHAR(20) NULL,
      \`preferred_date\` DATE NULL,
      \`notes\` TEXT NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`schedule_leads_season_id_idx\`(\`season_id\`),
      INDEX \`schedule_leads_team_season_id_idx\`(\`team_season_id\`),
      INDEX \`schedule_leads_opponent_club_id_idx\`(\`opponent_club_id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
}

function tryExportAccdbTables(): Record<string, any[]> | null {
  const candidatePaths = [
    path.join(process.cwd(), 'IHS Girls Soccer - Most Recent.accdb'),
    'C:\\Users\\decor\\Development\\IHS Girls Soccer - Most Recent.accdb',
    'D:\\Development\\IHS Girls Soccer - Most Recent.accdb',
    'C:\\Users\\decor\\Documents\\IHS Girls Soccer - Most Recent.accdb',
    'C:\\Users\\decor\\Downloads\\IHS Girls Soccer - Most Recent.accdb',
    'C:\\Users\\decor\\Desktop\\IHS Girls Soccer - Most Recent.accdb',
  ];

  let foundPath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (!foundPath) {
    console.log('   (Note: .accdb binary file not present in workspace root; using SQL dump & deterministic VBA rules)');
    return null;
  }

  console.log(`   Found Access DB at: ${foundPath}`);
  try {
    const psScript = `
      $ErrorActionPreference = "Stop"
      $dbPath = "${foundPath.replace(/\\/g, '\\\\')}"
      $dbe = New-Object -ComObject DAO.DBEngine.120
      $db = $dbe.OpenDatabase($dbPath)
      $tables = @("ShootoutTable", "PlayerAwards", "PlayerAwardsEarned", "PlayerSeasonLetters", "BeepInformation", "BeepResults", "PastSeasonStats", "PastStatsGameScores")
      $result = @{}
      foreach ($tName in $tables) {
        $rows = @()
        try {
          $rs = $db.OpenRecordset("SELECT * FROM [$tName]")
          while (-not $rs.EOF) {
            $obj = @{}
            for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
              $f = $rs.Fields.Item($i)
              $obj[$f.Name] = $f.Value
            }
            $rows += $obj
            $rs.MoveNext()
          }
          $rs.Close()
        } catch {}
        $result[$tName] = $rows
      }
      $db.Close()
      $result | ConvertTo-Json -Depth 4 -Compress
    `;
    const out = execSync(`powershell -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, {
      maxBuffer: 50 * 1024 * 1024,
      encoding: 'utf-8',
    });
    return JSON.parse(out.trim());
  } catch (err: any) {
    console.warn('   Could not read .accdb via DAO:', err.message);
    return null;
  }
}

async function main() {
  await ensureSchemaTablesExist();

  const sqlPath = path.join(process.cwd(), 'u676616277_hs_original.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    return;
  }
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Parse core mapping tables from u676616277_hs_original.sql
  const sqlSeasons = parseSqlValues(sql, 'seasons');
  const sqlSchools = parseSqlValues(sql, 'schools');
  const sqlPeople = parseSqlValues(sql, 'people');
  const sqlPlayers = parseSqlValues(sql, 'players');
  const sqlPlayerSeasons = parseSqlValues(sql, 'playerSeasons');
  const sqlUniforms = parseSqlValues(sql, 'uniforms');
  const sqlUniformJerseys = parseSqlValues(sql, 'uniformJerseys');
  const sqlUniformSeasons = parseSqlValues(sql, 'uniformSeasons');
  const sqlUniformSeasonPlayers = parseSqlValues(sql, 'uniformSeasonPlayers');
  const sqlScheduleHelper = parseSqlValues(sql, 'scheduleHelper');

  console.log(`Parsed from SQL:
  - uniforms: ${sqlUniforms.length}
  - uniformJerseys: ${sqlUniformJerseys.length}
  - uniformSeasons: ${sqlUniformSeasons.length}
  - uniformSeasonPlayers: ${sqlUniformSeasonPlayers.length}
  - scheduleHelper: ${sqlScheduleHelper.length}`);

  // Build mappings to current Prisma DB
  const ihsClub = await prisma.clubs.findFirst({
    where: { name: { contains: 'Independence High School' } },
  });
  if (!ihsClub) {
    throw new Error('Independence High School club not found in DB');
  }

  const dbSeasons = await prisma.seasons.findMany();
  const seasonNameMap = new Map<string, number>();
  for (const s of dbSeasons) {
    seasonNameMap.set(s.season_name.trim(), s.id);
  }

  // Legacy seasonId -> DB season.id
  const legacySeasonToDbSeason = new Map<number, number>();
  for (const s of sqlSeasons) {
    const oldId = Number(s[0]);
    const schoolYear = String(s[2] || '').trim();
    const dbId = seasonNameMap.get(schoolYear);
    if (dbId) {
      legacySeasonToDbSeason.set(oldId, dbId);
    }
  }

  // IHS Team Seasons by (season_id, level)
  const ihsTeams = await prisma.teams.findMany({
    where: { club_id: ihsClub.id },
  });
  const ihsVarsityTeam = ihsTeams.find((t) => t.name.includes('Varsity') && !t.name.includes('Junior')) || ihsTeams[0];
  const ihsJvTeam = ihsTeams.find((t) => t.name.includes('Junior Varsity') || t.name.includes('JV'));

  const ihsTeamSeasons = await prisma.team_seasons.findMany({
    where: { team_id: { in: ihsTeams.map((t) => t.id) } },
    include: { teams: true, seasons: true },
  });

  // Map (dbSeasonId, level) -> team_season_id
  const getIhsTeamSeasonId = (dbSeasonId: number, levelStr?: string | null): number | null => {
    const isJv = levelStr && (levelStr.toLowerCase().includes('jv') || levelStr.toLowerCase().includes('junior'));
    const targetTeamId = isJv && ihsJvTeam ? ihsJvTeam.id : ihsVarsityTeam?.id;
    const match = ihsTeamSeasons.find((ts) => ts.season_id === dbSeasonId && ts.team_id === targetTeamId);
    if (match) return match.id;
    const fallback = ihsTeamSeasons.find((ts) => ts.season_id === dbSeasonId);
    return fallback ? fallback.id : null;
  };

  // Map legacy people & players -> DB person_id
  const dbPeople = await prisma.people.findMany();
  const personNameMap = new Map<string, number>();
  for (const p of dbPeople) {
    const key = `${(p.first_name || '').trim().toLowerCase()}|${(p.last_name || '').trim().toLowerCase()}`;
    personNameMap.set(key, p.id);
  }

  const legacyPeopleMap = new Map<number, { firstName: string; lastName: string }>();
  for (const p of sqlPeople) {
    legacyPeopleMap.set(Number(p[0]), {
      firstName: String(p[3] || '').trim(),
      lastName: String(p[4] || '').trim(),
    });
  }

  const legacyPlayerToDbPerson = new Map<number, number>();
  for (const pl of sqlPlayers) {
    const oldPlayerId = Number(pl[0]);
    const oldPeopleId = Number(pl[2]);
    const pInfo = legacyPeopleMap.get(oldPeopleId);
    if (pInfo) {
      const key = `${pInfo.firstName.toLowerCase()}|${pInfo.lastName.toLowerCase()}`;
      const dbPersonId = personNameMap.get(key);
      if (dbPersonId) {
        legacyPlayerToDbPerson.set(oldPlayerId, dbPersonId);
      }
    }
  }

  // Map legacy playerSeasons.id -> DB player_teams.id
  const allIhsPlayerTeams = await prisma.player_teams.findMany({
    where: {
      team_seasons: {
        team_id: { in: ihsTeams.map((t) => t.id) },
      },
    },
    include: {
      team_seasons: true,
    },
  });

  const personSeasonToPlayerTeamId = new Map<string, number>();
  for (const pt of allIhsPlayerTeams) {
    const key = `${pt.person_id}_${pt.team_seasons.season_id}`;
    if (!personSeasonToPlayerTeamId.has(key)) {
      personSeasonToPlayerTeamId.set(key, pt.id);
    }
  }

  const legacyPlayerSeasonToPlayerTeam = new Map<number, number>();
  for (const ps of sqlPlayerSeasons) {
    const oldPsId = Number(ps[0]);
    const oldPlayerId = Number(ps[2]);
    const oldSeasonId = Number(ps[3]);
    const dbPersonId = legacyPlayerToDbPerson.get(oldPlayerId);
    const dbSeasonId = legacySeasonToDbSeason.get(oldSeasonId);
    if (dbPersonId && dbSeasonId) {
      const ptId = personSeasonToPlayerTeamId.get(`${dbPersonId}_${dbSeasonId}`);
      if (ptId) {
        legacyPlayerSeasonToPlayerTeam.set(oldPsId, ptId);
      }
    }
  }

  // Map legacy schools.id -> DB club.id
  const allClubs = await prisma.clubs.findMany();
  const clubByName = new Map<string, number>();
  for (const c of allClubs) {
    clubByName.set(c.name.trim().toLowerCase(), c.id);
    if (c.short_name) clubByName.set(c.short_name.trim().toLowerCase(), c.id);
  }

  const legacySchoolToClub = new Map<number, number>();
  for (const s of sqlSchools) {
    const oldSchoolId = Number(s[0]);
    const name = String(s[1] || '').trim().toLowerCase();
    const shortName = String(s[2] || '').trim().toLowerCase();
    const clubId = clubByName.get(name) || clubByName.get(shortName);
    if (clubId) {
      legacySchoolToClub.set(oldSchoolId, clubId);
    }
  }

  // ============================================================================
  // 2. MIGRATE UNIFORMS (uniform_kits, uniform_jerseys, uniform_season_kits, uniform_player_assignments)
  // ============================================================================
  console.log('\n2. Migrating Uniforms (Kits, Jerseys, Season Squad Kits & Player Assignments)...');

  const existingKitsCount = await prisma.uniform_kits.count();
  const legacyUniformIdToKitId = new Map<number, number>();
  let fallbackKitId: number;

  if (existingKitsCount === 0) {
    for (const u of sqlUniforms) {
      // (id, type, brand, style, color, year, updated_at, created_at, active)
      const oldId = Number(u[0]);
      const type = String(u[1] || 'Field');
      const brand = u[2] ? String(u[2]) : null;
      const style = u[3] ? String(u[3]) : null;
      const color = u[4] ? String(u[4]) : null;
      const year = u[5] ? String(u[5]) : null;
      const isActive = u[8] === 1 || u[8] === '1';

      const created = await prisma.uniform_kits.create({
        data: {
          club_id: ihsClub.id,
          type,
          brand,
          style,
          color,
          year,
          is_active: isActive,
        },
      });
      legacyUniformIdToKitId.set(oldId, created.id);
    }

    // Create 1 fallback kit for jerseys where uniform IS NULL in legacy SQL
    const fallbackKit = await prisma.uniform_kits.create({
      data: {
        club_id: ihsClub.id,
        type: 'General / Practice',
        brand: 'Team Issue',
        style: 'Standard',
        color: 'Mixed',
        year: 'Legacy',
        is_active: false,
      },
    });
    fallbackKitId = fallbackKit.id;
    console.log(`   Created ${legacyUniformIdToKitId.size} uniform kits (+1 general kit for unassigned jerseys).`);
  } else {
    const kits = await prisma.uniform_kits.findMany({ orderBy: { id: 'asc' } });
    sqlUniforms.forEach((u, idx) => {
      if (kits[idx]) legacyUniformIdToKitId.set(Number(u[0]), kits[idx].id);
    });
    fallbackKitId = kits[kits.length - 1].id;
    console.log(`   Uniform kits already migrated (${existingKitsCount} kits in DB).`);
  }

  // Migrate uniformJerseys -> uniform_jerseys
  // (uniform, number, size, lost, updated_at, created_at, id)
  const existingJerseysCount = await prisma.uniform_jerseys.count();
  const legacyJerseyIdToDbId = new Map<number, number>();

  if (existingJerseysCount === 0) {
    for (const j of sqlUniformJerseys) {
      const oldKitId = j[0] !== null ? Number(j[0]) : null;
      const number = Number(j[1]) || 0;
      const size = j[2] ? String(j[2]) : null;
      const isLost = j[3] === 1 || j[3] === '1';
      const oldJerseyId = Number(j[6]);

      const kitId = (oldKitId && legacyUniformIdToKitId.get(oldKitId)) || fallbackKitId;
      const created = await prisma.uniform_jerseys.create({
        data: {
          uniform_kit_id: kitId,
          jersey_number: number,
          size,
          is_lost: isLost,
        },
      });
      legacyJerseyIdToDbId.set(oldJerseyId, created.id);
    }
    console.log(`   Migrated ${legacyJerseyIdToDbId.size} individual uniform jerseys.`);
  } else {
    const jerseys = await prisma.uniform_jerseys.findMany({ orderBy: { id: 'asc' } });
    sqlUniformJerseys.forEach((j, idx) => {
      if (jerseys[idx]) legacyJerseyIdToDbId.set(Number(j[6]), jerseys[idx].id);
    });
    console.log(`   Uniform jerseys already migrated (${existingJerseysCount} jerseys in DB).`);
  }

  // Migrate uniformSeasons -> uniform_season_kits
  // (season, team, uniform, updated_at, created_at, id)
  const existingSeasonKitsCount = await prisma.uniform_season_kits.count();
  if (existingSeasonKitsCount === 0) {
    let createdCount = 0;
    for (const us of sqlUniformSeasons) {
      const oldSeasonId = Number(us[0]);
      const squadLevel = String(us[1] || 'Varsity');
      const oldKitId = Number(us[2]);

      const dbSeasonId = legacySeasonToDbSeason.get(oldSeasonId);
      const dbKitId = legacyUniformIdToKitId.get(oldKitId);
      if (dbSeasonId && dbKitId) {
        const teamSeasonId = getIhsTeamSeasonId(dbSeasonId, squadLevel);
        await prisma.uniform_season_kits.create({
          data: {
            season_id: dbSeasonId,
            team_season_id: teamSeasonId,
            squad_level: squadLevel,
            uniform_kit_id: dbKitId,
          },
        });
        createdCount++;
      }
    }
    console.log(`   Migrated ${createdCount} season squad kit assignments.`);
  } else {
    console.log(`   Uniform season kits already migrated (${existingSeasonKitsCount} in DB).`);
  }

  // Migrate uniformSeasonPlayers -> uniform_player_assignments
  // (id, seasonPlayer, uniform, updated_at, created_at, type)
  const existingAssignmentsCount = await prisma.uniform_player_assignments.count();
  if (existingAssignmentsCount === 0) {
    let assignedCount = 0;
    for (const usp of sqlUniformSeasonPlayers) {
      const oldPsId = Number(usp[1]);
      const oldJerseyId = Number(usp[2]);
      const assignType = usp[5] ? String(usp[5]) : 'Main';

      const playerTeamId = legacyPlayerSeasonToPlayerTeam.get(oldPsId);
      const dbJerseyId = legacyJerseyIdToDbId.get(oldJerseyId);

      if (playerTeamId && dbJerseyId) {
        await prisma.uniform_player_assignments.create({
          data: {
            player_team_id: playerTeamId,
            uniform_jersey_id: dbJerseyId,
            assignment_type: assignType,
            returned: true,
          },
        });
        assignedCount++;
      }
    }
    console.log(`   Migrated ${assignedCount} player uniform jersey assignments.`);
  } else {
    console.log(`   Player uniform assignments already migrated (${existingAssignmentsCount} in DB).`);
  }

  // ============================================================================
  // 3. MIGRATE SCHEDULE HELPER -> schedule_leads
  // ============================================================================
  console.log('\n3. Migrating ScheduleHelper leads...');
  const existingLeadsCount = await prisma.schedule_leads.count();
  if (existingLeadsCount === 0) {
    let leadsCreated = 0;
    for (const sh of sqlScheduleHelper) {
      // (id, created_at, updated_at, opponent, season, likelihood, notes, status)
      const oldSchoolId = Number(sh[3]);
      const oldSeasonId = Number(sh[4]);
      const likelihood = sh[5] !== null && !isNaN(Number(sh[5])) ? Number(sh[5]) : 3;
      const notes = sh[6] ? String(sh[6]).trim() : null;
      const rawStatus = sh[7] ? String(sh[7]).trim() : 'Prospect';

      const opponentClubId = legacySchoolToClub.get(oldSchoolId);
      const dbSeasonId = legacySeasonToDbSeason.get(oldSeasonId);

      if (opponentClubId && dbSeasonId) {
        const teamSeasonId = getIhsTeamSeasonId(dbSeasonId, 'Varsity');
        await prisma.schedule_leads.create({
          data: {
            season_id: dbSeasonId,
            team_season_id: teamSeasonId,
            opponent_club_id: opponentClubId,
            likelihood: Math.min(5, Math.max(1, likelihood || 3)),
            status: rawStatus || 'Prospect',
            notes: notes && notes.length > 0 ? notes : null,
          },
        });
        leadsCreated++;
      }
    }
    console.log(`   Migrated ${leadsCreated} schedule_leads records from legacy scheduleHelper.`);
  } else {
    console.log(`   Schedule helper leads already migrated (${existingLeadsCount} in DB).`);
  }

  // ============================================================================
  // 4. MIGRATE AWARDS & VARSITY LETTERS (Form_PlayerLetterWinners.vba + .accdb)
  // ============================================================================
  console.log('\n4. Populating Varsity Letterman Records (Form_PlayerLetterWinners.vba logic)...');
  const existingLettersCount = await prisma.player_season_letters.count();
  if (existingLettersCount === 0) {
    // Group all IHS player_teams by person_id ordered chronologically by season start_date
    const ihsPlayerTeamsChrono = await prisma.player_teams.findMany({
      where: {
        team_seasons: {
          team_id: { in: ihsTeams.map((t) => t.id) },
        },
      },
      include: {
        people: true,
        team_seasons: {
          include: {
            teams: true,
            seasons: true,
          },
        },
      },
      orderBy: [
        { team_seasons: { seasons: { start_date: 'asc' } } },
        { id: 'asc' },
      ],
    });

    // Track cumulative program years and varsity years per player
    const playerProgramYears = new Map<number, Set<number>>();
    const playerVarsityYears = new Map<number, Set<number>>();

    // Group by (person_id, season_id) so a player who played both JV and Varsity in the same season gets combined evaluation
    const personSeasonGroups = new Map<string, typeof ihsPlayerTeamsChrono>();
    for (const pt of ihsPlayerTeamsChrono) {
      const key = `${pt.person_id}_${pt.team_seasons.season_id}`;
      const list = personSeasonGroups.get(key) || [];
      list.push(pt);
      personSeasonGroups.set(key, list);
    }

    let lettersCreated = 0;
    for (const [, pts] of personSeasonGroups.entries()) {
      const primaryPt = pts.find((p) => p.team_seasons.teams.name.includes('Varsity') && !p.team_seasons.teams.name.includes('Junior')) || pts[0];
      const personId = primaryPt.person_id;
      const seasonId = primaryPt.team_seasons.season_id;
      const seasonName = primaryPt.team_seasons.seasons.season_name;

      // Determine if on Varsity this season
      const isVarsity = pts.some(
        (p) =>
          (p.team_seasons.teams.name.includes('Varsity') && !p.team_seasons.teams.name.includes('Junior')) ||
          (p.status && p.status.toLowerCase().includes('varsity') && !p.status.toLowerCase().includes('jv'))
      );

      if (!playerProgramYears.has(personId)) playerProgramYears.set(personId, new Set());
      if (!playerVarsityYears.has(personId)) playerVarsityYears.set(personId, new Set());

      const progSet = playerProgramYears.get(personId)!;
      const varsSet = playerVarsityYears.get(personId)!;

      progSet.add(seasonId);
      if (isVarsity) varsSet.add(seasonId);

      const isFirstProgramYear = progSet.size === 1;
      const isFirstVarsityYear = isVarsity && varsSet.size === 1;

      // Calculate 2-digit graduation year patch (e.g. 2025 -> 25)
      let gradPatch: number | null = null;
      if (isFirstProgramYear) {
        const endYearMatch = seasonName.match(/(\d{4})$/);
        const seasonEndYear = endYearMatch ? Number(endYearMatch[1]) : 2025;
        const grade = primaryPt.grade ? Number(primaryPt.grade) : 9;
        const yearsLeft = grade >= 9 && grade <= 12 ? 12 - grade : 3;
        gradPatch = (seasonEndYear + yearsLeft) % 100;
      }

      await prisma.player_season_letters.upsert({
        where: {
          player_id_season_id: {
            player_id: personId,
            season_id: seasonId,
          },
        },
        create: {
          player_id: personId,
          season_id: seasonId,
          team_season_id: primaryPt.team_season_id,
          certificate: true,
          varsity_letter: isVarsity,
          number_patch: gradPatch,
          number_patch_needed: isFirstProgramYear,
          varsity_patch_needed: isFirstVarsityYear,
          ball: isFirstVarsityYear,
          bar: isVarsity,
        },
        update: {},
      });
      lettersCreated++;
    }
    console.log(`   Calculated and stored ${lettersCreated} historical Varsity Letterman records across all seasons.`);
  } else {
    console.log(`   Varsity Letterman records already populated (${existingLettersCount} in DB).`);
  }

  // ============================================================================
  // 5. CHECK FOR OPTIONAL .ACCDB EXTRAS (ShootoutTable, BeepResults, PastSeasonStats)
  // ============================================================================
  console.log('\n5. Checking for .accdb binary tables (ShootoutTable, BeepResults, PastSeasonStats)...');
  const accdbData = tryExportAccdbTables();
  if (accdbData) {
    console.log('   Successfully extracted .accdb tables:', Object.keys(accdbData));
  }

  console.log('\nMigration and verification complete!');
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
