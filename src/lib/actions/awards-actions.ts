"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
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

  return { awards, letters };
}

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

  return { awards, letters };
}

export async function upsertAwardAction(data: {
  id?: number;
  personId?: number | null;
  teamSeasonId?: number | null;
  seasonId?: number | null;
  title: string;
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
    return { success: false, error: err.message || "Failed to save award" };
  }
}

export async function deleteAwardAction(awardId: number, teamSeasonId?: number | null) {
  try {
    const safeId = Number(awardId) || 0;
    if (!safeId) return { success: false, error: "Invalid award ID" };

    await prisma.awards.delete({ where: { id: safeId } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete award" };
  }
}

export async function upsertPlayerSeasonLetterAction(data: {
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
    return { success: false, error: err.message || "Failed to save letterman record" };
  }
}

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
    return { success: false, error: err.message || "Failed to auto-calculate letters" };
  }
}

export async function deletePlayerSeasonLetterAction(id: number, teamSeasonId?: number | null) {
  const safeId = Number(id) || 0;
  if (!safeId) return { success: false };

  await ensureLegacyExtrasMigrated();
  await prisma.$executeRawUnsafe(`DELETE FROM \`player_season_letters\` WHERE id = ?`, safeId);
  if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
  return { success: true };
}
