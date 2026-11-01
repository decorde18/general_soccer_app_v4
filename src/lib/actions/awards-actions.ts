"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
<<<<<<< HEAD
import { award_category, award_scope } from "@/generated/client";
import { ensureLegacyExtrasMigrated } from "@/lib/db/ensureLegacyExtrasMigrated";

export async function getPlayerAwardsAndLetters(personId: number) {
  const safePersonId = Number(personId) || 0;
  if (!safePersonId) return { awards: [], letters: [] };

  await ensureLegacyExtrasMigrated();

  const awards = await prisma.awards.findMany({
    where: { person_id: safePersonId },
    include: {
      people: true,
      seasons: true,
    },
    orderBy: [{ year: "desc" }, { id: "desc" }],
  });

  const rawLetters = await prisma.$queryRawUnsafe<any[]>(
    `SELECT l.*, p.first_name, p.last_name, s.season_name
     FROM \`player_season_letters\` l
     JOIN \`people\` p ON p.id = l.player_id
     JOIN \`seasons\` s ON s.id = l.season_id
     WHERE l.player_id = ?
     ORDER BY s.start_date DESC, l.id DESC`,
    safePersonId
  );

  const letters = rawLetters.map((l) => ({
    ...l,
    id: Number(l.id),
    player_id: Number(l.player_id),
    season_id: Number(l.season_id),
    team_season_id: l.team_season_id ? Number(l.team_season_id) : null,
    varsity_letter: Boolean(l.varsity_letter),
    number_patch: l.number_patch !== null && l.number_patch !== undefined ? Number(l.number_patch) : null,
    certificate: Boolean(l.certificate),
    bar: Boolean(l.bar),
    ball: Boolean(l.ball),
    number_patch_needed: Boolean(l.number_patch_needed),
    varsity_patch_needed: Boolean(l.varsity_patch_needed),
    people: { first_name: l.first_name, last_name: l.last_name },
    seasons: { season_name: l.season_name },
  }));
=======

export async function getPlayerAwardsAndLetters(personId: number) {
  const [awards, letters] = await Promise.all([
    prisma.awards.findMany({
      where: { person_id: personId },
      include: {
        seasons: true,
        team_seasons: {
          include: {
            teams: { include: { clubs: true } },
          },
        },
        league_nodes: true,
        governing_bodies: true,
      },
      orderBy: [{ year: "desc" }, { id: "desc" }],
    }),
    prisma.player_season_letters.findMany({
      where: { player_id: personId },
      include: {
        seasons: true,
        team_seasons: {
          include: {
            teams: { include: { clubs: true } },
          },
        },
      },
      orderBy: [{ seasons: { start_date: "desc" } }, { id: "desc" }],
    }),
  ]);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56

  return { awards, letters };
}

<<<<<<< HEAD
export async function getTeamSeasonAwardsAndLetters(
  teamSeasonId: number,
  programTeamSeasonIds?: number[]
) {
  const safeTsId = Number(teamSeasonId) || 0;
  if (!safeTsId) return { awards: [], letters: [] };

  await ensureLegacyExtrasMigrated();

  const ts = await prisma.team_seasons.findUnique({
    where: { id: safeTsId },
    include: {
      seasons: true,
      player_teams: {
        include: { people: true },
      },
    },
  });

  if (!ts) return { awards: [], letters: [] };

  const targetTsIds =
    programTeamSeasonIds && programTeamSeasonIds.length > 0 ? programTeamSeasonIds : [safeTsId];

  const allRosters = await prisma.player_teams.findMany({
    where: { team_season_id: { in: targetTsIds } },
  });
  const playerIds = Array.from(new Set(allRosters.map((pt) => pt.person_id)));

  const awards = await prisma.awards.findMany({
    where: {
      OR: [
        { team_season_id: { in: targetTsIds } },
        ...(playerIds.length > 0 ? [{ season_id: ts.season_id, person_id: { in: playerIds } }] : []),
      ],
    },
    include: {
      people: true,
      seasons: true,
    },
    orderBy: [{ id: "desc" }],
  });

  let rawLetters: any[] = [];
  if (playerIds.length > 0) {
    const tsPlaceholders = targetTsIds.map(() => "?").join(",");
    const pPlaceholders = playerIds.map(() => "?").join(",");
    rawLetters = await prisma.$queryRawUnsafe<any[]>(
      `SELECT l.*, p.first_name, p.last_name
       FROM \`player_season_letters\` l
       JOIN \`people\` p ON p.id = l.player_id
       WHERE l.team_season_id IN (${tsPlaceholders})
          OR (l.season_id = ? AND l.player_id IN (${pPlaceholders}))
       ORDER BY p.last_name ASC, p.first_name ASC`,
      ...targetTsIds,
      ts.season_id,
      ...playerIds
    );
  }

  const letters = rawLetters.map((l) => ({
    id: Number(l.id),
    player_id: Number(l.player_id),
    season_id: Number(l.season_id),
    team_season_id: l.team_season_id ? Number(l.team_season_id) : null,
    varsity_letter: Boolean(l.varsity_letter),
    number_patch: l.number_patch !== null && l.number_patch !== undefined ? Number(l.number_patch) : null,
    certificate: Boolean(l.certificate),
    bar: Boolean(l.bar),
    ball: Boolean(l.ball),
    number_patch_needed: Boolean(l.number_patch_needed),
    varsity_patch_needed: Boolean(l.varsity_patch_needed),
    notes: l.notes || null,
    people: {
      first_name: l.first_name,
      last_name: l.last_name,
    },
  }));
=======
export async function getTeamSeasonAwardsAndLetters(teamSeasonId: number, programTeamSeasonIds?: number[]) {
  const targetIds = programTeamSeasonIds && programTeamSeasonIds.length > 0 ? programTeamSeasonIds : [teamSeasonId];

  const ts = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    select: { season_id: true },
  });

  const [awards, letters] = await Promise.all([
    prisma.awards.findMany({
      where: {
        OR: [
          { team_season_id: { in: targetIds } },
          ...(ts?.season_id ? [{ season_id: ts.season_id, team_season_id: null }] : []),
        ],
      },
      include: {
        people: true,
        seasons: true,
        team_seasons: {
          include: { teams: { include: { clubs: true } } },
        },
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    prisma.player_season_letters.findMany({
      where: {
        OR: [
          { team_season_id: { in: targetIds } },
          ...(ts?.season_id ? [{ season_id: ts.season_id }] : []),
        ],
      },
      include: {
        people: true,
        seasons: true,
        team_seasons: {
          include: { teams: { include: { clubs: true } } },
        },
      },
      orderBy: [{ people: { last_name: "asc" } }, { people: { first_name: "asc" } }],
    }),
  ]);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56

  return { awards, letters };
}

export async function upsertAwardAction(data: {
  id?: number;
  personId?: number | null;
  teamSeasonId?: number | null;
  seasonId?: number | null;
  title: string;
<<<<<<< HEAD
  category: award_category;
  scope?: award_scope;
  organization?: string | null;
  year?: number | null;
  notes?: string | null;
}) {
  try {
    const safePersonId = data.personId ? Number(data.personId) : null;
    const safeTsId = data.teamSeasonId ? Number(data.teamSeasonId) : null;
    const safeSeasonId = data.seasonId ? Number(data.seasonId) : null;

    if (!data.title.trim()) {
      return { success: false, error: "Award title is required" };
    }

    const payload = {
      person_id: safePersonId,
      team_season_id: safeTsId,
      season_id: safeSeasonId,
      title: data.title.trim(),
      category: data.category || "team",
      scope: data.scope || (safePersonId ? "individual_player" : "team_achievement"),
      organization: data.organization?.trim() || null,
      year: data.year ? Number(data.year) : null,
      notes: data.notes?.trim() || null,
    };

    const award = data.id
      ? await prisma.awards.update({
          where: { id: Number(data.id) },
          data: payload,
          include: { people: true, seasons: true },
        })
      : await prisma.awards.create({
          data: payload,
          include: { people: true, seasons: true },
        });

    if (safeTsId) revalidatePath(`/teams/${safeTsId}`);
    if (safePersonId) revalidatePath(`/players/${safePersonId}`);
    return { success: true, award };
  } catch (err: any) {
=======
  category?: "team" | "district" | "region" | "state" | "national" | "academic" | "coaching" | "other";
  scope?: "individual_player" | "individual_coach" | "team_achievement";
  organization?: string | null;
  year?: number | null;
  notes?: string | null;
  badgeIcon?: string | null;
}) {
  try {
    let record;
    const payload = {
      person_id: data.personId || null,
      team_season_id: data.teamSeasonId || null,
      season_id: data.seasonId || null,
      title: data.title.trim(),
      category: data.category || "team",
      scope: data.scope || "individual_player",
      organization: data.organization?.trim() || null,
      year: data.year || null,
      notes: data.notes?.trim() || null,
      badge_icon: data.badgeIcon || null,
    };

    if (data.id) {
      record = await prisma.awards.update({
        where: { id: data.id },
        data: payload,
        include: { people: true, seasons: true },
      });
    } else {
      record = await prisma.awards.create({
        data: payload,
        include: { people: true, seasons: true },
      });
    }

    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    if (data.personId) revalidatePath(`/players/${data.personId}`);
    return { success: true, award: record };
  } catch (err: any) {
    console.error("Failed to save award:", err);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
    return { success: false, error: err.message || "Failed to save award" };
  }
}

<<<<<<< HEAD
export async function deleteAwardAction(awardId: number, teamSeasonId?: number | null) {
  try {
    const safeId = Number(awardId) || 0;
    if (!safeId) return { success: false, error: "Invalid award ID" };

    await prisma.awards.delete({ where: { id: safeId } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true };
  } catch (err: any) {
=======
export async function deleteAwardAction(id: number, teamSeasonId?: number, personId?: number) {
  try {
    await prisma.awards.delete({ where: { id } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    if (personId) revalidatePath(`/players/${personId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete award:", err);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
    return { success: false, error: err.message || "Failed to delete award" };
  }
}

<<<<<<< HEAD
export async function upsertPlayerSeasonLetterAction(data: {
=======
/**
 * High School Varsity Letterman Auto-Calculation Helper
 * Mirrors legacy Form_PlayerLetterWinners.vba logic:
 * - Every rostered player receives a Certificate (`certificate = true`).
 * - First-year participants or freshmen receive a Graduation Year Number Patch (`number_patch_needed = true`, `number_patch = graduationYear`).
 * - Varsity squad players earn a Varsity Letter (`varsity_letter = true`):
 *   - 1st year earning a Varsity Letter: receives Varsity Jacket Patch + Sport Ball (`varsity_patch_needed = true`, `ball = true`, `bar = false`).
 *   - 2nd+ year earning a Varsity Letter: receives a Chevron Bar (`varsity_patch_needed = false`, `ball = false`, `bar = true`).
 */
export async function upsertPlayerSeasonLetterAction(data: {
  id?: number;
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
  playerId: number;
  seasonId: number;
  teamSeasonId?: number | null;
  varsityLetter: boolean;
  numberPatch?: number | null;
  certificate: boolean;
  bar: boolean;
  ball: boolean;
  numberPatchNeeded: boolean;
  varsityPatchNeeded: boolean;
  notes?: string | null;
}) {
  try {
<<<<<<< HEAD
    const safePlayerId = Number(data.playerId) || 0;
    const safeSeasonId = Number(data.seasonId) || 0;
    if (!safePlayerId || !safeSeasonId) {
      return { success: false, error: "Player and Season are required." };
    }

    await ensureLegacyExtrasMigrated();

    await prisma.$executeRawUnsafe(
      `INSERT INTO \`player_season_letters\` (
        \`player_id\`, \`season_id\`, \`team_season_id\`,
        \`varsity_letter\`, \`number_patch\`, \`certificate\`,
        \`bar\`, \`ball\`, \`number_patch_needed\`, \`varsity_patch_needed\`, \`notes\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        \`team_season_id\` = VALUES(\`team_season_id\`),
        \`varsity_letter\` = VALUES(\`varsity_letter\`),
        \`number_patch\` = VALUES(\`number_patch\`),
        \`certificate\` = VALUES(\`certificate\`),
        \`bar\` = VALUES(\`bar\`),
        \`ball\` = VALUES(\`ball\`),
        \`number_patch_needed\` = VALUES(\`number_patch_needed\`),
        \`varsity_patch_needed\` = VALUES(\`varsity_patch_needed\`),
        \`notes\` = VALUES(\`notes\`)`,
      safePlayerId,
      safeSeasonId,
      data.teamSeasonId ? Number(data.teamSeasonId) : null,
      data.varsityLetter ? 1 : 0,
      data.numberPatch ? Number(data.numberPatch) : null,
      data.certificate ? 1 : 0,
      data.bar ? 1 : 0,
      data.ball ? 1 : 0,
      data.numberPatchNeeded ? 1 : 0,
      data.varsityPatchNeeded ? 1 : 0,
      data.notes?.trim() || null
    );

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT l.*, p.first_name, p.last_name
       FROM \`player_season_letters\` l
       JOIN \`people\` p ON p.id = l.player_id
       WHERE l.player_id = ? AND l.season_id = ?`,
      safePlayerId,
      safeSeasonId
    );
    const l = rows[0];
    const letter = l
      ? {
          id: Number(l.id),
          player_id: Number(l.player_id),
          season_id: Number(l.season_id),
          team_season_id: l.team_season_id ? Number(l.team_season_id) : null,
          varsity_letter: Boolean(l.varsity_letter),
          number_patch: l.number_patch !== null ? Number(l.number_patch) : null,
          certificate: Boolean(l.certificate),
          bar: Boolean(l.bar),
          ball: Boolean(l.ball),
          number_patch_needed: Boolean(l.number_patch_needed),
          varsity_patch_needed: Boolean(l.varsity_patch_needed),
          notes: l.notes || null,
          people: { first_name: l.first_name, last_name: l.last_name },
        }
      : null;

    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    revalidatePath(`/players/${safePlayerId}`);
    return { success: true, letter };
  } catch (err: any) {
=======
    const payload = {
      player_id: data.playerId,
      season_id: data.seasonId,
      team_season_id: data.teamSeasonId || null,
      varsity_letter: data.varsityLetter,
      number_patch: data.numberPatch || null,
      certificate: data.certificate,
      bar: data.bar,
      ball: data.ball,
      number_patch_needed: data.numberPatchNeeded,
      varsity_patch_needed: data.varsityPatchNeeded,
      notes: data.notes?.trim() || null,
    };

    const record = await prisma.player_season_letters.upsert({
      where: {
        player_id_season_id: {
          player_id: data.playerId,
          season_id: data.seasonId,
        },
      },
      update: payload,
      create: payload,
      include: {
        people: true,
        seasons: true,
      },
    });

    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    revalidatePath(`/players/${data.playerId}`);
    return { success: true, letter: record };
  } catch (err: any) {
    console.error("Failed to upsert player season letter:", err);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
    return { success: false, error: err.message || "Failed to save letterman record" };
  }
}

<<<<<<< HEAD
export async function autoCalculateTeamSeasonLettersAction(
  teamSeasonId: number,
  programTeamSeasonIds?: number[]
) {
  try {
    const safeTsId = Number(teamSeasonId) || 0;
    if (!safeTsId) return { success: false, error: "Invalid Team Season ID" };

    await ensureLegacyExtrasMigrated();

    const ts = await prisma.team_seasons.findUnique({
      where: { id: safeTsId },
      include: {
        seasons: true,
        teams: true,
      },
    });

    if (!ts) return { success: false, error: "Team Season not found" };

    const targetTsIds =
      programTeamSeasonIds && programTeamSeasonIds.length > 0 ? programTeamSeasonIds : [safeTsId];

    const rosters = await prisma.player_teams.findMany({
      where: { team_season_id: { in: targetTsIds } },
      include: {
        people: true,
        team_seasons: { include: { teams: true, seasons: true } },
      },
    });

    const seasonYearMatch = ts.seasons.season_name.match(/(\d{4})/g);
    const graduationBaseYear = seasonYearMatch
      ? Number(seasonYearMatch[seasonYearMatch.length - 1])
      : new Date(ts.seasons.end_date).getUTCFullYear();

    const playerIds = Array.from(new Set(rosters.map((pt) => pt.person_id)));
    const allPlayerSeasons = await prisma.player_teams.findMany({
      where: { person_id: { in: playerIds } },
      include: {
        team_seasons: { include: { seasons: true, teams: true } },
      },
    });

    let existingLetters: any[] = [];
    if (playerIds.length > 0) {
      const placeholders = playerIds.map(() => "?").join(",");
      existingLetters = await prisma.$queryRawUnsafe<any[]>(
        `SELECT l.*, s.start_date
         FROM \`player_season_letters\` l
         JOIN \`seasons\` s ON s.id = l.season_id
         WHERE l.player_id IN (${placeholders})`,
        ...playerIds
      );
    }

    const byPerson = new Map<number, typeof rosters>();
    for (const r of rosters) {
      const list = byPerson.get(r.person_id) || [];
      list.push(r);
      byPerson.set(r.person_id, list);
    }

    let count = 0;
    for (const [pid, pts] of byPerson.entries()) {
      const primaryPt =
        pts.find(
          (p) =>
            p.team_seasons.teams.name.includes("Varsity") &&
            !p.team_seasons.teams.name.includes("Junior")
        ) || pts[0];

      const isVarsity = pts.some(
        (p) =>
          (p.team_seasons.teams.name.includes("Varsity") &&
            !p.team_seasons.teams.name.includes("Junior")) ||
          (p.status &&
            p.status.toLowerCase().includes("varsity") &&
            !p.status.toLowerCase().includes("jv"))
      );

      const priorRosters = allPlayerSeasons.filter(
        (r) =>
          r.person_id === pid &&
          r.team_seasons.season_id !== ts.season_id &&
          new Date(r.team_seasons.seasons.start_date) < new Date(ts.seasons.start_date)
      );

      const priorVarsityLetters = existingLetters.filter(
        (l) =>
          Number(l.player_id) === pid &&
          Number(l.season_id) !== ts.season_id &&
          Boolean(l.varsity_letter) &&
          new Date(l.start_date) < new Date(ts.seasons.start_date)
      );

      const isFirstYearInProgram = priorRosters.length === 0;
      const priorVarsityCount = priorVarsityLetters.length;

      let gradYear: number | null = null;
      const gradeStr = (primaryPt.grade || "").toLowerCase().trim();
      if (gradeStr === "9" || gradeStr === "fr" || gradeStr === "freshman") {
        gradYear = graduationBaseYear + 3;
      } else if (gradeStr === "10" || gradeStr === "so" || gradeStr === "sophomore") {
        gradYear = graduationBaseYear + 2;
      } else if (gradeStr === "11" || gradeStr === "jr" || gradeStr === "junior") {
        gradYear = graduationBaseYear + 1;
      } else if (gradeStr === "12" || gradeStr === "sr" || gradeStr === "senior") {
        gradYear = graduationBaseYear;
      } else if (isFirstYearInProgram) {
        gradYear = graduationBaseYear + 3;
      }

      const isFirstVarsityLetter = isVarsity && priorVarsityCount === 0;

      await prisma.$executeRawUnsafe(
        `INSERT INTO \`player_season_letters\` (
          \`player_id\`, \`season_id\`, \`team_season_id\`,
          \`certificate\`, \`varsity_letter\`, \`number_patch\`,
          \`number_patch_needed\`, \`varsity_patch_needed\`, \`ball\`, \`bar\`
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`team_season_id\` = VALUES(\`team_season_id\`),
          \`certificate\` = 1,
          \`varsity_letter\` = VALUES(\`varsity_letter\`),
          \`number_patch\` = VALUES(\`number_patch\`),
          \`number_patch_needed\` = VALUES(\`number_patch_needed\`),
          \`varsity_patch_needed\` = VALUES(\`varsity_patch_needed\`),
          \`ball\` = VALUES(\`ball\`),
          \`bar\` = VALUES(\`bar\`)`,
        pid,
        ts.season_id,
        primaryPt.team_season_id,
        isVarsity ? 1 : 0,
        isFirstYearInProgram && gradYear ? gradYear : null,
        isFirstYearInProgram ? 1 : 0,
        isFirstVarsityLetter ? 1 : 0,
        isFirstVarsityLetter ? 1 : 0,
        isVarsity ? 1 : 0
      );
      count++;
    }

    const refreshed = await getTeamSeasonAwardsAndLetters(safeTsId, targetTsIds);
    revalidatePath(`/teams/${safeTsId}`);
    return { success: true, count, letters: refreshed.letters };
  } catch (err: any) {
=======
export async function autoCalculateTeamSeasonLettersAction(teamSeasonId: number, programTeamSeasonIds?: number[]) {
  try {
    const targetIds = programTeamSeasonIds && programTeamSeasonIds.length > 0 ? programTeamSeasonIds : [teamSeasonId];
    const ts = await prisma.team_seasons.findUnique({
      where: { id: teamSeasonId },
      include: { seasons: true },
    });
    if (!ts) return { success: false, error: "Team season not found" };

    const roster = await prisma.player_teams.findMany({
      where: {
        team_season_id: { in: targetIds },
        status: "rostered",
      },
      include: {
        people: true,
        team_seasons: { include: { teams: true } },
      },
    });

    // Get all prior varsity letters for these players
    const playerIds = Array.from(new Set(roster.map((r) => r.player_id)));
    const existingLetters = await prisma.player_season_letters.findMany({
      where: {
        player_id: { in: playerIds },
        season_id: { not: ts.season_id },
      },
    });

    const seasonYearMatch = ts.seasons.season_name.match(/(\d{4})/);
    const currentStartYear = seasonYearMatch ? parseInt(seasonYearMatch[1], 10) : new Date().getFullYear();

    // Group roster by player_id
    const playerRosterMap = new Map<number, typeof roster>();
    for (const r of roster) {
      if (!playerRosterMap.has(r.player_id)) playerRosterMap.set(r.player_id, []);
      playerRosterMap.get(r.player_id)!.push(r);
    }

    const results = [];
    for (const [playerId, entries] of playerRosterMap.entries()) {
      const primary = entries[0];
      const isVarsity = entries.some((e) =>
        (e.team_seasons?.teams?.team_name || "").toLowerCase().includes("varsity") &&
        !(e.team_seasons?.teams?.team_name || "").toLowerCase().includes("jv") &&
        !(e.team_seasons?.teams?.team_name || "").toLowerCase().includes("junior")
      );

      const priorLetters = existingLetters.filter((l) => l.player_id === playerId);
      const priorVarsityCount = priorLetters.filter((l) => l.varsity_letter).length;
      const participatedBefore = priorLetters.length > 0 || primary.played_last_season === true;

      // Calculate graduation year from entry_year or grade
      let gradYear: number | null = null;
      if (primary.people.entry_year) {
        gradYear = Number(primary.people.entry_year) + 4;
      } else if (primary.grade) {
        const gNum = parseInt(primary.grade, 10);
        if (!isNaN(gNum) && gNum >= 9 && gNum <= 12) {
          gradYear = currentStartYear + (12 - gNum) + 1;
        }
      }

      const numberPatchNeeded = !participatedBefore;
      const varsityLetter = isVarsity;
      const varsityPatchNeeded = isVarsity && priorVarsityCount === 0;
      const ball = isVarsity && priorVarsityCount === 0;
      const bar = isVarsity && priorVarsityCount >= 1;

      const upserted = await prisma.player_season_letters.upsert({
        where: {
          player_id_season_id: {
            player_id: playerId,
            season_id: ts.season_id,
          },
        },
        update: {
          team_season_id: primary.team_season_id,
          varsity_letter: varsityLetter,
          number_patch: numberPatchNeeded ? gradYear : undefined,
          certificate: true,
          bar,
          ball,
          number_patch_needed: numberPatchNeeded,
          varsity_patch_needed: varsityPatchNeeded,
        },
        create: {
          player_id: playerId,
          season_id: ts.season_id,
          team_season_id: primary.team_season_id,
          varsity_letter: varsityLetter,
          number_patch: gradYear,
          certificate: true,
          bar,
          ball,
          number_patch_needed: numberPatchNeeded,
          varsity_patch_needed: varsityPatchNeeded,
        },
        include: { people: true, seasons: true },
      });
      results.push(upserted);
    }

    revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true, count: results.length, letters: results };
  } catch (err: any) {
    console.error("Failed to auto-calculate letters:", err);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
    return { success: false, error: err.message || "Failed to auto-calculate letters" };
  }
}

<<<<<<< HEAD
export async function deletePlayerSeasonLetterAction(id: number, teamSeasonId?: number | null) {
  const safeId = Number(id) || 0;
  if (!safeId) return { success: false };

  await ensureLegacyExtrasMigrated();
  await prisma.$executeRawUnsafe(`DELETE FROM \`player_season_letters\` WHERE id = ?`, safeId);
  if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
  return { success: true };
=======
export async function deletePlayerSeasonLetterAction(id: number, teamSeasonId?: number) {
  try {
    await prisma.player_season_letters.delete({ where: { id } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete letter record" };
  }
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
}
