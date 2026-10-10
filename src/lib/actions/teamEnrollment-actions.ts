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

export async function getTerminalCompetitionNodes() {
  const allNodes = await prisma.league_nodes.findMany({
    include: {
      leagues: true,
      other_league_nodes: true,
      league_nodes: true,
    },
    orderBy: { display_order: "asc" },
  });

  const leafNodes = allNodes.filter((n) => n.other_league_nodes.length === 0);
  const nodeMap = new Map<number, typeof allNodes[0]>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));

  function buildBreadcrumbs(nodeId: number): string {
    const parts: string[] = [];
    let curr = nodeMap.get(nodeId);
    while (curr) {
      parts.unshift(curr.name);
      if (curr.parent_id) {
        curr = nodeMap.get(curr.parent_id);
      } else {
        if (curr.leagues) {
          parts.unshift(curr.leagues.name);
        }
        break;
      }
    }
    const uniqueParts: string[] = [];
    for (const p of parts) {
      if (uniqueParts.length === 0 || uniqueParts[uniqueParts.length - 1] !== p) {
        uniqueParts.push(p);
      }
    }
    return uniqueParts.join(" > ");
  }

  return leafNodes
    .map((n) => ({
      id: n.id,
      leagueId: n.league_id,
      name: n.name,
      breadcrumbs: buildBreadcrumbs(n.id),
      isTournament: n.leagues?.is_tournament ?? (n.node_type === "tournament"),
    }))
    .sort((a, b) => a.breadcrumbs.localeCompare(b.breadcrumbs));
}

export async function enrollTeamInCompetitionNode(data: {
  teamSeasonId: number;
  leagueNodeId: number;
  seasonId: number;
}) {
  const teamSeasonId = Number(data.teamSeasonId);
  const leagueNodeId = Number(data.leagueNodeId);
  const seasonId = Number(data.seasonId);

  if (!teamSeasonId || !leagueNodeId || !seasonId) {
    throw new Error("Missing required enrollment parameters");
  }

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

  const existing = await prisma.team_league_enrollments.findFirst({
    where: {
      team_season_id: teamSeasonId,
      league_node_season_id: nodeSeason.id,
    },
  });

  if (existing) {
    throw new Error("This team is already enrolled in this competition.");
  }

  const enrollment = await prisma.team_league_enrollments.create({
    data: {
      team_season_id: teamSeasonId,
      league_node_season_id: nodeSeason.id,
      is_active: true,
    },
  });

  revalidatePath(`/teams/${teamSeasonId}`);
  revalidatePath("/admin/leagues");
  revalidatePath("/leagues");

  return { success: true, enrollment };
}

export async function createAndEnrollCompetition(data: {
  teamSeasonId: number;
  seasonId: number;
  name: string;
  abbreviation?: string;
  isTournament?: boolean;
}) {
  const teamSeasonId = Number(data.teamSeasonId);
  const seasonId = Number(data.seasonId);

  if (!teamSeasonId || !seasonId || !data.name || !data.name.trim()) {
    throw new Error("Missing required competition parameters.");
  }

  const league = await prisma.leagues.create({
    data: {
      name: data.name.trim(),
      abbreviation: data.abbreviation?.trim() || null,
      is_tournament: Boolean(data.isTournament),
      status: "active",
      is_active: true,
    },
  });

  const node = await prisma.league_nodes.create({
    data: {
      league_id: league.id,
      name: `${league.name} (${data.isTournament ? "Tournament" : "Division"})`,
      node_type: data.isTournament ? "tournament" : "division",
      level: 0,
      display_order: 0,
    },
  });

  const nodeSeason = await prisma.league_node_seasons.create({
    data: {
      league_node_id: node.id,
      season_id: seasonId,
      status: "active",
      is_active: true,
    },
  });

  const enrollment = await prisma.team_league_enrollments.create({
    data: {
      team_season_id: teamSeasonId,
      league_node_season_id: nodeSeason.id,
      is_active: true,
    },
  });

  revalidatePath(`/teams/${teamSeasonId}`);
  revalidatePath("/leagues");
  revalidatePath("/admin/leagues");

  return { success: true, league, node, enrollment };
}
