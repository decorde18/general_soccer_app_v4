"use client";

import React from "react";
import { Zap, PlusCircle, MinusCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import useGameStore, { GAME_STAGES } from "@/stores/gameStore";
import { formatTeamName } from "@/lib/utils/teamName";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface TeamCountersPanelProps {
  ourShortName?: string;
  opponentShortName?: string;
  ourId?: number;
  oppId?: number;
  ourCorners?: number;
  oppCorners?: number;
  ourOffsides?: number;
  oppOffsides?: number;
  ourFouls?: number;
  oppFouls?: number;
  currentStage?: any;
  onAddTeamEvent?: (teamSeasonId: number | string, type: "corner" | "offside" | "foul") => void;
  onRemoveTeamEvent?: (teamSeasonId: number | string, type: "corner" | "offside" | "foul") => void;
}

export default function TeamCountersPanel(props: TeamCountersPanelProps) {
  const rawParams = typeof useParams === "function" ? useParams() : null;
  const params = (rawParams || {}) as { id?: string; teamSeasonId?: string };
  const game = useGameStore((s) => s.game);
  const addTeamEvent = useGameStore((s) => s.addTeamEvent);
  const storeStage = useGameStore((s) => s.getGameStage());

  const currentStage = props.currentStage ?? (game ? storeStage : GAME_STAGES.DURING_PERIOD);
  const isCountersDisabled =
    currentStage === GAME_STAGES.BETWEEN_PERIODS ||
    currentStage === GAME_STAGES.BEFORE_START ||
    currentStage === GAME_STAGES.END_GAME;

  const teamSeasonIdParam = params?.teamSeasonId;
  const gameIdParam = params?.id;

  const ourId = props.ourId ?? Number(teamSeasonIdParam || (game?.isHome ? game?.home_team_season_id : game?.away_team_season_id) || 0);
  const oppId = props.oppId ?? Number(game?.isHome ? game?.away_team_season_id : game?.home_team_season_id || 0);

  const teamEvents = game?.gameEventsTeam || [];

  const ourCorners = props.ourCorners ?? teamEvents.filter((e) => Number(e.team_season_id) === ourId && e.event_type === "corner").length;
  const oppCorners = props.oppCorners ?? teamEvents.filter((e) => Number(e.team_season_id) === oppId && e.event_type === "corner").length;
  const ourOffsides = props.ourOffsides ?? teamEvents.filter((e) => Number(e.team_season_id) === ourId && e.event_type === "offside").length;
  const oppOffsides = props.oppOffsides ?? teamEvents.filter((e) => Number(e.team_season_id) === oppId && e.event_type === "offside").length;
  const ourFouls = props.ourFouls ?? teamEvents.filter((e) => Number(e.team_season_id) === ourId && e.event_type === "foul").length;
  const oppFouls = props.oppFouls ?? teamEvents.filter((e) => Number(e.team_season_id) === oppId && e.event_type === "foul").length;

  const ourShortName = props.ourShortName ?? (game ? formatTeamName({
    team_name: (game.isHome ? game.homeTeamName : game.awayTeamName) as string | null,
    club: {
      name: (game.isHome ? game.homeClubName : game.awayClubName) as string | null,
      abbreviation: (game.isHome ? game.homeClubAbbreviation : game.awayClubAbbreviation) as string | null,
    }
  }, "short") : "Us");

  const opponentShortName = props.opponentShortName ?? (game ? formatTeamName({
    team_name: (game.isHome ? game.awayTeamName : game.homeTeamName) as string | null,
    club: {
      name: (game.isHome ? game.awayClubName : game.homeClubName) as string | null,
      abbreviation: (game.isHome ? game.awayClubAbbreviation : game.homeClubAbbreviation) as string | null,
    }
  }, "short") : "Them");

  const defaultAddTeamEvent = (teamSeasonIdVal: number | string, eventType: "corner" | "offside" | "foul") => {
    if (!game) return;
    const tid = Number(teamSeasonIdVal);
    if (!tid || isNaN(tid)) {
      toast.error("Invalid team season ID for counter");
      return;
    }

    const gameId = Number(game.game_id || game.id);
    const gameTimeSeconds = useGameStore.getState().getGameTime();
    const period = game.currentPeriodIndex + 1;
    const tempEventId = `temp_team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. SYNCHRONOUS OPTIMISTIC UPDATE (0ms latency)
    addTeamEvent({
      id: tempEventId,
      game_id: gameId,
      team_season_id: tid,
      event_type: eventType as any,
      game_time: gameTimeSeconds,
      period,
    } as any);

    // 2. BACKGROUND SERVER PERSISTENCE
    fetch(`/api/game_events_team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: gameId,
        team_season_id: tid,
        event_type: eventType,
        game_time: gameTimeSeconds,
        period,
      }),
    })
      .then((r) => r.json())
      .then((newEvent) => {
        if (newEvent?.id) {
          useGameStore.getState().replaceTeamEvent(tempEventId, {
            id: newEvent.id,
            game_id: gameId,
            team_season_id: tid,
            event_type: eventType as any,
            game_time: gameTimeSeconds,
            period,
          } as any);
        }
      })
      .catch((err) => {
        useGameStore.getState().removeTeamEvent(tempEventId);
        toast.error(`Failed to log team event: ${err.message}`);
      });
  };

  const defaultRemoveTeamEvent = (teamSeasonIdVal: number | string, eventType: "corner" | "offside" | "foul") => {
    if (!game) return;
    const matchEvents = teamEvents.filter(
      (e) => Number(e.team_season_id) === Number(teamSeasonIdVal) && e.event_type === eventType
    );
    if (matchEvents.length === 0) return;

    const lastEvent = matchEvents[matchEvents.length - 1];

    // 1. SYNCHRONOUS OPTIMISTIC REMOVAL (0ms latency)
    useGameStore.getState().removeTeamEvent(lastEvent.id);

    // 2. BACKGROUND SERVER PERSISTENCE
    useGameStore.getState().deleteEvent(lastEvent.id, "team").catch((err: any) => {
      // Rollback on failure
      useGameStore.getState().addTeamEvent(lastEvent);
      toast.error(`Failed to remove team event: ${err.message}`);
    });
  };

  const onAddTeamEvent = props.onAddTeamEvent ?? defaultAddTeamEvent;
  const onRemoveTeamEvent = props.onRemoveTeamEvent ?? defaultRemoveTeamEvent;

  return (
    <Card variant="outlined" padding="sm" className="h-[182px] shrink-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
      <div className="flex items-center justify-between border-b border-border/40 pb-1 px-1 shrink-0">
        <div className="flex items-center gap-1">
          <Zap size={11} className="text-primary" />
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-text">Team Counters</span>
        </div>
        {currentStage === GAME_STAGES.BETWEEN_PERIODS && (
          <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.25 rounded border border-amber-500/20">
            Halftime (Paused)
          </span>
        )}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2 text-[10px] p-1.5 min-h-0 overflow-y-auto mt-1">
        {/* Our Team */}
        <div className="space-y-1">
          <h4 className="font-extrabold text-[9px] uppercase text-primary border-b border-primary/10 pb-0.5 truncate" title={ourShortName}>
            {ourShortName}
          </h4>
          <div className="space-y-1 font-semibold text-text">
            <div className="flex items-center justify-between">
              <span>Corners: {ourCorners}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Our Corner"
                  onClick={() => onRemoveTeamEvent(ourId, "corner")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Our Corner"
                  onClick={() => onAddTeamEvent(ourId, "corner")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-primary hover:text-primary-hover cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Offsides: {ourOffsides}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Our Offside"
                  onClick={() => onRemoveTeamEvent(ourId, "offside")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Our Offside"
                  onClick={() => onAddTeamEvent(ourId, "offside")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-primary hover:text-primary-hover cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Fouls: {ourFouls}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Our Foul"
                  onClick={() => onRemoveTeamEvent(ourId, "foul")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Our Foul"
                  onClick={() => onAddTeamEvent(ourId, "foul")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-primary hover:text-primary-hover cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Opponent Team */}
        <div className="space-y-1 border-l border-border/40 pl-2">
          <h4 className="font-extrabold text-[9px] uppercase text-accent border-b border-accent/10 pb-0.5 truncate" title={opponentShortName}>
            {opponentShortName}
          </h4>
          <div className="space-y-1 font-semibold text-text">
            <div className="flex items-center justify-between">
              <span>Corners: {oppCorners}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Opponent Corner"
                  onClick={() => onRemoveTeamEvent(oppId, "corner")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Opponent Corner"
                  onClick={() => onAddTeamEvent(oppId, "corner")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-accent hover:text-accent-hover cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Offsides: {oppOffsides}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Opponent Offside"
                  onClick={() => onRemoveTeamEvent(oppId, "offside")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Opponent Offside"
                  onClick={() => onAddTeamEvent(oppId, "offside")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-accent hover:text-accent-hover cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Fouls: {oppFouls}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Opponent Foul"
                  onClick={() => onRemoveTeamEvent(oppId, "foul")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Opponent Foul"
                  onClick={() => onAddTeamEvent(oppId, "foul")}
                  disabled={isCountersDisabled}
                  className="p-0.5 text-accent hover:text-accent-hover cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
