"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { ArrowLeftRight, Check, AlertCircle } from "lucide-react";
import useGamePlayersStore, { Player } from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { toast } from "sonner";
import { saveGameCache } from "@/lib/offline/offlineSync";

interface LineupReconcileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LineupReconcileModal({
  isOpen,
  onClose,
}: LineupReconcileModalProps) {
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [selectedBenchId, setSelectedBenchId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const eligiblePlayers = players.filter(
    (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed"
  );

  const onFieldPlayers = eligiblePlayers.filter(
    (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk"
  );
  const benchPlayers = eligiblePlayers.filter((p) => p.fieldStatus === "onBench");

  const selectedFieldPlayer = onFieldPlayers.find(
    (p) => String(p.playerGameId) === selectedFieldId
  );
  const selectedBenchPlayer = benchPlayers.find(
    (p) => String(p.playerGameId) === selectedBenchId
  );

  const handleSwap = async () => {
    if (!selectedFieldPlayer || !selectedBenchPlayer || !game) return;

    setIsSubmitting(true);
    try {
      const gameTime = useGameStore.getState().getGameTime();
      const currentPeriod = useGameStore.getState().getCurrentPeriodNumber();

      const res = await fetch("/api/game_subs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: Number(game.game_id || game.id),
          in_player_id: Number(selectedBenchPlayer.playerGameId),
          out_player_id: Number(selectedFieldPlayer.playerGameId),
          sub_time: gameTime,
          period: currentPeriod,
          gk_sub: selectedFieldPlayer.fieldStatus === "onFieldGk" ? 1 : 0,
          is_swap: 1,
        }),
      }).then((r) => r.json());

      const subId = res?.id || `swap_${Date.now()}`;

      const calculateFieldStatus = useGamePlayersStore.getState().calculateFieldStatus;
      useGamePlayersStore.getState().setPlayers(
        players.map((p) => {
          if (String(p.playerGameId) === String(selectedBenchPlayer.playerGameId)) {
            const updatedIns = [
              ...(p.ins || []),
              {
                gameTime,
                subId,
                gkSub: selectedFieldPlayer.fieldStatus === "onFieldGk",
                isSwap: true,
                period: currentPeriod,
              },
            ];
            const updated = {
              ...p,
              ins: updatedIns,
              gameStatus:
                selectedFieldPlayer.fieldStatus === "onFieldGk"
                  ? "goalkeeper"
                  : p.gameStatus,
            };
            return {
              ...updated,
              fieldStatus: calculateFieldStatus(updated),
            };
          }
          if (String(p.playerGameId) === String(selectedFieldPlayer.playerGameId)) {
            const updatedOuts = [
              ...(p.outs || []),
              {
                gameTime,
                subId,
                gkSub: selectedFieldPlayer.fieldStatus === "onFieldGk",
                isSwap: true,
                period: currentPeriod,
              },
            ];
            const updated = {
              ...p,
              outs: updatedOuts,
            };
            return {
              ...updated,
              fieldStatus: calculateFieldStatus(updated),
            };
          }
          return p;
        })
      );

      saveGameCache(
        game.game_id || game.id || "",
        useGameStore.getState().game,
        useGamePlayersStore.getState().players
      );

      toast.success(
        `Lineup reconciled! #${selectedBenchPlayer.jerseyNumber || "?"} ${selectedBenchPlayer.fullName} is now On Field, #${selectedFieldPlayer.jerseyNumber || "?"} ${selectedFieldPlayer.fullName} is now on Bench.`
      );
      setSelectedFieldId("");
      setSelectedBenchId("");
      onClose();
    } catch (err: any) {
      toast.error("Failed to reconcile lineup: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reconcile Lineup & Field Status"
      subtitle="Correct who is physically on the field vs on the bench"
    >
      <div className="space-y-4 text-xs">
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Use this tool when real-life players on the pitch are out of sync with the app (e.g. a substitution was missed or deleted). Select one player to move to the bench and one player to move to the field.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 min-h-[220px] max-h-[350px]">
          {/* Currently On Field */}
          <div className="flex flex-col border border-border/50 rounded-xl p-2.5 bg-background/50">
            <span className="font-extrabold uppercase text-[10px] text-rose-500 tracking-wider mb-2 flex items-center justify-between">
              <span>Exit To Bench ({onFieldPlayers.length})</span>
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {onFieldPlayers.map((p) => {
                const isSelected = selectedFieldId === String(p.playerGameId);
                return (
                  <button
                    key={p.playerGameId}
                    type="button"
                    onClick={() =>
                      setSelectedFieldId(isSelected ? "" : String(p.playerGameId))
                    }
                    className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      isSelected
                        ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold shadow-2xs"
                        : "bg-surface hover:bg-surface/80 border-border/40 text-text font-medium"
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-mono font-bold mr-1.5">
                        #{p.jerseyNumber || "?"}
                      </span>
                      <span>{p.fullName}</span>
                      {p.fieldStatus === "onFieldGk" && (
                        <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-black">
                          GK
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currently On Bench */}
          <div className="flex flex-col border border-border/50 rounded-xl p-2.5 bg-background/50">
            <span className="font-extrabold uppercase text-[10px] text-emerald-500 tracking-wider mb-2 flex items-center justify-between">
              <span>Enter To Field ({benchPlayers.length})</span>
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {benchPlayers.map((p) => {
                const isSelected = selectedBenchId === String(p.playerGameId);
                return (
                  <button
                    key={p.playerGameId}
                    type="button"
                    onClick={() =>
                      setSelectedBenchId(isSelected ? "" : String(p.playerGameId))
                    }
                    className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-2xs"
                        : "bg-surface hover:bg-surface/80 border-border/40 text-text font-medium"
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-mono font-bold mr-1.5">
                        #{p.jerseyNumber || "?"}
                      </span>
                      <span>{p.fullName}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Summary Preview */}
        {selectedFieldPlayer && selectedBenchPlayer && (
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-rose-500">
              #{selectedFieldPlayer.jerseyNumber} {selectedFieldPlayer.fullName} (To Bench)
            </span>
            <ArrowLeftRight size={14} className="text-indigo-400 shrink-0 mx-2" />
            <span className="font-bold text-emerald-500 text-right">
              #{selectedBenchPlayer.jerseyNumber} {selectedBenchPlayer.fullName} (To Field)
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSwap}
            disabled={!selectedFieldPlayer || !selectedBenchPlayer || isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Reconciling..." : "Swap Field / Bench Status"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
