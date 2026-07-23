"use client";

import React, { useEffect } from "react";
import useGamePlayersStore, { Player } from "@/stores/gamePlayersStore";
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
    const mappedPlayers: Player[] = initialPlayers.map((lp) => ({
      id: lp.id,
      playerGameId: 0,
      firstName: lp.firstName,
      lastName: lp.lastName,
      fullName: lp.fullName,
      nickname: null,
      jerseyNumber: lp.jerseyNumber,
      position: null,
      teamId: 0,
      teamSeasonId: teamSeasonId,
      homeAway: "home",
      gameStatus: lp.gameStatus as any,
      fieldStatus: (lp.gameStatus === "starter" || lp.gameStatus === "goalkeeper") ? "onField" : "onBench",
      started: lp.gameStatus === "starter" || lp.gameStatus === "goalkeeper",
      isGuest: lp.isGuest,
      ins: [],
      outs: [],
      subStatus: null,
      goals: 0,
      penaltyGoals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      saves: 0,
      goalsAgainst: 0,
      penaltiesFaced: 0,
      penaltySaves: 0,
      cleanSheet: 0,
      yellowCards: 0,
      redCards: 0,
      foulsCommitted: 0,
      foulsDrawn: 0,
      goalkeeperTime: 0,
      plusMinus: 0,
    }));
    setPlayers(mappedPlayers);
  }, [initialPlayers, teamSeasonId, setPlayers]);

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
