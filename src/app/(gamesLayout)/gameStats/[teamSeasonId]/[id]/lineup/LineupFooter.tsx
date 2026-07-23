"use client";

import React, { useState } from "react";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { saveGameLineup } from "@/lib/actions/gameLineup-actions";
import { toast } from "sonner";

export default function LineupFooter() {
  const params = useParams();
  const id = params.id as string;
  const teamSeasonId = params.teamSeasonId as string;

  const players = useGamePlayersStore((s) => s.players);
  const game = useGameStore((s) => s.game);
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  if (!game) return null;

  // Calculate stats
  const startersCount = players.filter((p) => p.gameStatus === "starter").length;
  const hasGoalkeeper = !!players.find((p) => p.gameStatus === "goalkeeper");
  const totalFieldPlayers = game.settings.playersOnField - 1; // Field players excluding GK
  const totalStartersRequired = game.settings.playersOnField;

  const isComplete = startersCount === totalFieldPlayers && hasGoalkeeper;

  const handleConfirmLineup = async () => {
    setIsSaving(true);
    try {
      const playerStatuses = players.map((p) => ({
        id: Number(p.id),
        gameStatus: p.gameStatus,
        isGuest: p.isGuest,
      }));

      const res = await saveGameLineup(Number(id), Number(teamSeasonId), playerStatuses);
      if (res.success) {
        toast.success("Lineup confirmed and saved!");
        // Route to the live match center or overview
        router.push(`/gamestats/${teamSeasonId}/${id}/live`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save lineup");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-8 flex flex-col items-center w-full select-none">
      {/* Requirement Checklist */}
      <div className="mb-4 flex gap-4 text-[0.7rem] font-bold uppercase tracking-wider">
        <div
          className={
            startersCount === totalFieldPlayers
              ? "text-success flex items-center gap-1"
              : "text-muted flex items-center gap-1"
          }
        >
          <span>
            {startersCount}/{totalFieldPlayers} Field Players
          </span>
          {startersCount === totalFieldPlayers && <span>✓</span>}
        </div>
        <div className={hasGoalkeeper ? "text-success flex items-center gap-1" : "text-danger flex items-center gap-1 animate-pulse"}>
          <span>Goalkeeper</span>
          {hasGoalkeeper ? <span>✓</span> : <span className="text-[9px] lowercase bg-danger/10 px-1 py-0.5 rounded border border-danger/25">required</span>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md px-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSaving}
          className="py-4 !rounded-2xl shadow-sm border-2"
        >
          Back
        </Button>

        <Button
          variant={isComplete ? "success" : "secondary"}
          onClick={handleConfirmLineup}
          disabled={!isComplete || isSaving}
          className="py-4 !rounded-2xl shadow-sm flex flex-col leading-tight"
        >
          <span>{isSaving ? "Saving..." : isComplete ? "Confirm Lineup" : "Set Lineup"}</span>
          <span className="text-[10px] opacity-80 font-medium mt-0.5">
            {startersCount + (hasGoalkeeper ? 1 : 0)} / {totalStartersRequired} Selected
          </span>
        </Button>
      </div>
    </div>
  );
}
