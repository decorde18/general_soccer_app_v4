"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Trophy, CheckCircle, AlertTriangle, Plus, Trash2, Shield, Award, MessageSquare, Flag, ChevronDown, ChevronUp } from "lucide-react";
import {
  recordQuickScore,
  recordDetailedMatchScore,
  getGameRostersForQuickScore,
  GameRostersResult,
  RosterPlayerOption,
  DetailedGoalEntry,
  DetailedCardEntry,
} from "@/lib/actions/quickScore-actions";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

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
  const [entryMode, setEntryMode] = useState<"simple" | "detailed">("simple");
  const [homeScore, setHomeScore] = useState<number>(currentHomeScore ?? 0);
  const [awayScore, setAwayScore] = useState<number>(currentAwayScore ?? 0);
  const [countsForStandings, setCountsForStandings] = useState<boolean>(true);
  
  // Rosters
  const [rosters, setRosters] = useState<GameRostersResult | null>(null);
  const [loadingRosters, setLoadingRosters] = useState(false);

  // Detailed Entries
  const [goals, setGoals] = useState<DetailedGoalEntry[]>([]);
  const [cards, setCards] = useState<DetailedCardEntry[]>([]);

  // Team Stat Totals
  const [showTeamTotals, setShowTeamTotals] = useState(false);
  const [homeShots, setHomeShots] = useState<number | "">("");
  const [awayShots, setAwayShots] = useState<number | "">("");
  const [homeSaves, setHomeSaves] = useState<number | "">("");
  const [awaySaves, setAwaySaves] = useState<number | "">("");
  const [homeCorners, setHomeCorners] = useState<number | "">("");
  const [awayCorners, setAwayCorners] = useState<number | "">("");
  const [homeFouls, setHomeFouls] = useState<number | "">("");
  const [awayFouls, setAwayFouls] = useState<number | "">("");
  const [homeOffsides, setHomeOffsides] = useState<number | "">("");
  const [awayOffsides, setAwayOffsides] = useState<number | "">("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLoadingRosters(true);
    getGameRostersForQuickScore(gameId)
      .then(setRosters)
      .catch((err) => console.error("Failed to load rosters:", err))
      .finally(() => setLoadingRosters(false));
  }, [gameId]);

  const addGoalRow = (teamSeasonId: number) => {
    setGoals((prev) => [
      ...prev,
      {
        teamSeasonId,
        scorerPersonId: null,
        assistPersonId: null,
        gaPersonId: null,
        minute: null,
        isPk: false,
        isOwnGoal: false,
        comment: "",
      },
    ]);
  };

  const addCardRow = (teamSeasonId: number) => {
    setCards((prev) => [
      ...prev,
      {
        teamSeasonId,
        personId: null,
        cardType: "yellow",
        minute: null,
        comment: "",
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        if (entryMode === "simple") {
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
        } else {
          const res = await recordDetailedMatchScore({
            gameId,
            homeScore,
            awayScore,
            countsForStandings,
            goals,
            cards,
            teamTotals: {
              homeShots: Number(homeShots) || undefined,
              awayShots: Number(awayShots) || undefined,
              homeSaves: Number(homeSaves) || undefined,
              awaySaves: Number(awaySaves) || undefined,
              homeCorners: Number(homeCorners) || undefined,
              awayCorners: Number(awayCorners) || undefined,
              homeFouls: Number(homeFouls) || undefined,
              awayFouls: Number(awayFouls) || undefined,
              homeOffsides: Number(homeOffsides) || undefined,
              awayOffsides: Number(awayOffsides) || undefined,
            },
          });
          if (res.success) {
            if (onSuccess) onSuccess();
            onClose();
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to record match score.");
      }
    });
  };

  const homePlayers = rosters?.homePlayers || [];
  const awayPlayers = rosters?.awayPlayers || [];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Match Score & Post-Game Events Logger"
      size={entryMode === "detailed" ? "xl" : "md"}
      footer={
        <div className="flex items-center justify-between w-full">
          {/* Mode Switcher Buttons */}
          <div className="inline-flex rounded-xl bg-background border border-border/80 p-1">
            <button
              type="button"
              onClick={() => setEntryMode("simple")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                entryMode === "simple"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-text"
              }`}
            >
              Simple Score
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("detailed")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                entryMode === "detailed"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-text"
              }`}
            >
              Detailed Match Logger
            </button>
          </div>

          <div className="flex items-center gap-2">
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
        </div>
      }
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Score Header Board */}
        <div className="grid grid-cols-2 gap-4 items-center bg-background/50 border border-border/70 p-4 rounded-2xl">
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

        {/* DETAILED MATCH LOGGER MODE */}
        {entryMode === "detailed" && (
          <div className="space-y-6">
            
            {/* GOALS & ASSISTS SECTION */}
            <div className="bg-surface/60 border border-border/80 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={15} className="text-primary" />
                  <span>Goal Events & Assists</span>
                </h4>
                <div className="flex items-center gap-2">
                  {rosters && (
                    <>
                      <button
                        type="button"
                        onClick={() => addGoalRow(rosters.homeTeamSeasonId)}
                        className="px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>+ Home Goal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addGoalRow(rosters.awayTeamSeasonId)}
                        className="px-2.5 py-1 text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 hover:bg-accent/20 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>+ Away Goal</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {goals.length === 0 ? (
                <p className="text-xs text-muted italic text-center py-3 border border-dashed border-border/60 rounded-xl">
                  No goal details added yet. Click "+ Home Goal" or "+ Away Goal" above to assign goal scorers, assists, PK flags, and comments.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {goals.map((g, idx) => {
                    const isHomeGoal = rosters && g.teamSeasonId === rosters.homeTeamSeasonId;
                    const teamPlayers = isHomeGoal ? homePlayers : awayPlayers;
                    const oppPlayers = isHomeGoal ? awayPlayers : homePlayers;

                    return (
                      <div
                        key={idx}
                        className={`p-3 border rounded-xl space-y-2 text-xs transition-all ${
                          isHomeGoal
                            ? "bg-primary/[0.03] border-primary/20"
                            : "bg-accent/[0.03] border-accent/20"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                            isHomeGoal ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                          }`}>
                            {isHomeGoal ? "Home Goal" : "Away Goal"} #{idx + 1}
                          </span>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={g.isPk || false}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setGoals((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, isPk: val } : item))
                                  );
                                }}
                                className="rounded text-primary focus:ring-primary"
                              />
                              <span>PK</span>
                            </label>

                            <label className="flex items-center gap-1 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={g.isOwnGoal || false}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setGoals((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, isOwnGoal: val } : item))
                                  );
                                }}
                                className="rounded text-primary focus:ring-primary"
                              />
                              <span>Own Goal</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => setGoals((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-muted hover:text-rose-500 transition-colors p-1"
                              title="Remove goal event"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          {/* Goal Scorer */}
                          <div>
                            <label className="text-[10px] font-bold text-muted uppercase">Scorer</label>
                            <Select
                              value={g.scorerPersonId || ""}
                              onChange={(e: any) => {
                                const val = Number(e.target.value) || null;
                                setGoals((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, scorerPersonId: val } : item))
                                );
                              }}
                              options={[
                                { value: "", label: "(Unassigned / Unknown Scorer)" },
                                ...teamPlayers.map((p) => ({ value: p.personId, label: p.name })),
                              ]}
                              width="full"
                            />
                          </div>

                          {/* Assist */}
                          <div>
                            <label className="text-[10px] font-bold text-muted uppercase">Assist</label>
                            <Select
                              value={g.assistPersonId || ""}
                              onChange={(e: any) => {
                                const val = Number(e.target.value) || null;
                                setGoals((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, assistPersonId: val } : item))
                                );
                              }}
                              options={[
                                { value: "", label: "(Unassisted)" },
                                ...teamPlayers.map((p) => ({ value: p.personId, label: p.name })),
                              ]}
                              width="full"
                            />
                          </div>

                          {/* Minute */}
                          <div>
                            <label className="text-[10px] font-bold text-muted uppercase">Minute (1-90)</label>
                            <Input
                              type="number"
                              min={1}
                              max={120}
                              value={g.minute || ""}
                              onChange={(e: any) => {
                                const val = parseInt(e.target.value) || null;
                                setGoals((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, minute: val } : item))
                                );
                              }}
                              placeholder="e.g. 34'"
                            />
                          </div>

                          {/* Goal Comment / Description */}
                          <div>
                            <label className="text-[10px] font-bold text-muted uppercase">Event Comment</label>
                            <Input
                              type="text"
                              value={g.comment || ""}
                              onChange={(e: any) => {
                                const val = e.target.value;
                                setGoals((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, comment: val } : item))
                                );
                              }}
                              placeholder="e.g. Header from corner kick"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DISCIPLINE CARDS SECTION */}
            <div className="bg-surface/60 border border-border/80 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <Flag size={15} className="text-amber-500" />
                  <span>Disciplinary Cards (Yellow / Red)</span>
                </h4>
                <div className="flex items-center gap-2">
                  {rosters && (
                    <>
                      <button
                        type="button"
                        onClick={() => addCardRow(rosters.homeTeamSeasonId)}
                        className="px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>+ Home Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addCardRow(rosters.awayTeamSeasonId)}
                        className="px-2.5 py-1 text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 hover:bg-accent/20 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>+ Away Card</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {cards.length === 0 ? (
                <p className="text-xs text-muted italic text-center py-3 border border-dashed border-border/60 rounded-xl">
                  No cards logged. Click "+ Home Card" or "+ Away Card" to record warnings or ejections.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {cards.map((c, idx) => {
                    const isHomeCard = rosters && c.teamSeasonId === rosters.homeTeamSeasonId;
                    const teamPlayers = isHomeCard ? homePlayers : awayPlayers;

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-background/50 border border-border/80 rounded-xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                            isHomeCard ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                          }`}>
                            {isHomeCard ? "Home Team Card" : "Away Team Card"} #{idx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => setCards((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-muted hover:text-rose-500 transition-colors p-1"
                            title="Remove card"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          {/* Card Type */}
                          <div>
                            <label className="text-[10px] font-bold text-muted uppercase">Card Type</label>
                            <Select
                              value={c.cardType}
                              onChange={(e: any) => {
                                const val = e.target.value as "yellow" | "red";
                                setCards((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, cardType: val } : item))
                                );
                              }}
                              options={[
                                { value: "yellow", label: "Yellow Card" },
                                { value: "red", label: "Red Card" },
                              ]}
                              width="full"
                            />
                          </div>

                          {/* Player */}
                          <div>
                            <label className="text-[10px] font-bold text-muted uppercase">Player</label>
                            <Select
                              value={c.personId || ""}
                              onChange={(e: any) => {
                                const val = Number(e.target.value) || null;
                                setCards((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, personId: val } : item))
                                );
                              }}
                              options={[
                                { value: "", label: "(Select Player)" },
                                ...teamPlayers.map((p) => ({ value: p.personId, label: p.name })),
                              ]}
                              width="full"
                            />
                          </div>

                          {/* Minute */}
                          <div>
                            <label className="text-[10px] font-bold text-muted uppercase">Minute</label>
                            <Input
                              type="number"
                              min={1}
                              max={120}
                              value={c.minute || ""}
                              onChange={(e: any) => {
                                const val = parseInt(e.target.value) || null;
                                setCards((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, minute: val } : item))
                                );
                              }}
                              placeholder="e.g. 54'"
                            />
                          </div>

                          {/* Reason / Comment */}
                          <div>
                            <label className="text-[10px] font-bold text-muted uppercase">Reason / Description</label>
                            <Input
                              type="text"
                              value={c.comment || ""}
                              onChange={(e: any) => {
                                const val = e.target.value;
                                setCards((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, comment: val } : item))
                                );
                              }}
                              placeholder="e.g. Tactical foul"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TEAM STAT TOTALS EXPANDABLE SECTION */}
            <div className="bg-surface/60 border border-border/80 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTeamTotals((prev) => !prev)}
                className="w-full p-4 text-left font-extrabold text-xs text-text uppercase tracking-wider flex items-center justify-between hover:bg-background/40 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Shield size={15} className="text-primary" />
                  <span>Team Stat Totals (Shots, Saves, Corners, Fouls, Offsides)</span>
                </div>
                {showTeamTotals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showTeamTotals && (
                <div className="p-4 pt-0 border-t border-border/60 space-y-3">
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border/40 pb-1">
                    <span>Stat</span>
                    <span className="text-primary">Home Total</span>
                    <span className="text-accent">Away Total</span>
                    <span>Stat</span>
                    <span className="text-primary">Home / Away</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Column 1: Shots & Saves */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-muted">Shots</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={homeShots}
                            onChange={(e) => setHomeShots(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Home"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                          <input
                            type="number"
                            min="0"
                            value={awayShots}
                            onChange={(e) => setAwayShots(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Away"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-muted">Goalkeeper Saves</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={homeSaves}
                            onChange={(e) => setHomeSaves(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Home"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                          <input
                            type="number"
                            min="0"
                            value={awaySaves}
                            onChange={(e) => setAwaySaves(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Away"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Corners, Fouls, Offsides */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-muted">Corner Kicks</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={homeCorners}
                            onChange={(e) => setHomeCorners(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Home"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                          <input
                            type="number"
                            min="0"
                            value={awayCorners}
                            onChange={(e) => setAwayCorners(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Away"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-muted">Fouls</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={homeFouls}
                            onChange={(e) => setHomeFouls(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Home"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                          <input
                            type="number"
                            min="0"
                            value={awayFouls}
                            onChange={(e) => setAwayFouls(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Away"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-muted">Offsides</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={homeOffsides}
                            onChange={(e) => setHomeOffsides(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Home"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                          <input
                            type="number"
                            min="0"
                            value={awayOffsides}
                            onChange={(e) => setAwayOffsides(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Away"
                            className="w-16 px-2 py-1 text-center bg-background border border-border rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Standings Inclusion Toggle */}
        <div className="p-3 bg-background/40 border border-border/60 rounded-xl">
          <Checkbox
            label="Counts for League Standings (Include this match result in official standings calculations)"
            checked={countsForStandings}
            onChange={(e: any) => setCountsForStandings(e.target.checked)}
          />
        </div>
      </div>
    </Modal>
  );
}
