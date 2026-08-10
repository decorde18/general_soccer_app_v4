"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import useGamePlayersStore, { Player } from "@/stores/gamePlayersStore";
import useGameSubsStore, { PendingSub } from "@/stores/gameSubsStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import useGameStore from "@/stores/gameStore";
import LivePlayerTable from "./LivePlayerTable";
import RefOverrideModal from "./RefOverrideModal";
import { toast } from "sonner";

interface BenchReservesPanelProps {
  gameChangers?: Player[];
  subInId?: string | null;
  pendingSubsList?: PendingSub[];
  gameTimeSeconds?: number;
  calculateTotalTimeOnField?: (player: Player, nowSec: number) => number;
  calculateCurrentTimeOffField?: (player: Player, nowSec: number) => number;
  getPlayerStats?: (player: Player) => {
    shots: number;
    saves: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    goalsAgainst: number;
  };
  setSubInId?: (id: string | null) => void;
}

export default function BenchReservesPanel(props: BenchReservesPanelProps) {
  const storeGame = useGameStore((s) => s.game);
  const storePlayers = useGamePlayersStore((s) => s.players);
  const getPendingSubsSync = useGameSubsStore((s) => s.getPendingSubsSync);
  const storeCalcTotalTime = useGamePlayerTimeStore((s) => s.calculateTotalTimeOnField);
  const storeCalcCurrentTimeOffField = useGamePlayerTimeStore((s) => s.calculateCurrentTimeOffField);

  const [localGameTimeSeconds, setLocalGameTimeSeconds] = useState<number>(0);
  const [overridePlayerIds, setOverridePlayerIds] = useState<Set<string | number>>(new Set());
  const [overrideTarget, setOverrideTarget] = useState<{ player: Player; reason: string } | null>(null);

  useEffect(() => {
    if (props.gameTimeSeconds !== undefined) return;
    const interval = setInterval(() => {
      setLocalGameTimeSeconds(useGameStore.getState().getGameTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [props.gameTimeSeconds]);

  const gameTimeSeconds = props.gameTimeSeconds ?? localGameTimeSeconds;
  const pendingSubsList = props.pendingSubsList ?? (getPendingSubsSync() || []);
  const calculateTotalTimeOnField = props.calculateTotalTimeOnField ?? storeCalcTotalTime;
  const calculateCurrentTimeOffField = props.calculateCurrentTimeOffField ?? storeCalcCurrentTimeOffField;

  const eligiblePlayers = storePlayers.filter(
    (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed"
  );
  const storeGameChangers = eligiblePlayers.filter((p) => p.fieldStatus === "onBench");

  const gameChangers = props.gameChangers ?? storeGameChangers;

  const defaultGetPlayerStats = (player: Player) => {
    if (!storeGame) return { shots: 0, saves: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, goalsAgainst: 0 };
    const pId = Number(player.playerGameId);
    const playerActions = storeGame.playerActions || [];
    const goalsEvents = storeGame.gameEventsGoals || [];
    const disciplineEvents = storeGame.gameEventsDiscipline || [];

    const shots = playerActions.filter((a) => Number(a.player_game_id) === pId && (a.event_type === "shot" || a.event_type === "shot_on_target")).length;
    const saves = playerActions.filter((a) => Number(a.player_game_id) === pId && a.event_type === "save").length;
    const goals = goalsEvents.filter((g) => Number(g.scorer_player_game_id) === pId).length;
    const assists = goalsEvents.filter((g) => Number(g.assist_player_game_id) === pId).length;
    const yellowCards = disciplineEvents.filter((d) => Number(d.player_game_id) === pId && (d.card_type === "yellow" || d.card_color === "yellow")).length;
    const redCards = disciplineEvents.filter((d) => Number(d.player_game_id) === pId && (d.card_type === "red" || d.card_type === "yellow_red" || d.card_color === "red")).length;
    const goalsAgainst = goalsEvents.filter((g) => Number(g.defending_gk_player_game_id) === pId).length;

    return { shots, saves, goals, assists, yellowCards, redCards, goalsAgainst };
  };

  const getPlayerStats = props.getPlayerStats ?? defaultGetPlayerStats;

  const handleConfirmOverride = (player: Player) => {
    setOverridePlayerIds((prev) => {
      const next = new Set(prev);
      next.add(player.id);
      next.add(player.playerGameId);
      return next;
    });
    toast.success(`Ref exception override applied for #${player.jerseyNumber || ""} ${player.fullName}`);
    props.setSubInId?.(String(player.id));
  };

  return (
    <Card variant="outlined" padding="sm" className="flex-1 min-h-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
      <div className="shrink-0 flex items-center justify-between border-b border-border/40 pb-1 px-1">
        <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-text flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Game Changers (Bench Reserves) ({gameChangers.length})</span>
        </h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mt-1.5">
        <LivePlayerTable
          players={gameChangers}
          tableType="bench"
          subSelectedId={props.subInId ?? null}
          pendingSubsList={pendingSubsList}
          gameTimeSeconds={gameTimeSeconds}
          calculateTotalTimeOnField={calculateTotalTimeOnField}
          calculateSecondaryTime={calculateCurrentTimeOffField}
          getPlayerStats={getPlayerStats}
          onSelectPlayer={props.setSubInId}
          overridePlayerIds={overridePlayerIds}
          onAttemptIneligibleSelect={(player, reason) => setOverrideTarget({ player, reason })}
        />
      </div>

      {overrideTarget && (
        <RefOverrideModal
          player={overrideTarget.player}
          reason={overrideTarget.reason}
          isOpen={Boolean(overrideTarget)}
          onClose={() => setOverrideTarget(null)}
          onConfirmOverride={handleConfirmOverride}
        />
      )}
    </Card>
  );
}
