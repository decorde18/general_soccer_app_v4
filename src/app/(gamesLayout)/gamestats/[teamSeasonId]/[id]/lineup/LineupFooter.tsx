"use client";

import React, { useState } from "react";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { saveGameLineup } from "@/lib/actions/gameLineup-actions";
import { toast } from "sonner";
import LineupJerseyCheckModal, { JerseyIssuePlayer } from "./LineupJerseyCheckModal";

export default function LineupFooter() {
  const params = useParams();
  const id = params.id as string;
  const teamSeasonId = params.teamSeasonId as string;

  const players = useGamePlayersStore((s) => s.players);
  const setPlayers = useGamePlayersStore((s) => s.setPlayers);
  const game = useGameStore((s) => s.game);
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [showJerseyModal, setShowJerseyModal] = useState(false);
  const [jerseyIssues, setJerseyIssues] = useState<JerseyIssuePlayer[]>([]);

  if (!game) return null;

  // Calculate stats
  const startersCount = players.filter((p) => p.gameStatus === "starter").length;
  const hasGoalkeeper = !!players.find((p) => p.gameStatus === "goalkeeper");
  const totalFieldPlayers = game.settings.playersOnField - 1; // Field players excluding GK
  const totalStartersRequired = game.settings.playersOnField;

  const isComplete = startersCount === totalFieldPlayers && hasGoalkeeper;

  const executeSave = async (updatedPlayers = players) => {
    setIsSaving(true);
    try {
      const playerStatuses = updatedPlayers.map((p) => ({
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

  const handleConfirmLineup = () => {
    // Check for missing or duplicate jersey numbers among starters & goalkeeper
    const starters = players.filter(
      (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper"
    );

    const counts = new Map<string, number>();
    starters.forEach((p) => {
      if (p.jerseyNumber != null && String(p.jerseyNumber).trim() !== "") {
        const key = String(p.jerseyNumber);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });

    const issues: JerseyIssuePlayer[] = [];
    starters.forEach((p) => {
      const hasNumber = p.jerseyNumber != null && String(p.jerseyNumber).trim() !== "";
      if (!hasNumber) {
        issues.push({
          id: Number(p.id),
          fullName: p.fullName,
          jerseyNumber: null,
          gameStatus: p.gameStatus,
          issue: "missing",
        });
      } else if ((counts.get(String(p.jerseyNumber)) || 0) > 1) {
        issues.push({
          id: Number(p.id),
          fullName: p.fullName,
          jerseyNumber: p.jerseyNumber,
          gameStatus: p.gameStatus,
          issue: "duplicate",
        });
      }
    });

    if (issues.length > 0) {
      setJerseyIssues(issues);
      setShowJerseyModal(true);
    } else {
      executeSave();
    }
  };

  const handleModalConfirm = (assigned: { playerId: number; jerseyNumber: number }[]) => {
    setShowJerseyModal(false);
    const updated = players.map((p) => {
      const found = assigned.find((a) => a.playerId === Number(p.id));
      if (found) {
        return { ...p, jerseyNumber: found.jerseyNumber };
      }
      return p;
    });
    setPlayers(updated);
    executeSave(updated);
  };

  const handleProceedAnyway = () => {
    setShowJerseyModal(false);
    executeSave();
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
          onClick={() => router.push(`/gamestats/${teamSeasonId}/${id}`)}
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

      <LineupJerseyCheckModal
        isOpen={showJerseyModal}
        onClose={() => setShowJerseyModal(false)}
        teamSeasonId={Number(teamSeasonId)}
        issuePlayers={jerseyIssues}
        onConfirm={handleModalConfirm}
        onProceedAnyway={handleProceedAnyway}
      />
    </div>
  );
}
