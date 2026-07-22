"use client";

import React, { useEffect } from "react";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import GameHeader from "@/components/layout/gameLayout/GameHeader";
import PlayerStatusSections from "./PlayerStatusSections";
import LineupFooter from "./LineupFooter";
import { LineupPlayer } from "@/lib/actions/gameLineup-actions";

interface GameLineupClientPageProps {
  initialPlayers: LineupPlayer[];
  teamSeasonId: number;
}

export default function GameLineupClientPage({
  initialPlayers,
  teamSeasonId,
}: GameLineupClientPageProps) {
  const setPlayers = useGamePlayersStore((s) => s.setPlayers);

  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers, setPlayers]);

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto bg-gray-50">
      {/* Header */}
      <GameHeader backUrl={`/teams/${teamSeasonId}`} />

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
