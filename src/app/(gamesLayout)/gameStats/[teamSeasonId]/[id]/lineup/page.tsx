import { getGameById } from "@/lib/data/queries";
import { loadGameLineup } from "@/lib/actions/gameLineup-actions";
import GameLineupClientPage from "./GameLineupClientPage";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    teamSeasonId: string;
    id: string;
  }>;
}

export default async function LineupPage({ params }: PageProps) {
  const { teamSeasonId, id } = await params;
  const gameIdNum = Number(id);
  const teamSeasonIdNum = Number(teamSeasonId);

  if (isNaN(gameIdNum) || isNaN(teamSeasonIdNum)) {
    return notFound();
  }

  const [game, initialPlayers] = await Promise.all([
    getGameById(gameIdNum),
    loadGameLineup(gameIdNum, teamSeasonIdNum),
  ]);

  if (!game) {
    return notFound();
  }

  return (
    <GameLineupClientPage
      game={game}
      initialPlayers={initialPlayers}
      teamSeasonId={teamSeasonIdNum}
      gameId={gameIdNum}
    />
  );
}
