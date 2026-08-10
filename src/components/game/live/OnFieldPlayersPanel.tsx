"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import useGamePlayersStore, { Player } from "@/stores/gamePlayersStore";
import useGameSubsStore, { PendingSub } from "@/stores/gameSubsStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import useGameStore from "@/stores/gameStore";
import { toast } from "sonner";
import LivePlayerTable from "./LivePlayerTable";

interface OnFieldPlayersPanelProps {
  onFieldGks?: Player[];
  onFieldFlds?: Player[];
  onFieldCount?: number;
  subOutId?: string | null;
  pendingSubsList?: PendingSub[];
  gameTimeSeconds?: number;
  calculateTotalTimeOnField?: (player: Player, nowSec: number) => number;
  calculateCurrentTimeOnField?: (player: Player, nowSec: number) => number;
  getPlayerStats?: (player: Player) => {
    shots: number;
    saves: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    goalsAgainst: number;
  };
  setSubOutId?: (id: string | null) => void;
  handleQuickPlayerAction?: (
    playerId: string | number,
    actionType: "shot" | "shot_on_target" | "save" | "foul"
  ) => void;
}

export default function OnFieldPlayersPanel(props: OnFieldPlayersPanelProps) {
  const storeGame = useGameStore((s) => s.game);
  const addPlayerAction = useGameStore((s) => s.addPlayerAction);
  const storePlayers = useGamePlayersStore((s) => s.players);
  const getPendingSubsSync = useGameSubsStore((s) => s.getPendingSubsSync);
  const storeCalcTotalTime = useGamePlayerTimeStore((s) => s.calculateTotalTimeOnField);
  const storeCalcCurrentTimeOnField = useGamePlayerTimeStore((s) => s.calculateCurrentTimeOnField);

  const [localGameTimeSeconds, setLocalGameTimeSeconds] = useState<number>(0);

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
  const calculateCurrentTimeOnField = props.calculateCurrentTimeOnField ?? storeCalcCurrentTimeOnField;

  const eligiblePlayers = storePlayers.filter(
    (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed"
  );
  const storeOnFieldPlayers = eligiblePlayers.filter(
    (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk"
  );
  const storeOnFieldGks = storeOnFieldPlayers.filter((p) => p.gameStatus === "goalkeeper" || p.fieldStatus === "onFieldGk");
  const storeOnFieldFlds = storeOnFieldPlayers.filter((p) => p.gameStatus !== "goalkeeper" && p.fieldStatus !== "onFieldGk");

  const onFieldGks = props.onFieldGks ?? storeOnFieldGks;
  const onFieldFlds = props.onFieldFlds ?? storeOnFieldFlds;
  const onFieldCount = props.onFieldCount ?? storeOnFieldPlayers.length;

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

  const defaultQuickPlayerAction = async (playerId: string | number, actionType: "shot" | "shot_on_target" | "save" | "foul") => {
    if (!storeGame) return;
    const player = storePlayers.find((p) => p.id === playerId);
    if (!player) return;

    try {
      const payload = {
        game_id: Number(storeGame.game_id || storeGame.id),
        player_game_id: Number(player.playerGameId),
        event_type: actionType,
        game_time: gameTimeSeconds,
        period: storeGame.currentPeriodIndex + 1,
      };

      const res = await fetch("/api/game_events_player_actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const newAction = await res.json();

      if (newAction?.id) {
        addPlayerAction({
          id: newAction.id,
          game_id: Number(storeGame.game_id || storeGame.id),
          team_season_id: Number(storeGame.teamSeasonId),
          player_game_id: Number(player.playerGameId),
          event_type: actionType as any,
          game_time: gameTimeSeconds,
          period: storeGame.currentPeriodIndex + 1,
        } as any);
      }
    } catch (err: any) {
      console.error("Failed to record player action:", err);
    }
  };

  const handleQuickPlayerAction = props.handleQuickPlayerAction ?? defaultQuickPlayerAction;

  return (
    <Card variant="outlined" padding="sm" className="shrink-0 flex flex-col bg-surface shadow-xs rounded-xl p-2.5 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between border-b border-border/40 pb-1.5 px-1.5">
        <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-text flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Players On Field ({onFieldCount})</span>
        </h3>
        {props.subOutId && (
          <span className="text-[8px] uppercase font-black text-rose-500 animate-pulse bg-rose-50 border border-rose-500/20 px-1.5 py-0.25 rounded">
            Select game changer row below to swap
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2 pt-1.5 overflow-hidden">
        {/* GOALKEEPER SECTION */}
        {onFieldGks.length > 0 && (
          <div className="shrink-0 space-y-0.5">
            <span className="text-[9px] uppercase font-black text-muted tracking-wider px-1">Goalkeeper</span>
            <LivePlayerTable
              players={onFieldGks}
              tableType="gk"
              subSelectedId={props.subOutId ?? null}
              pendingSubsList={pendingSubsList}
              gameTimeSeconds={gameTimeSeconds}
              calculateTotalTimeOnField={calculateTotalTimeOnField}
              calculateSecondaryTime={calculateCurrentTimeOnField}
              getPlayerStats={getPlayerStats}
              onSelectPlayer={props.setSubOutId}
              onQuickAction={handleQuickPlayerAction}
            />
          </div>
        )}

        {/* FIELD PLAYERS SECTION */}
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase font-black text-muted tracking-wider px-1">Field Players</span>
          <LivePlayerTable
            players={onFieldFlds}
            tableType="field"
            subSelectedId={props.subOutId ?? null}
            pendingSubsList={pendingSubsList}
            gameTimeSeconds={gameTimeSeconds}
            calculateTotalTimeOnField={calculateTotalTimeOnField}
            calculateSecondaryTime={calculateCurrentTimeOnField}
            getPlayerStats={getPlayerStats}
            onSelectPlayer={props.setSubOutId}
            onQuickAction={handleQuickPlayerAction}
          />
        </div>
      </div>
    </Card>
  );
}
