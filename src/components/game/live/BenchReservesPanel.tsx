"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Player } from "@/stores/gamePlayersStore";
import { PendingSub } from "@/stores/gameSubsStore";
import LivePlayerTable from "./LivePlayerTable";

interface BenchReservesPanelProps {
  gameChangers: Player[];
  subInId: string | null;
  pendingSubsList: PendingSub[];
  gameTimeSeconds: number;
  calculateTotalTimeOnField: (player: Player, nowSec: number) => number;
  calculateCurrentTimeOffField: (player: Player, nowSec: number) => number;
  getPlayerStats: (player: Player) => {
    shots: number;
    saves: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    goalsAgainst: number;
  };
  setSubInId: (id: string | null) => void;
}

export default function BenchReservesPanel({
  gameChangers,
  subInId,
  pendingSubsList,
  gameTimeSeconds,
  calculateTotalTimeOnField,
  calculateCurrentTimeOffField,
  getPlayerStats,
  setSubInId,
}: BenchReservesPanelProps) {
  return (
    <Card variant="outlined" padding="sm" className="flex-1 min-h-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
      <div className="shrink-0 flex items-center justify-between border-b border-border/40 pb-1 px-1">
        <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-text flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Game Changers (Bench Reserves) ({gameChangers.length})</span>
        </h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mt-1.5">
        <LivePlayerTable
          players={gameChangers}
          tableType="bench"
          subSelectedId={subInId}
          pendingSubsList={pendingSubsList}
          gameTimeSeconds={gameTimeSeconds}
          calculateTotalTimeOnField={calculateTotalTimeOnField}
          calculateSecondaryTime={calculateCurrentTimeOffField}
          getPlayerStats={getPlayerStats}
          onSelectPlayer={setSubInId}
        />
      </div>
    </Card>
  );
}
