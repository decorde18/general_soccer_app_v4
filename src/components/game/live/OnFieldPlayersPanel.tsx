"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Player } from "@/stores/gamePlayersStore";
import { PendingSub } from "@/stores/gameSubsStore";
import LivePlayerTable from "./LivePlayerTable";

interface OnFieldPlayersPanelProps {
  onFieldGks: Player[];
  onFieldFlds: Player[];
  onFieldCount: number;
  subOutId: string | null;
  pendingSubsList: PendingSub[];
  gameTimeSeconds: number;
  calculateTotalTimeOnField: (player: Player, nowSec: number) => number;
  calculateCurrentTimeOnField: (player: Player, nowSec: number) => number;
  getPlayerStats: (player: Player) => {
    shots: number;
    saves: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    goalsAgainst: number;
  };
  setSubOutId: (id: string | null) => void;
  handleQuickPlayerAction: (
    playerId: string | number,
    actionType: "shot" | "shot_on_target" | "save" | "foul"
  ) => void;
}

export default function OnFieldPlayersPanel({
  onFieldGks,
  onFieldFlds,
  onFieldCount,
  subOutId,
  pendingSubsList,
  gameTimeSeconds,
  calculateTotalTimeOnField,
  calculateCurrentTimeOnField,
  getPlayerStats,
  setSubOutId,
  handleQuickPlayerAction,
}: OnFieldPlayersPanelProps) {
  return (
    <Card variant="outlined" padding="sm" className="shrink-0 flex flex-col bg-surface shadow-xs rounded-xl p-2.5 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between border-b border-border/40 pb-1.5 px-1.5">
        <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-text flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Players On Field ({onFieldCount})</span>
        </h3>
        {subOutId && (
          <span className="text-[8px] uppercase font-black text-rose-500 animate-pulse bg-rose-50 border border-rose-500/20 px-1.5 py-0.25 rounded">
            Select game changer row below to swap
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2 pt-1.5 overflow-hidden">
        {/* GOALKEEPER SECTION */}
        {onFieldGks.length > 0 && (
          <div className="shrink-0 space-y-0.5">
            <span className="text-[9px] uppercase font-black text-muted tracking-wider px-1">Goalkeeper</span>
            <LivePlayerTable
              players={onFieldGks}
              tableType="gk"
              subSelectedId={subOutId}
              pendingSubsList={pendingSubsList}
              gameTimeSeconds={gameTimeSeconds}
              calculateTotalTimeOnField={calculateTotalTimeOnField}
              calculateSecondaryTime={calculateCurrentTimeOnField}
              getPlayerStats={getPlayerStats}
              onSelectPlayer={setSubOutId}
              onQuickAction={handleQuickPlayerAction}
            />
          </div>
        )}

        {/* FIELD PLAYERS SECTION */}
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase font-black text-muted tracking-wider px-1">Field Players</span>
          <LivePlayerTable
            players={onFieldFlds}
            tableType="field"
            subSelectedId={subOutId}
            pendingSubsList={pendingSubsList}
            gameTimeSeconds={gameTimeSeconds}
            calculateTotalTimeOnField={calculateTotalTimeOnField}
            calculateSecondaryTime={calculateCurrentTimeOnField}
            getPlayerStats={getPlayerStats}
            onSelectPlayer={setSubOutId}
            onQuickAction={handleQuickPlayerAction}
          />
        </div>
      </div>
    </Card>
  );
}
