"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
          toast.error("Failed to queue sub: " + err.message);
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

  // Modal open / close auto-stoppage logic
  const handleOpenMajorEventModal = async () => {
    if (currentStage === GAME_STAGES.DURING_PERIOD) {
      try {
        await startStoppage("Recording event", "stoppage");
        toast.info("Clock paused automatically.");
      } catch (err) {
        console.error("Auto stoppage error:", err);
      }
    }
    setIsMajorEventModalOpen(true);
  };

  const handleCloseMajorEventModal = async () => {
    setIsMajorEventModalOpen(false);

    const activeStoppage = game?.gameEventsMajor?.find(
      (s) => s.end_time === null && s.period === game.currentPeriodIndex + 1 && s.clock_should_run === 0
    );
    if (activeStoppage) {
      try {
        await endStoppage(activeStoppage.id);
        toast.success("Clock resumed.");
      } catch (err) {
        console.error("Auto resume error:", err);
      }
    }
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
          <TeamCountersPanel />

          <UpcomingSubsPanel />

          <RecentEventsPanel />
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
