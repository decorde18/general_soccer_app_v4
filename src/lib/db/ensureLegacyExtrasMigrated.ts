import prisma from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

let migrationPromise: Promise<void> | null = null;

function parseSqlValues(sql: string, tableName: string): any[][] {
  const results: any[][] = [];
  const regex = new RegExp(`INSERT INTO \`${tableName}\`[^V]+VALUES\\s*([\\s\\S]+?);`, "g");
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const rawValues = match[1];
    let i = 0;
    const len = rawValues.length;
    while (i < len) {
      while (i < len && rawValues[i] !== "(") i++;
      if (i >= len) break;
      i++; // skip '('
      const row: any[] = [];
      while (i < len && rawValues[i] !== ")") {
        while (i < len && /\s/.test(rawValues[i])) i++;
        if (rawValues[i] === "'") {
          i++; // skip "'"
          let str = "";
          while (i < len) {
            if (rawValues[i] === "\\") {
              i++;
              if (i < len) {
                if (rawValues[i] === "n") str += "\n";
                else if (rawValues[i] === "r") str += "\r";
                else if (rawValues[i] === "t") str += "\t";
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
          let token = "";
          while (i < len && rawValues[i] !== "," && rawValues[i] !== ")") {
            token += rawValues[i];
            i++;
          }
          token = token.trim();
          if (token.toUpperCase() === "NULL") row.push(null);
          else if (!isNaN(Number(token)) && token !== "") row.push(Number(token));
          else row.push(token);
        }
        while (i < len && /\s/.test(rawValues[i])) i++;
        if (rawValues[i] === ",") i++;
      }
      if (rawValues[i] === ")") i++;
      results.push(row);
    }
  }
  return results;
}

async function runEnsureTablesAndMigrate(): Promise<void> {
  try {
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

    // Check if migration from u676616277_hs_original.sql has already run
    const kitCountRows = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
      `SELECT COUNT(*) AS cnt FROM \`uniform_kits\``
    );
    const kitCount = Number(kitCountRows[0]?.cnt || 0);

    const lettersCountRows = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
      `SELECT COUNT(*) AS cnt FROM \`player_season_letters\``
    );
    const lettersCount = Number(lettersCountRows[0]?.cnt || 0);

    if (kitCount > 0 && lettersCount > 0) {
      return;
    }

    const sqlPath = path.join(process.cwd(), "u676616277_hs_original.sql");
    if (!fs.existsSync(sqlPath)) {
      return;
    }
    const sql = fs.readFileSync(sqlPath, "utf-8");

    const sqlSeasons = parseSqlValues(sql, "seasons");
    const sqlSchools = parseSqlValues(sql, "schools");
    const sqlPeople = parseSqlValues(sql, "people");
    const sqlPlayers = parseSqlValues(sql, "players");
    const sqlPlayerSeasons = parseSqlValues(sql, "playerSeasons");
    const sqlUniforms = parseSqlValues(sql, "uniforms");
    const sqlUniformJerseys = parseSqlValues(sql, "uniformJerseys");
    const sqlUniformSeasons = parseSqlValues(sql, "uniformSeasons");
    const sqlUniformSeasonPlayers = parseSqlValues(sql, "uniformSeasonPlayers");
    const sqlScheduleHelper = parseSqlValues(sql, "scheduleHelper");

    const ihsClub = await prisma.clubs.findFirst({
      where: { name: { contains: "Independence High School" } },
    });
    if (!ihsClub) return;

    const dbSeasons = await prisma.seasons.findMany();
    const seasonNameMap = new Map<string, number>();
    for (const s of dbSeasons) {
      seasonNameMap.set(s.season_name.trim(), s.id);
    }

    const legacySeasonToDbSeason = new Map<number, number>();
    for (const s of sqlSeasons) {
      const oldId = Number(s[0]);
      const schoolYear = String(s[2] || "").trim();
      const dbId = seasonNameMap.get(schoolYear);
      if (dbId) legacySeasonToDbSeason.set(oldId, dbId);
    }

    const ihsTeams = await prisma.teams.findMany({
      where: { club_id: ihsClub.id },
    });
    const ihsVarsityTeam =
      ihsTeams.find((t) => t.name.includes("Varsity") && !t.name.includes("Junior")) || ihsTeams[0];
    const ihsJvTeam = ihsTeams.find((t) => t.name.includes("Junior Varsity") || t.name.includes("JV"));

    const ihsTeamSeasons = await prisma.team_seasons.findMany({
      where: { team_id: { in: ihsTeams.map((t) => t.id) } },
      include: { teams: true, seasons: true },
    });

    const getIhsTeamSeasonId = (dbSeasonId: number, levelStr?: string | null): number | null => {
      const isJv =
        levelStr && (levelStr.toLowerCase().includes("jv") || levelStr.toLowerCase().includes("junior"));
      const targetTeamId = isJv && ihsJvTeam ? ihsJvTeam.id : ihsVarsityTeam?.id;
      const match = ihsTeamSeasons.find((ts) => ts.season_id === dbSeasonId && ts.team_id === targetTeamId);
      if (match) return match.id;
      const fallback = ihsTeamSeasons.find((ts) => ts.season_id === dbSeasonId);
      return fallback ? fallback.id : null;
    };

    const dbPeople = await prisma.people.findMany();
    const personNameMap = new Map<string, number>();
    for (const p of dbPeople) {
      const key = `${(p.first_name || "").trim().toLowerCase()}|${(p.last_name || "").trim().toLowerCase()}`;
      personNameMap.set(key, p.id);
    }

    const legacyPeopleMap = new Map<number, { firstName: string; lastName: string }>();
    for (const p of sqlPeople) {
      legacyPeopleMap.set(Number(p[0]), {
        firstName: String(p[3] || "").trim(),
        lastName: String(p[4] || "").trim(),
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
        if (dbPersonId) legacyPlayerToDbPerson.set(oldPlayerId, dbPersonId);
      }
    }

    const allIhsPlayerTeams = await prisma.player_teams.findMany({
      where: { team_seasons: { team_id: { in: ihsTeams.map((t) => t.id) } } },
      include: { team_seasons: true },
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
        if (ptId) legacyPlayerSeasonToPlayerTeam.set(oldPsId, ptId);
      }
    }

    const allClubs = await prisma.clubs.findMany();
    const clubByName = new Map<string, number>();
    for (const c of allClubs) {
      clubByName.set(c.name.trim().toLowerCase(), c.id);
      if (c.short_name) clubByName.set(c.short_name.trim().toLowerCase(), c.id);
    }

    const legacySchoolToClub = new Map<number, number>();
    for (const s of sqlSchools) {
      const oldSchoolId = Number(s[0]);
      const name = String(s[1] || "").trim().toLowerCase();
      const shortName = String(s[2] || "").trim().toLowerCase();
      const clubId = clubByName.get(name) || clubByName.get(shortName);
      if (clubId) legacySchoolToClub.set(oldSchoolId, clubId);
    }

    if (kitCount === 0) {
      const legacyUniformIdToKitId = new Map<number, number>();
      for (const u of sqlUniforms) {
        const oldId = Number(u[0]);
        const type = String(u[1] || "Field");
        const brand = u[2] ? String(u[2]) : null;
        const style = u[3] ? String(u[3]) : null;
        const color = u[4] ? String(u[4]) : null;
        const year = u[5] ? String(u[5]) : null;
        const isActive = u[8] === 1 || u[8] === "1" ? 1 : 0;

        await prisma.$executeRawUnsafe(
          `INSERT INTO \`uniform_kits\` (\`club_id\`, \`type\`, \`brand\`, \`style\`, \`color\`, \`year\`, \`is_active\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ihsClub.id,
          type,
          brand,
          style,
          color,
          year,
          isActive
        );
        const inserted = await prisma.$queryRawUnsafe<{ id: number }[]>(`SELECT LAST_INSERT_ID() AS id`);
        legacyUniformIdToKitId.set(oldId, Number(inserted[0].id));
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO \`uniform_kits\` (\`club_id\`, \`type\`, \`brand\`, \`style\`, \`color\`, \`year\`, \`is_active\`) VALUES (?, 'General / Practice', 'Team Issue', 'Standard', 'Mixed', 'Legacy', 0)`,
        ihsClub.id
      );
      const fallbackInserted = await prisma.$queryRawUnsafe<{ id: number }[]>(
        `SELECT LAST_INSERT_ID() AS id`
      );
      const fallbackKitId = Number(fallbackInserted[0].id);

      const legacyJerseyIdToDbId = new Map<number, number>();
      for (const j of sqlUniformJerseys) {
        const oldKitId = j[0] !== null ? Number(j[0]) : null;
        const number = Number(j[1]) || 0;
        const size = j[2] ? String(j[2]) : null;
        const isLost = j[3] === 1 || j[3] === "1" ? 1 : 0;
        const oldJerseyId = Number(j[6]);
        const kitId = (oldKitId && legacyUniformIdToKitId.get(oldKitId)) || fallbackKitId;

        await prisma.$executeRawUnsafe(
          `INSERT INTO \`uniform_jerseys\` (\`uniform_kit_id\`, \`jersey_number\`, \`size\`, \`is_lost\`) VALUES (?, ?, ?, ?)`,
          kitId,
          number,
          size,
          isLost
        );
        const insertedJ = await prisma.$queryRawUnsafe<{ id: number }[]>(`SELECT LAST_INSERT_ID() AS id`);
        legacyJerseyIdToDbId.set(oldJerseyId, Number(insertedJ[0].id));
      }

      for (const us of sqlUniformSeasons) {
        const oldSeasonId = Number(us[0]);
        const squadLevel = String(us[1] || "Varsity");
        const oldKitId = Number(us[2]);
        const dbSeasonId = legacySeasonToDbSeason.get(oldSeasonId);
        const dbKitId = legacyUniformIdToKitId.get(oldKitId);
        if (dbSeasonId && dbKitId) {
          const teamSeasonId = getIhsTeamSeasonId(dbSeasonId, squadLevel);
          await prisma.$executeRawUnsafe(
            `INSERT INTO \`uniform_season_kits\` (\`season_id\`, \`team_season_id\`, \`squad_level\`, \`uniform_kit_id\`) VALUES (?, ?, ?, ?)`,
            dbSeasonId,
            teamSeasonId,
            squadLevel,
            dbKitId
          );
        }
      }

      for (const usp of sqlUniformSeasonPlayers) {
        const oldPsId = Number(usp[1]);
        const oldJerseyId = Number(usp[2]);
        const assignType = usp[5] ? String(usp[5]) : "Main";
        const playerTeamId = legacyPlayerSeasonToPlayerTeam.get(oldPsId);
        const dbJerseyId = legacyJerseyIdToDbId.get(oldJerseyId);
        if (playerTeamId && dbJerseyId) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO \`uniform_player_assignments\` (\`player_team_id\`, \`uniform_jersey_id\`, \`assignment_type\`, \`returned\`) VALUES (?, ?, ?, 1)`,
            playerTeamId,
            dbJerseyId,
            assignType
          );
        }
      }
    }

    const leadsCountRows = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
      `SELECT COUNT(*) AS cnt FROM \`schedule_leads\``
    );
    if (Number(leadsCountRows[0]?.cnt || 0) === 0) {
      for (const sh of sqlScheduleHelper) {
        const oldSchoolId = Number(sh[3]);
        const oldSeasonId = Number(sh[4]);
        const likelihood = sh[5] !== null && !isNaN(Number(sh[5])) ? Number(sh[5]) : 3;
        const notes = sh[6] ? String(sh[6]).trim() : null;
        const rawStatus = sh[7] ? String(sh[7]).trim() : "Prospect";
        const opponentClubId = legacySchoolToClub.get(oldSchoolId);
        const dbSeasonId = legacySeasonToDbSeason.get(oldSeasonId);
        if (opponentClubId && dbSeasonId) {
          const teamSeasonId = getIhsTeamSeasonId(dbSeasonId, "Varsity");
          await prisma.$executeRawUnsafe(
            `INSERT INTO \`schedule_leads\` (\`season_id\`, \`team_season_id\`, \`opponent_club_id\`, \`likelihood\`, \`status\`, \`notes\`) VALUES (?, ?, ?, ?, ?, ?)`,
            dbSeasonId,
            teamSeasonId,
            opponentClubId,
            Math.min(5, Math.max(1, likelihood || 3)),
            rawStatus || "Prospect",
            notes && notes.length > 0 ? notes : null
          );
        }
      }
    }

    if (lettersCount === 0) {
      const ihsPlayerTeamsChrono = await prisma.player_teams.findMany({
        where: { team_seasons: { team_id: { in: ihsTeams.map((t) => t.id) } } },
        include: {
          team_seasons: { include: { teams: true, seasons: true } },
        },
        orderBy: [{ team_seasons: { seasons: { start_date: "asc" } } }, { id: "asc" }],
      });

      const playerProgramYears = new Map<number, Set<number>>();
      const playerVarsityYears = new Map<number, Set<number>>();
      const personSeasonGroups = new Map<string, typeof ihsPlayerTeamsChrono>();

      for (const pt of ihsPlayerTeamsChrono) {
        const key = `${pt.person_id}_${pt.team_seasons.season_id}`;
        const list = personSeasonGroups.get(key) || [];
        list.push(pt);
        personSeasonGroups.set(key, list);
      }

      for (const [, pts] of personSeasonGroups.entries()) {
        const primaryPt =
          pts.find(
            (p) => p.team_seasons.teams.name.includes("Varsity") && !p.team_seasons.teams.name.includes("Junior")
          ) || pts[0];
        const personId = primaryPt.person_id;
        const seasonId = primaryPt.team_seasons.season_id;
        const seasonName = primaryPt.team_seasons.seasons.season_name;

        const isVarsity = pts.some(
          (p) =>
            (p.team_seasons.teams.name.includes("Varsity") && !p.team_seasons.teams.name.includes("Junior")) ||
            (p.status && p.status.toLowerCase().includes("varsity") && !p.status.toLowerCase().includes("jv"))
        );

        if (!playerProgramYears.has(personId)) playerProgramYears.set(personId, new Set());
        if (!playerVarsityYears.has(personId)) playerVarsityYears.set(personId, new Set());

        const progSet = playerProgramYears.get(personId)!;
        const varsSet = playerVarsityYears.get(personId)!;
        progSet.add(seasonId);
        if (isVarsity) varsSet.add(seasonId);

        const isFirstProgramYear = progSet.size === 1;
        const isFirstVarsityYear = isVarsity && varsSet.size === 1;

        let gradPatch: number | null = null;
        if (isFirstProgramYear) {
          const endYearMatch = seasonName.match(/(\d{4})$/);
          const seasonEndYear = endYearMatch ? Number(endYearMatch[1]) : 2025;
          const grade = primaryPt.grade ? Number(primaryPt.grade) : 9;
          const yearsLeft = grade >= 9 && grade <= 12 ? 12 - grade : 3;
          gradPatch = (seasonEndYear + yearsLeft) % 100;
        }

        await prisma.$executeRawUnsafe(
          `INSERT IGNORE INTO \`player_season_letters\` (\`player_id\`, \`season_id\`, \`team_season_id\`, \`certificate\`, \`varsity_letter\`, \`number_patch\`, \`number_patch_needed\`, \`varsity_patch_needed\`, \`ball\`, \`bar\`) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
          personId,
          seasonId,
          primaryPt.team_season_id,
          isVarsity ? 1 : 0,
          gradPatch,
          isFirstProgramYear ? 1 : 0,
          isFirstVarsityYear ? 1 : 0,
          isFirstVarsityYear ? 1 : 0,
          isVarsity ? 1 : 0
        );
      }
    }
  } catch (err) {
    console.error("Error in ensureLegacyExtrasMigrated:", err);
  }
}

export async function ensureLegacyExtrasMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runEnsureTablesAndMigrate();
  }
  return migrationPromise;
}

