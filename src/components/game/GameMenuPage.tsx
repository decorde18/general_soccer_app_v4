"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight, Zap } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameStageInfo } from "@/hooks/useGameStageInfo";
import useGameStore from "@/stores/gameStore";
import { FullScreenLoader } from "@/components/shared/FullScreenState";
import { formatTeamName } from "@/lib/utils/teamName";
import GameHeader from "@/components/layout/gameLayout/GameHeader";

import GameStatusCard from "@/components/game/GameStatusCard";
import MatchConfigCard from "@/components/game/MatchConfigCard";
import GameActionCard from "@/components/game/GameActionCard";

export default function GameMenuPage() {
  const router = useRouter();
  const { id, teamSeasonId } = useParams<{
    id: string;
    teamSeasonId: string;
  }>();

  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const GAME_STAGES = useGameStore((s) => s.GAME_STAGES);
  const currentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel());

  const baseGamePath = `/gamestats/${teamSeasonId}/${id}`;

  const stageInfo = useGameStageInfo({
    gameStage,
    gameStages: GAME_STAGES,
    currentPeriodLabel,
    baseGamePath,
  });

  if (!game) {
    return <FullScreenLoader message="Loading game data..." />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* STANDARD HEADER */}
      <GameHeader
        backUrl={`/teams/${teamSeasonId}`}
        className="rounded-2xl border border-border bg-surface shadow-sm"
      />

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: STATUS & CONFIG */}
        <div className="space-y-6 lg:col-span-1">
          <GameStatusCard
            icon={stageInfo.icon}
            title={stageInfo.title}
            subtitle={stageInfo.subtitle}
            statusColor={stageInfo.statusColor}
          />
          <MatchConfigCard settings={game.settings} gameId={id} teamSeasonId={teamSeasonId} />
        </div>

        {/* RIGHT COLUMN: ACTIONS GRID */}
        <div className="space-y-6 lg:col-span-2 lg:pt-2">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="text-sm font-extrabold text-text uppercase tracking-wider">
              Quick Match Actions
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {stageInfo.actions.map((action) => (
              <GameActionCard
                key={action.label}
                action={action}
                onSelect={(path) => router.push(path)}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
