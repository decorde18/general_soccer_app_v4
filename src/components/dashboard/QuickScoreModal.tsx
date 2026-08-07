import React, { useState, useTransition } from "react";
import { Trophy, CheckCircle, AlertTriangle } from "lucide-react";
import { recordQuickScore } from "@/lib/actions/quickScore-actions";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";

interface QuickScoreModalProps {
  gameId: number;
  homeTeamName: string;
  awayTeamName: string;
  currentHomeScore?: number | null;
  currentAwayScore?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickScoreModal({
  gameId,
  homeTeamName,
  awayTeamName,
  currentHomeScore = 0,
  currentAwayScore = 0,
  onClose,
  onSuccess,
}: QuickScoreModalProps) {
  const [homeScore, setHomeScore] = useState<number>(currentHomeScore ?? 0);
  const [awayScore, setAwayScore] = useState<number>(currentAwayScore ?? 0);
  const [countsForStandings, setCountsForStandings] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await recordQuickScore({
          gameId,
          homeScore,
          awayScore,
          countsForStandings,
        });
        if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to record quick score.");
      }
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Quick Score Entry"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-1.5"
          >
            <CheckCircle size={15} />
            <span>{isPending ? "Saving..." : "Save Match Score"}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 items-center bg-background/50 border border-border/70 p-4 rounded-xl">
            {/* Home Score */}
            <div className="text-center space-y-1.5">
              <label className="text-xs font-bold text-text truncate block">{homeTeamName}</label>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Home</span>
              <input
                type="number"
                min="0"
                max="99"
                value={homeScore}
                onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 text-center font-black text-2xl py-2 mx-auto bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text"
              />
            </div>

            {/* Away Score */}
            <div className="text-center space-y-1.5">
              <label className="text-xs font-bold text-text truncate block">{awayTeamName}</label>
              <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Away</span>
              <input
                type="number"
                min="0"
                max="99"
                value={awayScore}
                onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 text-center font-black text-2xl py-2 mx-auto bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text"
              />
            </div>
          </div>

          {/* Standings Inclusion Toggle */}
          <div className="p-3 bg-background/40 border border-border/60 rounded-xl">
            <Checkbox
              label="Counts for League Standings (Include this match result in official standings calculations)"
              checked={countsForStandings}
              onChange={(e: any) => setCountsForStandings(e.target.checked)}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
