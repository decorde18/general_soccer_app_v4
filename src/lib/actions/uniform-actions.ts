"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUniformDataForTeamSeason(teamSeasonId: number, programTeamSeasonIds?: number[]) {
  const ts = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    include: { teams: true },
  });
  if (!ts) return { kits: [], seasonKits: [], assignments: [] };

  const targetTsIds = programTeamSeasonIds && programTeamSeasonIds.length > 0 ? programTeamSeasonIds : [teamSeasonId];

  const [kits, seasonKits, assignments] = await Promise.all([
    prisma.uniform_kits.findMany({
      where: ts.teams.club_id ? { OR: [{ club_id: ts.teams.club_id }, { club_id: null }] } : {},
      include: {
        uniform_jerseys: {
          orderBy: { jersey_number: "asc" },
        },
      },
      orderBy: [{ is_active: "desc" }, { year: "desc" }, { id: "asc" }],
    }),
    prisma.uniform_season_kits.findMany({
      where: { season_id: ts.season_id },
      include: {
        uniform_kits: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.uniform_player_assignments.findMany({
      where: {
        player_teams: {
          team_season_id: { in: targetTsIds },
        },
      },
      include: {
        player_teams: {
          include: {
            people: true,
            team_seasons: { include: { teams: true } },
          },
        },
        uniform_jerseys: {
          include: {
            uniform_kits: true,
          },
        },
      },
      orderBy: { id: "asc" },
    }),
  ]);

  return { kits, seasonKits, assignments };
}

export async function upsertUniformKitAction(data: {
  id?: number;
  clubId?: number | null;
  type: string;
  brand?: string | null;
  style?: string | null;
  color?: string | null;
  year?: number | null;
  isActive?: boolean;
  teamSeasonId?: number;
}) {
  try {
    const payload = {
      club_id: data.clubId || null,
      type: data.type.trim(),
      brand: data.brand?.trim() || null,
      style: data.style?.trim() || null,
      color: data.color?.trim() || null,
      year: data.year || null,
      is_active: data.isActive ?? true,
    };

    const kit = data.id
      ? await prisma.uniform_kits.update({
          where: { id: data.id },
          data: payload,
          include: { uniform_jerseys: true },
        })
      : await prisma.uniform_kits.create({
          data: payload,
          include: { uniform_jerseys: true },
        });

    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, kit };
  } catch (err: any) {
    console.error("Error saving uniform kit:", err);
    return { success: false, error: err.message || "Failed to save uniform kit" };
  }
}

export async function addUniformJerseysBatchAction(data: {
  uniformKitId: number;
  numbers: number[];
  size: string;
  teamSeasonId?: number;
}) {
  try {
    const created = [];
    for (const num of data.numbers) {
      const j = await prisma.uniform_jerseys.create({
        data: {
          uniform_kit_id: data.uniformKitId,
          jersey_number: num,
          size: data.size || "M",
          is_lost: false,
        },
      });
      created.push(j);
    }
    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, jerseys: created };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add jerseys" };
  }
}

export async function toggleJerseyLostAction(jerseyId: number, isLost: boolean, teamSeasonId?: number) {
  try {
    const updated = await prisma.uniform_jerseys.update({
      where: { id: jerseyId },
      data: { is_lost: isLost },
    });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true, jersey: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update jersey status" };
  }
}

export async function assignKitToSeasonSquadAction(data: {
  seasonId: number;
  teamSeasonId?: number | null;
  squadLevel: string;
  uniformKitId: number;
}) {
  try {
    const record = await prisma.uniform_season_kits.create({
      data: {
        season_id: data.seasonId,
        team_season_id: data.teamSeasonId || null,
        squad_level: data.squadLevel,
        uniform_kit_id: data.uniformKitId,
      },
      include: { uniform_kits: true },
    });
    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, seasonKit: record };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign kit to season" };
  }
}

export async function assignJerseyToPlayerAction(data: {
  playerTeamId: number;
  uniformJerseyId: number;
  assignmentType: string; // 'primary', 'secondary', 'match', 'gk'
  teamSeasonId?: number;
}) {
  try {
    const record = await prisma.uniform_player_assignments.create({
      data: {
        player_team_id: data.playerTeamId,
        uniform_jersey_id: data.uniformJerseyId,
        assignment_type: data.assignmentType || "primary",
        returned: false,
      },
      include: {
        player_teams: { include: { people: true } },
        uniform_jerseys: { include: { uniform_kits: true } },
      },
    });
    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, assignment: record };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign jersey to player" };
  }
}

export async function toggleUniformReturnedAction(assignmentId: number, returned: boolean, teamSeasonId?: number) {
  try {
    const updated = await prisma.uniform_player_assignments.update({
      where: { id: assignmentId },
      data: { returned },
    });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true, assignment: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update return status" };
  }
}

export async function deleteUniformAssignmentAction(assignmentId: number, teamSeasonId?: number) {
  try {
    await prisma.uniform_player_assignments.delete({ where: { id: assignmentId } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete assignment" };
  }
}
