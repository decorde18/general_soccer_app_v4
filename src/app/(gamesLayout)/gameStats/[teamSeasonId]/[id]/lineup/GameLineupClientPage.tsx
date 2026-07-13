"use client";

import React, { useEffect } from "react";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import GameHeader from "@/components/layout/gameLayout/GameHeader";
import PlayerStatusSections from "./PlayerStatusSections";
import LineupFooter from "./LineupFooter";
import { Game } from "@/lib/data/queries";
import { LineupPlayer } from "@/lib/actions/gameLineup-actions";

interface GameLineupClientPageProps {
  game: Game;
  initialPlayers: LineupPlayer[];
  teamSeasonId: number;
  gameId: number;
}

export default function GameLineupClientPage({
  game,
  initialPlayers,
  teamSeasonId,
  gameId,
}: GameLineupClientPageProps) {
  const setGame = useGameStore((s) => s.setGame);
  const setPlayers = useGamePlayersStore((s) => s.setPlayers);

  useEffect(() => {
    setGame(game);
    setPlayers(initialPlayers);
  }, [game, initialPlayers, setGame, setPlayers]);

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto bg-gray-50">
      {/* Header */}
      <GameHeader game={game} backUrl={`/teams/${teamSeasonId}`} />

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <PlayerStatusSections />
      </div>

      {/* Footer pinned to bottom */}
      <div className="shrink-0 px-4 pb-4">
        <LineupFooter />
      </div>
    </div>
  );
}
