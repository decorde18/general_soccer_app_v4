"use client";

import { Clock, RotateCcw, Activity } from "lucide-react";
import type { GameSettings } from "@/types/game";

interface MatchConfigCardProps {
  settings: GameSettings;
}

export default function MatchConfigCard({ settings }: MatchConfigCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
        Match Config
      </h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Format</p>
            <p className="text-sm font-bold text-slate-700">
              {settings.periodCount} × {settings.periodDuration / 60} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Clock</p>
            <p className="text-sm font-bold capitalize text-slate-700">
              {settings.clockDirection}
            </p>
          </div>
        </div>

        {settings.hasOvertime && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-50 p-2 text-pink-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Overtime</p>
              <p className="text-sm font-bold text-slate-700">
                {settings.overtimePeriods} × {(settings.overtimeDuration ?? 0) / 60}m
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
