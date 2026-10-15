"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useRouter, useParams } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";

interface LineupValidationBannerProps {
  isLineupConfigured?: boolean;
  onFieldCount?: number;
  playersOnFieldSetting?: number;
  teamSeasonId?: string;
  gameId?: string;
}

export default function LineupValidationBanner(props: LineupValidationBannerProps) {
  const router = useRouter();
  const rawParams = typeof useParams === "function" ? useParams() : null;
  const params = (rawParams || {}) as { id?: string; teamSeasonId?: string };

  const storeGame = useGameStore((s) => s.game);
  const storePlayers = useGamePlayersStore((s) => s.players);

  const teamSeasonId = props.teamSeasonId ?? params?.teamSeasonId ?? "";
  const gameId = props.gameId ?? params?.id ?? "";
  const playersOnFieldSetting = props.playersOnFieldSetting ?? storeGame?.settings?.playersOnField ?? 11;

  const starterCount = storePlayers.filter((p) => p.gameStatus === "starter").length;
  const gkCount = storePlayers.filter((p) => p.gameStatus === "goalkeeper").length;
  const actualOnFieldCount = props.onFieldCount ?? (starterCount + gkCount);

  // Red card rule: team plays down only if the red-carded player was on the field
  const disciplineEvents = storeGame?.gameEventsDiscipline || [];
  const majorEvents = storeGame?.gameEventsMajor || [];
  const isPlayerOnFieldAtTime = useGamePlayerTimeStore.getState().isPlayerOnFieldAtTime;

  const onFieldRedCardCount = storePlayers.filter((p) => {
    const pGameId = String(p.playerGameId || p.id);
    const pCards = disciplineEvents.filter((d) => String(d.player_game_id) === pGameId);
    const redCards = pCards.filter((d) => d.card_type === "red" || d.card_type === "yellow_red");
    const yellowCards = pCards.filter((d) => d.card_type === "yellow");
    const hasRed = (p.redCards || 0) > 0 || redCards.length > 0 || (p.yellowCards || 0) >= 2 || yellowCards.length >= 2;
    if (!hasRed) return false;

    // A red card forces the team to play down ONLY if the player was on the field when disqualified
    const disqualifyingCard = redCards[0] || (yellowCards.length >= 2 ? yellowCards[1] : null);
    if (disqualifyingCard) {
      const cardTime = disqualifyingCard.game_time ?? majorEvents.find((m) => m.id === disqualifyingCard.major_event_id)?.game_time;
      if (cardTime !== undefined && cardTime !== null) {
        return isPlayerOnFieldAtTime(p, Number(cardTime));
      }
    }
    // Fallback: was player on field currently
    return p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk";
  }).length;

  const effectiveRequiredCount = Math.max(7, playersOnFieldSetting - onFieldRedCardCount);
  const isLineupConfigured = props.isLineupConfigured ?? (actualOnFieldCount === effectiveRequiredCount);

  if (isLineupConfigured) return null;

  return (
    <div className="shrink-0 p-2 border-l-4 border-l-amber-500 bg-amber-500/5 text-amber-800 dark:text-amber-300 rounded-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5 font-bold">
        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
        <span>
          Roster setup required: starting lineup size mismatch ({actualOnFieldCount}/{effectiveRequiredCount}).
        </span>
      </div>
      <Button
        variant="outline"
        size="xs"
        onClick={() => router.push(`/gamestats/${teamSeasonId}/${gameId}/lineup`)}
        className="text-[10px] h-5 py-0 px-2 text-amber-700 dark:text-amber-300 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20"
      >
        Configure Lineup
      </Button>
    </div>
  );
}
