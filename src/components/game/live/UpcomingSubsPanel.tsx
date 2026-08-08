"use client";

import React, { useState } from "react";
import { Users, Check, Trash2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Player } from "@/stores/gamePlayersStore";
import { PendingSub } from "@/stores/gameSubsStore";

interface UpcomingSubsPanelProps {
  pendingSubsList: PendingSub[];
  players: Player[];
  onConfirmSingleSub: (subId: string | number) => void;
  onCancelSub: (subId: string | number) => void;
  onConfirmAllSubs: () => void;
  onEditSub?: (subId: string | number, inPlayerId: string | number, outPlayerId: string | number) => void;
}

export default function UpcomingSubsPanel({
  pendingSubsList,
  players,
  onConfirmSingleSub,
  onCancelSub,
  onConfirmAllSubs,
  onEditSub,
}: UpcomingSubsPanelProps) {
  // Edit Pending Sub Modal state
  const [editingSub, setEditingSub] = useState<PendingSub | null>(null);
  const [editInId, setEditInId] = useState<string>("");
  const [editOutId, setEditOutId] = useState<string>("");

  const handleOpenEdit = (sub: PendingSub) => {
    setEditingSub(sub);
    setEditInId(sub.inPlayerId ? String(sub.inPlayerId) : "");
    setEditOutId(sub.outPlayerId ? String(sub.outPlayerId) : "");
  };

  const handleSaveEdit = () => {
    if (editingSub && onEditSub && (editInId || editOutId)) {
      onEditSub(editingSub.subId, editInId, editOutId);
    }
    setEditingSub(null);
  };

  const eligiblePlayers = players.filter(
    (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed"
  );

  const onFieldOptions = eligiblePlayers
    .filter((p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk" || p.gameStatus === "starter" || p.gameStatus === "goalkeeper")
    .map((p) => ({ value: String(p.playerGameId), label: `#${p.jerseyNumber || "?"} ${p.fullName} (On Field)` }));

  const benchOptions = eligiblePlayers
    .filter((p) => p.fieldStatus === "onBench" && p.gameStatus === "dressed")
    .map((p) => ({ value: String(p.playerGameId), label: `#${p.jerseyNumber || "?"} ${p.fullName} (Bench)` }));

  const getValue = (val: any) => (typeof val === "string" ? val : val?.target?.value ?? "");

  return (
    <Card variant="outlined" padding="sm" className="flex-1 min-h-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
      <div className="flex items-center justify-between border-b border-border/40 pb-1 px-1 shrink-0">
        <div className="flex items-center gap-1">
          <Users size={11} className="text-primary" />
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-text">Upcoming Subs ({pendingSubsList.length})</span>
        </div>
        {pendingSubsList.length > 0 && (
          <button
            onClick={onConfirmAllSubs}
            className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] rounded-md transition-colors cursor-pointer"
          >
            Enter All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1 mt-1.5 space-y-1.5 text-[9px] min-h-0">
        {pendingSubsList.length === 0 ? (
          <p className="text-muted text-center py-6">No pending subs in queue.</p>
        ) : (
          pendingSubsList.map((sub) => {
            const inPl = players.find((p) => Number(p.playerGameId) === Number(sub.inPlayerId));
            const outPl = players.find((p) => Number(p.playerGameId) === Number(sub.outPlayerId));

            return (
              <div key={sub.subId} className="flex flex-col gap-1 p-2 border border-border/40 bg-background/60 rounded-lg shadow-2xs animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-text">
                  <span className="truncate">Out: <span className="text-rose-600 dark:text-rose-400 font-extrabold">{outPl?.fullName || "Unknown"}</span></span>
                  <span className="text-muted font-mono shrink-0">🔄</span>
                  <span className="truncate text-right">In: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{inPl?.fullName || "Unknown"}</span></span>
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/20">
                  <button
                    aria-label="Edit Pending Sub"
                    onClick={() => handleOpenEdit(sub)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 rounded text-[9px] font-bold cursor-pointer transition-colors"
                    title="Edit Sub"
                  >
                    <Pencil size={10} /> Edit
                  </button>
                  <button
                    aria-label="Confirm Sub"
                    onClick={() => onConfirmSingleSub(sub.subId)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded text-[9px] font-bold cursor-pointer transition-colors"
                    title="Confirm Sub"
                  >
                    <Check size={10} /> Enter
                  </button>
                  <button
                    aria-label="Cancel Sub"
                    onClick={() => onCancelSub(sub.subId)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded text-[9px] font-bold cursor-pointer transition-colors"
                    title="Cancel Sub"
                  >
                    <Trash2 size={10} /> Cancel
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Pending Sub Modal */}
      {editingSub && (
        <Modal
          isOpen={Boolean(editingSub)}
          onClose={() => setEditingSub(null)}
          title="Edit Pending Substitution"
          subtitle="Change players for this queued substitution"
        >
          <div className="space-y-4 text-xs">
            <Select
              label="Player Going Out"
              value={editOutId}
              onChange={(e: any) => setEditOutId(getValue(e))}
              options={[{ value: "", label: "-- Select Player Out --" }, ...onFieldOptions]}
            />

            <Select
              label="Player Coming In"
              value={editInId}
              onChange={(e: any) => setEditInId(getValue(e))}
              options={[{ value: "", label: "-- Select Player In --" }, ...benchOptions]}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingSub(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
