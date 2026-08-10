"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Player } from "@/stores/gamePlayersStore";

interface RefOverrideModalProps {
  player: Player | null;
  reason?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOverride: (player: Player) => void;
}

export default function RefOverrideModal({
  player,
  reason,
  isOpen,
  onClose,
  onConfirmOverride,
}: RefOverrideModalProps) {
  if (!player || !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Substitution Re-Entry Restriction"
      subtitle="Re-entry limit reached under match rules"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
          <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm">
              #{player.jerseyNumber || "?"} {player.fullName}
            </h4>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Restriction: <span className="font-bold">{reason || "Re-entry limit reached"}</span>
            </p>
          </div>
        </div>

        <p className="text-muted leading-relaxed">
          Standard match rules prevent this player from re-entering the field. If the referee has granted an official exception (such as a <span className="font-extrabold text-text">head injury / concussion evaluation</span> or referee waiver), you may override this restriction.
        </p>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onConfirmOverride(player);
              onClose();
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            <AlertTriangle size={14} className="mr-1 inline-block" />
            Override & Allow Sub
          </Button>
        </div>
      </div>
    </Modal>
  );
}
