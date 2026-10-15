"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { AlertTriangle, Hash } from "lucide-react";
import { updateLineupPlayerJerseys } from "@/lib/actions/gameLineup-actions";
import { toast } from "sonner";

export interface JerseyIssuePlayer {
  id: number;
  fullName: string;
  jerseyNumber: number | string | null;
  gameStatus: string;
  issue: "missing" | "duplicate";
}

interface LineupJerseyCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamSeasonId: number;
  issuePlayers: JerseyIssuePlayer[];
  onConfirm: (assignedJerseys: { playerId: number; jerseyNumber: number }[]) => void;
  onProceedAnyway: () => void;
}

export default function LineupJerseyCheckModal({
  isOpen,
  onClose,
  teamSeasonId,
  issuePlayers,
  onConfirm,
  onProceedAnyway,
}: LineupJerseyCheckModalProps) {
  const [jerseyValues, setJerseyValues] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    issuePlayers.forEach((p) => {
      initial[p.id] = p.jerseyNumber != null ? String(p.jerseyNumber) : "";
    });
    return initial;
  });

  const [applyPermanently, setApplyPermanently] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleJerseyChange = (playerId: number, val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 3);
    setJerseyValues((prev) => ({ ...prev, [playerId]: cleaned }));
  };

  const handleSaveAndProceed = async () => {
    setIsSubmitting(true);
    try {
      const assignments = Object.entries(jerseyValues)
        .filter(([_, val]) => val.trim() !== "")
        .map(([pid, val]) => ({
          playerId: Number(pid),
          jerseyNumber: parseInt(val, 10),
          applyToSeason: applyPermanently,
        }));

      if (assignments.length > 0 && applyPermanently) {
        await updateLineupPlayerJerseys(teamSeasonId, assignments);
      }

      onConfirm(assignments.map((a) => ({ playerId: a.playerId, jerseyNumber: a.jerseyNumber })));
      toast.success("Jersey numbers updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update jersey numbers");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Jersey Number Verification"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onProceedAnyway}
            disabled={isSubmitting}
          >
            Skip & Proceed Anyway
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAndProceed}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Save & Continue to Match
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-text">
              Some starting players have missing or duplicate jersey numbers.
            </p>
            <p className="text-muted mt-0.5">
              Accurate jersey numbers make tracking live substitutions, goals, and cards seamless during the game.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {issuePlayers.map((player) => {
            const isDup = player.issue === "duplicate";
            return (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-2.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text">
                      {player.fullName}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isDup ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"
                    }`}>
                      {isDup ? "Duplicate #" : "No Jersey #"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted capitalize">
                    {player.gameStatus === "goalkeeper" ? "Goalkeeper" : "Starting Field Player"}
                  </span>
                </div>

                <div className="w-24">
                  <Input
                    placeholder="#"
                    size="sm"
                    value={jerseyValues[player.id] ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleJerseyChange(player.id, e.target.value)
                    }
                    className="text-center font-bold"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border">
          <Checkbox
            id="applyPermanent"
            checked={applyPermanently}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setApplyPermanently(e.target.checked)
            }
            label="Save jersey numbers permanently to team roster"
          />
        </div>
      </div>
    </Modal>
  );
}
