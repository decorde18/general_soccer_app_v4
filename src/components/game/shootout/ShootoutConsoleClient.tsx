"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Flame,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import {
  evaluateShootoutState,
  ShootoutKick,
  TeamShootoutInfo,
  PenaltyOutcome,
  isGoalOutcome,
} from "@/lib/utils/shootoutUtils";
import {
  recordShootoutKickAction,
  deleteShootoutKickAction,
  concludeShootoutAction,
} from "@/lib/actions/shootout-actions";

export interface PlayerOption {
  playerGameId: number;
  jerseyNumber: string | number | null;
  name: string;
  isGoalkeeper?: boolean;
}

interface ShootoutConsoleClientProps {
  gameId: number;
  teamSeasonId: number;
  homeTeam: TeamShootoutInfo;
  awayTeam: TeamShootoutInfo;
  homeScore: number;
  awayScore: number;
  initialKicks: ShootoutKick[];
  homePlayers: PlayerOption[];
  awayPlayers: PlayerOption[];
}

export default function ShootoutConsoleClient({
  gameId,
  teamSeasonId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  initialKicks,
  homePlayers,
  awayPlayers,
}: ShootoutConsoleClientProps) {
  const [kicks, setKicks] = useState<ShootoutKick[]>(initialKicks);
  const [isPending, startTransition] = useTransition();
  const [selectedShooterId, setSelectedShooterId] = useState<string>("");
  const [customShooterJersey, setCustomShooterJersey] = useState<string>("");
  const [selectedGkId, setSelectedGkId] = useState<string>("");

  // Evaluate decision engine & clinch/elimination state
  const state = useMemo(() => {
    return evaluateShootoutState(kicks, homeTeam, awayTeam, 5);
  }, [kicks, homeTeam, awayTeam]);

  // Determine current active team and roster
  const activeTeam = state.activeTurn === "teamA" ? homeTeam : awayTeam;
  const defendingTeam = state.activeTurn === "teamA" ? awayTeam : homeTeam;
  const activePlayers = state.activeTurn === "teamA" ? homePlayers : awayPlayers;
  const defendingPlayers = state.activeTurn === "teamA" ? awayPlayers : homePlayers;

  // Max rounds to display: at least 5, or more if sudden death
  const maxRoundsDisplay = Math.max(5, state.currentRound, ...kicks.map((k) => k.round));

  const handleRecordKick = async (outcome: PenaltyOutcome) => {
    if (state.isDecided) {
      toast.info("Shootout has already concluded!");
      return;
    }

    const currentRound = state.currentRound;
    const isTop = state.activeTurn === "teamA";
    const currentTeamId = isTop ? Number(homeTeam.teamId) : Number(awayTeam.teamId);

    const shooter = activePlayers.find((p) => String(p.playerGameId) === selectedShooterId);
    const gk = defendingPlayers.find((p) => String(p.playerGameId) === selectedGkId);

    const shooterJersey = shooter
      ? shooter.jerseyNumber
      : customShooterJersey
      ? parseInt(customShooterJersey, 10)
      : null;

    // 0ms Optimistic UI update
    const optimisticKick: ShootoutKick = {
      round: currentRound,
      isTop,
      teamId: currentTeamId,
      shooterPlayerGameId: shooter?.playerGameId ?? null,
      shooterName: shooter?.name || (shooterJersey ? `#${shooterJersey}` : "Shooter"),
      shooterJersey,
      gkPlayerGameId: gk?.playerGameId ?? null,
      gkName: gk?.name || "Goalkeeper",
      outcome,
      timestamp: Date.now(),
    };

    const previousKicks = [...kicks];
    setKicks((prev) => [...prev, optimisticKick]);

    // Reset picker
    setSelectedShooterId("");
    setCustomShooterJersey("");

    // Backend save
    startTransition(async () => {
      const dbOutcome =
        outcome === "scored" ? "goal" : outcome === "post" ? "hit_post" : outcome;

      const res = await recordShootoutKickAction({
        gameId,
        teamSeasonId,
        round: currentRound,
        isTop,
        outcome: dbOutcome,
        shooterPlayerGameId: shooter?.playerGameId ?? null,
        shooterJerseyNumber: shooterJersey ? Number(shooterJersey) : null,
        gkPlayerGameId: gk?.playerGameId ?? null,
        opponentJerseyNumber: null,
      });

      if (!res.success) {
        toast.error("Failed to save kick on server. Rolling back.");
        setKicks(previousKicks);
      } else {
        // If state clinched after this kick, prompt victory
        const nextState = evaluateShootoutState([...previousKicks, optimisticKick], homeTeam, awayTeam, 5);
        if (nextState.isDecided) {
          toast.success(`Shootout Won! ${nextState.winnerName} clinches ${nextState.finalScore}!`);
        }
      }
    });
  };

  const handleUndo = async () => {
    if (kicks.length === 0) return;

    const lastKick = kicks[kicks.length - 1];
    const previousKicks = [...kicks];
    setKicks((prev) => prev.slice(0, -1));

    if (lastKick.id) {
      startTransition(async () => {
        const res = await deleteShootoutKickAction(lastKick.id!, gameId, teamSeasonId);
        if (!res.success) {
          toast.error("Failed to remove kick on server");
          setKicks(previousKicks);
        } else {
          toast.info("Previous kick removed");
        }
      });
    } else {
      toast.info("Previous kick undone");
    }
  };

  const handleConcludeGame = async () => {
    if (!state.isDecided || !state.winnerTeamId) return;

    startTransition(async () => {
      const res = await concludeShootoutAction(gameId, teamSeasonId, Number(state.winnerTeamId));
      if (res.success) {
        toast.success("Game officially completed with shootout result!");
      } else {
        toast.error("Failed to conclude game.");
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {/* 1. Header Match Scoreboard */}
      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-surface to-surface-elevated/70 p-5 shadow-xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Penalty Shootout
              </span>
              {state.isSuddenDeath && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <Flame size={12} /> Sudden Death
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">
              {homeTeam.name} vs {awayTeam.name}
            </h1>
            <p className="text-xs text-muted">
              Regulation Score: {homeScore} - {awayScore} • Shootout Status: Round {state.currentRound}
            </p>
          </div>

          {/* Big Live Shootout Tally */}
          <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-surface-elevated/80 px-6 py-3 shadow-inner">
            <div className="text-center">
              <span className="block text-xs font-semibold text-muted uppercase tracking-wider">
                {homeTeam.shortName || homeTeam.name}
              </span>
              <span className="text-3xl font-extrabold text-text">{state.teamAScore}</span>
            </div>
            <span className="text-xl font-bold text-muted">-</span>
            <div className="text-center">
              <span className="block text-xs font-semibold text-muted uppercase tracking-wider">
                {awayTeam.shortName || awayTeam.name}
              </span>
              <span className="text-3xl font-extrabold text-text">{state.teamBScore}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. THE CLINCH & ELIMINATION "DISTANCE TO DECISION" BANNER (USER FEATURE) */}
      <div className="space-y-3 transition-all duration-300">
        {state.scenarioType === "clinch_on_score" && (
          <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-surface p-4 shadow-lg shadow-amber-500/10">
            <div className="flex items-start gap-3.5">
              <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 ring-1 ring-amber-500/40">
                <Trophy className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {state.scenarioTitle}
                  </span>
                </div>
                <p className="text-base font-bold text-text sm:text-lg">
                  {state.scenarioDescription}
                </p>
                <p className="mt-0.5 text-xs text-amber-200/80">
                  {state.distanceSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {state.scenarioType === "elimination_on_miss" && (
          <div className="relative overflow-hidden rounded-xl border-2 border-rose-500/80 bg-gradient-to-r from-rose-500/25 via-rose-500/10 to-surface p-4 shadow-lg shadow-rose-500/15">
            <div className="flex items-start gap-3.5">
              <div className="rounded-lg bg-rose-500/20 p-2 text-rose-400 ring-1 ring-rose-500/40">
                <ShieldAlert className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    {state.scenarioTitle}
                  </span>
                </div>
                <p className="text-base font-bold text-text sm:text-lg">
                  {state.scenarioDescription}
                </p>
                <p className="mt-0.5 text-xs text-rose-200/80">
                  {state.distanceSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {state.scenarioType === "clinch_and_elimination" && (
          <div className="relative overflow-hidden rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-surface p-4 shadow-lg">
            <div className="flex items-start gap-3.5">
              <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                <Award className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {state.scenarioTitle}
                </span>
                <p className="text-base font-bold text-text sm:text-lg">
                  {state.scenarioDescription}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {state.distanceSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {state.scenarioType === "sudden_death_lead" && (
          <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/80 bg-gradient-to-r from-purple-500/20 to-surface p-4 shadow-lg shadow-purple-500/10">
            <div className="flex items-start gap-3.5">
              <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400 ring-1 ring-purple-500/40">
                <Flame className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  {state.scenarioTitle}
                </span>
                <p className="text-base font-bold text-text sm:text-lg">
                  {state.scenarioDescription}
                </p>
                <p className="mt-0.5 text-xs text-purple-200/80">
                  {state.distanceSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {state.scenarioType === "normal" && (
          <div className="rounded-xl border border-border bg-surface/70 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <div>
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  {state.scenarioTitle}
                </span>
                <p className="text-sm font-medium text-text">
                  {state.distanceSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REAL-TIME DISTANCE TO DECISION & CONSEQUENCES CARD */}
        {!state.isDecided && (
          <div className="rounded-xl border border-border/80 bg-surface/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-md bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                  ⏱️ Distance to Winner: {state.minKicksToDecision === 1 ? "1 Kick Away (Match Point)" : `${state.minKicksToDecision} Kicks Away`}
                </span>
                <span className="text-xs text-muted">
                  {state.distanceToDecisionText}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span><strong className="text-text">{homeTeam.shortName || homeTeam.name}:</strong> {state.teamAClinchNeeds}</span>
                <span>•</span>
                <span><strong className="text-text">{awayTeam.shortName || awayTeam.name}:</strong> {state.teamBClinchNeeds}</span>
              </div>
            </div>

            {/* LIVE KICK CONSEQUENCES (IF SCORE vs IF MISS) */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* IF SCORE */}
              <div className={`relative overflow-hidden rounded-lg border p-3 transition-all ${
                state.activeKickConsequences.ifScore.isDecisive
                  ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-500/10"
                  : "border-emerald-500/30 bg-emerald-500/5"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    ⚽ IF {activeTeam.name.toUpperCase()} SCORES:
                  </span>
                  {state.activeKickConsequences.ifScore.isDecisive && (
                    <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black animate-pulse">
                      🏆 CLINCHES WIN
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-text">
                  {state.activeKickConsequences.ifScore.summary}
                </p>
              </div>

              {/* IF MISS */}
              <div className={`relative overflow-hidden rounded-lg border p-3 transition-all ${
                state.activeKickConsequences.ifMiss.isDecisive
                  ? "border-rose-500 bg-rose-500/15 ring-1 ring-rose-500/50 shadow-md shadow-rose-500/10"
                  : "border-border/60 bg-surface-elevated/40"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    state.activeKickConsequences.ifMiss.isDecisive ? "text-rose-400" : "text-muted"
                  }`}>
                    ❌ IF {activeTeam.name.toUpperCase()} MISSES:
                  </span>
                  {state.activeKickConsequences.ifMiss.isDecisive && (
                    <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white animate-pulse">
                      🚨 OPPONENT WINS
                    </span>
                  )}
                </div>
                <p className={`text-xs font-semibold ${
                  state.activeKickConsequences.ifMiss.isDecisive ? "text-rose-200" : "text-text"
                }`}>
                  {state.activeKickConsequences.ifMiss.summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {state.scenarioType === "game_over" && (
          <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-500/25 via-emerald-500/10 to-surface p-5 shadow-xl">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3.5">
                <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-400 ring-1 ring-emerald-500/40">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Shootout Victorious
                  </span>
                  <h2 className="text-xl font-black text-text">
                    {state.winnerName} Wins {state.finalScore}!
                  </h2>
                  <p className="text-xs text-muted">
                    Match officially decided. Final score reconciled in system.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={handleConcludeGame}
                  disabled={isPending}
                >
                  Confirm Game Completed
                </Button>
                <Link href={`/gamestats/${teamSeasonId}/${gameId}/summary`}>
                  <Button variant="outline">
                    View Summary <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. VISUAL 5-ROUND SHOOTOUT SCOREBOARD MATRIX */}
      <Card className="border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Round-by-Round Progression Matrix
          </span>
          <span className="text-xs text-muted">
            Total Rounds: {maxRoundsDisplay} {maxRoundsDisplay > 5 && "(Sudden Death Active)"}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {/* Team A Row */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-text">
                {homeTeam.name} (Kicks First)
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {state.teamAScore} Goals
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-10">
              {Array.from({ length: maxRoundsDisplay }).map((_, idx) => {
                const roundNum = idx + 1;
                const kick = kicks.find((k) => k.round === roundNum && k.isTop);
                const isCurrent = !state.isDecided && state.currentRound === roundNum && state.activeTurn === "teamA";

                return (
                  <div
                    key={`teamA-${roundNum}`}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                        : kick
                        ? isGoalOutcome(kick.outcome)
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-rose-500/40 bg-rose-500/10"
                        : "border-border/60 bg-surface/50 opacity-60"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-muted">R{roundNum}</span>
                    <div className="my-1.5">
                      {kick ? (
                        isGoalOutcome(kick.outcome) ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        ) : (
                          <XCircle className="h-6 w-6 text-rose-400" />
                        )
                      ) : isCurrent ? (
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border border-border/80" />
                      )}
                    </div>
                    <span className="truncate text-[10px] text-text font-medium max-w-full">
                      {kick ? kick.shooterName || `#${kick.shooterJersey}` : isCurrent ? "Shooting" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team B Row */}
          <div className="border-t border-border/60 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-text">
                {awayTeam.name} (Kicks Second)
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {state.teamBScore} Goals
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-10">
              {Array.from({ length: maxRoundsDisplay }).map((_, idx) => {
                const roundNum = idx + 1;
                const kick = kicks.find((k) => k.round === roundNum && !k.isTop);
                const isCurrent = !state.isDecided && state.currentRound === roundNum && state.activeTurn === "teamB";

                return (
                  <div
                    key={`teamB-${roundNum}`}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                        : kick
                        ? isGoalOutcome(kick.outcome)
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-rose-500/40 bg-rose-500/10"
                        : "border-border/60 bg-surface/50 opacity-60"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-muted">R{roundNum}</span>
                    <div className="my-1.5">
                      {kick ? (
                        isGoalOutcome(kick.outcome) ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        ) : (
                          <XCircle className="h-6 w-6 text-rose-400" />
                        )
                      ) : isCurrent ? (
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border border-border/80" />
                      )}
                    </div>
                    <span className="truncate text-[10px] text-text font-medium max-w-full">
                      {kick ? kick.shooterName || `#${kick.shooterJersey}` : isCurrent ? "Shooting" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* 4. ACTIVE KICK LOGGER & CONTROLS */}
      {!state.isDecided && (
        <Card className="border-border bg-surface-elevated/70 p-5 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Active Kick Action • Round {state.currentRound}
              </span>
              <h2 className="text-lg font-bold text-text">
                Shooting: <span className="text-primary">{activeTeam.name}</span>
              </h2>
              <p className="text-xs text-muted">
                Defending Goal: {defendingTeam.name}
              </p>
            </div>

            {kicks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={isPending}
                className="self-start sm:self-auto"
              >
                <RotateCcw size={14} className="mr-1.5" /> Undo Last Kick
              </Button>
            )}
          </div>

          {/* Shooter & Goalkeeper Selectors */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text">
                Select Penalty Shooter ({activeTeam.name})
              </label>
              <Select
                value={selectedShooterId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedShooterId(e.target.value)}
                options={[
                  { value: "", label: "-- Choose from Roster --" },
                  ...activePlayers.map((p) => ({
                    value: String(p.playerGameId),
                    label: `#${p.jerseyNumber ?? "?"} ${p.name}`,
                  })),
                ]}
                width="full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text">
                Defending Goalkeeper ({defendingTeam.name})
              </label>
              <Select
                value={selectedGkId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedGkId(e.target.value)}
                options={[
                  { value: "", label: "-- Choose Goalkeeper --" },
                  ...defendingPlayers.map((p) => ({
                    value: String(p.playerGameId),
                    label: `#${p.jerseyNumber ?? "?"} ${p.name}${p.isGoalkeeper ? " (GK)" : ""}`,
                  })),
                ]}
                width="full"
              />
            </div>
          </div>

          {/* 4 Action Buttons */}
          <div className="mt-6">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Log Penalty Outcome
            </span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex flex-col">
                {state.activeKickConsequences.ifScore.isDecisive && (
                  <span className="mb-1 text-center text-[10px] font-black uppercase tracking-wider text-emerald-400 animate-pulse">
                    ★ Clinches Win
                  </span>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleRecordKick("scored")}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 shadow-lg shadow-emerald-900/20 w-full"
                >
                  ⚽ GOAL
                </Button>
              </div>

              <div className="flex flex-col">
                {state.activeKickConsequences.ifMiss.isDecisive && (
                  <span className="mb-1 text-center text-[10px] font-black uppercase tracking-wider text-rose-400 animate-pulse">
                    ⚠️ Opponent Wins
                  </span>
                )}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => handleRecordKick("saved")}
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 w-full"
                >
                  🧤 SAVED
                </Button>
              </div>

              <div className="flex flex-col">
                {state.activeKickConsequences.ifMiss.isDecisive && (
                  <span className="mb-1 text-center text-[10px] font-black uppercase tracking-wider text-rose-400 animate-pulse">
                    ⚠️ Opponent Wins
                  </span>
                )}
                <Button
                  variant="danger"
                  size="lg"
                  onClick={() => handleRecordKick("missed")}
                  disabled={isPending}
                  className="font-bold py-3.5 w-full"
                >
                  ❌ MISSED
                </Button>
              </div>

              <div className="flex flex-col">
                {state.activeKickConsequences.ifMiss.isDecisive && (
                  <span className="mb-1 text-center text-[10px] font-black uppercase tracking-wider text-rose-400 animate-pulse">
                    ⚠️ Opponent Wins
                  </span>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleRecordKick("post")}
                  disabled={isPending}
                  className="font-bold py-3.5 w-full"
                >
                  🥅 POST / BAR
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 5. Navigation Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Link href={`/gamestats/${teamSeasonId}/${gameId}/live`}>
          <Button variant="outline" size="sm">
            ← Back to Live Game
          </Button>
        </Link>

        <Link href={`/gamestats/${teamSeasonId}/${gameId}/summary`}>
          <Button variant="outline" size="sm">
            View Match Summary →
          </Button>
        </Link>
      </div>
    </div>
  );
}
