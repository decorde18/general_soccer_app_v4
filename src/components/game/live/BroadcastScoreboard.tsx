"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Menu } from "lucide-react";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";
import { formatTeamName } from "@/lib/utils/teamName";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import { useOnlineStatus } from "@/lib/offline/offlineSync";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface BroadcastScoreboardProps {
  ourShortName?: string;
  opponentShortName?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  gameTimeSeconds?: number;
  periodLabel?: string;
  isOnline?: boolean;
  queueCount?: number;
  currentStage?: number | string;
  GAME_STAGES?: Record<string, any>;
  isLineupConfigured?: boolean;
  onTogglePeriodClock?: () => void;
  onOpenMajorEventModal?: () => void;
  onOpenNavDrawer?: () => void;
}

export default function BroadcastScoreboard(props: BroadcastScoreboardProps) {
  const rawParams = typeof useParams === "function" ? useParams() : null;
  const params = (rawParams || {}) as { id?: string; teamSeasonId?: string };

  // Store & Hook subscriptions
  const game = useGameStore((s) => s.game);
  const getGameStage = useGameStore((s) => s.getGameStage);
  const getCurrentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel);
  const GAME_STAGES_STORE = useGameStore((s) => s.GAME_STAGES);
  const startNextPeriod = useGameStore((s) => s.startNextPeriod);
  const endPeriod = useGameStore((s) => s.endPeriod);
  const endStoppage = useGameStore((s) => s.endStoppage);

  const players = useGamePlayersStore((s) => s.players);
  const { isOnline: onlineStatus, queueCount: offlineQueueCount } = useOnlineStatus();

  // Local timer tick for smooth scoreboard clock
  const [storeGameTimeSeconds, setStoreGameTimeSeconds] = useState<number>(0);

  useEffect(() => {
    if (props.gameTimeSeconds !== undefined) return;
    const interval = setInterval(() => {
      setStoreGameTimeSeconds(useGameStore.getState().getGameTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [props.gameTimeSeconds]);

  // Derived values with fallbacks
  const gameTimeSeconds = props.gameTimeSeconds ?? storeGameTimeSeconds;
  const currentStage = props.currentStage ?? (game ? getGameStage() : 0);
  const GAME_STAGES = props.GAME_STAGES ?? GAME_STAGES_STORE;
  const periodLabel = props.periodLabel ?? (game ? getCurrentPeriodLabel() : "");
  const isOnline = props.isOnline ?? onlineStatus;
  const queueCount = props.queueCount ?? offlineQueueCount;
  const goalsFor = props.goalsFor ?? game?.goalsFor ?? 0;
  const goalsAgainst = props.goalsAgainst ?? game?.goalsAgainst ?? 0;

  const starterCount = players.filter((p) => p.gameStatus === "starter").length;
  const gkCount = players.filter((p) => p.gameStatus === "goalkeeper").length;
  const playersOnFieldSetting = game?.settings?.playersOnField || 11;
  const isLineupConfigured = props.isLineupConfigured ?? ((starterCount + gkCount) === playersOnFieldSetting);

  const ourShortName = props.ourShortName ?? (game ? formatTeamName({
    team_name: (game.isHome ? game.homeTeamName : game.awayTeamName) as string | null,
    club: {
      name: (game.isHome ? game.homeClubName : game.awayClubName) as string | null,
      abbreviation: (game.isHome ? game.homeClubAbbreviation : game.awayClubAbbreviation) as string | null,
    }
  }, "short") : "HOME");

  const opponentShortName = props.opponentShortName ?? (game ? formatTeamName({
    team_name: (game.isHome ? game.awayTeamName : game.homeTeamName) as string | null,
    club: {
      name: (game.isHome ? game.awayClubName : game.homeClubName) as string | null,
      abbreviation: (game.isHome ? game.awayClubAbbreviation : game.homeClubAbbreviation) as string | null,
    }
  }, "short") : "AWAY");

  const handleDefaultToggleClock = async () => {
    if (!game) return;
    try {
      if (currentStage === GAME_STAGES.IN_STOPPAGE) {
        const activeStoppage = game.gameEventsMajor?.find(
          (s) => s.end_time === null && s.period === game.currentPeriodIndex + 1 && s.clock_should_run === 0
        );
        if (activeStoppage) {
          await endStoppage(activeStoppage.id);
        }
      } else if (currentStage === GAME_STAGES.BEFORE_START || currentStage === GAME_STAGES.BETWEEN_PERIODS) {
        if (!isLineupConfigured) {
          toast.error("Roster config mismatch. Set starting lineup first.");
          return;
        }
        await startNextPeriod();
        toast.success(`Started ${periodLabel}`);
      } else if (currentStage === GAME_STAGES.DURING_PERIOD) {
        await endPeriod();
        toast.info(`Ended ${periodLabel}`);
      }
    } catch (err: any) {
      toast.error("Clock action error: " + err.message);
    }
  };

  const onTogglePeriodClock = props.onTogglePeriodClock ?? handleDefaultToggleClock;

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

          {props.onOpenNavDrawer && (
            <button
              onClick={props.onOpenNavDrawer}
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
          {props.onOpenMajorEventModal && (
            <button
              onClick={props.onOpenMajorEventModal}
              className="h-6 py-0 px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[10px] font-black shadow-xs transition-colors cursor-pointer"
            >
              Record Major Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
