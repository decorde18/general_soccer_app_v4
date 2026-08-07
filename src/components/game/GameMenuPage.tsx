"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight, Zap, Shield } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameStageInfo } from "@/hooks/useGameStageInfo";
import useGameStore from "@/stores/gameStore";
import { FullScreenLoader } from "@/components/shared/FullScreenState";

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
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/teams/${teamSeasonId}`)}
              className="inline-flex items-center gap-1.5"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span>Back to Team Schedule</span>
            </Button>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Match Command Dashboard
            </h1>
            <p className="text-xs text-muted max-w-xl">
              {game.ourName} vs {game.opponentName} — Live match control, lineup adjustments, and statistics logging.
            </p>
          </div>

          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-background shadow-xs">
            <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${stageInfo.statusColor}`} />
            <span className="font-extrabold text-xs text-text uppercase tracking-wider">
              {stageInfo.title}
            </span>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: STATUS & CONFIG */}
        <div className="space-y-6 lg:col-span-1">
          <GameStatusCard
            icon={stageInfo.icon}
            title={stageInfo.title}
            subtitle={stageInfo.subtitle}
            accentColor={stageInfo.accentColor}
          />
          <MatchConfigCard settings={game.settings} />
        </div>

        {/* RIGHT COLUMN: ACTIONS GRID */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-extrabold text-text uppercase tracking-wider">
              Quick Match Actions
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stageInfo.actions.map((action) => (
              <GameActionCard
                key={action.label}
                action={action}
                onSelect={(path) => router.push(path)}
              />
            ))}
          </div>

          {/* HELP TIP */}
          <Card variant="outlined" padding="md" className="bg-primary/5 border-primary/20 flex gap-4 items-start">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-text uppercase">Match Day Tip</h4>
              <p className="text-xs text-muted leading-relaxed">
                Confirm your starting 11 and bench substitutions in the <strong>Lineup</strong> section prior to starting the period clock.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
