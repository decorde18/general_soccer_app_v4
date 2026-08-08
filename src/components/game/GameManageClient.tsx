"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  Clock,
  Trash2,
  Plus,
  AlertTriangle,
  Calendar,
  Users,
  Award,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Dialog from "@/components/ui/Dialog";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import { apiFetch } from "@/app/api/fetcher";
import { formatTeamName } from "@/lib/utils/teamName";
import { formatDateStandard, formatTimeStandard } from "@/components/ui/DateSelect";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";

export default function GameManageClient() {
  const router = useRouter();
  const { id, teamSeasonId } = useParams<{ id: string; teamSeasonId: string }>();
  const [isPending, startTransition] = useTransition();

  // Zustand stores
  const game = useGameStore((s) => s.game);
  const initializeGame = useGameStore((s) => s.initializeGame);
  const deleteEvent = useGameStore((s) => s.deleteEvent);
  const deleteSub = useGameStore((s) => s.deleteSub);
  const updatePeriod = useGameStore((s) => s.updatePeriod);
  const deletePeriod = useGameStore((s) => s.deletePeriod);
  const startNextPeriod = useGameStore((s) => s.startNextPeriod);
  const syncGameStatus = useGameStore((s) => s.syncGameStatus);
  const players = useGamePlayersStore((s) => s.players);

  // local state for clocks editing
  const [editingPeriodId, setEditingPeriodId] = useState<string | number | null>(null);
  const [periodStartVal, setPeriodStartVal] = useState<string>("");
  const [periodEndVal, setPeriodEndVal] = useState<string>("");

  // Modals visibility
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Goal Form State
  const [goalScorerId, setGoalScorerId] = useState<string>("");
  const [goalAssistId, setGoalAssistId] = useState<string>("");
  const [goalType, setGoalType] = useState<string>("foot");
  const [goalPeriod, setGoalPeriod] = useState<string>("1");
  const [goalTimeMin, setGoalTimeMin] = useState<string>("0");
  const [isOpponentGoal, setIsOpponentGoal] = useState<boolean>(false);

  // Sub Form State
  const [subInId, setSubInId] = useState<string>("");
  const [subOutId, setSubOutId] = useState<string>("");
  const [subPeriod, setSubPeriod] = useState<string>("1");
  const [subTimeMin, setSubTimeMin] = useState<string>("0");
  const [isGkSub, setIsGkSub] = useState<boolean>(false);

  // Card Form State
  const [cardPlayerId, setCardPlayerId] = useState<string>("");
  const [cardType, setCardType] = useState<string>("yellow");
  const [cardReason, setCardReason] = useState<string>("");
  const [cardPeriod, setCardPeriod] = useState<string>("1");
  const [cardTimeMin, setCardTimeMin] = useState<string>("0");

  // Delete event confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: number | string;
    type: "goal" | "sub" | "card" | "period";
    label: string;
  } | null>(null);

  if (!game) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading game management...
      </div>
    );
  }

  // Format team names
  const ourFormatted = formatTeamName({
    team_name: (game.ourName ?? (game.isHome ? game.homeTeamName : game.awayTeamName)) as string,
    club: { name: (game.isHome ? game.homeClubName : game.awayClubName) as string }
  });
  const opponentFormatted = formatTeamName({
    team_name: (game.opponentName ?? (game.isHome ? game.awayTeamName : game.homeTeamName)) as string,
    club: { name: (game.isHome ? game.awayClubName : game.homeClubName) as string }
  });

  // Convert Unix MS to local datetime-local format
  const msToDatetimeLocal = (ms: number | null) => {
    if (!ms) return "";
    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const datetimeLocalToMs = (val: string) => {
    if (!val) return null;
    return new Date(val).getTime();
  };

  // Perform delete actions
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    const { id: targetId, type, label } = deleteConfirmation;

    startTransition(async () => {
      try {
        if (type === "goal") {
          await deleteEvent(targetId, "goal");
        } else if (type === "card") {
          await deleteEvent(targetId, "discipline");
        } else if (type === "sub") {
          await deleteSub(targetId);
        } else if (type === "period") {
          await deletePeriod(targetId);
        }
        await initializeGame(id, teamSeasonId);
        toast.success(`Deleted: ${label}`);
      } catch (err: any) {
        toast.error("Failed to delete: " + err.message);
      } finally {
        setDeleteConfirmation(null);
      }
    });
  };

  // Save updated period clocks
  const handleSavePeriod = async (periodId: string | number) => {
    const start_time = datetimeLocalToMs(periodStartVal);
    const end_time = datetimeLocalToMs(periodEndVal);

    if (!start_time) {
      toast.error("Start time is required.");
      return;
    }

    startTransition(async () => {
      try {
        await updatePeriod(periodId, { start_time, end_time });
        await initializeGame(id, teamSeasonId);
        toast.success("Period clock adjusted successfully.");
        setEditingPeriodId(null);
      } catch (err: any) {
        toast.error("Failed to save period adjustments: " + err.message);
      }
    });
  };

  // Add Goal Submit
  const handleAddGoal = async () => {
    if (!isOpponentGoal && !goalScorerId) {
      toast.error("Please select a scorer.");
      return;
    }

    startTransition(async () => {
      try {
        const scorer = players.find((p) => String(p.playerGameId) === goalScorerId);
        const assist = players.find((p) => String(p.playerGameId) === goalAssistId);

        // 1. Create Major Event
        const majorPayload = {
          game_id: Number(game.game_id || game.id),
          period: Number(goalPeriod),
          event_type: "goal",
          game_time: Number(goalTimeMin) * 60,
          clock_should_run: 1,
        };
        const resMajor = await apiFetch("game_events_major", "POST", majorPayload);
        if (!resMajor?.id) throw new Error("Failed to record major event");

        // 2. Create Goal
        const goalPayload = {
          major_event_id: Number(resMajor.id),
          game_id: Number(game.game_id || game.id),
          team_season_id: isOpponentGoal ? Number(game.opponentId) : Number(teamSeasonId),
          scorer_player_game_id: scorer ? Number(scorer.playerGameId) : null,
          assist_player_game_id: assist ? Number(assist.playerGameId) : null,
          is_own_goal: goalType === "own_goal",
          goal_types: goalType,
        };
        await apiFetch("game_events_goals", "POST", goalPayload);

        await initializeGame(id, teamSeasonId);
        toast.success("Goal manually recorded.");
        setIsGoalModalOpen(false);
        setGoalScorerId("");
        setGoalAssistId("");
        setGoalTimeMin("0");
        setIsOpponentGoal(false);
      } catch (err: any) {
        toast.error("Failed to record goal: " + err.message);
      }
    });
  };

  // Add Sub Submit
  const handleAddSub = async () => {
    if (!subInId || !subOutId) {
      toast.error("Please select both subbing IN and OUT players.");
      return;
    }

    startTransition(async () => {
      try {
        const subPayload = {
          game_id: Number(game.game_id || game.id),
          in_player_id: Number(subInId),
          out_player_id: Number(subOutId),
          sub_time: Number(subTimeMin) * 60,
          gk_sub: isGkSub ? 1 : 0,
        };
        await apiFetch("game_subs", "POST", subPayload);

        await initializeGame(id, teamSeasonId);
        toast.success("Substitution manually recorded.");
        setIsSubModalOpen(false);
        setSubInId("");
        setSubOutId("");
        setSubTimeMin("0");
        setIsGkSub(false);
      } catch (err: any) {
        toast.error("Failed to record substitution: " + err.message);
      }
    });
  };

  // Add Card Submit
  const handleAddCard = async () => {
    if (!cardPlayerId) {
      toast.error("Please select a player.");
      return;
    }

    startTransition(async () => {
      try {
        const player = players.find((p) => String(p.playerGameId) === cardPlayerId);

        // 1. Create Major Event
        const majorPayload = {
          game_id: Number(game.game_id || game.id),
          period: Number(cardPeriod),
          event_type: "discipline",
          game_time: Number(cardTimeMin) * 60,
          clock_should_run: 1,
        };
        const resMajor = await apiFetch("game_events_major", "POST", majorPayload);
        if (!resMajor?.id) throw new Error("Failed to record major event");

        // 2. Create Card
        const cardPayload = {
          major_event_id: Number(resMajor.id),
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(teamSeasonId),
          player_game_id: player ? Number(player.playerGameId) : null,
          card_type: cardType,
          card_reason: cardReason || null,
        };
        await apiFetch("game_events_discipline", "POST", cardPayload);

        await initializeGame(id, teamSeasonId);
        toast.success("Card manually recorded.");
        setIsCardModalOpen(false);
        setCardPlayerId("");
        setCardReason("");
        setCardTimeMin("0");
      } catch (err: any) {
        toast.error("Failed to record card: " + err.message);
      }
    });
  };

  // Select list options helpers
  const playerOptions = players.map((p) => ({
    value: String(p.playerGameId),
    label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
  }));

  const periodOptions = game.periods.map((p) => ({
    value: String(p.periodNumber),
    label: `Period ${p.periodNumber}`,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <Card variant="default" padding="lg" className="relative overflow-hidden bg-surface border border-border shadow-md rounded-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/gamestats/${teamSeasonId}/${id}`)}
              className="inline-flex items-center gap-1.5"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span>Back to Command Dashboard</span>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Match Administration & Event Audit
            </h1>
            <p className="text-xs text-muted max-w-xl">
              {ourFormatted} vs {opponentFormatted} — Manually manage clocks, goals, substitutions, and discipline logs.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await syncGameStatus();
              await initializeGame(id, teamSeasonId);
              toast.success("Game status resynced with period clocks.");
            }}
          >
            Resync Game Status
          </Button>
        </div>
      </Card>

      {/* SECTION 1: PERIOD CLOCKS */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-primary animate-pulse" />
            <span>Match Periods & Clocks</span>
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              try {
                await startNextPeriod();
                await initializeGame(id, teamSeasonId);
                toast.success("Next period created successfully.");
              } catch (err: any) {
                toast.error("Failed to add period: " + err.message);
              }
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Plus size={14} />
            <span>Add Next Period</span>
          </Button>
        </div>

        <div className="space-y-4">
          {(!game.periods || game.periods.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No periods recorded yet.</p>
          ) : (
            game.periods.map((p) => {
              const isEditing = editingPeriodId === p.id;
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-border bg-background/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-text">Period #{p.periodNumber}</h4>
                    {!isEditing && (
                      <div className="text-xs text-muted space-y-0.5">
                        <p>Start: <span className="font-semibold text-text">{p.startTime ? formatDateStandard(new Date(p.startTime)) + " " + formatTimeStandard(new Date(p.startTime)) : "Not started"}</span></p>
                        <p>End: <span className="font-semibold text-text">{p.endTime ? formatDateStandard(new Date(p.endTime)) + " " + formatTimeStandard(new Date(p.endTime)) : "In Progress / Active"}</span></p>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted">Start Time</label>
                        <Input
                          type="datetime-local"
                          value={periodStartVal}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodStartVal(e.target.value)}
                          className="w-full text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted">End Time (Optional)</label>
                        <Input
                          type="datetime-local"
                          value={periodEndVal}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodEndVal(e.target.value)}
                          className="w-full text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => handleSavePeriod(p.id)} className="text-xs">
                          Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingPeriodId(null)} className="text-xs">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPeriodId(p.id);
                          setPeriodStartVal(msToDatetimeLocal(p.startTime));
                          setPeriodEndVal(msToDatetimeLocal(p.endTime));
                        }}
                        className="text-xs"
                      >
                        Adjust Clocks
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          setDeleteConfirmation({
                            id: p.id,
                            type: "period",
                            label: `Period #${p.periodNumber}`,
                          })
                        }
                        className="text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* SECTION 2: GOALS */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
            <Award size={16} className="text-primary animate-pulse" />
            <span>Match Goals ({game.gameEventsGoals?.length || 0})</span>
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-1 text-xs"
          >
            <Plus size={14} />
            <span>Add Goal</span>
          </Button>
        </div>

        <div className="space-y-2">
          {(!game.gameEventsGoals || game.gameEventsGoals.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No goals recorded yet.</p>
          ) : (
            game.gameEventsGoals.map((g) => {
              const scorerName = players.find((p) => p.playerGameId === g.scorer_player_game_id)?.fullName || "Opponent / Unrecorded";
              const assistName = players.find((p) => p.playerGameId === g.assist_player_game_id)?.fullName;
              const isUs = g.team_season_id == teamSeasonId;

              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/40 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-text">
                      ⚽ {scorerName} {g.is_own_goal && <span className="text-rose-500 font-bold">(OG)</span>}
                    </p>
                    {assistName && <p className="text-muted text-[10px]">Assist: {assistName}</p>}
                    <div className="flex gap-2 text-[10px] text-muted font-semibold">
                      <span className="uppercase px-1.5 py-0.25 rounded bg-primary/10 text-primary border border-primary/20">
                        {isUs ? "FOR US" : "AGAINST"}
                      </span>
                      <span>Type: {String(g.goal_types || "standard")}</span>
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setDeleteConfirmation({
                        id: g.id!,
                        type: "goal",
                        label: `Goal by ${scorerName}`,
                      })
                    }
                    className="flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 size={13} />
                    <span>Delete Goal</span>
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* SECTION 3: SUBSTITUTIONS */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-primary animate-pulse" />
            <span>Substitution Logs ({game.gameSubs?.length || 0})</span>
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSubModalOpen(true)}
            className="flex items-center gap-1 text-xs"
          >
            <Plus size={14} />
            <span>Add Sub</span>
          </Button>
        </div>

        <div className="space-y-2">
          {(!game.gameSubs || game.gameSubs.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No substitutions recorded yet.</p>
          ) : (
            game.gameSubs.map((s) => {
              const pIn = players.find((p) => p.playerGameId === s.in_player_id);
              const pOut = players.find((p) => p.playerGameId === s.out_player_id);

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/40 text-xs"
                >
                  <div>
                    <p className="font-semibold text-text">
                      🔄 <span className="text-emerald-500 font-bold">IN</span>: {pIn?.fullName || "Unknown"} (#{pIn?.jerseyNumber || "?"})
                    </p>
                    <p className="font-semibold text-text">
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-500 font-bold">OUT</span>: {pOut?.fullName || "Unknown"} (#{pOut?.jerseyNumber || "?"})
                    </p>
                    <p className="text-[10px] text-muted mt-1 font-semibold">
                      Time: {s.sub_time ? formatSecondsToMmss(Number(s.sub_time)) : "--"} {s.gk_sub === 1 && "• Goalkeeper Sub"}
                    </p>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setDeleteConfirmation({
                        id: s.id,
                        type: "sub",
                        label: `Sub: ${pIn?.fullName} for ${pOut?.fullName}`,
                      })
                    }
                    className="flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 size={13} />
                    <span>Delete Sub</span>
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* SECTION 4: DISCIPLINE CARDS */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert size={16} className="text-primary animate-pulse" />
            <span>Disciplinary Cards ({game.gameEventsDiscipline?.length || 0})</span>
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCardModalOpen(true)}
            className="flex items-center gap-1 text-xs"
          >
            <Plus size={14} />
            <span>Add Card</span>
          </Button>
        </div>

        <div className="space-y-2">
          {(!game.gameEventsDiscipline || game.gameEventsDiscipline.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No cards recorded yet.</p>
          ) : (
            game.gameEventsDiscipline.map((c) => {
              const player = players.find((p) => p.playerGameId === c.player_game_id);

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/40 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-text flex items-center gap-1.5">
                      <span
                        className={`inline-block h-3.5 w-2.5 rounded ${
                          (c.card_type as string) === "red"
                            ? "bg-rose-500"
                            : (c.card_type as string) === "yellow"
                            ? "bg-amber-400"
                            : "bg-orange-500"
                        }`}
                      />
                      <span>{player?.fullName || "Unknown Player"}</span>
                    </p>
                    {typeof c.card_reason === "string" && c.card_reason && (
                      <p className="text-muted text-[10px]">Reason: {c.card_reason}</p>
                    )}
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setDeleteConfirmation({
                        id: c.id!,
                        type: "card",
                        label: `Card for ${player?.fullName || "Player"}`,
                      })
                    }
                    className="flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 size={13} />
                    <span>Delete Card</span>
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* MODAL: ADD GOAL */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Manually Add Goal Record">
        <div className="space-y-4 py-2">
          <Checkbox
            label="Recorded for opponent?"
            checked={isOpponentGoal}
            onChange={(checked: boolean) => {
              setIsOpponentGoal(checked);
              setGoalScorerId("");
              setGoalAssistId("");
            }}
          />

          {!isOpponentGoal && (
            <>
              <Select
                label="Goal Scorer"
                options={[{ value: "", label: "-- Select Scorer --" }, ...playerOptions]}
                value={goalScorerId}
                onChange={(val: string) => setGoalScorerId(val)}
              />
              <Select
                label="Assisted By"
                options={[{ value: "", label: "-- None / Select Assist --" }, ...playerOptions]}
                value={goalAssistId}
                onChange={(val: string) => setGoalAssistId(val)}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Goal Type"
              options={[
                { value: "foot", label: "Standard Shot" },
                { value: "header", label: "Header" },
                { value: "penalty", label: "Penalty Kick" },
                { value: "free_kick", label: "Free Kick" },
                { value: "own_goal", label: "Own Goal" },
              ]}
              value={goalType}
              onChange={(val: string) => setGoalType(val)}
            />
            <Select
              label="Match Period"
              options={periodOptions}
              value={goalPeriod}
              onChange={(val: string) => setGoalPeriod(val)}
            />
          </div>

          <Input
            label="Game Time (minutes into match)"
            type="number"
            value={goalTimeMin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalTimeMin(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddGoal} disabled={isPending}>
              Create Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ADD SUB */}
      <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title="Manually Add Substitution">
        <div className="space-y-4 py-2">
          <Select
            label="Player IN"
            options={[{ value: "", label: "-- Select Player In --" }, ...playerOptions]}
            value={subInId}
            onChange={(val: string) => setSubInId(val)}
          />
          <Select
            label="Player OUT"
            options={[{ value: "", label: "-- Select Player Out --" }, ...playerOptions]}
            value={subOutId}
            onChange={(val: string) => setSubOutId(val)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Match Period"
              options={periodOptions}
              value={subPeriod}
              onChange={(val: string) => setSubPeriod(val)}
            />
            <Input
              label="Game Time (minutes)"
              type="number"
              value={subTimeMin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubTimeMin(e.target.value)}
            />
          </div>

          <Checkbox
            label="Goalkeeper substitution?"
            checked={isGkSub}
            onChange={(checked: boolean) => setIsGkSub(checked)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsSubModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddSub} disabled={isPending}>
              Create Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ADD CARD */}
      <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title="Manually Add Discipline Card">
        <div className="space-y-4 py-2">
          <Select
            label="Carded Player"
            options={[{ value: "", label: "-- Select Player --" }, ...playerOptions]}
            value={cardPlayerId}
            onChange={(val: string) => setCardPlayerId(val)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Card Color"
              options={[
                { value: "yellow", label: "Yellow Card" },
                { value: "red", label: "Red Card" },
                { value: "yellow_red", label: "Second Yellow (Red)" },
              ]}
              value={cardType}
              onChange={(val: string) => setCardType(val)}
            />
            <Select
              label="Match Period"
              options={periodOptions}
              value={cardPeriod}
              onChange={(val: string) => setCardPeriod(val)}
            />
          </div>

          <Input
            label="Game Time (minutes)"
            type="number"
            value={cardTimeMin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardTimeMin(e.target.value)}
          />

          <Input
            label="Reason (Optional)"
            type="text"
            value={cardReason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardReason(e.target.value)}
            placeholder="e.g. Unsporting Behavior"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddCard} disabled={isPending}>
              Create Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        isOpen={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
        title="Delete Recorded Event"
        message={`Are you sure you want to permanently delete "${deleteConfirmation?.label || 'this event'}" from the match record?`}
        type="warning"
        confirmText="Confirm Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
