"use client";

import React from "react";
import { Player } from "@/stores/gamePlayersStore";
import { PendingSub } from "@/stores/gameSubsStore";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";
import useGameStore from "@/stores/gameStore";
import { checkPlayerSubEligibility } from "@/lib/utils/subRules";

export interface LivePlayerTableProps {
  players: Player[];
  tableType: "gk" | "field" | "bench";
  subSelectedId: string | null;
  pendingSubsList: PendingSub[];
  gameTimeSeconds: number;
  calculateTotalTimeOnField: (player: Player, nowSec: number) => number;
  calculateSecondaryTime: (player: Player, nowSec: number) => number;
  getPlayerStats: (player: Player) => {
    shots: number;
    saves: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    goalsAgainst: number;
  };
  onSelectPlayer?: (id: string | null) => void;
  onQuickAction?: (playerId: string | number, actionType: "shot" | "save") => void;
  onAttemptIneligibleSelect?: (player: Player, reason: string) => void;
  overridePlayerIds?: Set<string | number>;
}

export default function LivePlayerTable({
  players,
  tableType,
  subSelectedId,
  pendingSubsList,
  gameTimeSeconds,
  calculateTotalTimeOnField,
  calculateSecondaryTime,
  getPlayerStats,
  onSelectPlayer,
  onQuickAction,
  onAttemptIneligibleSelect,
  overridePlayerIds,
}: LivePlayerTableProps) {
  const isGk = tableType === "gk";
  const isBench = tableType === "bench";

  const gameStore = useGameStore.getState();
  const currentPeriod = (gameStore.game?.currentPeriodIndex ?? 0) + 1;
  const gameSettings = gameStore.game?.settings;

  return (
    <div className="border border-border/60 bg-background/25 rounded-lg p-1">
      <table className="w-full text-left select-none border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-border/40 text-muted uppercase font-black text-[9px] h-5.5">
            <th className="py-0.5 px-1.5 text-center w-8 align-middle">#</th>
            <th className="py-0.5 px-1.5 w-1/3 align-middle">Name</th>
            {isGk ? (
              <>
                <th className="py-0.5 px-1.5 text-right w-12 align-middle">Saves</th>
                <th className="py-0.5 px-1.5 text-right w-12 align-middle">GA</th>
              </>
            ) : (
              <>
                <th className="py-0.5 px-1.5 text-right w-10 align-middle">Shots</th>
                <th className="py-0.5 px-1.5 text-right w-10 align-middle">Goals</th>
                <th className="py-0.5 px-1.5 text-right w-10 align-middle">Assts</th>
              </>
            )}
            <th className="py-0.5 px-1.5 text-center w-10 align-middle">+/-</th>
            <th className="py-0.5 px-1.5 text-right w-16 align-middle">Total Time</th>
            <th className="py-0.5 px-1.5 text-right w-16 align-middle">
              {isBench ? "Bench Time" : "Shift Time"}
            </th>
            <th className="py-0.5 px-1.5 text-center w-36 align-middle">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {players.map((player) => {
            const isSelected = subSelectedId === String(player.id);
            const totalTime = calculateTotalTimeOnField(player, gameTimeSeconds);
            const secondaryTime = calculateSecondaryTime(player, gameTimeSeconds);
            const stats = getPlayerStats(player);
            (player as any).redCards = stats.redCards;
            const isRedCarded = stats.redCards > 0 || stats.yellowCards >= 2;

            const eligibility = isBench
              ? checkPlayerSubEligibility(player, gameSettings, currentPeriod, overridePlayerIds)
              : { isEligible: true, reason: undefined };

            const isExhausted = isBench && !eligibility.isEligible;

            // Instant pending check combining store state and pending queue
            const pGameId = Number(player.playerGameId);
            const isPendingOut =
              player.subStatus === "pendingOut" ||
              pendingSubsList.some((s) => Number(s.outPlayerId) === pGameId);
            const isPendingIn =
              player.subStatus === "pendingIn" ||
              pendingSubsList.some((s) => Number(s.inPlayerId) === pGameId);

            let rowClass = "hover:bg-background/60 transition-colors cursor-pointer text-text font-bold text-[11px] h-6.5";
            if (isRedCarded) {
              rowClass = "opacity-40 bg-slate-100 dark:bg-slate-900 pointer-events-none text-muted-foreground font-bold text-[11px] h-6.5";
            } else if (isExhausted) {
              rowClass = "opacity-55 bg-slate-100/70 dark:bg-slate-900/40 text-muted font-bold text-[11px] h-6.5 cursor-pointer hover:bg-slate-200/80 dark:hover:bg-slate-800/80";
            } else if (isSelected) {
              rowClass = isBench
                ? "bg-emerald-500/15 border-l-2 border-l-emerald-500 font-extrabold text-emerald-700 dark:text-emerald-300 cursor-pointer text-[11px] h-6.5"
                : "bg-rose-500/15 border-l-2 border-l-rose-500 font-extrabold text-rose-700 dark:text-rose-300 cursor-pointer text-[11px] h-6.5";
            } else if (isPendingOut) {
              rowClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-l-2 border-l-rose-500 font-bold text-[11px] h-6.5";
            } else if (isPendingIn) {
              rowClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-l-emerald-500 font-bold text-[11px] h-6.5";
            }

            return (
              <tr
                key={player.id}
                className={rowClass}
                onClick={() => {
                  if (isRedCarded || isPendingOut || isPendingIn) return;
                  if (isExhausted) {
                    onAttemptIneligibleSelect?.(player, eligibility.reason || "Re-entry limit reached");
                    return;
                  }
                  onSelectPlayer?.(isSelected ? null : String(player.id));
                }}
              >
                <td className="py-0.5 px-1.5 text-center font-bold font-mono align-middle">
                  {player.jerseyNumber || "—"}
                </td>
                <td className="py-0.5 px-1.5 font-bold truncate align-middle" title={player.fullName}>
                  <div className="flex items-center gap-1.5">
                    <span>{player.fullName}</span>
                    {Array.from({ length: stats.yellowCards }).map((_, idx) => (
                      <span
                        key={`y-${idx}`}
                        className="inline-block w-2.5 h-3.5 bg-amber-400 border border-amber-500 rounded-xs shrink-0 shadow-xs"
                        style={{ minWidth: "10px", minHeight: "14px" }}
                      />
                    ))}
                    {Array.from({ length: stats.redCards }).map((_, idx) => (
                      <span
                        key={`r-${idx}`}
                        className="inline-block w-2.5 h-3.5 bg-rose-500 border border-rose-600 rounded-xs shrink-0 shadow-xs"
                        style={{ minWidth: "10px", minHeight: "14px" }}
                      />
                    ))}
                  </div>
                </td>

                {isGk ? (
                  <>
                    <td className="py-0.5 px-1.5 text-right font-mono font-bold text-emerald-600 align-middle">
                      {stats.saves || "—"}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono font-bold text-rose-500 align-middle">
                      {stats.goalsAgainst || "—"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-0.5 px-1.5 text-right font-mono font-bold text-muted align-middle">
                      {stats.shots || "—"}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono font-bold text-primary align-middle">
                      {stats.goals || "—"}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono font-bold text-blue-600 align-middle">
                      {stats.assists || "—"}
                    </td>
                  </>
                )}

                <td className="py-0.5 px-1.5 text-center font-mono font-black text-slate-600 align-middle">
                  {player.plusMinus || 0}
                </td>
                <td className="py-0.5 px-1.5 text-right font-mono text-muted align-middle">
                  {formatSecondsToMmss(totalTime)}
                </td>
                <td
                  className={`py-0.5 px-1.5 text-right font-mono font-black align-middle ${
                    isBench ? "text-amber-600" : "text-primary"
                  }`}
                >
                  {formatSecondsToMmss(secondaryTime)}
                </td>

                <td className="py-0.5 px-1.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                  {isRedCarded ? (
                    <span className="text-[9px] font-bold text-rose-600 uppercase">SENT OFF</span>
                  ) : (
                    <div className="flex gap-1.5 justify-center items-center">
                      {!isBench && onQuickAction && (
                        <button
                          onClick={() => onQuickAction(player.id, isGk ? "save" : "shot")}
                          className={`px-2.5 py-0.5 bg-background border border-border/80 text-[10px] font-black rounded-md shadow-xs shrink-0 cursor-pointer ${
                            isGk ? "hover:border-emerald-500 text-emerald-700 dark:text-emerald-300" : "hover:border-primary text-text"
                          }`}
                        >
                          {isGk ? "SAVE" : "SHOT"}
                        </button>
                      )}

                      {isPendingOut ? (
                        <span className="inline-block text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 rounded uppercase tracking-tight">
                          Pending Out
                        </span>
                      ) : isPendingIn ? (
                        <span className="inline-block text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-tight">
                          Pending In
                        </span>
                      ) : isExhausted ? (
                        <button
                          onClick={() => onAttemptIneligibleSelect?.(player, eligibility.reason || "Re-entry limit reached")}
                          className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800 text-slate-500 text-[9px] font-bold rounded shadow-2xs hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          title={eligibility.reason || "Re-entry limit reached. Click to request ref override."}
                        >
                          Exhausted
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectPlayer?.(isSelected ? null : String(player.id))}
                          className={`px-2.5 py-0.5 border rounded-md text-[10px] font-black shadow-xs shrink-0 cursor-pointer ${
                            isBench
                              ? isSelected
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-primary text-white border-primary hover:bg-primary/95"
                              : isSelected
                              ? "bg-rose-500 text-white border-rose-500"
                              : "bg-background border-border text-rose-500 hover:bg-rose-500/10"
                          }`}
                        >
                          {isBench ? (isSelected ? "Selected" : "Sub In") : (isSelected ? "Selected" : "Sub Out")}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
