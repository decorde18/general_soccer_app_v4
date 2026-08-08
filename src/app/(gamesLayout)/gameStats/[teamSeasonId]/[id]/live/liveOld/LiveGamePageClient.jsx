"use client";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";

import LayoutLiveGame from "./LayoutLiveGame";
import LayoutBetweenPeriods from "./LayoutBetweenPeriods";
import LayoutLiveBeforeGame from "./LayoutLiveBeforeGame";

function LiveGamePageClient() {
  const router = useRouter();
  const { id, teamSeasonId } = useParams();

  const players = useGamePlayersStore((s) => s.players);
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());

  // Check if lineup is valid
  const isLineupValid = useMemo(() => {
    if (!game?.settings?.playersOnField) return false;

    const starterCount = players.filter(
      (p) => p.gameStatus === "starter"
    ).length;
    const gkCount = players.filter((p) => p.gameStatus === "goalkeeper").length;

    return starterCount === game.settings.playersOnField - 1 && gkCount === 1;
  }, [players, game?.settings?.playersOnField]);
  // Handle redirects based on game state
  useEffect(() => {
    const basePath = `/gamestats/${teamSeasonId}/${id}`;

    // Always redirect to lineup if invalid
    if (!isLineupValid) {
      router.push(`${basePath}/lineup`);
      return;
    }

    // Redirect to summary when game ends
    if (gameStage === "end_game") {
      router.push(`${basePath}/summary`);
      return;
    }
  }, [gameStage, isLineupValid, router, teamSeasonId, id]);

  // Show loading while redirecting
  if (!isLineupValid || gameStage === "end_game") {
    return (
      <div className='h-screen flex items-center justify-center bg-background'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-text mb-2'>Loading...</div>
          <div className='text-muted'>Redirecting...</div>
        </div>
      </div>
    );
  }

  // Render appropriate layout for live game states
  const layoutMap = {
    between_periods: <LayoutBetweenPeriods />,
    before_start: <LayoutLiveBeforeGame />,
    during_period: <LayoutLiveGame />,
    in_stoppage: <LayoutLiveGame />,
  };

  return layoutMap[gameStage] || <LayoutLiveGame />;
}

export default LiveGamePageClient;
