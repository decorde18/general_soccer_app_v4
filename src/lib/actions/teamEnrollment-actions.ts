"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { teamEnrollmentSchema } from "@/lib/validations/schemas";

export async function createTeamEnrollment(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsed = teamEnrollmentSchema.parse(data);

  // 1. Find or create the unique league_node_seasons entry for the (leagueNodeId, seasonId)
  let nodeSeason = await prisma.league_node_seasons.findFirst({
    where: {
      league_node_id: parsed.leagueNodeId,
      season_id: parsed.seasonId,
    },
  });

  if (!nodeSeason) {
    nodeSeason = await prisma.league_node_seasons.create({
      data: {
        league_node_id: parsed.leagueNodeId,
        season_id: parsed.seasonId,
        is_active: true,
        status: "active",
      },
    });
  }

  // 2. Check if this team is already enrolled in this league node season
  const existing = await prisma.team_league_enrollments.findFirst({
    where: {
      team_season_id: parsed.teamSeasonId,
      league_node_season_id: nodeSeason.id,
    },
  });

  if (existing) {
    throw new Error("This team is already enrolled in this league node for this season.");
  }

  // 3. Create enrollment
  const enrollment = await prisma.team_league_enrollments.create({
    data: {
      team_season_id: parsed.teamSeasonId,
      league_node_season_id: nodeSeason.id,
      is_active: parsed.isActive !== undefined ? parsed.isActive : true,
    },
  });

  revalidatePath("/admin/leagues");
  return enrollment;
}

export async function updateTeamEnrollment(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Validate server-side with Zod (partial for updates)
  const parsed = teamEnrollmentSchema.partial().parse(data);

  let targetLeagueNodeSeasonId: number | undefined = undefined;

  // If node or season is changing, we must resolve the corresponding league_node_seasons row
  if (parsed.leagueNodeId || parsed.seasonId) {
    // Get current enrollment to backfill missing fields
    const current = await prisma.team_league_enrollments.findUnique({
      where: { id: numId },
      include: { league_node_seasons: true },
    });
    if (!current) throw new Error("Enrollment not found");

    const leagueNodeId = parsed.leagueNodeId ?? current.league_node_seasons.league_node_id;
    const seasonId = parsed.seasonId ?? current.league_node_seasons.season_id;

    let nodeSeason = await prisma.league_node_seasons.findFirst({
      where: {
        league_node_id: leagueNodeId,
        season_id: seasonId,
      },
    });

    if (!nodeSeason) {
      nodeSeason = await prisma.league_node_seasons.create({
        data: {
          league_node_id: leagueNodeId,
          season_id: seasonId,
          is_active: true,
          status: "active",
        },
      });
    }

    targetLeagueNodeSeasonId = nodeSeason.id;
  }

  await prisma.team_league_enrollments.update({
    where: { id: numId },
    data: {
      team_season_id: parsed.teamSeasonId,
      league_node_season_id: targetLeagueNodeSeasonId,
      is_active: parsed.isActive,
    },
  });

  revalidatePath("/admin/leagues");
}

export async function deleteTeamEnrollment(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.team_league_enrollments.delete({
    where: { id: numId },
  });

  revalidatePath("/admin/leagues");
}
