"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, BarChart2, Shield, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";

export default function GameSummaryClient() {
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);
  const calculateTotalTimeOnField = useGamePlayerTimeStore((s) => s.calculateTotalTimeOnField);
  const calculateAllGoalkeeperTime = useGamePlayerTimeStore((s) => s.calculateAllGoalkeeperTime);

  if (!game) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading game summary...
      </div>
    );
  }

  // Calculate current match time for minute calculations
  const gameTimeSeconds = useGameStore.getState().getGameTime() || 0;
  const gkTimesMap = calculateAllGoalkeeperTime(game.id || game.game_id || "", gameTimeSeconds);

  // Aggregate team stats
  const goalsFor = game.goalsFor ?? 0;
  const goalsAgainst = game.goalsAgainst ?? 0;

  const yellowCardsCount = game.gameEventsDiscipline?.filter((d) => d.card_type === "yellow").length || 0;
  const redCardsCount = game.gameEventsDiscipline?.filter((d) => d.card_type === "red" || d.card_type === "yellow_red").length || 0;

  // Separate Goalkeepers vs Field Players
  const goalkeepers = players.filter(
    (p) => p.gameStatus === "goalkeeper" || p.saves > 0 || (gkTimesMap[p.id] || 0) > 0 || p.goalkeeperTime > 0
  );

  const fieldPlayers = players.filter(
    (p) => calculateTotalTimeOnField(p, gameTimeSeconds) > 0 || p.gameStatus === "starter" || p.gameStatus === "dressed" || p.gameStatus === "goalkeeper"
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* HOME TEAM */}
          <div className="flex items-center gap-4 text-left">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-extrabold text-primary text-xl">
              ⚽
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Home</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text">{game.ourName}</h2>
            </div>
          </div>

          {/* FINAL SCORE */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-widest border border-primary/20">
              Final Match Result
            </span>
            <div className="flex items-center gap-4 font-mono font-black text-5xl sm:text-6xl text-text tracking-tighter">
              <span>{goalsFor}</span>
              <span className="text-muted/40">:</span>
              <span>{goalsAgainst}</span>
            </div>

            {Boolean(game.id || game.game_id) && Boolean(game.teamSeasonId || game.home_team_season_id) && (
              <Link
                href={`/gamestats/${game.teamSeasonId || game.home_team_season_id}/${game.id || game.game_id}/manage`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-all mt-1"
                title="Edit match clocks, substitutions, goals, and disciplinary logs"
              >
                <Pencil size={13} />
                <span>Edit Match Details & Clocks</span>
              </Link>
            )}
          </div>

          {/* AWAY TEAM */}
          <div className="flex items-center gap-4 text-right flex-row-reverse">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-extrabold text-accent text-xl">
              🛡️
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Away</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text">{game.opponentName}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* TEAM STAT COMPARISON TABLE */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <BarChart2 size={16} className="text-primary" />
          <h3 className="font-extrabold text-sm text-text uppercase tracking-wider">
            Match Statistical Breakdown
          </h3>
        </div>

        <div className="space-y-3 text-xs font-semibold">
          {/* Goals */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-background/50">
            <span className="font-mono font-black text-primary text-base">{goalsFor}</span>
            <span className="text-muted text-[11px] font-bold uppercase">Goals Scored</span>
            <span className="font-mono font-black text-accent text-base">{goalsAgainst}</span>
          </div>

          {/* Yellow Cards */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-background/50">
            <span className="font-mono font-bold text-text">{yellowCardsCount}</span>
            <span className="text-muted text-[11px] font-bold uppercase">Yellow Cards</span>
            <span className="font-mono font-bold text-text">0</span>
          </div>

          {/* Red Cards */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-background/50">
            <span className="font-mono font-bold text-text">{redCardsCount}</span>
            <span className="text-muted text-[11px] font-bold uppercase">Red Cards</span>
            <span className="font-mono font-bold text-text">0</span>
          </div>
        </div>
      </Card>

      {/* FIELD PLAYERS BOX SCORE TABLE */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <Users size={16} className="text-primary" />
          <h3 className="font-extrabold text-sm text-text uppercase tracking-wider">
            Field Players Box Score
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-background/60 text-[10px] font-bold uppercase text-muted">
                <th className="p-3">#</th>
                <th className="p-3">Player Name</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">MIN</th>
                <th className="p-3 text-center">+/-</th>
                <th className="p-3 text-center">Goals</th>
                <th className="p-3 text-center">Assists</th>
                <th className="p-3 text-center">Shots</th>
                <th className="p-3 text-center">Cards</th>
              </tr>
            </thead>
            <tbody>
              {fieldPlayers.map((p) => {
                const totalSec = calculateTotalTimeOnField(p, gameTimeSeconds);
                const plusMinusStr = p.plusMinus > 0 ? `+${p.plusMinus}` : String(p.plusMinus || 0);

                return (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-background/25">
                    <td className="p-3 font-mono font-bold text-primary">#{p.jerseyNumber || "?"}</td>
                    <td className="p-3 font-bold text-text">{p.fullName}</td>
                    <td className="p-3 text-center capitalize text-muted text-[10px] font-bold">
                      {p.gameStatus}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-text">
                      {formatSecondsToMmss(totalSec)}
                    </td>
                    <td className="p-3 text-center font-mono font-black text-slate-600">
                      {plusMinusStr}
                    </td>
                    <td className="p-3 text-center font-bold text-text">{p.goals || 0}</td>
                    <td className="p-3 text-center font-bold text-text">{p.assists || 0}</td>
                    <td className="p-3 text-center font-bold text-muted">{p.shots || 0}</td>
                    <td className="p-3 text-center font-bold text-text">
                      {p.yellowCards > 0 && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 rounded mr-1">Y</span>}
                      {p.redCards > 0 && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-600 rounded">R</span>}
                      {!p.yellowCards && !p.redCards && "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* GOALKEEPERS BOX SCORE TABLE */}
      {goalkeepers.length > 0 && (
        <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <Shield size={16} className="text-emerald-600" />
            <h3 className="font-extrabold text-sm text-text uppercase tracking-wider">
              Goalkeepers Box Score
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-background/60 text-[10px] font-bold uppercase text-muted">
                  <th className="p-3">#</th>
                  <th className="p-3">Keeper Name</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Total MIN</th>
                  <th className="p-3 text-right">MIN in Goal</th>
                  <th className="p-3 text-center">Saves</th>
                  <th className="p-3 text-center">GA</th>
                  <th className="p-3 text-center">Clean Sheet</th>
                  <th className="p-3 text-center">Cards</th>
                </tr>
              </thead>
              <tbody>
                {goalkeepers.map((p) => {
                  const totalSec = calculateTotalTimeOnField(p, gameTimeSeconds);
                  const gkSec = gkTimesMap[p.id] || p.goalkeeperTime || 0;

                  return (
                    <tr key={p.id} className="border-b border-border/40 hover:bg-background/25">
                      <td className="p-3 font-mono font-bold text-emerald-600">#{p.jerseyNumber || "?"}</td>
                      <td className="p-3 font-bold text-text">{p.fullName}</td>
                      <td className="p-3 text-center capitalize text-muted text-[10px] font-bold">
                        {p.gameStatus}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-text">
                        {formatSecondsToMmss(totalSec)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        {formatSecondsToMmss(gkSec)}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">{p.saves || 0}</td>
                      <td className="p-3 text-center font-mono font-bold text-rose-500">{p.goalsAgainst || 0}</td>
                      <td className="p-3 text-center font-bold text-text">{p.cleanSheet ? "Yes" : "No"}</td>
                      <td className="p-3 text-center font-bold text-text">
                        {p.yellowCards > 0 && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 rounded mr-1">Y</span>}
                        {p.redCards > 0 && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-600 rounded">R</span>}
                        {!p.yellowCards && !p.redCards && "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
