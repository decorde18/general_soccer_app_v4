"use client";

import React from "react";
import { Wifi, WifiOff, Menu } from "lucide-react";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";

interface BroadcastScoreboardProps {
  ourShortName: string;
  opponentShortName: string;
  goalsFor: number;
  goalsAgainst: number;
  gameTimeSeconds: number;
  periodLabel: string;
  isOnline: boolean;
  queueCount: number;
  currentStage: number | string;
  GAME_STAGES: Record<string, any>;
  isLineupConfigured: boolean;
  onTogglePeriodClock: () => void;
  onOpenMajorEventModal: () => void;
  onOpenNavDrawer?: () => void;
}

export default function BroadcastScoreboard({
  ourShortName,
  opponentShortName,
  goalsFor,
  goalsAgainst,
  gameTimeSeconds,
  periodLabel,
  isOnline,
  queueCount,
  currentStage,
  GAME_STAGES,
  isLineupConfigured,
  onTogglePeriodClock,
  onOpenMajorEventModal,
  onOpenNavDrawer,
}: BroadcastScoreboardProps) {
  const getClockButtonText = () => {
    if (currentStage === GAME_STAGES.IN_STOPPAGE) return "Resume Clock";
    if (currentStage === GAME_STAGES.DURING_PERIOD) return "End Period";
    return "Start Period";
  };

  const isClockButtonDisabled =
    !isLineupConfigured &&
    currentStage !== GAME_STAGES.DURING_PERIOD &&
    currentStage !== GAME_STAGES.IN_STOPPAGE;

  return (
    <div className="shrink-0 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white px-5 py-3 shadow-md flex flex-col gap-2 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Home team */}
        <div className="flex items-center justify-end gap-3 min-w-0 flex-1 text-right">
          <span className="font-extrabold text-sm sm:text-base truncate tracking-tight">
            {ourShortName}
          </span>
          <span className="text-[9px] font-black shrink-0 bg-primary/25 border border-primary/45 px-1.5 py-0.5 rounded text-white">
            HOME
          </span>
          <span className="font-mono font-black text-3xl sm:text-4xl text-white pl-2">
            {goalsFor}
          </span>
        </div>

        {/* LARGE MATCH TIME CLOCK */}
        <div className="flex flex-col items-center justify-center bg-black/40 border border-slate-700/60 px-5 py-1.5 rounded-xl shadow-inner min-w-[150px] shrink-0">
          <div className="flex items-center gap-1 font-mono font-black text-2xl sm:text-3xl text-yellow-400 tracking-tight">
            <span>{formatSecondsToMmss(gameTimeSeconds)}</span>
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.75">
            {periodLabel}
          </span>
        </div>

        {/* Away team & Hamburger */}
        <div className="flex items-center justify-start gap-3 min-w-0 flex-1 text-left">
          <span className="font-mono font-black text-3xl sm:text-4xl text-white pr-2">
            {goalsAgainst}
          </span>
          <span className="text-[9px] font-black shrink-0 bg-accent/25 border border-accent/45 px-1.5 py-0.5 rounded text-white">
            AWAY
          </span>
          <span className="font-extrabold text-sm sm:text-base truncate tracking-tight">
            {opponentShortName}
          </span>

          {onOpenNavDrawer && (
            <button
              onClick={onOpenNavDrawer}
              aria-label="Open Navigation Menu"
              className="p-1.5 ml-2 rounded-lg bg-black/30 hover:bg-black/60 border border-slate-700/80 text-white transition-colors cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>
          )}
        </div>
      </div>

      {/* System info bar and actions */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[9px] text-slate-400 font-bold">
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Wifi size={11} />
              <span>Sync Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-400">
              <WifiOff size={11} />
              <span>Offline ({queueCount})</span>
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onTogglePeriodClock}
            disabled={isClockButtonDisabled}
            className="h-6 py-0 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-black shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
          >
            {getClockButtonText()}
          </button>
          <button
            onClick={onOpenMajorEventModal}
            className="h-6 py-0 px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[10px] font-black shadow-xs transition-colors cursor-pointer"
          >
            Record Major Event
          </button>
        </div>
      </div>
    </div>
  );
}
