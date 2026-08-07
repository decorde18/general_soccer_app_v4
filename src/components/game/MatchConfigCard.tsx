"use client";

import React from "react";
import { Clock, RotateCcw, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { GameSettings } from "@/types/game";

interface MatchConfigCardProps {
  settings: GameSettings;
}

export default function MatchConfigCard({ settings }: MatchConfigCardProps) {
  return (
    <Card variant="outlined" padding="md" className="space-y-4 bg-surface shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted border-b border-border/50 pb-2">
        Match Rules & Configuration
      </h3>

      <div className="space-y-3.5 text-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase">Period Format</p>
            <p className="text-xs font-extrabold text-text">
              {settings.periodCount} × {Math.round(settings.periodDuration / 60)} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase">Clock Direction</p>
            <p className="text-xs font-extrabold capitalize text-text">
              Count {settings.clockDirection}
            </p>
          </div>
        </div>

        {settings.hasOvertime && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-2 text-accent">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase">Overtime Rules</p>
              <p className="text-xs font-extrabold text-text">
                {settings.overtimePeriods} × {Math.round((settings.overtimeDuration ?? 600) / 60)} min
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
