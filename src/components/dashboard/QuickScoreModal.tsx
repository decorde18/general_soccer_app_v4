"use client";

import React, { useState, useTransition } from "react";
import { Trophy, CheckCircle, AlertTriangle, X } from "lucide-react";
import { recordQuickScore } from "@/lib/actions/quickScore-actions";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted hover:text-text rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-primary">
          <Trophy size={20} />
          <h3 className="font-extrabold text-base text-text">Quick Score Entry</h3>
        </div>

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
          <div className="flex items-center justify-between p-3 bg-background/40 border border-border/60 rounded-xl">
            <div>
              <p className="text-xs font-bold text-text">Counts for League Standings</p>
              <p className="text-[10px] text-muted">Include this match result in official standings calculations</p>
            </div>
            <input
              type="checkbox"
              checked={countsForStandings}
              onChange={(e) => setCountsForStandings(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-muted hover:text-text rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              <CheckCircle size={15} />
              <span>{isPending ? "Saving..." : "Save Match Score"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
