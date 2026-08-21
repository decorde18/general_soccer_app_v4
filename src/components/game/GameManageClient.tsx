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
  Pencil,
  CheckSquare,
  Square,
  Check,
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

  // Local state for clocks editing
  const [editingPeriodId, setEditingPeriodId] = useState<string | number | null>(null);
  const [periodStartVal, setPeriodStartVal] = useState<string>("");
  const [periodEndVal, setPeriodEndVal] = useState<string>("");

  // Modals visibility & editing targets
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any | null>(null);

  // Multi-select checkbox selection state (stored as string[])
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);

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
    id?: number | string;
    type: "goal" | "sub" | "card" | "period" | "bulk_goals" | "bulk_subs" | "bulk_cards" | "bulk_periods" | "bulk_all";
    label: string;
    targetIds?: (number | string)[];
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

  // Helper ID Resolvers (handling view vs table column aliases)
  const getGoalId = (g: any): string => String(g.id ?? g.goal_id ?? g.major_event_id);
  const getCardId = (c: any): string => String(c.id ?? c.discipline_id ?? c.major_event_id);
  const getSubId = (s: any): string => String(s.id ?? s.sub_id);
  const getPeriodId = (p: any): string => String(p.id ?? p.period_id);

  // Checkbox Selection Helpers
  const toggleGoalSelection = (rawId: number | string) => {
    const targetId = String(rawId);
    setSelectedGoalIds((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]
    );
  };

  const toggleSelectAllGoals = () => {
    const allIds = (game.gameEventsGoals || []).map((g) => getGoalId(g)).filter(Boolean);
    if (selectedGoalIds.length > 0 && selectedGoalIds.length === allIds.length) {
      setSelectedGoalIds([]);
    } else {
      setSelectedGoalIds(allIds);
    }
  };

  const toggleSubSelection = (rawId: number | string) => {
    const targetId = String(rawId);
    setSelectedSubIds((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]
    );
  };

  const toggleSelectAllSubs = () => {
    const allIds = (game.gameSubs || []).map((s) => getSubId(s)).filter(Boolean);
    if (selectedSubIds.length > 0 && selectedSubIds.length === allIds.length) {
      setSelectedSubIds([]);
    } else {
      setSelectedSubIds(allIds);
    }
  };

  const toggleCardSelection = (rawId: number | string) => {
    const targetId = String(rawId);
    setSelectedCardIds((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]
    );
  };

  const toggleSelectAllCards = () => {
    const allIds = (game.gameEventsDiscipline || []).map((c) => getCardId(c)).filter(Boolean);
    if (selectedCardIds.length > 0 && selectedCardIds.length === allIds.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(allIds);
    }
  };

  const togglePeriodSelection = (rawId: number | string) => {
    const targetId = String(rawId);
    setSelectedPeriodIds((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]
    );
  };

  const toggleSelectAllPeriods = () => {
    const allIds = (game.periods || []).map((p) => getPeriodId(p)).filter(Boolean);
    if (selectedPeriodIds.length > 0 && selectedPeriodIds.length === allIds.length) {
      setSelectedPeriodIds([]);
    } else {
      setSelectedPeriodIds(allIds);
    }
  };

  const totalSelectedCount =
    selectedGoalIds.length + selectedSubIds.length + selectedCardIds.length + selectedPeriodIds.length;

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

  // Perform single or bulk delete actions
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    const { id: targetId, type, label, targetIds } = deleteConfirmation;

    startTransition(async () => {
      try {
        if (type === "goal" && targetId) {
          await deleteEvent(targetId, "goal");
          setSelectedGoalIds((prev) => prev.filter((i) => i !== targetId));
        } else if (type === "card" && targetId) {
          await deleteEvent(targetId, "discipline");
          setSelectedCardIds((prev) => prev.filter((i) => i !== targetId));
        } else if (type === "sub" && targetId) {
          await deleteSub(targetId);
          setSelectedSubIds((prev) => prev.filter((i) => i !== targetId));
        } else if (type === "period" && targetId) {
          await deletePeriod(targetId);
          setSelectedPeriodIds((prev) => prev.filter((i) => i !== targetId));
        } else if (type === "bulk_goals" && targetIds) {
          for (const gId of targetIds) {
            await deleteEvent(gId, "goal");
          }
          setSelectedGoalIds([]);
        } else if (type === "bulk_subs" && targetIds) {
          for (const sId of targetIds) {
            await deleteSub(sId);
          }
          setSelectedSubIds([]);
        } else if (type === "bulk_cards" && targetIds) {
          for (const cId of targetIds) {
            await deleteEvent(cId, "discipline");
          }
          setSelectedCardIds([]);
        } else if (type === "bulk_periods" && targetIds) {
          for (const pId of targetIds) {
            await deletePeriod(pId);
          }
          setSelectedPeriodIds([]);
        } else if (type === "bulk_all") {
          for (const gId of selectedGoalIds) await deleteEvent(gId, "goal");
          for (const sId of selectedSubIds) await deleteSub(sId);
          for (const cId of selectedCardIds) await deleteEvent(cId, "discipline");
          for (const pId of selectedPeriodIds) await deletePeriod(pId);
          setSelectedGoalIds([]);
          setSelectedSubIds([]);
          setSelectedCardIds([]);
          setSelectedPeriodIds([]);
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
    const end_time = periodEndVal ? datetimeLocalToMs(periodEndVal) : null;

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

  const handleClearPeriodEndTime = async (periodId: string | number) => {
    startTransition(async () => {
      try {
        await updatePeriod(periodId, { end_time: null });
        await initializeGame(id, teamSeasonId);
        toast.success("Period end time deleted.");
      } catch (err: any) {
        toast.error("Failed to delete period end time: " + err.message);
      }
    });
  };

  // --- GOAL HANDLERS ---
  const openAddGoalModal = () => {
    setEditingGoal(null);
    setGoalScorerId("");
    setGoalAssistId("");
    setGoalType("foot");
    setGoalPeriod("1");
    setGoalTimeMin("0");
    setIsOpponentGoal(false);
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (g: any) => {
    const realId = getGoalId(g);
    setEditingGoal({ ...g, id: realId });
    setGoalScorerId(g.scorer_player_game_id ? String(g.scorer_player_game_id) : "");
    setGoalAssistId(g.assist_player_game_id ? String(g.assist_player_game_id) : "");
    setGoalType(g.is_own_goal ? "own_goal" : g.goal_types || "foot");
    setGoalPeriod(g.period ? String(g.period) : "1");
    setGoalTimeMin(g.game_time !== undefined && g.game_time !== null ? String(Math.floor(g.game_time / 60)) : "0");
    setIsOpponentGoal(g.team_season_id != teamSeasonId);
    setIsGoalModalOpen(true);
  };

  const handleAddOrUpdateGoal = async () => {
    if (!isOpponentGoal && !goalScorerId) {
      toast.error("Please select a scorer.");
      return;
    }

    startTransition(async () => {
      try {
        const scorer = players.find((p) => String(p.playerGameId) === goalScorerId);
        const assist = players.find((p) => String(p.playerGameId) === goalAssistId);

        if (editingGoal) {
          // Edit existing goal
          const goalPayload = {
            team_season_id: isOpponentGoal ? Number(game.opponentId) : Number(teamSeasonId),
            scorer_player_game_id: scorer ? Number(scorer.playerGameId) : null,
            assist_player_game_id: assist ? Number(assist.playerGameId) : null,
            is_own_goal: goalType === "own_goal",
            goal_types: goalType,
          };
          await apiFetch("game_events_goals", "PUT", goalPayload, editingGoal.id);

          if (editingGoal.major_event_id) {
            await apiFetch("game_events_major", "PUT", {
              period: Number(goalPeriod),
              game_time: Number(goalTimeMin) * 60,
            }, editingGoal.major_event_id);
          }
          toast.success("Goal record updated successfully.");
        } else {
          // Create new goal
          const majorPayload = {
            game_id: Number(game.game_id || game.id),
            period: Number(goalPeriod),
            event_type: "goal",
            game_time: Number(goalTimeMin) * 60,
            clock_should_run: 1,
          };
          const resMajor = await apiFetch("game_events_major", "POST", majorPayload);
          if (!resMajor?.id) throw new Error("Failed to record major event");

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
          toast.success("Goal manually recorded.");
        }

        await initializeGame(id, teamSeasonId);
        setIsGoalModalOpen(false);
        setEditingGoal(null);
      } catch (err: any) {
        toast.error("Failed to save goal: " + err.message);
      }
    });
  };

  // --- SUB HANDLERS ---
  const openAddSubModal = () => {
    setEditingSub(null);
    setSubInId("");
    setSubOutId("");
    setSubPeriod("1");
    setSubTimeMin("0");
    setIsGkSub(false);
    setIsSubModalOpen(true);
  };

  const openEditSubModal = (s: any) => {
    const realId = getSubId(s);
    setEditingSub({ ...s, id: realId });
    setSubInId(s.in_player_id ? String(s.in_player_id) : "");
    setSubOutId(s.out_player_id ? String(s.out_player_id) : "");
    setSubPeriod(s.period ? String(s.period) : "1");
    setSubTimeMin(s.sub_time !== undefined && s.sub_time !== null ? String(Math.floor(s.sub_time / 60)) : "0");
    setIsGkSub(Boolean(s.gk_sub));
    setIsSubModalOpen(true);
  };

  const handleAddOrUpdateSub = async () => {
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
          period: Number(subPeriod),
          sub_time: Number(subTimeMin) * 60,
          gk_sub: isGkSub ? 1 : 0,
        };

        if (editingSub) {
          await apiFetch("game_subs", "PUT", subPayload, editingSub.id);
          toast.success("Substitution updated successfully.");
        } else {
          await apiFetch("game_subs", "POST", subPayload);
          toast.success("Substitution manually recorded.");
        }

        await initializeGame(id, teamSeasonId);
        setIsSubModalOpen(false);
        setEditingSub(null);
      } catch (err: any) {
        toast.error("Failed to save substitution: " + err.message);
      }
    });
  };

  // --- CARD HANDLERS ---
  const openAddCardModal = () => {
    setEditingCard(null);
    setCardPlayerId("");
    setCardType("yellow");
    setCardReason("");
    setCardPeriod("1");
    setCardTimeMin("0");
    setIsCardModalOpen(true);
  };

  const openEditCardModal = (c: any) => {
    const realId = getCardId(c);
    setEditingCard({ ...c, id: realId });
    setCardPlayerId(c.player_game_id ? String(c.player_game_id) : "");
    setCardType(c.card_type || "yellow");
    setCardReason(c.card_reason || "");
    setCardPeriod(c.period ? String(c.period) : "1");
    setCardTimeMin(c.game_time !== undefined && c.game_time !== null ? String(Math.floor(c.game_time / 60)) : "0");
    setIsCardModalOpen(true);
  };

  const handleAddOrUpdateCard = async () => {
    if (!cardPlayerId) {
      toast.error("Please select a player.");
      return;
    }

    startTransition(async () => {
      try {
        const player = players.find((p) => String(p.playerGameId) === cardPlayerId);

        if (editingCard) {
          const cardPayload = {
            player_game_id: player ? Number(player.playerGameId) : null,
            card_type: cardType,
            card_reason: cardReason || null,
          };
          await apiFetch("game_events_discipline", "PUT", cardPayload, editingCard.id);

          if (editingCard.major_event_id) {
            await apiFetch("game_events_major", "PUT", {
              period: Number(cardPeriod),
              game_time: Number(cardTimeMin) * 60,
            }, editingCard.major_event_id);
          }
          toast.success("Discipline card updated successfully.");
        } else {
          const majorPayload = {
            game_id: Number(game.game_id || game.id),
            period: Number(cardPeriod),
            event_type: "discipline",
            game_time: Number(cardTimeMin) * 60,
            clock_should_run: 1,
          };
          const resMajor = await apiFetch("game_events_major", "POST", majorPayload);
          if (!resMajor?.id) throw new Error("Failed to record major event");

          const cardPayload = {
            major_event_id: Number(resMajor.id),
            game_id: Number(game.game_id || game.id),
            team_season_id: Number(teamSeasonId),
            player_game_id: player ? Number(player.playerGameId) : null,
            card_type: cardType,
            card_reason: cardReason || null,
          };
          await apiFetch("game_events_discipline", "POST", cardPayload);
          toast.success("Card manually recorded.");
        }

        await initializeGame(id, teamSeasonId);
        setIsCardModalOpen(false);
        setEditingCard(null);
      } catch (err: any) {
        toast.error("Failed to save card: " + err.message);
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
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
              {ourFormatted} vs {opponentFormatted} — Manually manage clocks, goals, substitutions, and discipline logs with multi-select deletion & full editing.
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

      {/* FLOATING BULK DELETE BANNER */}
      {totalSelectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface/95 backdrop-blur border-2 border-danger/40 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 text-xs font-semibold text-text animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white font-bold text-[11px]">
              {totalSelectedCount}
            </span>
            <span>Items Selected for Bulk Deletion</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                setDeleteConfirmation({
                  type: "bulk_all",
                  label: `${totalSelectedCount} total selected records across match admin`,
                })
              }
              className="flex items-center gap-1.5 text-xs rounded-full px-4"
            >
              <Trash2 size={13} />
              <span>Delete All Selected ({totalSelectedCount})</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedGoalIds([]);
                setSelectedSubIds([]);
                setSelectedCardIds([]);
                setSelectedPeriodIds([]);
              }}
              className="text-[11px] text-muted hover:text-text rounded-full"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* SECTION 1: PERIOD CLOCKS */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-3">
            {game.periods && game.periods.length > 0 && (
              <input
                type="checkbox"
                checked={selectedPeriodIds.length > 0 && selectedPeriodIds.length === game.periods.length}
                onChange={toggleSelectAllPeriods}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                title="Select all periods"
              />
            )}
            <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-primary animate-pulse" />
              <span>Match Periods & Clocks</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {selectedPeriodIds.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  setDeleteConfirmation({
                    type: "bulk_periods",
                    label: `${selectedPeriodIds.length} periods`,
                    targetIds: selectedPeriodIds,
                  })
                }
                className="flex items-center gap-1 text-xs"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedPeriodIds.length})</span>
              </Button>
            )}
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
        </div>

        <div className="space-y-4">
          {(!game.periods || game.periods.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No periods recorded yet.</p>
          ) : (
            game.periods.map((p, idx) => {
              const periodIdStr = getPeriodId(p);
              const isEditing = editingPeriodId === p.id || editingPeriodId === periodIdStr;
              const isSelected = selectedPeriodIds.includes(periodIdStr);

              return (
                <div
                  key={`period-${periodIdStr}`}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSelected ? "border-danger/50 bg-danger/5" : "border-border bg-background/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePeriodSelection(periodIdStr)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-text">Period #{p.periodNumber}</h4>
                      {!isEditing && (
                        <div className="text-xs text-muted space-y-0.5">
                          <p>Start: <span className="font-semibold text-text">{p.startTime ? formatDateStandard(new Date(p.startTime)) + " " + formatTimeStandard(new Date(p.startTime)) : "Not started"}</span></p>
                          <p>End: <span className="font-semibold text-text">{p.endTime ? formatDateStandard(new Date(p.endTime)) + " " + formatTimeStandard(new Date(p.endTime)) : "In Progress / Active"}</span></p>
                        </div>
                      )}
                    </div>
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
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold text-muted">End Time (Optional)</label>
                          {periodEndVal && (
                            <button
                              type="button"
                              onClick={() => setPeriodEndVal("")}
                              className="text-[10px] text-danger hover:underline font-semibold"
                            >
                              Clear Input
                            </button>
                          )}
                        </div>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPeriodId(p.id);
                          setPeriodStartVal(msToDatetimeLocal(p.startTime));
                          setPeriodEndVal(msToDatetimeLocal(p.endTime));
                        }}
                        className="text-xs flex items-center gap-1"
                      >
                        <Pencil size={12} />
                        <span>Adjust Clocks</span>
                      </Button>
                      {p.endTime && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearPeriodEndTime(p.id)}
                          className="text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 border border-rose-500/20"
                          title="Delete/clear period end timestamp"
                        >
                          <Trash2 size={12} />
                          <span>Clear End Time</span>
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          setDeleteConfirmation({
                            id: periodIdStr,
                            type: "period",
                            label: `Period #${p.periodNumber}`,
                          })
                        }
                        className="text-xs flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Delete Period</span>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-3">
            {game.gameEventsGoals && game.gameEventsGoals.length > 0 && (
              <input
                type="checkbox"
                checked={selectedGoalIds.length > 0 && selectedGoalIds.length === game.gameEventsGoals.length}
                onChange={toggleSelectAllGoals}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                title="Select all goals"
              />
            )}
            <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-primary animate-pulse" />
              <span>Match Goals ({game.gameEventsGoals?.length || 0})</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {selectedGoalIds.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  setDeleteConfirmation({
                    type: "bulk_goals",
                    label: `${selectedGoalIds.length} goals`,
                    targetIds: selectedGoalIds,
                  })
                }
                className="flex items-center gap-1 text-xs"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedGoalIds.length})</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={openAddGoalModal}
              className="flex items-center gap-1 text-xs"
            >
              <Plus size={14} />
              <span>Add Goal</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {(!game.gameEventsGoals || game.gameEventsGoals.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No goals recorded yet.</p>
          ) : (
            game.gameEventsGoals.map((g, idx) => {
              const scorerName = players.find((p) => p.playerGameId === g.scorer_player_game_id)?.fullName || "Opponent / Unrecorded";
              const assistName = players.find((p) => p.playerGameId === g.assist_player_game_id)?.fullName;
              const isUs = g.team_season_id == teamSeasonId;
              const goalIdStr = getGoalId(g);
              const isSelected = selectedGoalIds.includes(goalIdStr);

              return (
                <div
                  key={`goal-${goalIdStr}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                    isSelected ? "border-danger/50 bg-danger/5" : "border-border bg-background/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleGoalSelection(goalIdStr)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <p className="font-bold text-text">
                        ⚽ {scorerName} {g.is_own_goal && <span className="text-rose-500 font-bold">(OG)</span>}
                      </p>
                      {assistName && <p className="text-muted text-[10px]">Assist: {assistName}</p>}
                      <div className="flex gap-2 text-[10px] text-muted font-semibold items-center">
                        <span className="uppercase px-1.5 py-0.25 rounded bg-primary/10 text-primary border border-primary/20">
                          {isUs ? "FOR US" : "AGAINST"}
                        </span>
                        <span>Type: {String(g.goal_types || "standard")}</span>
                        {Boolean(g.period) && <span>Period: {String(g.period)}</span>}
                        {g.game_time !== undefined && g.game_time !== null && (
                          <span>Min: {Math.floor(Number(g.game_time) / 60)}&apos;</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditGoalModal(g)}
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        setDeleteConfirmation({
                          id: goalIdStr,
                          type: "goal",
                          label: `Goal by ${scorerName}`,
                        })
                      }
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* SECTION 3: SUBSTITUTIONS */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-3">
            {game.gameSubs && game.gameSubs.length > 0 && (
              <input
                type="checkbox"
                checked={selectedSubIds.length > 0 && selectedSubIds.length === game.gameSubs.length}
                onChange={toggleSelectAllSubs}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                title="Select all substitutions"
              />
            )}
            <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-primary animate-pulse" />
              <span>Substitution Logs ({game.gameSubs?.length || 0})</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {selectedSubIds.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  setDeleteConfirmation({
                    type: "bulk_subs",
                    label: `${selectedSubIds.length} substitutions`,
                    targetIds: selectedSubIds,
                  })
                }
                className="flex items-center gap-1 text-xs"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedSubIds.length})</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={openAddSubModal}
              className="flex items-center gap-1 text-xs"
            >
              <Plus size={14} />
              <span>Add Sub</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {(!game.gameSubs || game.gameSubs.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No substitutions recorded yet.</p>
          ) : (
            game.gameSubs.map((s, idx) => {
              const pIn = players.find((p) => p.playerGameId === s.in_player_id);
              const pOut = players.find((p) => p.playerGameId === s.out_player_id);
              const subIdStr = getSubId(s);
              const isSelected = selectedSubIds.includes(subIdStr);

              return (
                <div
                  key={`sub-${subIdStr}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                    isSelected ? "border-danger/50 bg-danger/5" : "border-border bg-background/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSubSelection(subIdStr)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <div>
                      <p className="font-semibold text-text">
                        🔄 <span className="text-emerald-500 font-bold">IN</span>: {pIn?.fullName || "Unknown"} (#{pIn?.jerseyNumber || "?"})
                      </p>
                      <p className="font-semibold text-text">
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-500 font-bold">OUT</span>: {pOut?.fullName || "Unknown"} (#{pOut?.jerseyNumber || "?"})
                      </p>
                      <p className="text-[10px] text-muted mt-1 font-semibold">
                        Time: {s.sub_time ? formatSecondsToMmss(Number(s.sub_time)) : "--"} {s.period ? `• Period ${s.period}` : ""} {s.gk_sub === 1 && "• Goalkeeper Sub"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditSubModal(s)}
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        setDeleteConfirmation({
                          id: subIdStr,
                          type: "sub",
                          label: `Sub: ${pIn?.fullName} for ${pOut?.fullName}`,
                        })
                      }
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* SECTION 4: DISCIPLINE CARDS */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-3">
            {game.gameEventsDiscipline && game.gameEventsDiscipline.length > 0 && (
              <input
                type="checkbox"
                checked={selectedCardIds.length > 0 && selectedCardIds.length === game.gameEventsDiscipline.length}
                onChange={toggleSelectAllCards}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                title="Select all discipline cards"
              />
            )}
            <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={16} className="text-primary animate-pulse" />
              <span>Disciplinary Cards ({game.gameEventsDiscipline?.length || 0})</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {selectedCardIds.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  setDeleteConfirmation({
                    type: "bulk_cards",
                    label: `${selectedCardIds.length} disciplinary cards`,
                    targetIds: selectedCardIds,
                  })
                }
                className="flex items-center gap-1 text-xs"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedCardIds.length})</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={openAddCardModal}
              className="flex items-center gap-1 text-xs"
            >
              <Plus size={14} />
              <span>Add Card</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {(!game.gameEventsDiscipline || game.gameEventsDiscipline.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No cards recorded yet.</p>
          ) : (
            game.gameEventsDiscipline.map((c, idx) => {
              const player = players.find((p) => p.playerGameId === c.player_game_id);
              const cardIdStr = getCardId(c);
              const isSelected = selectedCardIds.includes(cardIdStr);

              return (
                <div
                  key={`card-${cardIdStr}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                    isSelected ? "border-danger/50 bg-danger/5" : "border-border bg-background/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCardSelection(cardIdStr)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
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
                      <div className="flex gap-2 text-[10px] text-muted font-semibold items-center">
                        {Boolean(c.period) && <span>Period: {String(c.period)}</span>}
                        {c.game_time !== undefined && c.game_time !== null && (
                          <span>Min: {Math.floor(Number(c.game_time) / 60)}&apos;</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditCardModal(c)}
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        setDeleteConfirmation({
                          id: cardIdStr,
                          type: "card",
                          label: `Card for ${player?.fullName || "Player"}`,
                        })
                      }
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* MODAL: ADD / EDIT GOAL */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? "Edit Goal Record" : "Manually Add Goal Record"}
      >
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
            <Button
              variant="outline"
              onClick={() => {
                setIsGoalModalOpen(false);
                setEditingGoal(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddOrUpdateGoal} disabled={isPending}>
              {editingGoal ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ADD / EDIT SUB */}
      <Modal
        isOpen={isSubModalOpen}
        onClose={() => {
          setIsSubModalOpen(false);
          setEditingSub(null);
        }}
        title={editingSub ? "Edit Substitution Record" : "Manually Add Substitution"}
      >
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
            <Button
              variant="outline"
              onClick={() => {
                setIsSubModalOpen(false);
                setEditingSub(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddOrUpdateSub} disabled={isPending}>
              {editingSub ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ADD / EDIT CARD */}
      <Modal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
        }}
        title={editingCard ? "Edit Disciplinary Card Record" : "Manually Add Discipline Card"}
      >
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
            <Button
              variant="outline"
              onClick={() => {
                setIsCardModalOpen(false);
                setEditingCard(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddOrUpdateCard} disabled={isPending}>
              {editingCard ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        isOpen={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
        title="Delete Recorded Event(s)"
        message={`Are you sure you want to permanently delete "${deleteConfirmation?.label || 'the selected event(s)'}" from the match record?`}
        type="warning"
        confirmText="Confirm Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
