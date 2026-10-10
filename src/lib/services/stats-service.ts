"use server";

import prisma from "@/lib/prisma";

export interface GoalLogFilter {
  seasonId?: number;
  teamSeasonId?: number;
  clubId?: number;
  personId?: number;
  opponentTeamSeasonId?: number;
  leagueNodeSeasonId?: number;
  gameType?: string;
  onlyGameWinners?: boolean;
  goalType?: string; // 'Header', 'Penalty', 'Free Kick', 'Open Play', etc.
  startDate?: string;
  endDate?: string;
}

export interface FlattenedGoal {
  goalId: number;
  majorEventId: number;
  gameId: number;
  startDate: string;
  seasonId: number;
  seasonName: string;
  competitionName: string | null;
  gameType: string;

  // Teams & Location
  scoringTeamSeasonId: number;
  scoringTeamName: string;
  opponentTeamSeasonId: number;
  opponentTeamName: string;
  isHomeTeam: boolean;
  locationName: string | null;

  // Timing
  period: number;
  gameTimeSeconds: number;
  clockDisplay: string;

  // Players
  scorerPersonId: number | null;
  scorerName: string;
  scorerJersey: number | null;
  scorerPhotoUrl: string | null;

  assistPersonId: number | null;
  assisterName: string | null;
  assisterJersey: number | null;

  defendingGkPersonId: number | null;
  defendingGkName: string | null;

  // Goal Attributes
  isOwnGoal: boolean;
  goalTypes: string[]; // ['Header', 'Right Foot', etc.]
  isGameWinner: boolean; // Is it the (OpponentScore + 1)-th goal in a win?
  contextType: string; // "Opening Goal", "Equalizer", "Go-Ahead Goal", "Insurance Goal"

  // Scores
  scoreAtGoal: string; // e.g. "2-1"
  finalGameScore: string; // e.g. "3-1"

  // On Field Players for Plus/Minus (+/-)
  onFieldPlayerIds: number[];
}

export interface FlattenedGameSummary {
  gameId: number;
  startDate: string;
  startTime: string | null;
  seasonId: number;
  seasonName: string;
  competitionName: string | null;
  gameType: string;

  homeTeamSeasonId: number;
  homeTeamName: string;
  awayTeamSeasonId: number;
  awayTeamName: string;

  homeScore: number;
  awayScore: number;
  halftimeHomeScore: number | null;
  halftimeAwayScore: number | null;

  resultHome: "W" | "L" | "D";
  resultAway: "W" | "L" | "D";
  goalDifferential: number;
  isCleanSheetHome: boolean;
  isCleanSheetAway: boolean;

  wentToOvertime: boolean;
  wentToShootout: boolean;
  totalShots: number;
  totalYellowCards: number;
  totalRedCards: number;
}

/**
 * Fetches all flattened goal events matching optional filter dimensions.
 */
export async function getFlattenedGoalLog(
  filters: GoalLogFilter = {}
): Promise<FlattenedGoal[]> {
  const whereMajor: any = { event_type: "goal" };
  const whereGame: any = {};

  if (filters.seasonId) whereGame.season_id = filters.seasonId;
  if (filters.gameType) whereGame.game_type = filters.gameType;

  if (filters.startDate || filters.endDate) {
    whereGame.start_date = {};
    if (filters.startDate) whereGame.start_date.gte = new Date(filters.startDate);
    if (filters.endDate) whereGame.start_date.lte = new Date(filters.endDate);
  }

  // Fetch raw goal records with nested relations
  const goalsData = await prisma.game_events_goals.findMany({
    where: {
      game_events_major: whereMajor,
      ...(filters.teamSeasonId ? { team_season_id: filters.teamSeasonId } : {}),
      ...(filters.personId
        ? {
            OR: [
              { player_games_game_events_goals_scorer_player_game_idToplayer_games: { player_id: filters.personId } },
              { player_games_game_events_goals_assist_player_game_idToplayer_games: { player_id: filters.personId } },
            ],
          }
        : {}),
    },
    include: {
      game_events_major: {
        include: {
          games: {
            include: {
              seasons: true,
              locations: true,
              game_events_major: {
                where: { event_type: "goal" },
                include: { game_events_goals: true },
                orderBy: [{ period: "asc" }, { game_time: "asc" }],
              },
              player_games: {
                include: { people: true },
              },
              team_seasons_games_home_team_season_idToteam_seasons: {
                include: { teams: { include: { clubs: true } } },
              },
              team_seasons_games_away_team_season_idToteam_seasons: {
                include: { teams: { include: { clubs: true } } },
              },
            },
          },
        },
      },
      team_seasons: {
        include: { teams: { include: { clubs: true } } },
      },
      player_games_game_events_goals_scorer_player_game_idToplayer_games: {
        include: { people: true },
      },
      player_games_game_events_goals_assist_player_game_idToplayer_games: {
        include: { people: true },
      },
      player_games_game_events_goals_defending_gk_player_game_idToplayer_games: {
        include: { people: true },
      },
    },
    orderBy: [
      { game_events_major: { games: { start_date: "desc" } } },
      { game_events_major: { game_time: "asc" } },
    ],
  });

  const results: FlattenedGoal[] = [];

  for (const goalRecord of goalsData) {
    const major = goalRecord.game_events_major;
    const game = major.games;
    if (!game) continue;

    const scoringTeamId = goalRecord.team_season_id;
    const isHome = game.home_team_season_id === scoringTeamId;
    const homeTeam = game.team_seasons_games_home_team_season_idToteam_seasons;
    const awayTeam = game.team_seasons_games_away_team_season_idToteam_seasons;

    const scoringTeamName = isHome ? homeTeam.teams.team_name : awayTeam.teams.team_name;
    const opponentTeamSeasonId = isHome ? game.away_team_season_id : game.home_team_season_id;
    const opponentTeamName = isHome ? awayTeam.teams.team_name : homeTeam.teams.team_name;

    // Filter club if requested
    if (filters.clubId) {
      const scoringClubId = isHome ? homeTeam.teams.club_id : awayTeam.teams.club_id;
      if (scoringClubId !== filters.clubId) continue;
    }

    if (filters.opponentTeamSeasonId && opponentTeamSeasonId !== filters.opponentTeamSeasonId) {
      continue;
    }

    // Evaluate Game Goals Chronologically for Running Score & Game Winner
    const allGameGoals = game.game_events_major;
    let homeRunning = 0;
    let awayRunning = 0;
    let goalSeqForScoringTeam = 0;
    let isThisGoalGameWinner = false;
    let scoreAtThisGoal = "0-0";
    let contextType = "Goal";

    for (const gMajor of allGameGoals) {
      const gSub = gMajor.game_events_goals[0];
      if (!gSub) continue;

      const isScoringTeamGoal = gSub.team_season_id === scoringTeamId;
      if (gSub.team_season_id === game.home_team_season_id) homeRunning++;
      if (gSub.team_season_id === game.away_team_season_id) awayRunning++;

      if (gMajor.id === major.id) {
        scoreAtThisGoal = `${homeRunning}-${awayRunning}`;

        const myScoreBefore = isScoringTeamGoal
          ? (isHome ? homeRunning - 1 : awayRunning - 1)
          : (isHome ? homeRunning : awayRunning);
        const oppScoreBefore = isScoringTeamGoal
          ? (isHome ? awayRunning : homeRunning)
          : (isHome ? awayRunning - 1 : homeRunning - 1);

        if (myScoreBefore === oppScoreBefore) {
          contextType = myScoreBefore === 0 ? "Opening Goal" : "Go-Ahead Goal";
        } else if (myScoreBefore < oppScoreBefore && myScoreBefore + 1 === oppScoreBefore) {
          contextType = "Equalizer";
        } else if (myScoreBefore > oppScoreBefore) {
          contextType = "Insurance Goal";
        }
      }
    }

    const finalHome = homeRunning;
    const finalAway = awayRunning;

    const scoringTeamWon = isHome ? finalHome > finalAway : finalAway > finalHome;
    const opponentFinalScore = isHome ? finalAway : finalHome;
    const winningGoalNeededIndex = opponentFinalScore + 1;

    // Check if this goal was the +1 over opponent's total
    let scoringTeamGoalCounter = 0;
    for (const gMajor of allGameGoals) {
      const gSub = gMajor.game_events_goals[0];
      if (gSub && gSub.team_season_id === scoringTeamId) {
        scoringTeamGoalCounter++;
        if (gMajor.id === major.id && scoringTeamWon && scoringTeamGoalCounter === winningGoalNeededIndex) {
          isThisGoalGameWinner = true;
        }
      }
    }

    if (filters.onlyGameWinners && !isThisGoalGameWinner) continue;

    // Scorer, Assister, GK Details
    const scorerPg = goalRecord.player_games_game_events_goals_scorer_player_game_idToplayer_games;
    const assistPg = goalRecord.player_games_game_events_goals_assist_player_game_idToplayer_games;
    const gkPg = goalRecord.player_games_game_events_goals_defending_gk_player_game_idToplayer_games;

    const scorerName = scorerPg
      ? `${scorerPg.people.first_name} ${scorerPg.people.last_name}`
      : goalRecord.opponent_jersey_number
      ? `Opponent #${goalRecord.opponent_jersey_number}`
      : "Unknown Scorer";

    const assisterName = assistPg
      ? `${assistPg.people.first_name} ${assistPg.people.last_name}`
      : null;

    const defendingGkName = gkPg
      ? `${gkPg.people.first_name} ${gkPg.people.last_name}`
      : null;

    // Goal Types
    let parsedTypes: string[] = [];
    if (goalRecord.goal_types) {
      try {
        parsedTypes = JSON.parse(goalRecord.goal_types);
      } catch (e) {
        parsedTypes = [goalRecord.goal_types];
      }
    }
    if (goalRecord.is_own_goal) parsedTypes.push("Own Goal");

    if (filters.goalType && !parsedTypes.includes(filters.goalType)) {
      continue;
    }

    // Format Clock Display
    const minutes = Math.floor(major.game_time / 60);
    const seconds = major.game_time % 60;
    const clockDisplay = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    results.push({
      goalId: goalRecord.id,
      majorEventId: major.id,
      gameId: game.id,
      startDate: game.start_date.toISOString().split("T")[0],
      seasonId: game.season_id,
      seasonName: game.seasons.season_name,
      competitionName: null,
      gameType: game.game_type || "league",

      scoringTeamSeasonId: scoringTeamId,
      scoringTeamName,
      opponentTeamSeasonId,
      opponentTeamName,
      isHomeTeam: isHome,
      locationName: game.locations?.name || null,

      period: major.period,
      gameTimeSeconds: major.game_time,
      clockDisplay,

      scorerPersonId: scorerPg?.people.id || null,
      scorerName,
      scorerJersey: goalRecord.opponent_jersey_number || null,
      scorerPhotoUrl: scorerPg?.people.photo_url || null,

      assistPersonId: assistPg?.people.id || null,
      assisterName,
      assisterJersey: null,

      defendingGkPersonId: gkPg?.people.id || null,
      defendingGkName,

      isOwnGoal: goalRecord.is_own_goal,
      goalTypes: parsedTypes,
      isGameWinner: isThisGoalGameWinner,
      contextType,

      scoreAtGoal: scoreAtThisGoal,
      finalGameScore: `${finalHome}-${finalAway}`,
      onFieldPlayerIds: [], // Computed dynamically on detail expansion
    });
  }

  return results;
}

/**
 * Fetches flattened game summaries for matches.
 */
export async function getFlattenedGameSummaries(
  filters: GoalLogFilter = {}
): Promise<FlattenedGameSummary[]> {
  const whereGame: any = {};
  if (filters.seasonId) whereGame.season_id = filters.seasonId;
  if (filters.gameType) whereGame.game_type = filters.gameType;

  const games = await prisma.games.findMany({
    where: whereGame,
    include: {
      seasons: true,
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: true },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: true },
      },
      game_events_major: {
        include: {
          game_events_goals: true,
          game_events_discipline: true,
        },
      },
    },
    orderBy: [{ start_date: "desc" }],
  });

  return games.map((g) => {
    let homeScore = 0;
    let awayScore = 0;
    let halftimeHome = 0;
    let halftimeAway = 0;
    let yellowCount = 0;
    let redCount = 0;

    g.game_events_major.forEach((m) => {
      if (m.event_type === "goal") {
        const goal = m.game_events_goals[0];
        if (goal) {
          if (goal.team_season_id === g.home_team_season_id) homeScore++;
          if (goal.team_season_id === g.away_team_season_id) awayScore++;
          if (m.period === 1) {
            if (goal.team_season_id === g.home_team_season_id) halftimeHome++;
            if (goal.team_season_id === g.away_team_season_id) halftimeAway++;
          }
        }
      }
      if (m.event_type === "discipline") {
        const card = m.game_events_discipline[0];
        if (card) {
          if (card.card_type === "yellow") yellowCount++;
          if (card.card_type === "red") redCount++;
        }
      }
    });

    const homeName = g.team_seasons_games_home_team_season_idToteam_seasons.teams.team_name;
    const awayName = g.team_seasons_games_away_team_season_idToteam_seasons.teams.team_name;

    const resultHome: "W" | "L" | "D" = homeScore > awayScore ? "W" : homeScore < awayScore ? "L" : "D";
    const resultAway: "W" | "L" | "D" = awayScore > homeScore ? "W" : awayScore < homeScore ? "L" : "D";

    return {
      gameId: g.id,
      startDate: g.start_date.toISOString().split("T")[0],
      startTime: g.start_time ? g.start_time.toISOString().split("T")[1] : null,
      seasonId: g.season_id,
      seasonName: g.seasons.season_name,
      competitionName: null,
      gameType: g.game_type || "league",

      homeTeamSeasonId: g.home_team_season_id,
      homeTeamName: homeName,
      awayTeamSeasonId: g.away_team_season_id,
      awayTeamName: awayName,

      homeScore,
      awayScore,
      halftimeHomeScore: halftimeHome,
      halftimeAwayScore: halftimeAway,

      resultHome,
      resultAway,
      goalDifferential: Math.abs(homeScore - awayScore),
      isCleanSheetHome: awayScore === 0,
      isCleanSheetAway: homeScore === 0,

      wentToOvertime: g.game_events_major.some((m) => m.period > 2),
      wentToShootout: false,
      totalShots: 0,
      totalYellowCards: yellowCount,
      totalRedCards: redCount,
    };
  });
}
