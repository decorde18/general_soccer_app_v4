"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

  return { awards, letters };
}

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

  return { awards, letters };
}

export async function upsertAwardAction(data: {
  id?: number;
  personId?: number | null;
  teamSeasonId?: number | null;
  seasonId?: number | null;
  title: string;
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
    return { success: false, error: err.message || "Failed to save award" };
  }
}

export async function deleteAwardAction(id: number, teamSeasonId?: number, personId?: number) {
  try {
    await prisma.awards.delete({ where: { id } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    if (personId) revalidatePath(`/players/${personId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete award:", err);
    return { success: false, error: err.message || "Failed to delete award" };
  }
}

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
    return { success: false, error: err.message || "Failed to save letterman record" };
  }
}

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
    return { success: false, error: err.message || "Failed to auto-calculate letters" };
  }
}

export async function deletePlayerSeasonLetterAction(id: number, teamSeasonId?: number) {
  try {
    await prisma.player_season_letters.delete({ where: { id } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete letter record" };
  }
}
