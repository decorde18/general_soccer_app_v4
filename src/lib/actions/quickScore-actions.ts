"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession, verifyScoreReportingAccess } from "@/lib/auth/auth-utils";

export interface QuickScoreInput {
  gameId: number;
  homeScore: number;
  awayScore: number;
  countsForStandings?: boolean;
}

/**
 * Record a quick match score, setting status to completed, creating synthetic goals,
 * and setting game_standings_inclusions flags.
 */
export async function recordQuickScore({
  gameId,
  homeScore,
  awayScore,
  countsForStandings = true,
}: QuickScoreInput) {
  await requireSession();
  await verifyScoreReportingAccess();

  const game = await prisma.games.findUnique({
    where: { id: gameId },
    include: {
      game_league_nodes: true,
    },
  });

  if (!game) throw new Error("Game not found");

  // 1. Delete previous synthetic major goal events if editing quick score
  const existingGoals = await prisma.game_events_major.findMany({
    where: {
      game_id: gameId,
      event_type: "goal",
    },
    select: { id: true },
  });

  if (existingGoals.length > 0) {
    await prisma.game_events_major.deleteMany({
      where: {
        id: { in: existingGoals.map((g) => g.id) },
      },
    });
  }

  // 2. Create home team goal events
  for (let i = 0; i < homeScore; i++) {
    const major = await prisma.game_events_major.create({
      data: {
        game_id: gameId,
        event_type: "goal",
        game_time: 0,
        period: 1,
        clock_should_run: true,
        details: "Quick Score Entry",
      },
    });

    await prisma.game_events_goals.create({
      data: {
        major_event_id: major.id,
        team_season_id: game.home_team_season_id,
        scorer_player_game_id: null,
        is_own_goal: false,
      },
    });
  }

  // 3. Create away team goal events
  for (let i = 0; i < awayScore; i++) {
    const major = await prisma.game_events_major.create({
      data: {
        game_id: gameId,
        event_type: "goal",
        game_time: 0,
        period: 1,
        clock_should_run: true,
        details: "Quick Score Entry",
      },
    });

    await prisma.game_events_goals.create({
      data: {
        major_event_id: major.id,
        team_season_id: game.away_team_season_id,
        scorer_player_game_id: null,
        is_own_goal: false,
      },
    });
  }

  // 4. Update game status to completed
  await prisma.games.update({
    where: { id: gameId },
    data: {
      status: "completed",
    },
  });

  // 5. Update/Upsert game_standings_inclusions for associated league nodes
  if (game.game_league_nodes && game.game_league_nodes.length > 0) {
    for (const node of game.game_league_nodes) {
      await prisma.game_standings_inclusions.upsert({
        where: {
          game_id_league_node_id: {
            game_id: gameId,
            league_node_id: node.league_node_id,
          },
        },
        create: {
          game_id: gameId,
          league_node_id: node.league_node_id,
          counts_for_standings: countsForStandings,
        },
        update: {
          counts_for_standings: countsForStandings,
        },
      });
    }
  }

  // 6. Revalidate pages
  revalidatePath("/leagues");
  revalidatePath("/dashboard");
  revalidatePath(`/teams/${game.home_team_season_id}`);
  revalidatePath(`/teams/${game.away_team_season_id}`);

  return { success: true };
}

/**
 * Toggle game_standings_inclusions count_for_standings flag for a match
 */
export async function toggleStandingsInclusion(
  gameId: number,
  leagueNodeId: number,
  countsForStandings: boolean
) {
  await requireSession();
  await verifyScoreReportingAccess();

  const inclusion = await prisma.game_standings_inclusions.upsert({
    where: {
      game_id_league_node_id: {
        game_id: gameId,
        league_node_id: leagueNodeId,
      },
    },
    create: {
      game_id: gameId,
      league_node_id: leagueNodeId,
      counts_for_standings: countsForStandings,
    },
    update: {
      counts_for_standings: countsForStandings,
    },
  });

  revalidatePath("/leagues");
  return inclusion;
}
