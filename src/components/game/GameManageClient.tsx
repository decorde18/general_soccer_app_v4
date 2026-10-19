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
  Trophy,
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
import {
  formatSecondsToMmss,
  convertPeriodClockToAbsoluteSeconds,
  convertAbsoluteSecondsToPeriodClock,
} from "@/lib/utils/dateTimeUtils";
import {
  GOAL_METHOD_OPTIONS,
  parseGoalTypes,
  normalizeGoalTypesJson,
  formatGoalTypesDisplay,
} from "@/lib/utils/goalUtils";

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
  const [isOwnGoal, setIsOwnGoal] = useState<boolean>(false);
  const [selectedGoalMethods, setSelectedGoalMethods] = useState<Set<string>>(new Set(["open_play"]));
  const [goalPeriod, setGoalPeriod] = useState<string>("1");
  const [goalTimeMin, setGoalTimeMin] = useState<string>("0");
  const [goalTimeSec, setGoalTimeSec] = useState<string>("0");
  const [isOpponentGoal, setIsOpponentGoal] = useState<boolean>(false);

  // Sub Form State
  const [subInId, setSubInId] = useState<string>("");
  const [subOutId, setSubOutId] = useState<string>("");
  const [subPeriod, setSubPeriod] = useState<string>("1");
  const [subTimeMin, setSubTimeMin] = useState<string>("0");
  const [subTimeSec, setSubTimeSec] = useState<string>("0");
  const [isGkSub, setIsGkSub] = useState<boolean>(false);

  // Bulk Sub Time Edit State
  const [isBulkSubModalOpen, setIsBulkSubModalOpen] = useState<boolean>(false);
  const [bulkTargetSubIds, setBulkTargetSubIds] = useState<string[]>([]);
  const [bulkSubPeriod, setBulkSubPeriod] = useState<string>("1");
  const [bulkSubTimeMin, setBulkSubTimeMin] = useState<string>("0");
  const [bulkSubTimeSec, setBulkSubTimeSec] = useState<string>("0");

  // Card Form State
  const [cardPlayerId, setCardPlayerId] = useState<string>("");
  const [cardType, setCardType] = useState<string>("yellow");
  const [cardReason, setCardReason] = useState<string>("");
  const [cardPeriod, setCardPeriod] = useState<string>("1");
  const [cardTimeMin, setCardTimeMin] = useState<string>("0");
  const [cardTimeSec, setCardTimeSec] = useState<string>("0");

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

  // Perform single or bulk delete actions optimistically
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    const { id: targetId, type, label, targetIds } = deleteConfirmation;

    // 1. Synchronously update Zustand state optimistically (0ms lag)
    const currentGame = useGameStore.getState().game;
    if (currentGame) {
      if (type === "goal" && targetId) {
        useGameStore.getState().updateGame({
          gameEventsGoals: (currentGame.gameEventsGoals || []).filter((g: any) => String(getGoalId(g)) !== String(targetId)),
          gameEventsMajor: (currentGame.gameEventsMajor || []).filter((m: any) => String(m.id) !== String(targetId)),
        });
        setSelectedGoalIds((prev) => prev.filter((i) => i !== String(targetId)));
      } else if (type === "card" && targetId) {
        useGameStore.getState().updateGame({
          gameEventsDiscipline: (currentGame.gameEventsDiscipline || []).filter((c: any) => String(getCardId(c)) !== String(targetId)),
          gameEventsMajor: (currentGame.gameEventsMajor || []).filter((m: any) => String(m.id) !== String(targetId)),
        });
        setSelectedCardIds((prev) => prev.filter((i) => i !== String(targetId)));
      } else if (type === "sub" && targetId) {
        useGameStore.getState().updateGame({
          gameSubs: (currentGame.gameSubs || []).filter((s: any) => String(getSubId(s)) !== String(targetId)),
        });
        setSelectedSubIds((prev) => prev.filter((i) => i !== String(targetId)));
      } else if (type === "period" && targetId) {
        useGameStore.getState().updateGame({
          periods: (currentGame.periods || []).filter((p: any) => String(getPeriodId(p)) !== String(targetId)),
        });
        setSelectedPeriodIds((prev) => prev.filter((i) => i !== String(targetId)));
      } else if (type === "bulk_goals" && targetIds) {
        const idSet = new Set(targetIds.map(String));
        useGameStore.getState().updateGame({
          gameEventsGoals: (currentGame.gameEventsGoals || []).filter((g: any) => !idSet.has(String(getGoalId(g)))),
          gameEventsMajor: (currentGame.gameEventsMajor || []).filter((m: any) => !idSet.has(String(m.id))),
        });
        setSelectedGoalIds([]);
      } else if (type === "bulk_subs" && targetIds) {
        const idSet = new Set(targetIds.map(String));
        useGameStore.getState().updateGame({
          gameSubs: (currentGame.gameSubs || []).filter((s: any) => !idSet.has(String(getSubId(s)))),
        });
        setSelectedSubIds([]);
      } else if (type === "bulk_cards" && targetIds) {
        const idSet = new Set(targetIds.map(String));
        useGameStore.getState().updateGame({
          gameEventsDiscipline: (currentGame.gameEventsDiscipline || []).filter((c: any) => !idSet.has(String(getCardId(c)))),
          gameEventsMajor: (currentGame.gameEventsMajor || []).filter((m: any) => !idSet.has(String(m.id))),
        });
        setSelectedCardIds([]);
      } else if (type === "bulk_periods" && targetIds) {
        const idSet = new Set(targetIds.map(String));
        useGameStore.getState().updateGame({
          periods: (currentGame.periods || []).filter((p: any) => !idSet.has(String(getPeriodId(p)))),
        });
        setSelectedPeriodIds([]);
      } else if (type === "bulk_all") {
        const goalSet = new Set(selectedGoalIds);
        const subSet = new Set(selectedSubIds);
        const cardSet = new Set(selectedCardIds);
        const periodSet = new Set(selectedPeriodIds);
        useGameStore.getState().updateGame({
          gameEventsGoals: (currentGame.gameEventsGoals || []).filter((g: any) => !goalSet.has(String(getGoalId(g)))),
          gameSubs: (currentGame.gameSubs || []).filter((s: any) => !subSet.has(String(getSubId(s)))),
          gameEventsDiscipline: (currentGame.gameEventsDiscipline || []).filter((c: any) => !cardSet.has(String(getCardId(c)))),
          periods: (currentGame.periods || []).filter((p: any) => !periodSet.has(String(getPeriodId(p)))),
        });
        setSelectedGoalIds([]);
        setSelectedSubIds([]);
        setSelectedCardIds([]);
        setSelectedPeriodIds([]);
      }
    }

    setDeleteConfirmation(null);

    // 2. Perform backend persistence in parallel
    startTransition(async () => {
      try {
        if (type === "goal" && targetId) {
          await deleteEvent(targetId, "goal");
        } else if (type === "card" && targetId) {
          await deleteEvent(targetId, "discipline");
        } else if (type === "sub" && targetId) {
          await deleteSub(targetId);
        } else if (type === "period" && targetId) {
          await deletePeriod(targetId);
        } else if (type === "bulk_goals" && targetIds) {
          await Promise.all(targetIds.map((gId) => deleteEvent(gId, "goal")));
        } else if (type === "bulk_subs" && targetIds) {
          await Promise.all(targetIds.map((sId) => deleteSub(sId)));
        } else if (type === "bulk_cards" && targetIds) {
          await Promise.all(targetIds.map((cId) => deleteEvent(cId, "discipline")));
        } else if (type === "bulk_periods" && targetIds) {
          await Promise.all(targetIds.map((pId) => deletePeriod(pId)));
        } else if (type === "bulk_all") {
          await Promise.all([
            ...selectedGoalIds.map((gId) => deleteEvent(gId, "goal")),
            ...selectedSubIds.map((sId) => deleteSub(sId)),
            ...selectedCardIds.map((cId) => deleteEvent(cId, "discipline")),
            ...selectedPeriodIds.map((pId) => deletePeriod(pId)),
          ]);
        }
        await initializeGame(id, teamSeasonId);
        toast.success(`Deleted: ${label}`);
      } catch (err: any) {
        toast.error("Failed to delete: " + err.message);
        await initializeGame(id, teamSeasonId);
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
    setIsOwnGoal(false);
    setSelectedGoalMethods(new Set(["open_play"]));
    setGoalPeriod("1");
    setGoalTimeMin("0");
    setGoalTimeSec("0");
    setIsOpponentGoal(false);
    setIsGoalModalOpen(true);
  };

  const toggleGoalMethod = (methodId: string) => {
    const next = new Set(selectedGoalMethods);
    if (next.has(methodId)) {
      next.delete(methodId);
    } else {
      next.add(methodId);
    }
    if (next.size === 0) {
      next.add("open_play");
    }
    setSelectedGoalMethods(next);
  };

  // Resolve period minute (e.g. 9' 52" into 2nd half) into continuous absolute game seconds
  const resolveGameTimeSeconds = (periodStr: string | number, minStr: string, secStr: string) => {
    const pNum = Number(periodStr) || 1;
    const rawInputSecs = (Number(minStr) || 0) * 60 + (Number(secStr) || 0);
    return convertPeriodClockToAbsoluteSeconds(
      pNum,
      rawInputSecs,
      game?.periods || [],
      game?.gameEventsMajor || [],
      game?.settings?.periodDuration || 2400
    );
  };

  const calculatePreviewTime = (periodStr: string | number, minStr: string, secStr: string) => {
    const pNum = Number(periodStr) || 1;
    const totalSeconds = resolveGameTimeSeconds(periodStr, minStr, secStr);
    const clock = convertAbsoluteSecondsToPeriodClock(
      totalSeconds,
      pNum,
      game?.periods || [],
      game?.gameEventsMajor || [],
      game?.settings?.periodDuration || 2400
    );
    const gameMin = Math.floor(totalSeconds / 60);
    const halfLabel = pNum === 1 ? "1st Half" : pNum === 2 ? "2nd Half" : `OT${pNum - 2}`;
    return {
      totalSeconds,
      gameMin,
      displayLabel: `${gameMin}' (${halfLabel}, ${clock.formattedTime})`,
    };
  };

  const openEditGoalModal = (g: any) => {
    const realId = getGoalId(g);
    setEditingGoal({ ...g, id: realId });
    setGoalScorerId(g.scorer_player_game_id ? String(g.scorer_player_game_id) : "");
    setGoalAssistId(g.assist_player_game_id ? String(g.assist_player_game_id) : "");
    const isOg = Boolean(g.is_own_goal);
    setIsOwnGoal(isOg);
    const parsed = parseGoalTypes(g.goal_types);
    setSelectedGoalMethods(new Set(parsed.length > 0 ? parsed : ["open_play"]));
    const pNum = Number(g.period || 1);
    setGoalPeriod(String(pNum));
    const totalSec = g.game_time !== undefined && g.game_time !== null ? Number(g.game_time) : 0;
    const clock = convertAbsoluteSecondsToPeriodClock(
      totalSec,
      pNum,
      game?.periods || [],
      game?.gameEventsMajor || [],
      game?.settings?.periodDuration || 2400
    );
    setGoalTimeMin(String(clock.minutes));
    setGoalTimeSec(String(clock.seconds));
    setIsOpponentGoal(g.team_season_id != teamSeasonId);
    setIsGoalModalOpen(true);
  };

  const handleAddOrUpdateGoal = async () => {
    if (!isOpponentGoal && !isOwnGoal && !goalScorerId) {
      toast.error("Please select a scorer.");
      return;
    }

    startTransition(async () => {
      try {
        const scorer = (!isOpponentGoal && !isOwnGoal) ? players.find((p) => String(p.playerGameId) === goalScorerId) : null;
        const assist = (!isOpponentGoal && !isOwnGoal) ? players.find((p) => String(p.playerGameId) === goalAssistId) : null;
        const totalSeconds = resolveGameTimeSeconds(goalPeriod, goalTimeMin, goalTimeSec);
        const methodsArr = isOwnGoal ? ["own_goal"] : Array.from(selectedGoalMethods);
        const goalTypesJson = normalizeGoalTypesJson(methodsArr.length > 0 ? methodsArr : ["open_play"]);

        if (editingGoal) {
          // Edit existing goal
          const goalPayload = {
            team_season_id: isOpponentGoal ? Number(game.opponentId) : Number(teamSeasonId),
            scorer_player_game_id: scorer ? Number(scorer.playerGameId) : null,
            assist_player_game_id: assist ? Number(assist.playerGameId) : null,
            is_own_goal: isOwnGoal,
            goal_types: goalTypesJson,
          };
          await apiFetch("game_events_goals", "PUT", goalPayload, editingGoal.id);

          if (editingGoal.major_event_id) {
            await apiFetch("game_events_major", "PUT", {
              period: Number(goalPeriod),
              game_time: totalSeconds,
              details: isOwnGoal ? "Own Goal" : undefined,
            }, editingGoal.major_event_id);
          }
          toast.success("Goal record updated successfully.");
        } else {
          // Create new goal
          const majorPayload = {
            game_id: Number(game.game_id || game.id),
            period: Number(goalPeriod),
            event_type: "goal",
            game_time: totalSeconds,
            clock_should_run: 1,
            details: isOwnGoal ? "Own Goal" : undefined,
          };
          const resMajor = await apiFetch("game_events_major", "POST", majorPayload);
          if (!resMajor?.id) throw new Error("Failed to record major event");

          const goalPayload = {
            major_event_id: Number(resMajor.id),
            team_season_id: isOpponentGoal ? Number(game.opponentId) : Number(teamSeasonId),
            scorer_player_game_id: scorer ? Number(scorer.playerGameId) : null,
            assist_player_game_id: assist ? Number(assist.playerGameId) : null,
            is_own_goal: isOwnGoal,
            goal_types: goalTypesJson,
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
    setSubTimeSec("0");
    setIsGkSub(false);
    setIsSubModalOpen(true);
  };

  const openEditSubModal = (s: any) => {
    const realId = getSubId(s);
    setEditingSub({ ...s, id: realId });

    const matchingIn = players.find(
      (p) => String(p.playerGameId) === String(s.in_player_id) || String(p.id) === String(s.in_player_id)
    );
    const matchingOut = players.find(
      (p) => String(p.playerGameId) === String(s.out_player_id) || String(p.id) === String(s.out_player_id)
    );

    setSubInId(matchingIn ? String(matchingIn.playerGameId) : s.in_player_id ? String(s.in_player_id) : "");
    setSubOutId(matchingOut ? String(matchingOut.playerGameId) : s.out_player_id ? String(s.out_player_id) : "");
    const pNum = Number(s.period || 1);
    setSubPeriod(String(pNum));
    const totalSec = s.sub_time !== undefined && s.sub_time !== null ? Number(s.sub_time) : 0;
    const clock = convertAbsoluteSecondsToPeriodClock(
      totalSec,
      pNum,
      game?.periods || [],
      game?.gameEventsMajor || [],
      game?.settings?.periodDuration || 2400
    );
    setSubTimeMin(String(clock.minutes));
    setSubTimeSec(String(clock.seconds));
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
        const totalSeconds = resolveGameTimeSeconds(subPeriod, subTimeMin, subTimeSec);
        const subPayload = {
          game_id: Number(game.game_id || game.id),
          in_player_id: Number(subInId),
          out_player_id: Number(subOutId),
          period: Number(subPeriod),
          sub_time: totalSeconds,
          gk_sub: isGkSub ? 1 : 0,
        };

        if (editingSub) {
          await apiFetch("game_subs", "PUT", subPayload, editingSub.id);
          toast.success("Substitution updated successfully.");
        } else {
          await apiFetch("game_subs", "POST", subPayload);
          toast.success("Substitution manually recorded.");
        }

        // Reset any local transient pending sub states & re-sync game store
        useGamePlayersStore.getState().setPlayers(
          useGamePlayersStore.getState().players.map((p) => ({ ...p, subStatus: null }))
        );
        await initializeGame(id, teamSeasonId);
        setIsSubModalOpen(false);
        setEditingSub(null);
      } catch (err: any) {
        toast.error("Failed to save substitution: " + err.message);
      }
    });
  };

  // --- BULK SUB TIME EDIT HANDLERS ---
  const openBulkSubModal = (subIdsToEdit?: string[]) => {
    const targetIds = subIdsToEdit && subIdsToEdit.length > 0 ? subIdsToEdit : selectedSubIds;
    if (targetIds.length === 0) {
      toast.error("Please select at least one substitution to edit.");
      return;
    }

    setBulkTargetSubIds(targetIds);

    const firstSub = (game.gameSubs || []).find((s) => targetIds.includes(String(getSubId(s))));
    if (firstSub) {
      const pNum = Number(firstSub.period || 1);
      setBulkSubPeriod(String(pNum));
      const totalSec = firstSub.sub_time !== undefined && firstSub.sub_time !== null ? Number(firstSub.sub_time) : 0;
      const clock = convertAbsoluteSecondsToPeriodClock(
        totalSec,
        pNum,
        game?.periods || [],
        game?.gameEventsMajor || [],
        game?.settings?.periodDuration || 2400
      );
      setBulkSubTimeMin(String(clock.minutes));
      setBulkSubTimeSec(String(clock.seconds));
    } else {
      setBulkSubPeriod("1");
      setBulkSubTimeMin("0");
      setBulkSubTimeSec("0");
    }

    setIsBulkSubModalOpen(true);
  };

  const toggleBulkTargetSub = (subIdStr: string) => {
    setBulkTargetSubIds((prev) =>
      prev.includes(subIdStr) ? prev.filter((id) => id !== subIdStr) : [...prev, subIdStr]
    );
  };

  const selectAllSubsMatchingTime = (timeSec: number | null | undefined, period: number | null | undefined) => {
    const matching = (game.gameSubs || [])
      .filter((s) => s.sub_time === timeSec && (!period || s.period === period))
      .map((s) => getSubId(s));
    setSelectedSubIds(Array.from(new Set([...selectedSubIds, ...matching])));
    toast.info(`Selected ${matching.length} substitution(s) matching this timestamp.`);
  };

  const handleBulkUpdateSubTimes = async () => {
    if (bulkTargetSubIds.length === 0) {
      toast.error("Please select at least one substitution to update.");
      return;
    }

    startTransition(async () => {
      try {
        const totalSeconds = resolveGameTimeSeconds(bulkSubPeriod, bulkSubTimeMin, bulkSubTimeSec);
        const pNum = Number(bulkSubPeriod);
        const idSet = new Set(bulkTargetSubIds);

        // 1. Optimistically update gameSubs in Zustand store
        const currentGame = useGameStore.getState().game;
        if (currentGame) {
          const updatedSubs = (currentGame.gameSubs || []).map((s: any) => {
            if (idSet.has(String(getSubId(s)))) {
              return {
                ...s,
                period: pNum,
                sub_time: totalSeconds,
              };
            }
            return s;
          });
          useGameStore.getState().updateGame({ gameSubs: updatedSubs });
        }

        // 2. Persist in parallel
        await Promise.all(
          bulkTargetSubIds.map((sId) =>
            apiFetch("game_subs", "PUT", { sub_time: totalSeconds, period: pNum }, sId)
          )
        );

        toast.success(`Updated ${bulkTargetSubIds.length} substitution(s) to Period ${pNum} (${bulkSubTimeMin}m ${bulkSubTimeSec}s).`);
        setIsBulkSubModalOpen(false);
        setBulkTargetSubIds([]);
        setSelectedSubIds([]);
        await initializeGame(id, teamSeasonId);
      } catch (err: any) {
        toast.error("Failed to update substitution times: " + err.message);
        await initializeGame(id, teamSeasonId);
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
    setCardTimeSec("0");
    setIsCardModalOpen(true);
  };

  const openEditCardModal = (c: any) => {
    const realId = getCardId(c);
    setEditingCard({ ...c, id: realId });
    setCardPlayerId(c.player_game_id ? String(c.player_game_id) : "");
    setCardType(c.card_type || "yellow");
    setCardReason(c.card_reason || "");
    const pNum = Number(c.period || 1);
    setCardPeriod(String(pNum));
    const totalSec = c.game_time !== undefined && c.game_time !== null ? Number(c.game_time) : 0;
    const clock = convertAbsoluteSecondsToPeriodClock(
      totalSec,
      pNum,
      game?.periods || [],
      game?.gameEventsMajor || [],
      game?.settings?.periodDuration || 2400
    );
    setCardTimeMin(String(clock.minutes));
    setCardTimeSec(String(clock.seconds));
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
        const totalSeconds = resolveGameTimeSeconds(cardPeriod, cardTimeMin, cardTimeSec);

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
              game_time: totalSeconds,
            }, editingCard.major_event_id);
          }
          toast.success("Discipline card updated successfully.");
        } else {
          const majorPayload = {
            game_id: Number(game.game_id || game.id),
            period: Number(cardPeriod),
            event_type: "discipline",
            game_time: totalSeconds,
            clock_should_run: 1,
          };
          const resMajor = await apiFetch("game_events_major", "POST", majorPayload);
          if (!resMajor?.id) throw new Error("Failed to record major event");

          const cardPayload = {
            major_event_id: Number(resMajor.id),
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
  const eligiblePlayers = players.filter(
    (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed"
  );
  const playerOptions = eligiblePlayers.map((p) => ({
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
                          disabled={isPending}
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
                        disabled={isPending}
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
                disabled={isPending}
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
              disabled={isPending}
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
                        <span>
                          Type: {formatGoalTypesDisplay(g.goal_types, Boolean(g.is_own_goal))}
                        </span>
                        {Boolean(g.period) && <span>Period: {String(g.period)}</span>}
                        {g.game_time !== undefined && g.game_time !== null && (() => {
                          const pNum = Number(g.period || 1);
                          const clock = convertAbsoluteSecondsToPeriodClock(
                            Number(g.game_time),
                            pNum,
                            game?.periods || [],
                            game?.gameEventsMajor || [],
                            game?.settings?.periodDuration || 2400
                          );
                          return (
                            <span>Clock: {clock.formattedTime} (Match: {Math.floor(Number(g.game_time) / 60)}&apos;)</span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditGoalModal(g)}
                      disabled={isPending}
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
                      disabled={isPending}
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openBulkSubModal(selectedSubIds)}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs text-primary border-primary/40 hover:bg-primary/10"
                >
                  <Clock size={13} />
                  <span>Bulk Change Time ({selectedSubIds.length})</span>
                </Button>
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
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs"
                >
                  <Trash2 size={13} />
                  <span>Delete Selected ({selectedSubIds.length})</span>
                </Button>
              </>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={openAddSubModal}
              disabled={isPending}
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
              const pIn = players.find((p) => String(p.playerGameId) === String(s.in_player_id) || String(p.id) === String(s.in_player_id));
              const pOut = players.find((p) => String(p.playerGameId) === String(s.out_player_id) || String(p.id) === String(s.out_player_id));
              const subIdStr = getSubId(s);
              const isSelected = selectedSubIds.includes(subIdStr);

              return (
                <div
                  key={`sub-${subIdStr}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                    isSelected ? "border-primary/60 bg-primary/5" : "border-border bg-background/40"
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
                      <p className="text-[10px] text-muted mt-1 font-semibold flex items-center flex-wrap gap-1">
                        <span>
                          Time: {s.sub_time !== undefined && s.sub_time !== null ? (() => {
                            const pNum = Number(s.period || 1);
                            const clock = convertAbsoluteSecondsToPeriodClock(
                              Number(s.sub_time),
                              pNum,
                              game?.periods || [],
                              game?.gameEventsMajor || [],
                              game?.settings?.periodDuration || 2400
                            );
                            return `${clock.formattedTime} (Match ${formatSecondsToMmss(Number(s.sub_time))})`;
                          })() : "--"} {s.period ? `• Period ${s.period}` : ""} {s.gk_sub === 1 && (s.is_swap === 1 ? "• Goalkeeper Swap 🧤" : "• Goalkeeper Sub 🧤")}
                        </span>
                        {s.sub_time !== undefined && s.sub_time !== null && (
                          <button
                            type="button"
                            onClick={() => selectAllSubsMatchingTime(s.sub_time, s.period)}
                            className="text-primary hover:underline font-bold text-[9px] ml-1.5 cursor-pointer"
                            title="Select all subs made at this exact timestamp"
                          >
                            [Select All at this Time]
                          </button>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openBulkSubModal([subIdStr])}
                      disabled={isPending}
                      className="flex items-center gap-1 text-[11px] text-primary border-primary/30 hover:bg-primary/10"
                      title="Bulk change or modify time"
                    >
                      <Clock size={12} />
                      <span>Change Time</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditSubModal(s)}
                      disabled={isPending}
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
                      disabled={isPending}
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
                disabled={isPending}
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
              disabled={isPending}
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
                        {c.game_time !== undefined && c.game_time !== null && (() => {
                          const pNum = Number(c.period || 1);
                          const clock = convertAbsoluteSecondsToPeriodClock(
                            Number(c.game_time),
                            pNum,
                            game?.periods || [],
                            game?.gameEventsMajor || [],
                            game?.settings?.periodDuration || 2400
                          );
                          return (
                            <span>Clock: {clock.formattedTime} (Match: {Math.floor(Number(c.game_time) / 60)}&apos;)</span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditCardModal(c)}
                      disabled={isPending}
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
                      disabled={isPending}
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

          {/* Goal Type Selector: Standard Goal vs Own Goal */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted mb-1.5">
              Goal Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsOwnGoal(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isOwnGoal
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "bg-surface border-border text-muted hover:border-emerald-500/40"
                }`}
              >
                <Trophy size={14} className={!isOwnGoal ? "text-emerald-500" : "text-muted"} />
                <span>Standard Goal ⚽</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOwnGoal(true);
                  setGoalScorerId("");
                  setGoalAssistId("");
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isOwnGoal
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-2xs"
                    : "bg-surface border-border text-muted hover:border-rose-500/40"
                }`}
              >
                <AlertTriangle size={14} className={isOwnGoal ? "text-rose-500" : "text-muted"} />
                <span>Own Goal ⚠️</span>
              </button>
            </div>
          </div>

          {/* OWN GOAL SCORE EXPLANATION BANNER */}
          {isOwnGoal && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-1 text-amber-600 dark:text-amber-400 text-xs">
              <div className="flex items-center gap-1.5 font-black">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <span>{isOpponentGoal ? "Opponent Net Own Goal (+1 Our Team)" : "Our Team Own Goal (+1 to Opponent)"}</span>
              </div>
              <p className="text-[11px] text-muted font-medium">
                No individual player goal or assist credit will be attributed to preserve statistical integrity.
              </p>
            </div>
          )}

          {/* PLAYER SELECTION DROPDOWNS: Rendered ONLY for Standard Goals (!isOwnGoal) */}
          {!isOwnGoal && !isOpponentGoal && (
            <div className="space-y-3">
              <Select
                label="Goal Scorer (On-Field / Eligible Players)"
                options={[{ value: "", label: "-- Select Scorer --" }, ...playerOptions]}
                value={goalScorerId}
                onChange={(e: any) => setGoalScorerId(e.target?.value ?? e)}
              />
              <Select
                label="Assisted By (Optional)"
                options={[{ value: "", label: "-- None / Select Assist --" }, ...playerOptions]}
                value={goalAssistId}
                onChange={(e: any) => setGoalAssistId(e.target?.value ?? e)}
              />
            </div>
          )}

          {/* GOAL METHOD / TYPE: Rendered for Standard Goals (!isOwnGoal) */}
          {!isOwnGoal && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted mb-1.5">
                Goal Method / Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {GOAL_METHOD_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleGoalMethod(id)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                      selectedGoalMethods.has(id)
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold"
                        : "bg-surface border-border text-muted hover:border-emerald-500/40"
                    }`}
                  >
                    <span>{label}</span>
                    {selectedGoalMethods.has(id) && <Check size={12} className="text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Match Period and Time Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Match Period"
              options={periodOptions}
              value={goalPeriod}
              onChange={(e: any) => setGoalPeriod(e.target?.value ?? e)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Min (mm)"
                type="number"
                min="0"
                value={goalTimeMin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalTimeMin(e.target.value)}
              />
              <Input
                label="Sec (ss)"
                type="number"
                min="0"
                max="59"
                value={goalTimeSec}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalTimeSec(e.target.value)}
              />
            </div>
          </div>

          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-text">Calculated Match Clock: </span>
              <span className="font-extrabold text-primary text-sm">
                {calculatePreviewTime(goalPeriod, goalTimeMin, goalTimeSec).displayLabel}
              </span>
            </div>
            <span className="text-[10px] text-muted font-medium">
              Accepts period minute (e.g. 15') or game minute (e.g. 45')
            </span>
          </div>

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
            onChange={(e: any) => setSubInId(e.target?.value ?? e)}
          />
          <Select
            label="Player OUT"
            options={[{ value: "", label: "-- Select Player Out --" }, ...playerOptions]}
            value={subOutId}
            onChange={(e: any) => setSubOutId(e.target?.value ?? e)}
          />

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Match Period"
              options={periodOptions}
              value={subPeriod}
              onChange={(e: any) => setSubPeriod(e.target?.value ?? e)}
            />
            <Input
              label="Minute (mm)"
              type="number"
              min="0"
              value={subTimeMin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubTimeMin(e.target.value)}
            />
            <Input
              label="Second (ss)"
              type="number"
              min="0"
              max="59"
              value={subTimeSec}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubTimeSec(e.target.value)}
            />
          </div>

          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-text">Calculated Match Clock: </span>
              <span className="font-extrabold text-primary text-sm">
                {calculatePreviewTime(subPeriod, subTimeMin, subTimeSec).displayLabel}
              </span>
            </div>
            <span className="text-[10px] text-muted font-medium">
              Accepts period minute (e.g. 15') or game minute (e.g. 45')
            </span>
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

      {/* MODAL: BULK CHANGE SUBSTITUTION TIME */}
      <Modal
        isOpen={isBulkSubModalOpen}
        onClose={() => {
          setIsBulkSubModalOpen(false);
          setBulkTargetSubIds([]);
        }}
        title="Bulk Change Substitution Time"
        size="md"
      >
        <div className="space-y-4 py-2 text-xs">
          <p className="text-muted leading-relaxed">
            Pick which substitution(s) you would like to move, and set their new period and game time:
          </p>

          {/* Sub selection list with checkboxes */}
          <div className="border border-border rounded-xl divide-y divide-border/40 max-h-48 overflow-y-auto bg-background/50 p-1">
            {(game.gameSubs || [])
              .filter((s) => bulkTargetSubIds.includes(String(getSubId(s))) || selectedSubIds.includes(String(getSubId(s))))
              .map((s) => {
                const subIdStr = getSubId(s);
                const isChecked = bulkTargetSubIds.includes(subIdStr);
                const pIn = players.find((p) => String(p.playerGameId) === String(s.in_player_id) || String(p.id) === String(s.in_player_id));
                const pOut = players.find((p) => String(p.playerGameId) === String(s.out_player_id) || String(p.id) === String(s.out_player_id));
                const clock = s.sub_time !== null && s.sub_time !== undefined ? convertAbsoluteSecondsToPeriodClock(
                  Number(s.sub_time),
                  Number(s.period || 1),
                  game?.periods || [],
                  game?.gameEventsMajor || [],
                  game?.settings?.periodDuration || 2400
                ) : null;

                return (
                  <label
                    key={`bulk-item-${subIdStr}`}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-background/80 transition-colors ${
                      isChecked ? "bg-primary/5" : "opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleBulkTargetSub(subIdStr)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 font-bold text-text truncate">
                        <span className="text-emerald-500 font-extrabold">IN: {pIn?.fullName || "Unknown"} (#{pIn?.jerseyNumber || "?"})</span>
                        <span className="text-muted">/</span>
                        <span className="text-rose-500 font-extrabold">OUT: {pOut?.fullName || "Unknown"} (#{pOut?.jerseyNumber || "?"})</span>
                      </div>
                      <div className="text-[10px] text-muted font-medium mt-0.5">
                        Current: {clock ? `${clock.formattedTime} (Match ${formatSecondsToMmss(Number(s.sub_time))}) • Period ${s.period}` : "No time set"}
                      </div>
                    </div>
                  </label>
                );
              })}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">
              {bulkTargetSubIds.length} substitution(s) selected to change
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkTargetSubIds((game.gameSubs || []).map((s) => String(getSubId(s))))}
                className="text-primary hover:underline font-bold cursor-pointer"
              >
                Select All
              </button>
              <span className="text-muted">•</span>
              <button
                type="button"
                onClick={() => setBulkTargetSubIds([])}
                className="text-muted hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="border-t border-border/60 pt-3 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-text">New Target Timestamp</h4>
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Match Period"
                options={periodOptions}
                value={bulkSubPeriod}
                onChange={(e: any) => setBulkSubPeriod(e.target?.value ?? e)}
              />
              <Input
                label="Minute (mm)"
                type="number"
                min="0"
                value={bulkSubTimeMin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkSubTimeMin(e.target.value)}
              />
              <Input
                label="Second (ss)"
                type="number"
                min="0"
                max="59"
                value={bulkSubTimeSec}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkSubTimeSec(e.target.value)}
              />
            </div>

            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-text">New Converted Time: </span>
                <span className="font-extrabold text-primary text-sm">
                  {calculatePreviewTime(bulkSubPeriod, bulkSubTimeMin, bulkSubTimeSec).displayLabel}
                </span>
              </div>
              <span className="text-[10px] text-muted font-medium">
                Applied to all {bulkTargetSubIds.length} checked subs
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkSubModalOpen(false);
                setBulkTargetSubIds([]);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkUpdateSubTimes}
              disabled={isPending || bulkTargetSubIds.length === 0}
              isLoading={isPending}
            >
              {isPending ? "Updating Subs..." : `Update ${bulkTargetSubIds.length} Substitution(s)`}
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
            onChange={(e: any) => setCardPlayerId(e.target?.value ?? e)}
          />

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Card Color"
              options={[
                { value: "yellow", label: "Yellow Card" },
                { value: "red", label: "Red Card" },
                { value: "yellow_red", label: "Second Yellow (Red)" },
              ]}
              value={cardType}
              onChange={(e: any) => setCardType(e.target?.value ?? e)}
            />
            <Select
              label="Match Period"
              options={periodOptions}
              value={cardPeriod}
              onChange={(e: any) => setCardPeriod(e.target?.value ?? e)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Min (mm)"
                type="number"
                min="0"
                value={cardTimeMin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardTimeMin(e.target.value)}
              />
              <Input
                label="Sec (ss)"
                type="number"
                min="0"
                max="59"
                value={cardTimeSec}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardTimeSec(e.target.value)}
              />
            </div>
          </div>

          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-text">Calculated Match Clock: </span>
              <span className="font-extrabold text-primary text-sm">
                {calculatePreviewTime(cardPeriod, cardTimeMin, cardTimeSec).displayLabel}
              </span>
            </div>
            <span className="text-[10px] text-muted font-medium">
              Accepts period minute (e.g. 15') or game minute (e.g. 45')
            </span>
          </div>

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
        isLoading={isPending}
        disabled={isPending}
      />
    </div>
  );
}
