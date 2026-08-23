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
      game_league_nodes: {
        include: {
          league_node_seasons: true,
        },
      },
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
      const realNodeId = node.league_node_seasons?.league_node_id || node.league_node_id;
      
      // Verify league_node exists in league_nodes table before upserting
      const validNode = await prisma.league_nodes.findUnique({
        where: { id: realNodeId },
        select: { id: true },
      });

      if (validNode) {
        await prisma.game_standings_inclusions.upsert({
          where: {
            game_id_league_node_id: {
              game_id: gameId,
              league_node_id: validNode.id,
            },
          },
          create: {
            game_id: gameId,
            league_node_id: validNode.id,
            counts_for_standings: countsForStandings,
          },
          update: {
            counts_for_standings: countsForStandings,
          },
        });
      }
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

export interface RosterPlayerOption {
  playerSeasonId: number;
  personId: number;
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  teamSeasonId: number;
}

export interface GameRostersResult {
  homeTeamSeasonId: number;
  awayTeamSeasonId: number;
  homePlayers: RosterPlayerOption[];
  awayPlayers: RosterPlayerOption[];
}

/**
 * Fetch player rosters for home and away teams in a game to populate Quick Score dropdowns
 */
export async function getGameRostersForQuickScore(gameId: number): Promise<GameRostersResult> {
  const game = await prisma.games.findUnique({
    where: { id: gameId },
    select: {
      home_team_season_id: true,
      away_team_season_id: true,
    },
  });

  if (!game) throw new Error("Game not found");

  const [homePlayers, awayPlayers] = await Promise.all([
    prisma.player_teams.findMany({
      where: { team_season_id: game.home_team_season_id, is_active: true },
      include: { people: true },
      orderBy: [{ jersey_number: "asc" }, { people: { last_name: "asc" } }],
    }),
    prisma.player_teams.findMany({
      where: { team_season_id: game.away_team_season_id, is_active: true },
      include: { people: true },
      orderBy: [{ jersey_number: "asc" }, { people: { last_name: "asc" } }],
    }),
  ]);

  const mapRoster = (list: typeof homePlayers, teamSeasonId: number): RosterPlayerOption[] =>
    list.map((pt) => ({
      playerSeasonId: pt.id,
      personId: pt.player_id,
      name: `${pt.jersey_number ? `#${pt.jersey_number} ` : ""}${pt.people.first_name} ${pt.people.last_name}`,
      jerseyNumber: pt.jersey_number ?? null,
      position: pt.position ?? null,
      teamSeasonId,
    }));

  return {
    homeTeamSeasonId: game.home_team_season_id,
    awayTeamSeasonId: game.away_team_season_id,
    homePlayers: mapRoster(homePlayers, game.home_team_season_id),
    awayPlayers: mapRoster(awayPlayers, game.away_team_season_id),
  };
}

export interface DetailedGoalEntry {
  teamSeasonId: number;
  scorerPersonId?: number | null;
  assistPersonId?: number | null;
  gaPersonId?: number | null;
  minute?: number | null;
  isPk?: boolean;
  isOwnGoal?: boolean;
  comment?: string | null;
}

export interface DetailedCardEntry {
  teamSeasonId: number;
  personId?: number | null;
  cardType: "yellow" | "red";
  minute?: number | null;
  comment?: string | null;
}

export interface TeamStatTotalsInput {
  homeShots?: number;
  awayShots?: number;
  homeSaves?: number;
  awaySaves?: number;
  homeCorners?: number;
  awayCorners?: number;
  homeFouls?: number;
  awayFouls?: number;
  homeOffsides?: number;
  awayOffsides?: number;
}

export interface DetailedMatchScoreInput {
  gameId: number;
  homeScore: number;
  awayScore: number;
  countsForStandings?: boolean;
  goals?: DetailedGoalEntry[];
  cards?: DetailedCardEntry[];
  teamTotals?: TeamStatTotalsInput;
}

async function getOrCreatePlayerGame(gameId: number, personId: number, teamSeasonId: number) {
  let pg = await prisma.player_games.findFirst({
    where: { game_id: gameId, player_id: personId },
  });
  if (!pg) {
    pg = await prisma.player_games.create({
      data: {
        game_id: gameId,
        player_id: personId,
        team_season_id: teamSeasonId,
        game_status: "dressed",
      },
    });
  }
  return pg.id;
}

/**
 * Record a detailed post-game match score with goal scorers, assists, comments, cards, and team totals
 */
export async function recordDetailedMatchScore({
  gameId,
  homeScore,
  awayScore,
  countsForStandings = true,
  goals = [],
  cards = [],
  teamTotals,
}: DetailedMatchScoreInput) {
  await requireSession();
  await verifyScoreReportingAccess();

  const game = await prisma.games.findUnique({
    where: { id: gameId },
    include: {
      game_league_nodes: {
        include: {
          league_node_seasons: true,
        },
      },
    },
  });

  if (!game) throw new Error("Game not found");

  // 1. Delete previous major events for this game if re-saving
  const existingMajors = await prisma.game_events_major.findMany({
    where: { game_id: gameId },
    select: { id: true },
  });

  if (existingMajors.length > 0) {
    await prisma.game_events_major.deleteMany({
      where: { id: { in: existingMajors.map((m) => m.id) } },
    });
  }

  // Delete previous team stat totals
  await prisma.game_events_team.deleteMany({
    where: { game_id: gameId },
  });

  // 2. Process Detailed Goals
  let homeGoalCount = 0;
  let awayGoalCount = 0;

  for (const g of goals) {
    let scorerPgId: number | null = null;
    let assistPgId: number | null = null;
    let gaPgId: number | null = null;

    if (g.scorerPersonId) {
      scorerPgId = await getOrCreatePlayerGame(gameId, g.scorerPersonId, g.teamSeasonId);
    }
    if (g.assistPersonId) {
      assistPgId = await getOrCreatePlayerGame(gameId, g.assistPersonId, g.teamSeasonId);
    }
    if (g.gaPersonId) {
      const oppTeamSeasonId = g.teamSeasonId === game.home_team_season_id ? game.away_team_season_id : game.home_team_season_id;
      gaPgId = await getOrCreatePlayerGame(gameId, g.gaPersonId, oppTeamSeasonId);
    }

    const major = await prisma.game_events_major.create({
      data: {
        game_id: gameId,
        event_type: "goal",
        game_time: (g.minute || 1) * 60,
        period: (g.minute || 1) > 40 ? 2 : 1,
        clock_should_run: true,
        details: g.comment || (g.isPk ? "Penalty Kick Goal" : "Goal"),
      },
    });

    await prisma.game_events_goals.create({
      data: {
        major_event_id: major.id,
        team_season_id: g.teamSeasonId,
        scorer_player_game_id: scorerPgId,
        assist_player_game_id: assistPgId,
        defending_gk_player_game_id: gaPgId,
        is_own_goal: g.isOwnGoal ?? false,
        goal_types: g.isPk ? "penalty_kick" : null,
      },
    });

    const isHomeGoal =
      (g.teamSeasonId === game.home_team_season_id && !g.isOwnGoal) ||
      (g.teamSeasonId === game.away_team_season_id && g.isOwnGoal);

    if (isHomeGoal) homeGoalCount++;
    else awayGoalCount++;
  }

  // Generate filler goals if user entered score > detailed goal entries count
  while (homeGoalCount < homeScore) {
    const major = await prisma.game_events_major.create({
      data: {
        game_id: gameId,
        event_type: "goal",
        game_time: 0,
        period: 1,
        clock_should_run: true,
        details: "Match Score Entry",
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
    homeGoalCount++;
  }

  while (awayGoalCount < awayScore) {
    const major = await prisma.game_events_major.create({
      data: {
        game_id: gameId,
        event_type: "goal",
        game_time: 0,
        period: 1,
        clock_should_run: true,
        details: "Match Score Entry",
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
    awayGoalCount++;
  }

  // 3. Process Detailed Disciplinary Cards
  for (const c of cards) {
    if (!c.personId) continue;
    const playerPgId = await getOrCreatePlayerGame(gameId, c.personId, c.teamSeasonId);

    const major = await prisma.game_events_major.create({
      data: {
        game_id: gameId,
        event_type: "discipline",
        game_time: (c.minute || 1) * 60,
        period: (c.minute || 1) > 40 ? 2 : 1,
        clock_should_run: true,
        details: c.comment || `${c.cardType === "yellow" ? "Yellow Card" : "Red Card"}`,
      },
    });

    await prisma.game_events_discipline.create({
      data: {
        major_event_id: major.id,
        team_season_id: c.teamSeasonId,
        player_game_id: playerPgId,
        card_type: c.cardType === "yellow" ? "yellow" : "red",
        card_reason: c.comment || null,
      },
    });
  }

  // 4. Process Team Stat Totals
  if (teamTotals) {
    const createTeamEvents = async (teamSeasonId: number, eventType: any, count: number) => {
      for (let i = 0; i < count; i++) {
        await prisma.game_events_team.create({
          data: {
            game_id: gameId,
            team_season_id: teamSeasonId,
            event_type: eventType,
            game_time: 0,
            period: 1,
          },
        });
      }
    };

    if (teamTotals.homeShots) await createTeamEvents(game.home_team_season_id, "shot", teamTotals.homeShots);
    if (teamTotals.awayShots) await createTeamEvents(game.away_team_season_id, "shot", teamTotals.awayShots);
    if (teamTotals.homeSaves) await createTeamEvents(game.home_team_season_id, "save", teamTotals.homeSaves);
    if (teamTotals.awaySaves) await createTeamEvents(game.away_team_season_id, "save", teamTotals.awaySaves);
    if (teamTotals.homeCorners) await createTeamEvents(game.home_team_season_id, "corner_kick", teamTotals.homeCorners);
    if (teamTotals.awayCorners) await createTeamEvents(game.away_team_season_id, "corner_kick", teamTotals.awayCorners);
    if (teamTotals.homeFouls) await createTeamEvents(game.home_team_season_id, "foul", teamTotals.homeFouls);
    if (teamTotals.awayFouls) await createTeamEvents(game.away_team_season_id, "foul", teamTotals.awayFouls);
    if (teamTotals.homeOffsides) await createTeamEvents(game.home_team_season_id, "offside", teamTotals.homeOffsides);
    if (teamTotals.awayOffsides) await createTeamEvents(game.away_team_season_id, "offside", teamTotals.awayOffsides);
  }

  // 5. Update Game Status
  await prisma.games.update({
    where: { id: gameId },
    data: { status: "completed" },
  });

  // 6. Update Standings Inclusions
  if (game.game_league_nodes && game.game_league_nodes.length > 0) {
    for (const node of game.game_league_nodes) {
      const realNodeId = node.league_node_seasons?.league_node_id || node.league_node_id;
      const validNode = await prisma.league_nodes.findUnique({
        where: { id: realNodeId },
        select: { id: true },
      });

      if (validNode) {
        await prisma.game_standings_inclusions.upsert({
          where: {
            game_id_league_node_id: {
              game_id: gameId,
              league_node_id: validNode.id,
            },
          },
          create: {
            game_id: gameId,
            league_node_id: validNode.id,
            counts_for_standings: countsForStandings,
          },
          update: {
            counts_for_standings: countsForStandings,
          },
        });
      }
    }
  }

  // 7. Revalidate
  revalidatePath("/leagues");
  revalidatePath("/dashboard");
  revalidatePath(`/teams/${game.home_team_season_id}`);
  revalidatePath(`/teams/${game.away_team_season_id}`);

  return { success: true };
}
