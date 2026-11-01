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

    const perfLogsCount = await prisma.player_performance_logs.count();
    const customValsCount = await prisma.custom_field_values.count();

    if (kitCount > 0 && lettersCount > 0 && perfLogsCount > 0 && customValsCount > 0) {
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
      ihsTeams.find((t) => t.team_name.includes("Varsity") && !t.team_name.includes("Junior")) || ihsTeams[0];
    const ihsJvTeam = ihsTeams.find(
      (t) => t.team_name.includes("Junior Varsity") || t.team_name.includes("JV")
    );

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
      const key = `${pt.player_id}_${pt.team_seasons.season_id}`;
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
      if (c.abbreviation) clubByName.set(c.abbreviation.trim().toLowerCase(), c.id);
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
      if (sqlUniformJerseys.length > 0) {
        const jerseyPlaceholders: string[] = [];
        const jerseyParams: any[] = [];
        for (const j of sqlUniformJerseys) {
          const oldKitId = j[0] !== null ? Number(j[0]) : null;
          const number = Number(j[1]) || 0;
          const size = j[2] ? String(j[2]) : null;
          const isLost = j[3] === 1 || j[3] === "1" ? 1 : 0;
          const kitId = (oldKitId && legacyUniformIdToKitId.get(oldKitId)) || fallbackKitId;
          jerseyPlaceholders.push("(?, ?, ?, ?)");
          jerseyParams.push(kitId, number, size, isLost);
        }
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`uniform_jerseys\` (\`uniform_kit_id\`, \`jersey_number\`, \`size\`, \`is_lost\`) VALUES ${jerseyPlaceholders.join(", ")}`,
          ...jerseyParams
        );
        const insertedJerseys = await prisma.$queryRawUnsafe<{ id: number }[]>(
          `SELECT id FROM \`uniform_jerseys\` ORDER BY id ASC`
        );
        sqlUniformJerseys.forEach((j, idx) => {
          if (insertedJerseys[idx]) {
            legacyJerseyIdToDbId.set(Number(j[6]), Number(insertedJerseys[idx].id));
          }
        });
      }

      const skPlaceholders: string[] = [];
      const skParams: any[] = [];
      for (const us of sqlUniformSeasons) {
        const oldSeasonId = Number(us[0]);
        const squadLevel = String(us[1] || "Varsity");
        const oldKitId = Number(us[2]);
        const dbSeasonId = legacySeasonToDbSeason.get(oldSeasonId);
        const dbKitId = legacyUniformIdToKitId.get(oldKitId);
        if (dbSeasonId && dbKitId) {
          const teamSeasonId = getIhsTeamSeasonId(dbSeasonId, squadLevel);
          skPlaceholders.push("(?, ?, ?, ?)");
          skParams.push(dbSeasonId, teamSeasonId, squadLevel, dbKitId);
        }
      }
      if (skPlaceholders.length > 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`uniform_season_kits\` (\`season_id\`, \`team_season_id\`, \`squad_level\`, \`uniform_kit_id\`) VALUES ${skPlaceholders.join(", ")}`,
          ...skParams
        );
      }

      const upaPlaceholders: string[] = [];
      const upaParams: any[] = [];
      for (const usp of sqlUniformSeasonPlayers) {
        const oldPsId = Number(usp[1]);
        const oldJerseyId = Number(usp[2]);
        const assignType = usp[5] ? String(usp[5]) : "Main";
        const playerTeamId = legacyPlayerSeasonToPlayerTeam.get(oldPsId);
        const dbJerseyId = legacyJerseyIdToDbId.get(oldJerseyId);
        if (playerTeamId && dbJerseyId) {
          upaPlaceholders.push("(?, ?, ?, 1)");
          upaParams.push(playerTeamId, dbJerseyId, assignType);
        }
      }
      if (upaPlaceholders.length > 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`uniform_player_assignments\` (\`player_team_id\`, \`uniform_jersey_id\`, \`assignment_type\`, \`returned\`) VALUES ${upaPlaceholders.join(", ")}`,
          ...upaParams
        );
      }
    }

    const leadsCountRows = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
      `SELECT COUNT(*) AS cnt FROM \`schedule_leads\``
    );
    if (Number(leadsCountRows[0]?.cnt || 0) === 0) {
      const slPlaceholders: string[] = [];
      const slParams: any[] = [];
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
          slPlaceholders.push("(?, ?, ?, ?, ?, ?)");
          slParams.push(
            dbSeasonId,
            teamSeasonId,
            opponentClubId,
            Math.min(5, Math.max(1, likelihood || 3)),
            rawStatus || "Prospect",
            notes && notes.length > 0 ? notes : null
          );
        }
      }
      if (slPlaceholders.length > 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`schedule_leads\` (\`season_id\`, \`team_season_id\`, \`opponent_club_id\`, \`likelihood\`, \`status\`, \`notes\`) VALUES ${slPlaceholders.join(", ")}`,
          ...slParams
        );
      }
    }

    if (lettersCount === 0) {
      const ihsPlayerTeamsChrono = await prisma.player_teams.findMany({
        where: {
          team_seasons: { team_id: { in: ihsTeams.map((t) => t.id) } },
          status: "rostered",
        },
        include: {
          team_seasons: { include: { teams: true, seasons: true } },
        },
        orderBy: [{ team_seasons: { seasons: { start_date: "asc" } } }, { id: "asc" }],
      });

      const playerProgramYears = new Map<number, Set<number>>();
      const playerVarsityYears = new Map<number, Set<number>>();
      const personSeasonGroups = new Map<string, typeof ihsPlayerTeamsChrono>();

      for (const pt of ihsPlayerTeamsChrono) {
        const key = `${pt.player_id}_${pt.team_seasons.season_id}`;
        const list = personSeasonGroups.get(key) || [];
        list.push(pt);
        personSeasonGroups.set(key, list);
      }

      const pslPlaceholders: string[] = [];
      const pslParams: any[] = [];

      for (const [, pts] of personSeasonGroups.entries()) {
        const primaryPt =
          pts.find(
            (p) =>
              p.team_seasons.teams.team_name.includes("Varsity") &&
              !p.team_seasons.teams.team_name.includes("Junior")
          ) || pts[0];
        const personId = primaryPt.player_id;
        const seasonId = primaryPt.team_seasons.season_id;
        const seasonName = primaryPt.team_seasons.seasons.season_name;

        const isVarsity = pts.some(
          (p) =>
            (p.team_seasons.teams.team_name.includes("Varsity") &&
              !p.team_seasons.teams.team_name.includes("Junior")) ||
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

        pslPlaceholders.push("(?, ?, ?, 1, ?, ?, ?, ?, ?, ?)");
        pslParams.push(
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

      if (pslPlaceholders.length > 0) {
        await prisma.$executeRawUnsafe(
          `INSERT IGNORE INTO \`player_season_letters\` (\`player_id\`, \`season_id\`, \`team_season_id\`, \`certificate\`, \`varsity_letter\`, \`number_patch\`, \`number_patch_needed\`, \`varsity_patch_needed\`, \`ball\`, \`bar\`) VALUES ${pslPlaceholders.join(", ")}`,
          ...pslParams
        );
      }
    }

    // 5. Migrate Fitness Testing (BeepInformation & BeepResults -> performance_tests & player_performance_logs)
    if (perfLogsCount === 0) {
      const beepJsonPath = path.join(process.cwd(), "src", "lib", "db", "accdb_beep_data.json");
      if (fs.existsSync(beepJsonPath)) {
        const beepData = JSON.parse(fs.readFileSync(beepJsonPath, "utf-8")) as {
          BeepInformation: Array<{ ID: number; Run: number; Distance: number }>;
          BeepResults: Array<{
            PlayerID: number;
            SeasonID: number;
            RunDate: string | null;
            RunNo: number | null;
            EndRun: number | null;
          }>;
        };

        const beepDistMap = new Map<number, number>();
        for (const info of beepData.BeepInformation || []) {
          if (info.Run !== null && info.Run !== undefined && info.Distance !== null) {
            beepDistMap.set(Math.round(Number(info.Run) * 10) / 10, Number(info.Distance));
          }
        }
        if (!beepDistMap.has(16.9)) {
          beepDistMap.set(16.9, 1420);
        }

        // Ensure a Beep Test performance_tests row exists for each Independence season (Varsity / primary team_season_id)
        const seasonToPrimaryTsId = new Map<number, number>();
        const seasonToStartDate = new Map<number, Date>();
        for (const ts of ihsTeamSeasons) {
          const isVarsity = ts.teams.team_name.includes("Varsity") && !ts.teams.team_name.includes("Junior");
          if (!seasonToPrimaryTsId.has(ts.season_id) || isVarsity) {
            seasonToPrimaryTsId.set(ts.season_id, ts.id);
          }
          if (ts.seasons?.start_date) {
            seasonToStartDate.set(ts.season_id, new Date(ts.seasons.start_date));
          }
        }

        const existingTests = await prisma.performance_tests.findMany({
          where: { team_season_id: { in: Array.from(seasonToPrimaryTsId.values()) } },
        });
        const tsToTestId = new Map<number, number>();
        for (const t of existingTests) {
          if (t.team_season_id) tsToTestId.set(t.team_season_id, t.id);
        }

        const missingTsIds = Array.from(seasonToPrimaryTsId.values()).filter(
          (tsId) => !tsToTestId.has(tsId)
        );
        if (missingTsIds.length > 0) {
          await prisma.performance_tests.createMany({
            data: missingTsIds.map((tsId) => ({
              team_season_id: tsId,
              name: "Beep Test (20m Shuttle)",
              unit: "level.shuttle",
              higher_is_better: true,
              description: "20m multistage fitness shuttle test (91 stages from BeepInformation)",
            })),
          });
          const allTestsNow = await prisma.performance_tests.findMany({
            where: { team_season_id: { in: Array.from(seasonToPrimaryTsId.values()) } },
          });
          for (const t of allTestsNow) {
            if (t.team_season_id) tsToTestId.set(t.team_season_id, t.id);
          }
        }

        const logsToCreate: Array<{
          test_id: number;
          player_id: number;
          test_date: Date;
          score_numeric: number;
          score_display: string;
          entry_source: string;
          frequency_reps: number;
          interval_details: string;
          verification_status: string;
          notes: string;
        }> = [];

        for (const res of beepData.BeepResults || []) {
          if (res.EndRun === null || res.EndRun === undefined) continue;
          const dbPersonId = legacyPlayerToDbPerson.get(Number(res.PlayerID));
          const dbSeasonId = legacySeasonToDbSeason.get(Number(res.SeasonID));
          if (!dbPersonId || !dbSeasonId) continue;

          const primaryTsId = seasonToPrimaryTsId.get(dbSeasonId);
          const testId = primaryTsId ? tsToTestId.get(primaryTsId) : undefined;
          if (!testId) continue;

          const endRunNum = Math.round(Number(res.EndRun) * 10) / 10;
          const dist = beepDistMap.get(endRunNum);
          const runNo = Number(res.RunNo) || 1;

          let testDateObj: Date;
          if (res.RunDate) {
            testDateObj = new Date(`${res.RunDate}T12:00:00Z`);
          } else {
            const baseDate = seasonToStartDate.get(dbSeasonId) || new Date("2010-08-01T12:00:00Z");
            const year = baseDate.getUTCFullYear();
            testDateObj = new Date(Date.UTC(year, 6, 15 + (runNo - 1) * 7, 12, 0, 0));
          }

          logsToCreate.push({
            test_id: testId,
            player_id: dbPersonId,
            test_date: testDateObj,
            score_numeric: endRunNum,
            score_display: dist ? `${endRunNum.toFixed(1)} (${dist}m)` : endRunNum.toFixed(1),
            entry_source: "coach_practice",
            frequency_reps: runNo,
            interval_details: `Attempt #${runNo}${dist ? ` • Total Shuttle Distance: ${dist}m` : ""}`,
            verification_status: "verified",
            notes: dist ? `Reached stage ${endRunNum.toFixed(1)} (${dist}m total)` : `Reached stage ${endRunNum.toFixed(1)}`,
          });
        }

        if (logsToCreate.length > 0) {
          await prisma.player_performance_logs.createMany({
            data: logsToCreate,
          });
        }
      }
    }

    // 6. Migrate Requirements & Gear (custom_field_definitions & custom_field_values)
    if (customValsCount === 0) {
      // Map legacy playerId -> previousSchool from sqlPlayers
      const personToPreviousSchool = new Map<number, string>();
      for (const pl of sqlPlayers) {
        const oldPlayerId = Number(pl[0]);
        const prevSchool = pl[4] ? String(pl[4]).trim() : "";
        const dbPersonId = legacyPlayerToDbPerson.get(oldPlayerId);
        if (dbPersonId && prevSchool && prevSchool.toLowerCase() !== "n/a") {
          personToPreviousSchool.set(dbPersonId, prevSchool);
        }
      }

      // Map (personId_seasonId) -> legacy playerSeasons attributes
      const personSeasonLegacyAttrs = new Map<
        string,
        {
          livesWithParents: boolean;
          returningPlayer: boolean;
          enrolledLastYear: boolean;
          earnedCredits: boolean;
        }
      >();
      for (const ps of sqlPlayerSeasons) {
        const oldPlayerId = Number(ps[2]);
        const oldSeasonId = Number(ps[3]);
        const dbPersonId = legacyPlayerToDbPerson.get(oldPlayerId);
        const dbSeasonId = legacySeasonToDbSeason.get(oldSeasonId);
        if (!dbPersonId || !dbSeasonId) continue;

        const livesWithParents = ps[12] === null || ps[12] === undefined ? true : Number(ps[12]) === 1;
        const returningPlayer = ps[13] !== null && ps[13] !== undefined ? Number(ps[13]) === 1 : false;
        const enrolledLastYear = ps[14] === null || ps[14] === undefined ? true : Number(ps[14]) === 1;
        const earnedCredits = ps[15] === null || ps[15] === undefined ? true : Number(ps[15]) >= 0;

        personSeasonLegacyAttrs.set(`${dbPersonId}_${dbSeasonId}`, {
          livesWithParents,
          returningPlayer,
          enrolledLastYear,
          earnedCredits,
        });
      }

      const seasonToPrimaryTsId = new Map<number, number>();
      for (const ts of ihsTeamSeasons) {
        const isVarsity = ts.teams.team_name.includes("Varsity") && !ts.teams.team_name.includes("Junior");
        if (!seasonToPrimaryTsId.has(ts.season_id) || isVarsity) {
          seasonToPrimaryTsId.set(ts.season_id, ts.id);
        }
      }

      const reqTemplates = [
        {
          field_key: "player_headshot",
          label: "Player Headshot",
          field_type: "photo_upload",
          category: "Profile",
          options: null,
          is_required: true,
          display_order: 1,
          instructions: "Official roster headshot photo for player profile and match day cards.",
        },
        {
          field_key: "lives_with_parents",
          label: "Lives With Parents",
          field_type: "boolean",
          category: "TSSAA Eligibility",
          options: null,
          is_required: true,
          display_order: 2,
          instructions: "TSSAA bona fide residence compliance check (student resides with parents/legal guardians).",
        },
        {
          field_key: "enrolled_last_year",
          label: "Enrolled Last 12 Months",
          field_type: "boolean",
          category: "TSSAA Eligibility",
          options: null,
          is_required: true,
          display_order: 3,
          instructions: "Student has been enrolled for the preceding 12 months or qualified as an entering 9th grader.",
        },
        {
          field_key: "played_last_season",
          label: "Returning Player",
          field_type: "boolean",
          category: "TSSAA Eligibility",
          options: null,
          is_required: false,
          display_order: 4,
          instructions: "Participated in the Independence Girls Soccer program during the previous season.",
        },
        {
          field_key: "earned_credits",
          label: "Academic Credits Met",
          field_type: "boolean",
          category: "TSSAA Eligibility",
          options: null,
          is_required: true,
          display_order: 5,
          instructions: "Earned required TSSAA academic credits from the previous school year.",
        },
        {
          field_key: "previous_school",
          label: "Previous School",
          field_type: "text",
          category: "TSSAA Eligibility",
          options: null,
          is_required: false,
          display_order: 6,
          instructions: "Feeder middle school or transfer school prior to enrolling at Independence High School.",
        },
        {
          field_key: "jersey_size",
          label: "Jersey Size",
          field_type: "select",
          category: "Gear & Uniforms",
          options: "YS, YM, YL, S, M, L, XL",
          is_required: true,
          display_order: 7,
          instructions: "Player uniform jersey size issued for the season.",
        },
        {
          field_key: "uniform_issued",
          label: "Uniform Issued",
          field_type: "boolean",
          category: "Gear & Uniforms",
          options: null,
          is_required: true,
          display_order: 8,
          instructions: "Confirm primary/alternate match uniform kits have been issued to the player.",
        },
        {
          field_key: "uniform_returned",
          label: "Uniform Returned",
          field_type: "boolean",
          category: "Gear & Uniforms",
          options: null,
          is_required: true,
          display_order: 9,
          instructions: "Confirm all issued uniform jerseys have been returned at end of season.",
        },
      ];

      // Create club-level annual recurring templates + season-specific definitions
      const targetTsIds = Array.from(seasonToPrimaryTsId.values());
      const existingDefs = await prisma.custom_field_definitions.findMany({
        where: {
          OR: [{ club_id: ihsClub.id }, { team_season_id: { in: targetTsIds } }],
        },
      });

      if (existingDefs.length === 0) {
        const defsToCreate: Array<{
          team_season_id: number | null;
          club_id: number;
          field_key: string;
          label: string;
          field_type: string;
          category: string;
          options: string | null;
          permission_role: string;
          is_required: boolean;
          is_annual_recurring: boolean;
          display_order: number;
          is_active: boolean;
          instructions: string | null;
        }> = [];

        // Club-level templates (team_season_id = null)
        for (const tpl of reqTemplates) {
          defsToCreate.push({
            team_season_id: null,
            club_id: ihsClub.id,
            field_key: tpl.field_key,
            label: tpl.label,
            field_type: tpl.field_type,
            category: tpl.category,
            options: tpl.options,
            permission_role: "coach_edit_player_view",
            is_required: tpl.is_required,
            is_annual_recurring: true,
            display_order: tpl.display_order,
            is_active: true,
            instructions: tpl.instructions,
          });
        }

        // Per-season definitions so each season stores independent player values
        for (const tsId of targetTsIds) {
          for (const tpl of reqTemplates) {
            defsToCreate.push({
              team_season_id: tsId,
              club_id: ihsClub.id,
              field_key: tpl.field_key,
              label: tpl.label,
              field_type: tpl.field_type,
              category: tpl.category,
              options: tpl.options,
              permission_role: "coach_edit_player_view",
              is_required: tpl.is_required,
              is_annual_recurring: true,
              display_order: tpl.display_order,
              is_active: true,
              instructions: tpl.instructions,
            });
          }
        }

        await prisma.custom_field_definitions.createMany({
          data: defsToCreate,
        });
      }

      const allSeasonDefs = await prisma.custom_field_definitions.findMany({
        where: { team_season_id: { in: targetTsIds }, is_active: true },
      });

      // Map (team_season_id, field_key) -> definition.id
      const defIdByTsAndKey = new Map<string, number>();
      for (const d of allSeasonDefs) {
        if (d.team_season_id) {
          defIdByTsAndKey.set(`${d.team_season_id}_${d.field_key}`, d.id);
        }
      }

      // Fetch all rostered Independence player_teams with people
      const rosteredPlayerTeams = await prisma.player_teams.findMany({
        where: {
          team_seasons: { team_id: { in: ihsTeams.map((t) => t.id) } },
          status: "rostered",
        },
        include: {
          people: true,
          team_seasons: true,
        },
      });

      // Fetch uniform assignments joined with uniform_jerseys via raw SQL
      const rawAssignments = await prisma.$queryRawUnsafe<
        Array<{
          player_team_id: number;
          returned: number | boolean;
          size: string | null;
        }>
      >(
        `SELECT upa.player_team_id, upa.returned, uj.size FROM \`uniform_player_assignments\` upa LEFT JOIN \`uniform_jerseys\` uj ON uj.id = upa.uniform_jersey_id`
      );
      const assignmentsByPtId = new Map<
        number,
        Array<{ returned: boolean; size: string | null }>
      >();
      for (const a of rawAssignments) {
        const ptId = Number(a.player_team_id);
        const list = assignmentsByPtId.get(ptId) || [];
        list.push({
          returned: Boolean(a.returned),
          size: a.size ? String(a.size) : null,
        });
        assignmentsByPtId.set(ptId, list);
      }

      // Group by (person_id, season_id)
      const rosteredGroups = new Map<string, typeof rosteredPlayerTeams>();
      for (const pt of rosteredPlayerTeams) {
        const key = `${pt.player_id}_${pt.team_seasons.season_id}`;
        const list = rosteredGroups.get(key) || [];
        list.push(pt);
        rosteredGroups.set(key, list);
      }

      const valuesToCreate: Array<{
        definition_id: number;
        player_id: number;
        team_season_id: number;
        value: string;
      }> = [];

      for (const [, pts] of rosteredGroups.entries()) {
        const primaryPt = pts[0];
        const personId = primaryPt.player_id;
        const seasonId = primaryPt.team_seasons.season_id;
        const primaryTsId = seasonToPrimaryTsId.get(seasonId) || primaryPt.team_season_id;

        const legacyAttrs = personSeasonLegacyAttrs.get(`${personId}_${seasonId}`);
        const livesWithParents =
          legacyAttrs?.livesWithParents ?? (primaryPt.lives_with_parents !== false);
        const enrolledLastYear =
          legacyAttrs?.enrolledLastYear ?? (primaryPt.enrolled_last_year !== false);
        const playedLastSeason =
          legacyAttrs?.returningPlayer ?? Boolean(primaryPt.played_last_season);
        const earnedCredits =
          legacyAttrs?.earnedCredits ?? (primaryPt.earned_credits !== false);
        const prevSchool =
          primaryPt.previous_school || personToPreviousSchool.get(personId) || "";

        // Gather uniform assignments across any sub-team in this season
        const allAssignments = pts.flatMap((p) => assignmentsByPtId.get(p.id) || []);
        const sizeFound = allAssignments.find((a) => a.size)?.size || "";
        const hasUniformIssued =
          allAssignments.length > 0 || pts.some((p) => p.jersey_number !== null);
        const allUniformsReturned =
          allAssignments.length > 0
            ? allAssignments.every((a) => a.returned)
            : hasUniformIssued;

        const hasPhoto = Boolean(primaryPt.people?.photo_url);

        const fieldEntries: Array<[string, string]> = [
          ["player_headshot", hasPhoto ? "Completed" : "Not Uploaded"],
          ["lives_with_parents", livesWithParents ? "true" : "false"],
          ["enrolled_last_year", enrolledLastYear ? "true" : "false"],
          ["played_last_season", playedLastSeason ? "true" : "false"],
          ["earned_credits", earnedCredits ? "true" : "false"],
          ["previous_school", prevSchool],
          ["jersey_size", sizeFound],
          ["uniform_issued", hasUniformIssued ? "true" : "false"],
          ["uniform_returned", allUniformsReturned ? "true" : "false"],
        ];

        for (const [fKey, fVal] of fieldEntries) {
          const defId = defIdByTsAndKey.get(`${primaryTsId}_${fKey}`);
          if (defId && fVal !== "") {
            valuesToCreate.push({
              definition_id: defId,
              player_id: personId,
              team_season_id: primaryTsId,
              value: fVal,
            });
          }
        }
      }

      if (valuesToCreate.length > 0) {
        await prisma.custom_field_values.createMany({
          data: valuesToCreate,
          skipDuplicates: true,
        });
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

