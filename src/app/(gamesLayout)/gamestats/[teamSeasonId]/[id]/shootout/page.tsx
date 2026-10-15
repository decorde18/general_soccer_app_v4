import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getGameById } from "@/lib/data/queries";
import { loadGameLineup } from "@/lib/actions/gameLineup-actions";
import GameProvider from "@/components/game/GameProvider";
import ShootoutConsoleClient, {
  PlayerOption,
} from "@/components/game/shootout/ShootoutConsoleClient";
import { ShootoutKick, TeamShootoutInfo } from "@/lib/utils/shootoutUtils";

export const dynamic = "force-dynamic";

interface ShootoutPageProps {
  params: Promise<{
    id: string;
    teamSeasonId: string;
  }>;
}

export default async function ShootoutPage({ params }: ShootoutPageProps) {
  const resolvedParams = await params;
  const gameId = parseInt(resolvedParams.id, 10);
  const currentTeamSeasonId = parseInt(resolvedParams.teamSeasonId, 10);

  if (isNaN(gameId) || isNaN(currentTeamSeasonId)) {
    notFound();
  }

  // 1. Fetch Game
  const game = await getGameById(gameId);
  if (!game) {
    notFound();
  }

  const homeTsId = Number(game.homeTeamSeasonId);
  const awayTsId = Number(game.awayTeamSeasonId);

  const homeTeam: TeamShootoutInfo = {
    teamId: homeTsId,
    name: game.homeTeamName || "Home Team",
    shortName: game.homeClubName || "Home",
  };

  const awayTeam: TeamShootoutInfo = {
    teamId: awayTsId,
    name: game.awayTeamName || "Away Team",
    shortName: game.awayClubName || "Away",
  };

  // 2. Fetch Lineups for Both Teams
  const [homeRoster, awayRoster] = await Promise.all([
    loadGameLineup(gameId, homeTsId).catch(() => []),
    loadGameLineup(gameId, awayTsId).catch(() => []),
  ]);

  const homePlayers: PlayerOption[] = homeRoster.map((p) => ({
    playerGameId: p.playerTeamId,
    jerseyNumber: p.jerseyNumber,
    name: p.fullName,
    isGoalkeeper: p.gameStatus === "goalkeeper",
  }));

  const awayPlayers: PlayerOption[] = awayRoster.map((p) => ({
    playerGameId: p.playerTeamId,
    jerseyNumber: p.jerseyNumber,
    name: p.fullName,
    isGoalkeeper: p.gameStatus === "goalkeeper",
  }));

  // 3. Fetch Existing Shootout Kicks
  const penaltiesRaw = await prisma.game_events_penalties.findMany({
    where: {
      game_id: gameId,
      is_shootout: true,
    },
    orderBy: [
      { shootout_round: "asc" },
      { top_of_round: "desc" },
      { id: "asc" },
    ],
    include: {
      player_games_game_events_penalties_shooter_player_game_idToplayer_games: {
        include: { people: true },
      },
      player_games_game_events_penalties_gk_player_game_idToplayer_games: {
        include: { people: true },
      },
    },
  });

  const initialKicks: ShootoutKick[] = penaltiesRaw.map((k) => {
    const shooterPerson =
      k.player_games_game_events_penalties_shooter_player_game_idToplayer_games
        ?.people;
    const gkPerson =
      k.player_games_game_events_penalties_gk_player_game_idToplayer_games
        ?.people;

    const shooterName = shooterPerson
      ? `${shooterPerson.first_name} ${shooterPerson.last_name}`
      : k.shooter_jersey_number
      ? `#${k.shooter_jersey_number}`
      : "Shooter";

    const gkName = gkPerson
      ? `${gkPerson.first_name} ${gkPerson.last_name}`
      : "Goalkeeper";

    return {
      id: k.id,
      round: k.shootout_round || 1,
      isTop: k.top_of_round ?? true,
      teamId: k.team_season_id,
      shooterPlayerGameId: k.shooter_player_game_id,
      shooterName,
      shooterJersey: k.shooter_jersey_number,
      gkPlayerGameId: k.gk_player_game_id,
      gkName,
      outcome:
        k.outcome === "goal"
          ? "scored"
          : k.outcome === "hit_post"
          ? "post"
          : k.outcome,
      timestamp: k.created_at ? new Date(k.created_at).getTime() : Date.now(),
    };
  });

  return (
    <GameProvider>
      <ShootoutConsoleClient
        gameId={gameId}
        teamSeasonId={currentTeamSeasonId}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={game.homeScore ?? 0}
        awayScore={game.awayScore ?? 0}
        initialKicks={initialKicks}
        homePlayers={homePlayers}
        awayPlayers={awayPlayers}
      />
    </GameProvider>
  );
}
