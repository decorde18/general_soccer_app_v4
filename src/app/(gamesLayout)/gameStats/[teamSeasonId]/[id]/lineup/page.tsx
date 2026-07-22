import { loadGameLineup } from "@/lib/actions/gameLineup-actions";
import GameLineupClientPage from "./GameLineupClientPage";
import GameProvider from "@/components/game/GameProvider";
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

  const initialPlayers = await loadGameLineup(gameIdNum, teamSeasonIdNum);

  return (
    <GameProvider>
      <GameLineupClientPage
        initialPlayers={initialPlayers}
        teamSeasonId={teamSeasonIdNum}
      />
    </GameProvider>
  );
}
