"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";

import LineupValidationBanner from "./live/LineupValidationBanner";
import BroadcastScoreboard from "./live/BroadcastScoreboard";
import OnFieldPlayersPanel from "./live/OnFieldPlayersPanel";
import BenchReservesPanel from "./live/BenchReservesPanel";
import TeamCountersPanel from "./live/TeamCountersPanel";
import UpcomingSubsPanel from "./live/UpcomingSubsPanel";
import RecentEventsPanel from "./live/RecentEventsPanel";
import MajorEventModal from "./live/MajorEventModal";
import LiveNavigationDrawer from "./live/LiveNavigationDrawer";
import { PauseCircle, Info } from "lucide-react";

export default function LiveGameTrackerClient() {
  const { id, teamSeasonId } = useParams<{ id: string; teamSeasonId: string }>();

  // Zustand Store States
  const game = useGameStore((s) => s.game);
  const getGameStage = useGameStore((s) => s.getGameStage);
  const startStoppage = useGameStore((s) => s.startStoppage);
  const endStoppage = useGameStore((s) => s.endStoppage);

  const players = useGamePlayersStore((s) => s.players);
  const createPendingSub = useGameSubsStore((s) => s.createPendingSub);

  // Modals & Navigation Drawer visibility
  const [isMajorEventModalOpen, setIsMajorEventModalOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // Substitution Quick Tap selection states
  const [subOutId, setSubOutId] = useState<string | null>(null);
  const [subInId, setSubInId] = useState<string | null>(null);

  // Automatic sub queueing when both an on-field and bench player are selected
  useEffect(() => {
    if (getGameStage() === useGameStore.getState().GAME_STAGES.BEFORE_START) {
      setSubOutId(null);
      setSubInId(null);
      return;
    }
    if (subOutId && subInId) {
      const outId = subOutId;
      const inId = subInId;

      setSubOutId(null);
      setSubInId(null);

      const executeAutoSub = async () => {
        try {
          const inPlayer = players.find((p) => String(p.id) === inId);
          const outPlayer = players.find((p) => String(p.id) === outId);

          if (inPlayer && outPlayer) {
            await createPendingSub(
              inPlayer.playerGameId,
              outPlayer.playerGameId,
              outPlayer.gameStatus === "goalkeeper"
            );
          }
        } catch (err: any) {
          console.error("Failed to queue sub:", err);
        }
      };
      executeAutoSub();
    }
  }, [subOutId, subInId, players, createPendingSub]);

  if (!game) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading live match tracker...
      </div>
    );
  }

  const GAME_STAGES = useGameStore.getState().GAME_STAGES;
  const currentStage = getGameStage();

  // Auto-reopen MajorEventModal on reload/mount if active stoppage exists
  useEffect(() => {
    if (!game) return;
    const activeStoppage = game.gameEventsMajor?.find(
      (s) => s.end_time === null && s.period === (game.currentPeriodIndex || 0) + 1 && s.clock_should_run === 0
    );
    if (activeStoppage) {
      setIsMajorEventModalOpen(true);
    }
  }, [game?.gameEventsMajor, game?.currentPeriodIndex]);

  const router = useRouter();

  // Auto-redirect to summary page when game is completed
  useEffect(() => {
    if (currentStage === GAME_STAGES.END_GAME && teamSeasonId && id) {
      router.push(`/gamestats/${teamSeasonId}/${id}/summary`);
    }
  }, [currentStage, GAME_STAGES.END_GAME, teamSeasonId, id, router]);

  // Modal open / close logic
  const handleOpenMajorEventModal = async () => {
    setIsMajorEventModalOpen(true);
  };

  const handleCloseMajorEventModal = async () => {
    setIsMajorEventModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden p-3 gap-2 bg-background select-none text-xs">
      {/* LINEUP VALIDATION WARNING */}
      <LineupValidationBanner />

      {/* Broadcast Scoreboard Header */}
      <BroadcastScoreboard
        onOpenMajorEventModal={handleOpenMajorEventModal}
        onOpenNavDrawer={() => setIsNavDrawerOpen(true)}
      />

      {/* PREGAME INTERMISSION BANNER */}
      {currentStage === GAME_STAGES.BEFORE_START && (
        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-indigo-400 shadow-2xs">
          <div className="flex items-center gap-2">
            <PauseCircle size={16} className="text-indigo-400" />
            <span>PREGAME — Starting Lineup & Substitutions Configured. Click 'Start Match' in header to begin Period 1. Event recording is disabled before start.</span>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-black tracking-wider shrink-0 border border-indigo-500/30">
            Pregame
          </span>
        </div>
      )}

      {/* BETWEEN PERIODS INTERMISSION BANNER */}
      {currentStage === GAME_STAGES.BETWEEN_PERIODS && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-amber-500 shadow-2xs">
          <div className="flex items-center gap-2">
            <PauseCircle size={16} className="text-amber-500 animate-pulse" />
            <span>HALFTIME / BETWEEN PERIODS — Timed match clock is paused. Review lineups, stats & queue substitutions. Event recording is disabled until next period starts.</span>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] uppercase font-black tracking-wider shrink-0 border border-amber-500/30">
            Intermission
          </span>
        </div>
      )}

      {/* Main split grid: Left 70% (Rosters Stacked), Right 30% (Feeds Stacked) */}
      <div className="flex-1 min-h-0 flex gap-3">
        {/* LEFT COLUMN: ROSTER PANELS (70% WIDTH) */}
        <div className="w-[70%] flex flex-col gap-2.5 min-h-0">
          <OnFieldPlayersPanel
            subOutId={subOutId}
            setSubOutId={setSubOutId}
          />

          <BenchReservesPanel
            subInId={subInId}
            setSubInId={setSubInId}
          />
        </div>

        {/* RIGHT COLUMN: ACTION & FEED PANEL (30% WIDTH) */}
        <div className="w-[30%] flex flex-col gap-2.5 min-h-0">
          {currentStage !== GAME_STAGES.BEFORE_START ? (
            <>
              <TeamCountersPanel />
              <UpcomingSubsPanel />
              <RecentEventsPanel />
            </>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 text-slate-300 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-indigo-400 font-extrabold uppercase text-xs tracking-wider">
                <Info size={16} className="text-indigo-400" />
                <span>Pregame Overview</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                The match has not started yet. Starting lineups are set on the <strong className="text-slate-200">Lineup</strong> page.
              </p>
              <div className="space-y-2.5 pt-3 border-t border-slate-800/80 text-xs font-semibold">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Match Period:</span>
                  <span className="text-indigo-300 font-extrabold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Pregame</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Corners / Fouls / Offsides:</span>
                  <span className="text-slate-500 text-[11px]">Activates in Period 1</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Pending Substitutions:</span>
                  <span className="text-slate-500 text-[11px]">Activates in Period 1</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Live Match Feed:</span>
                  <span className="text-slate-500 text-[11px]">Activates in Period 1</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UNIFIED MAJOR EVENT MODAL */}
      <MajorEventModal
        isOpen={isMajorEventModalOpen}
        onClose={handleCloseMajorEventModal}
      />

      {/* COLLAPSIBLE SIDEBAR NAVIGATION DRAWER */}
      <LiveNavigationDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        teamSeasonId={teamSeasonId}
        gameId={id}
      />
    </div>
  );
}
