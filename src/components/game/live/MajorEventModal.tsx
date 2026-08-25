"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import { checkPlayerSubEligibility } from "@/lib/utils/subRules";
import { formatTeamName } from "@/lib/utils/teamName";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";
import { toast } from "sonner";
import { enqueueOfflineAction, saveGameCache } from "@/lib/offline/offlineSync";
import {
  Trophy,
  ShieldAlert,
  Target,
  Activity,
  Zap,
  Tv,
  PauseCircle,
  PlayCircle,
  Check,
  CornerDownRight,
  ArrowRightLeft,
  Trash2,
  Droplets,
} from "lucide-react";

export type MajorEventType =
  | "goal"
  | "card"
  | "pk"
  | "injury"
  | "hydration"
  | "weather"
  | "var"
  | "stoppage";

interface MajorEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentShortName?: string;
  onRecordGoal?: (data: any) => void;
  onRecordCard?: (data: any) => void;
  onRecordStoppage?: (data: any) => void;
  isPending?: boolean;
}

const GOAL_METHOD_OPTIONS = [
  { id: "open_play", label: "Open Play" },
  { id: "corner", label: "Corner Kick" },
  { id: "direct_free_kick", label: "Direct Free Kick" },
  { id: "indirect_free_kick", label: "Indirect Free Kick" },
  { id: "throw_in", label: "Throw-In" },
  { id: "header", label: "Header" },
  { id: "volley", label: "Volley" },
];

export default function MajorEventModal(props: MajorEventModalProps) {
  const { isOpen, onClose } = props;

  const game = useGameStore((s) => s.game);
  const addGoalEvent = useGameStore((s) => s.addGoalEvent);
  const addDisciplineEvent = useGameStore((s) => s.addDisciplineEvent);
  const addMajorEvent = useGameStore((s) => s.addMajorEvent);
  const endStoppage = useGameStore((s) => s.endStoppage);
  const deleteEvent = useGameStore((s) => s.deleteEvent);
  const players = useGamePlayersStore((s) => s.players);

  const createPendingSub = useGameSubsStore((s) => s.createPendingSub);
  const confirmSub = useGameSubsStore((s) => s.confirmSub);
  const cancelSub = useGameSubsStore((s) => s.cancelSub);
  const confirmAllPendingSubs = useGameSubsStore((s) => s.confirmAllPendingSubs);
  const getPendingSubsSync = useGameSubsStore((s) => s.getPendingSubsSync);

  const [localIsPending, startTransition] = useTransition();
  const isPending = props.isPending ?? localIsPending;

  const [eventType, setEventType] = useState<MajorEventType>("goal");
  const [teamTarget, setTeamTarget] = useState<"us" | "opp">("us");

  // Live match clock state for modal header
  const [liveSeconds, setLiveSeconds] = useState<number>(0);
  const [isPausedLocally, setIsPausedLocally] = useState<boolean>(false);

  // In-Stoppage Substitutions State
  const [stoppageSubOutId, setStoppageSubOutId] = useState("");
  const [stoppageSubInId, setStoppageSubInId] = useState("");
  const [allowExhaustedOverride, setAllowExhaustedOverride] = useState(false);
  const [showPendingSubPrompt, setShowPendingSubPrompt] = useState(false);

  // Stop Clock toggle state (default: NOT paused / clock running)
  const [stopClock, setStopClock] = useState<boolean>(false);

  // Active unended stoppage
  const activeStoppage = game?.gameEventsMajor?.find(
    (s) => s.end_time === null && s.period === (game?.currentPeriodIndex || 0) + 1 && s.clock_should_run === 0
  );

  const eventOpenMsRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isOpen) return;
    eventOpenMsRef.current = Date.now();
    setStopClock(false);
    setTeamTarget("us");

    // Reset Goal Form
    setGoalScorerId("");
    setGoalAssistId("");
    setOppScorerJersey("");
    setOppAssistJersey("");
    setIsOwnGoal(false);
    setSelectedMethods(new Set(["open_play"]));
    setGoalNotes("");

    // Reset Card Form
    setCardPlayerId("");
    setOppCardJersey("");
    setCardType("yellow");
    setCardReason("");

    // Reset PK Form
    setPkTakerId("");
    setOppPkTakerJersey("");
    setPkOutcome("goal");
    setIsReboundGoal(false);
    setPkNotes("");

    // Reset Subs & Stoppage Form
    setStoppageSubOutId("");
    setStoppageSubInId("");
    setShowPendingSubPrompt(false);
    setStoppageCategory("injury");
    setStoppageDetails("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (stopClock) {
      // Clock Paused: Freeze at the moment the event button was clicked (minus all previous paused stoppages)
      const snapSeconds = useGameStore.getState().getPeriodTime(eventOpenMsRef.current);
      setLiveSeconds(snapSeconds);
    } else {
      // Clock Running: Display current actual game time minus all previous paused stoppages and tick live every second
      setLiveSeconds(useGameStore.getState().getPeriodTime());
      const interval = setInterval(() => {
        setLiveSeconds(useGameStore.getState().getPeriodTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, stopClock]);

  // Goal Form State
  const [goalScorerId, setGoalScorerId] = useState("");
  const [goalAssistId, setGoalAssistId] = useState("");
  const [oppScorerJersey, setOppScorerJersey] = useState("");
  const [oppAssistJersey, setOppAssistJersey] = useState("");
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set(["open_play"]));
  const [goalNotes, setGoalNotes] = useState("");

  // Discipline / Card Form State
  const [cardPlayerId, setCardPlayerId] = useState("");
  const [oppCardJersey, setOppCardJersey] = useState("");
  const [cardType, setCardType] = useState<"yellow" | "red" | "yellow_red">("yellow");
  const [cardReason, setCardReason] = useState("");

  // Penalty Kick Form State
  const [pkTakerId, setPkTakerId] = useState("");
  const [oppPkTakerJersey, setOppPkTakerJersey] = useState("");
  const [pkOutcome, setPkOutcome] = useState<"goal" | "saved" | "missed" | "hit_post">("goal");
  const [isReboundGoal, setIsReboundGoal] = useState(false);
  const [pkNotes, setPkNotes] = useState("");

  // Stoppage Form State
  const [stoppageCategory, setStoppageCategory] = useState<"injury" | "weather" | "var" | "stoppage">("injury");
  const [stoppageDetails, setStoppageDetails] = useState("");

  if (!isOpen) return null;

  const opponentShortName = props.opponentShortName ?? (game ? formatTeamName({
    team_name: (game.isHome ? game.awayTeamName : game.homeTeamName) as string | null,
    club: {
      name: (game.isHome ? game.awayClubName : game.homeClubName) as string | null,
      abbreviation: (game.isHome ? game.awayClubAbbreviation : game.homeClubAbbreviation) as string | null,
    }
  }, "short") : "Opponent");

  // FILTERED PLAYERS FOR DROPDOWNS:
  const onFieldPlayers = players.filter(
    (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk"
  );
  const benchPlayers = players.filter(
    (p) => p.fieldStatus === "onBench"
  );
  const allEligiblePlayers = players.filter(
    (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed"
  );

  const currentPeriodNum = (game?.currentPeriodIndex || 0) + 1;

  const scorerOptions = onFieldPlayers
    .filter((p) => String(p.id) !== goalAssistId)
    .map((p) => ({
      value: String(p.id),
      label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
    }));

  const assistOptions = onFieldPlayers
    .filter((p) => String(p.id) !== goalScorerId)
    .map((p) => ({
      value: String(p.id),
      label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
    }));

  const pkTakerOptions = onFieldPlayers.map((p) => ({
    value: String(p.id),
    label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
  }));

  const cardPlayerOptions = allEligiblePlayers.map((p) => ({
    value: String(p.id),
    label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
  }));

  const subOutOptions = onFieldPlayers.map((p) => ({
    value: String(p.playerGameId || p.id),
    label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
  }));

  // Player IN Options with Exhausted Filtering & Rule Override
  const subInOptions = benchPlayers
    .map((p) => {
      const eligibility = checkPlayerSubEligibility(p, game?.settings, currentPeriodNum);
      return { player: p, eligibility };
    })
    .filter(({ eligibility }) => allowExhaustedOverride || eligibility.isEligible)
    .map(({ player, eligibility }) => ({
      value: String(player.playerGameId || player.id),
      label: `#${player.jerseyNumber || "?"} ${player.fullName}${!eligibility.isEligible ? ` ⛔ (${eligibility.reason || "Exhausted"})` : ""}`,
    }));

  const pendingSubs = getPendingSubsSync();

  const toggleMethod = (methodId: string) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(methodId)) {
        next.delete(methodId);
      } else {
        next.add(methodId);
      }
      return next;
    });
  };

  const handleToggleClock = async () => {
    if (!game) return;
    if (activeStoppage) {
      await endStoppage(activeStoppage.id);
      setIsPausedLocally(false);
    } else {
      const gameTimeSeconds = useGameStore.getState().getGameTime();
      const newMajor = await fetch(`/api/game_events_major`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: Number(game.game_id || game.id),
          event_type: "stoppage",
          period: game.currentPeriodIndex + 1,
          game_time: gameTimeSeconds,
          clock_should_run: 0,
          details: "Manual Clock Pause",
        }),
      }).then((r) => r.json());

      if (newMajor?.id) {
        addMajorEvent({
          id: newMajor.id,
          game_id: Number(game.game_id || game.id),
          period: game.currentPeriodIndex + 1,
          game_time: gameTimeSeconds,
          clock_should_run: 0,
          details: "Manual Clock Pause",
          start_time: Date.now(),
          end_time: null,
        });
      }
      setIsPausedLocally(true);
    }
  };

  // Queue sub for restart
  const handleQueueStoppageSub = async () => {
    if (!stoppageSubOutId || !stoppageSubInId) {
      return;
    }
    try {
      await createPendingSub(stoppageSubInId, stoppageSubOutId);
      setStoppageSubOutId("");
      setStoppageSubInId("");
    } catch (err: any) {
      console.error("Failed to queue sub:", err);
    }
  };

  // Execute sub immediately during stoppage
  const handleExecuteSubImmediately = async () => {
    if (!stoppageSubOutId || !stoppageSubInId) {
      return;
    }
    try {
      const newSub = await createPendingSub(stoppageSubInId, stoppageSubOutId);
      if (newSub?.id) {
        await confirmSub(newSub.id);
      }
      setStoppageSubOutId("");
      setStoppageSubInId("");
    } catch (err: any) {
      console.error("Failed to execute sub:", err);
    }
  };

  // Execute specific queued pending sub
  const handleExecuteSingleQueuedSub = async (subId: string | number) => {
    try {
      await confirmSub(subId);
    } catch (err: any) {
      console.error("Failed to execute sub:", err);
    }
  };

  // Delete specific queued pending sub
  const handleDeleteSingleQueuedSub = async (subId: string | number) => {
    try {
      await cancelSub(subId);
    } catch (err: any) {
      console.error("Failed to cancel sub:", err);
    }
  };

  // Cancel active stoppage
  const handleCancelStoppage = () => {
    if (!activeStoppage) {
      onClose();
      return;
    }
    try {
      deleteEvent(activeStoppage.id, "major");
      setIsPausedLocally(false);
      setStopClock(false);
      if (game) {
        saveGameCache(
          game.game_id || game.id || "",
          useGameStore.getState().game,
          useGamePlayersStore.getState().players
        );
      }
      toast.success("Stoppage Canceled!");
      onClose();
    } catch (err: any) {
      toast.error("Failed to cancel stoppage: " + err.message);
    }
  };

  // End stoppage & resume clock
  const handleEndStoppageAndResume = (confirmPendingSubs = false) => {
    if (!activeStoppage) {
      onClose();
      return;
    }

    try {
      if (confirmPendingSubs && pendingSubs.length > 0) {
        confirmAllPendingSubs();
      }
      endStoppage(activeStoppage.id);
      setIsPausedLocally(false);
      setStopClock(false);
      setShowPendingSubPrompt(false);
      if (game) {
        saveGameCache(
          game.game_id || game.id || "",
          useGameStore.getState().game,
          useGamePlayersStore.getState().players
        );
      }
      toast.success("Stoppage Ended — Clock Resumed!");
      onClose();
    } catch (err: any) {
      toast.error("Failed to end stoppage: " + err.message);
    }
  };

  const handleEndStoppageClick = () => {
    if (pendingSubs.length > 0 && !showPendingSubPrompt) {
      setShowPendingSubPrompt(true);
    } else {
      handleEndStoppageAndResume(false);
    }
  };

  // SUBMIT GOAL
  const handleGoalSubmit = () => {
    if (!game) return;

    if (teamTarget === "us" && !isOwnGoal && !goalScorerId) {
      toast.error("Please select the goal scorer from currently on-field players.");
      return;
    }

    try {
      const isOpp = teamTarget === "opp";
      const scorer = players.find((p) => String(p.id) === goalScorerId);
      const assist = players.find((p) => String(p.id) === goalAssistId);
      const ourTeamSeasonId = game.teamSeasonId || (game.isHome ? game.home_team_season_id : game.away_team_season_id);
      const oppTeamSeasonId = game.opponentId || (game.isHome ? game.away_team_season_id : game.home_team_season_id);
      const teamSeasonVal = isOpp ? oppTeamSeasonId : ourTeamSeasonId;
      const gameTimeSeconds = liveSeconds || useGameStore.getState().getPeriodTime();
      const goalMethodsArr = Array.from(selectedMethods);
      const goalTypesJson = JSON.stringify(goalMethodsArr.length > 0 ? goalMethodsArr : ["open_play"]);

      const activeGk = players.find((p) => (p.fieldStatus === "onFieldGk" || p.gameStatus === "goalkeeper") && p.fieldStatus !== "onBench");
      const defendingGkPlayerGameId = isOpp || isOwnGoal ? (activeGk?.playerGameId ? Number(activeGk.playerGameId) : null) : null;

      const tempGoalId = `temp_goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const tempMajorId = `temp_major_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const payload = {
        game_id: Number(game.game_id || game.id),
        team_season_id: Number(teamSeasonVal),
        scorer_player_game_id: !isOpp && scorer?.playerGameId ? Number(scorer.playerGameId) : null,
        assist_player_game_id: !isOpp && assist?.playerGameId ? Number(assist.playerGameId) : null,
        defending_gk_player_game_id: defendingGkPlayerGameId,
        opponent_jersey_number: isOpp && oppScorerJersey ? Number(oppScorerJersey) : null,
        is_own_goal: isOwnGoal,
        goal_types: goalTypesJson,
        game_time: gameTimeSeconds,
        period: game.currentPeriodIndex + 1,
      };

      // 1. Synchronous Optimistic Update (0ms delay)
      addGoalEvent(
        {
          id: tempGoalId,
          major_event_id: tempMajorId,
          team_season_id: Number(teamSeasonVal),
          is_own_goal: isOwnGoal,
          goal_types: goalTypesJson,
          scorer_player_game_id: !isOpp && scorer?.playerGameId ? Number(scorer.playerGameId) : null,
          assist_player_game_id: !isOpp && assist?.playerGameId ? Number(assist.playerGameId) : null,
          defending_gk_player_game_id: defendingGkPlayerGameId,
        } as any,
        {
          id: tempMajorId,
          game_id: Number(game.game_id || game.id),
          period: game.currentPeriodIndex + 1,
          event_type: "goal",
          game_time: gameTimeSeconds,
          clock_should_run: stopClock ? 0 : 1,
          details: goalNotes || (isOwnGoal ? "Own Goal Stoppage" : "Goal Kickoff Stoppage"),
          start_time: Date.now(),
          end_time: null,
        } as any
      );

      if (!isOpp && scorer?.playerGameId) {
        fetch("/api/game_events_player_actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: Number(game.game_id || game.id),
            player_game_id: Number(scorer.playerGameId),
            event_type: "shot",
            game_time: gameTimeSeconds,
            period: game.currentPeriodIndex + 1,
          }),
        }).then((r) => r.json()).then((newAction) => {
          if (newAction?.id) {
            useGameStore.getState().addPlayerAction({
              id: newAction.id,
              game_id: Number(game.game_id || game.id),
              team_season_id: Number(game.teamSeasonId),
              player_game_id: Number(scorer.playerGameId),
              event_type: "shot",
              game_time: gameTimeSeconds,
              period: game.currentPeriodIndex + 1,
            } as any);
          }
        }).catch((err) => console.error("Error logging auto shot on goal:", err));
      }

      if (stopClock) {
        setIsPausedLocally(true);
      }

      // Save device cache snapshot synchronously
      saveGameCache(
        game.game_id || game.id || "",
        useGameStore.getState().game,
        useGamePlayersStore.getState().players
      );

      // CLOSE MODAL IMMEDIATELY
      onClose();

      // 2. Background Persistence (Non-blocking)
      (async () => {
        try {
          const majorRes = await fetch(`/api/game_events_major`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              event_type: "goal",
              game_time: gameTimeSeconds,
              clock_should_run: stopClock ? 0 : 1,
              details: goalNotes || (isOwnGoal ? "Own Goal Stoppage" : "Goal Kickoff Stoppage"),
            }),
          }).then((r) => r.json());

          if (!majorRes?.id) throw new Error("Failed to create major event record.");

          const newGoal = await fetch(`/api/game_events_goals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              major_event_id: Number(majorRes.id),
              team_season_id: Number(teamSeasonVal),
              scorer_player_game_id: !isOpp && scorer?.playerGameId ? Number(scorer.playerGameId) : null,
              assist_player_game_id: !isOpp && assist?.playerGameId ? Number(assist.playerGameId) : null,
              defending_gk_player_game_id: defendingGkPlayerGameId,
              opponent_jersey_number: isOpp && oppScorerJersey ? Number(oppScorerJersey) : null,
              is_own_goal: isOwnGoal,
              goal_types: goalTypesJson,
            }),
          }).then((r) => r.json());

          if (newGoal?.id) {
            useGameStore.getState().replaceGoalEvent(
              tempGoalId,
              newGoal,
              tempMajorId,
              {
                id: majorRes.id,
                game_id: Number(game.game_id || game.id),
                period: game.currentPeriodIndex + 1,
                event_type: "goal",
                game_time: gameTimeSeconds,
                clock_should_run: stopClock ? 0 : 1,
                details: goalNotes || (isOwnGoal ? "Own Goal Stoppage" : "Goal Kickoff Stoppage"),
                start_time: Date.now(),
                end_time: null,
              } as any
            );
            saveGameCache(
              game.game_id || game.id || "",
              useGameStore.getState().game,
              useGamePlayersStore.getState().players
            );
          }
        } catch (err: any) {
          console.warn("Error persisting goal to server, queueing offline fallback:", err);
          enqueueOfflineAction("goal", "game_events_goals", "POST", {
            majorPayload: {
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              event_type: "goal",
              game_time: gameTimeSeconds,
              clock_should_run: stopClock ? 0 : 1,
              details: goalNotes || (isOwnGoal ? "Own Goal Stoppage" : "Goal Kickoff Stoppage"),
            },
            goalPayload: {
              team_season_id: Number(teamSeasonVal),
              scorer_player_game_id: !isOpp && scorer?.playerGameId ? Number(scorer.playerGameId) : null,
              assist_player_game_id: !isOpp && assist?.playerGameId ? Number(assist.playerGameId) : null,
              defending_gk_player_game_id: defendingGkPlayerGameId,
              opponent_jersey_number: isOpp && oppScorerJersey ? Number(oppScorerJersey) : null,
              is_own_goal: isOwnGoal,
              goal_types: goalTypesJson,
            },
          });
        }
      })();
    } catch (err: any) {
      toast.error("Failed to record goal: " + err.message);
    }
  };

  // SUBMIT CARD / DISCIPLINE
  const handleCardSubmit = () => {
    if (!game) return;

    if (teamTarget === "us" && !cardPlayerId) {
      toast.error("Please select a player for the card.");
      return;
    }

    try {
      const isOpp = teamTarget === "opp";
      const player = players.find((p) => String(p.id) === cardPlayerId);
      const ourTeamSeasonId = game.teamSeasonId || (game.isHome ? game.home_team_season_id : game.away_team_season_id);
      const oppTeamSeasonId = game.opponentId || (game.isHome ? game.away_team_season_id : game.home_team_season_id);
      const teamSeasonVal = isOpp ? oppTeamSeasonId : ourTeamSeasonId;
      const gameTimeSeconds = liveSeconds || useGameStore.getState().getPeriodTime();

      const tempCardId = `temp_card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const tempMajorId = `temp_major_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const payload = {
        game_id: Number(game.game_id || game.id),
        team_season_id: Number(teamSeasonVal),
        player_game_id: !isOpp && player?.playerGameId ? Number(player.playerGameId) : null,
        opponent_jersey_number: isOpp && oppCardJersey ? Number(oppCardJersey) : null,
        card_type: cardType,
        card_reason: cardReason || null,
        game_time: gameTimeSeconds,
        period: game.currentPeriodIndex + 1,
      };

      // 1. Synchronous Optimistic Update
      addDisciplineEvent(
        {
          id: tempCardId,
          major_event_id: tempMajorId,
          team_season_id: Number(teamSeasonVal),
          card_type: cardType,
          card_reason: cardReason,
          player_game_id: !isOpp && player?.playerGameId ? Number(player.playerGameId) : null,
        } as any,
        {
          id: tempMajorId,
          game_id: Number(game.game_id || game.id),
          period: game.currentPeriodIndex + 1,
          event_type: "card",
          game_time: gameTimeSeconds,
          clock_should_run: stopClock ? 0 : 1,
          details: cardReason || `${cardType.toUpperCase()} Card Stoppage`,
          start_time: Date.now(),
          end_time: null,
        } as any
      );

      if (stopClock) {
        setIsPausedLocally(true);
      }

      saveGameCache(
        game.game_id || game.id || "",
        useGameStore.getState().game,
        useGamePlayersStore.getState().players
      );

      // CLOSE MODAL IMMEDIATELY
      onClose();

      // 2. Background Persistence
      (async () => {
        try {
          const majorRes = await fetch(`/api/game_events_major`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              event_type: "card",
              game_time: gameTimeSeconds,
              clock_should_run: stopClock ? 0 : 1,
              details: cardReason || `${cardType.toUpperCase()} Card Stoppage`,
            }),
          }).then((r) => r.json());

          if (!majorRes?.id) throw new Error("Failed to create major event record.");

          const newCard = await fetch(`/api/game_events_discipline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              major_event_id: Number(majorRes.id),
              team_season_id: Number(teamSeasonVal),
              player_game_id: !isOpp && player?.playerGameId ? Number(player.playerGameId) : null,
              opponent_jersey_number: isOpp && oppCardJersey ? Number(oppCardJersey) : null,
              card_type: cardType,
              card_reason: cardReason || null,
            }),
          }).then((r) => r.json());

          if (newCard?.id) {
            useGameStore.getState().replaceDisciplineEvent(
              tempCardId,
              newCard,
              tempMajorId,
              {
                id: majorRes.id,
                game_id: Number(game.game_id || game.id),
                period: game.currentPeriodIndex + 1,
                game_time: gameTimeSeconds,
                clock_should_run: stopClock ? 0 : 1,
                details: cardReason || `${cardType.toUpperCase()} Card Stoppage`,
                start_time: Date.now(),
                end_time: null,
              } as any
            );
            saveGameCache(
              game.game_id || game.id || "",
              useGameStore.getState().game,
              useGamePlayersStore.getState().players
            );
          }
        } catch (err: any) {
          console.warn("Error persisting card to server, queueing offline fallback:", err);
          enqueueOfflineAction("discipline", "game_events_discipline", "POST", {
            majorPayload: {
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              event_type: "card",
              game_time: gameTimeSeconds,
              clock_should_run: stopClock ? 0 : 1,
              details: cardReason || `${cardType.toUpperCase()} Card Stoppage`,
            },
            cardPayload: {
              team_season_id: Number(teamSeasonVal),
              player_game_id: !isOpp && player?.playerGameId ? Number(player.playerGameId) : null,
              opponent_jersey_number: isOpp && oppCardJersey ? Number(oppCardJersey) : null,
              card_type: cardType,
              card_reason: cardReason || null,
            },
          });
        }
      })();
    } catch (err: any) {
      toast.error("Failed to record card: " + err.message);
    }
  };

  // SUBMIT PENALTY KICK (PK)
  const handlePkSubmit = () => {
    if (!game) return;

    if (teamTarget === "us" && !pkTakerId) {
      toast.error("Please select an on-field player for the Penalty Kick.");
      return;
    }

    startTransition(async () => {
      try {
        const isOpp = teamTarget === "opp";
        const taker = players.find((p) => String(p.id) === pkTakerId);
        const gameTimeSeconds = liveSeconds || useGameStore.getState().getPeriodTime();
        const finalOutcome = isReboundGoal ? "goal" : pkOutcome;

        const ourTeamSeasonId = game.teamSeasonId || (game.isHome ? game.home_team_season_id : game.away_team_season_id);
        const oppTeamSeasonId = game.opponentId || (game.isHome ? game.away_team_season_id : game.home_team_season_id);
        const teamSeasonVal = isOpp ? oppTeamSeasonId : ourTeamSeasonId;
        const activeGk = players.find((p) => (p.fieldStatus === "onFieldGk" || p.gameStatus === "goalkeeper") && p.fieldStatus !== "onBench");
        const defendingGkPlayerGameId = isOpp ? (activeGk?.playerGameId ? Number(activeGk.playerGameId) : null) : null;

        const majorRes = await fetch(`/api/game_events_major`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: Number(game.game_id || game.id),
            period: game.currentPeriodIndex + 1,
            event_type: "penalty",
            game_time: gameTimeSeconds,
            clock_should_run: 0,
            details: pkNotes || "Penalty Kick Stoppage",
          }),
        }).then((r) => r.json());

        if (!majorRes?.id) throw new Error("Failed to create major event record.");

        const pkPayload = {
          major_event_id: Number(majorRes.id),
          team_season_id: Number(teamSeasonVal),
          shooter_player_game_id: !isOpp && taker?.playerGameId ? Number(taker.playerGameId) : null,
          opponent_jersey_number: isOpp && oppPkTakerJersey ? Number(oppPkTakerJersey) : null,
          outcome: finalOutcome,
        };

        await fetch(`/api/game_events_penalties`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pkPayload),
        });

        if (finalOutcome === "goal" || isReboundGoal) {
          const pkGoalTypesJson = JSON.stringify([isReboundGoal ? "pk_rebound" : "penalty"]);
          const goalPayload = {
            major_event_id: Number(majorRes.id),
            team_season_id: Number(teamSeasonVal),
            scorer_player_game_id: !isOpp && taker?.playerGameId ? Number(taker.playerGameId) : null,
            defending_gk_player_game_id: defendingGkPlayerGameId,
            goal_types: pkGoalTypesJson,
          };
          const newGoal = await fetch(`/api/game_events_goals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(goalPayload),
          }).then((r) => r.json());

          if (newGoal?.id) {
            addGoalEvent(
              {
                id: newGoal.id,
                major_event_id: newGoal.major_event_id,
                team_season_id: Number(teamSeasonVal),
                goal_types: pkGoalTypesJson,
                scorer_player_game_id: !isOpp && taker?.playerGameId ? Number(taker.playerGameId) : null,
              } as any,
              {
                id: newGoal.major_event_id,
                game_id: Number(game.game_id || game.id),
                period: game.currentPeriodIndex + 1,
                game_time: gameTimeSeconds,
                clock_should_run: 0,
                details: pkNotes || "PK Goal Stoppage",
                start_time: Date.now(),
                end_time: null,
              } as any
            );

            if (!isOpp && taker?.playerGameId) {
              fetch("/api/game_events_player_actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  game_id: Number(game.game_id || game.id),
                  player_game_id: Number(taker.playerGameId),
                  event_type: "shot",
                  game_time: gameTimeSeconds,
                  period: game.currentPeriodIndex + 1,
                }),
              }).then((r) => r.json()).then((newAction) => {
                if (newAction?.id) {
                  useGameStore.getState().addPlayerAction({
                    id: newAction.id,
                    game_id: Number(game.game_id || game.id),
                    team_season_id: Number(game.teamSeasonId),
                    player_game_id: Number(taker.playerGameId),
                    event_type: "shot",
                    game_time: gameTimeSeconds,
                    period: game.currentPeriodIndex + 1,
                  } as any);
                }
              }).catch((err) => console.error("Error logging PK auto shot:", err));
            }
          }
        }

        setEventType("stoppage");
        setStoppageCategory("stoppage");
        setStoppageDetails(pkNotes || `Kickoff / PK (${finalOutcome.toUpperCase()}) Stoppage`);
      } catch (err: any) {
        toast.error("Failed to record penalty kick: " + err.message);
      }
    });
  };

  // SUBMIT STOPPAGE / INJURY / VAR
  const handleStoppageSubmit = () => {
    if (!game) return;

    const gameTimeSeconds = liveSeconds || useGameStore.getState().getPeriodTime();
    const reasonStr = stoppageDetails || stoppageCategory.toUpperCase() + " Stoppage";
    const tempMajorId = `temp_stoppage_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Synchronous Optimistic Update
    addMajorEvent({
      id: tempMajorId,
      game_id: Number(game.game_id || game.id),
      period: game.currentPeriodIndex + 1,
      event_type: "stoppage",
      game_time: gameTimeSeconds,
      clock_should_run: stopClock ? 0 : 1,
      details: reasonStr,
      start_time: Date.now(),
      end_time: null,
    });

    if (stopClock) {
      setIsPausedLocally(true);
    }

    // Save device cache snapshot synchronously
    saveGameCache(
      game.game_id || game.id || "",
      useGameStore.getState().game,
      useGamePlayersStore.getState().players
    );

    // CLOSE MODAL IMMEDIATELY
    onClose();

    // 2. Background Persistence
    startTransition(async () => {
      try {
        const newMajor = await fetch(`/api/game_events_major`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: Number(game.game_id || game.id),
            event_type: "stoppage",
            period: game.currentPeriodIndex + 1,
            game_time: gameTimeSeconds,
            clock_should_run: stopClock ? 0 : 1,
            details: reasonStr,
          }),
        }).then((r) => r.json());

        if (newMajor?.id) {
          // Replace temp ID with server ID if needed
        }
      } catch (err: any) {
        console.error("Failed to log stoppage to server:", err);
      }
    });
  };

  // SHARED IN-EVENT SUBSTITUTIONS WIDGET (RENDERED ON ALL EVENT TABS)
  const renderSubstitutionsWidget = () => (
    <div className="p-3 bg-background/50 border border-border/60 rounded-xl space-y-3 mt-3">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text">
          <ArrowRightLeft size={14} className="text-primary" />
          <span>Substitutions During Event / Stoppage</span>
        </div>
        <Checkbox
          label="Include Exhausted Players (Override)"
          checked={allowExhaustedOverride}
          onChange={(val: any) => setAllowExhaustedOverride(typeof val === "boolean" ? val : Boolean(val?.target?.checked))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select
          label="Player OUT (On-Field)"
          value={stoppageSubOutId}
          onChange={(e: any) => setStoppageSubOutId(e.target.value)}
          options={[{ value: "", label: "-- Select Player OUT --" }, ...subOutOptions]}
        />
        <Select
          label="Player IN (Bench Reserve)"
          value={stoppageSubInId}
          onChange={(e: any) => setStoppageSubInId(e.target.value)}
          options={[{ value: "", label: "-- Select Player IN --" }, ...subInOptions]}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="xs"
          onClick={handleQueueStoppageSub}
          disabled={!stoppageSubOutId || !stoppageSubInId}
          className="font-bold text-[10px]"
        >
          <span>Queue for Restart</span>
        </Button>
        <Button
          variant="primary"
          size="xs"
          onClick={handleExecuteSubImmediately}
          disabled={!stoppageSubOutId || !stoppageSubInId}
          className="font-bold text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <span>Enter Sub Now ⚡</span>
        </Button>
      </div>

      {pendingSubs.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <span className="text-[10px] font-bold text-muted block">Queued Pending Subs ({pendingSubs.length}):</span>
          <div className="space-y-1">
            {pendingSubs.map((sub) => {
              const inP = players.find((p) => String(p.playerGameId || p.id) === String(sub.inPlayerId));
              const outP = players.find((p) => String(p.playerGameId || p.id) === String(sub.outPlayerId));
              return (
                <div key={sub.subId} className="text-[10px] font-semibold bg-surface p-2 rounded-lg border flex justify-between items-center gap-2">
                  <span className="truncate">Out: #{outP?.jerseyNumber || "?"} {outP?.fullName || "Player"} 🔄 In: #{inP?.jerseyNumber || "?"} {inP?.fullName || "Player"}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleExecuteSingleQueuedSub(sub.subId)}
                      className="px-1.5 py-0.5 text-[9px] font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Execute Now ⚡
                    </Button>
                    <button
                      onClick={() => handleDeleteSingleQueuedSub(sub.subId)}
                      className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                      title="Cancel sub"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnOverlayClick={false}
      title="Record Major Match Event"
      subtitle="Immediate event logging with clock controls"
    >
      <div className="space-y-4 text-xs">
        {/* Header Bar: Timed Match Clock & Single Pause Toggle */}
        <div className="flex items-center justify-between p-3 bg-surface border border-border/80 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Timed Match Clock:</span>
            <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
              stopClock
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}>
              {formatSecondsToMmss(liveSeconds)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setStopClock(!stopClock)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer shadow-2xs ${
              stopClock
                ? "bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
            }`}
          >
            {stopClock ? (
              <>
                <PauseCircle size={15} className="text-amber-500 animate-pulse" />
                <span>Clock Paused ⏸️</span>
              </>
            ) : (
              <>
                <PlayCircle size={15} className="text-emerald-400" />
                <span>Clock Running ⏱️</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Action Event Type Button Bar */}
        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted">
            Select Event Type
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {[
              { type: "goal", label: "Goal", icon: Trophy, color: "text-emerald-500" },
              { type: "card", label: "Card", icon: ShieldAlert, color: "text-amber-500" },
              { type: "pk", label: "PK", icon: Target, color: "text-blue-500" },
              { type: "injury", label: "Injury", icon: Activity, color: "text-rose-500" },
              { type: "hydration", label: "Water", icon: Droplets, color: "text-cyan-400" },
              { type: "weather", label: "Delay", icon: Zap, color: "text-yellow-500" },
              { type: "var", label: "VAR", icon: Tv, color: "text-indigo-500" },
              { type: "stoppage", label: "Pause", icon: PauseCircle, color: "text-slate-500" },
            ].map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => {
                  setEventType(type as MajorEventType);
                  if (type === "injury" || type === "hydration" || type === "weather" || type === "var" || type === "stoppage") {
                    setStoppageCategory(type === "hydration" ? "stoppage" : type as any);
                    if (type === "hydration") {
                      setStoppageDetails("Hydration / Water Break");
                    }
                  }
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                  eventType === type || (eventType === "stoppage" && stoppageCategory === type)
                    ? "bg-primary text-white border-primary shadow-sm font-extrabold"
                    : "bg-surface border-border text-muted hover:border-primary/50 hover:text-text font-bold"
                }`}
              >
                <Icon size={16} className={eventType === type ? "text-white" : color} />
                <span className="text-[10px] mt-1 tracking-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PAUSE CLOCK TOGGLE FOR EVENT */}
        <div className="flex items-center justify-between p-2.5 bg-surface border border-border/80 rounded-xl">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-text">Pause Timed Match Clock</span>
            <span className="text-[10px] text-muted">
              {stopClock ? "Match clock is paused. Clock does not tick." : "Match clock continues running live."}
            </span>
          </div>
          <Checkbox
            label={stopClock ? "Paused ⏸️" : "Running ⏱️"}
            checked={stopClock}
            onChange={(val: any) => setStopClock(typeof val === "boolean" ? val : Boolean(val?.target?.checked))}
          />
        </div>

        {/* TEAM TARGET TOGGLE (Us vs Opponent) */}
        {(eventType === "goal" || eventType === "card" || eventType === "pk") && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Team:</span>
            <div className="flex gap-1.5 flex-1">
              <button
                onClick={() => setTeamTarget("us")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                  teamTarget === "us"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface border-border text-muted hover:border-primary/50"
                }`}
              >
                Our Team
              </button>
              <button
                onClick={() => setTeamTarget("opp")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                  teamTarget === "opp"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-surface border-border text-muted hover:border-amber-600/50"
                }`}
              >
                {opponentShortName}
              </button>
            </div>
          </div>
        )}

        {/* ⚽ GOAL FORM */}
        {eventType === "goal" && (
          <div className="space-y-3.5 pt-2 border-t border-border/40">
            <Checkbox
              label="Own Goal?"
              checked={isOwnGoal}
              onChange={(val: any) => {
                const isChecked = typeof val === "boolean" ? val : Boolean(val?.target?.checked);
                setIsOwnGoal(isChecked);
              }}
            />

            {teamTarget === "us" ? (
              !isOwnGoal && (
                <>
                  <Select
                    label="Goal Scorer (On-Field Players Only)"
                    value={goalScorerId}
                    onChange={(e: any) => setGoalScorerId(e.target.value)}
                    options={[{ value: "", label: "-- Select Scorer --" }, ...scorerOptions]}
                  />
                  <Select
                    label="Assist By (Optional)"
                    value={goalAssistId}
                    onChange={(e: any) => setGoalAssistId(e.target.value)}
                    options={[{ value: "", label: "-- None (Optional) --" }, ...assistOptions]}
                  />
                </>
              )
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Opponent Scorer # (Optional)"
                  placeholder="e.g. 9"
                  value={oppScorerJersey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOppScorerJersey(e.target.value)}
                />
                <Input
                  label="Opponent Assist # (Optional)"
                  placeholder="e.g. 10"
                  value={oppAssistJersey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOppAssistJersey(e.target.value)}
                />
              </div>
            )}

            {/* Goal Method Checkboxes */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted mb-1.5">
                Goal Method / Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {GOAL_METHOD_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleMethod(id)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all text-left flex items-center justify-between ${
                      selectedMethods.has(id)
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                        : "bg-surface border-border text-muted hover:border-emerald-500/40"
                    }`}
                  >
                    <span>{label}</span>
                    {selectedMethods.has(id) && <Check size={12} className="text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Stoppage Details / Goal Notes (Optional)"
              placeholder="e.g. Deflected off defender, Kickoff restart notes"
              value={goalNotes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalNotes(e.target.value)}
            />

            {renderSubstitutionsWidget()}
          </div>
        )}

        {/* 🟨 DISCIPLINE / CARD FORM */}
        {eventType === "card" && (
          <div className="space-y-3.5 pt-2 border-t border-border/40">
            {teamTarget === "us" ? (
              <Select
                label="Select Player"
                value={cardPlayerId}
                onChange={(e: any) => setCardPlayerId(e.target.value)}
                options={[{ value: "", label: "-- Player --" }, ...cardPlayerOptions]}
              />
            ) : (
              <Input
                label="Opponent Jersey # (Optional)"
                placeholder="e.g. 4"
                value={oppCardJersey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOppCardJersey(e.target.value)}
              />
            )}

            <Select
              label="Card Type"
              value={cardType}
              onChange={(e: any) => setCardType(e.target.value as any)}
              options={[
                { value: "yellow", label: "Yellow Card" },
                { value: "red", label: "Red Card (Ejection)" },
                { value: "yellow_red", label: "Second Yellow (Red)" },
              ]}
            />

            <Input
              label="Reason for Card (Optional)"
              placeholder="e.g. Unsporting Behavior / Tactical Foul"
              value={cardReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardReason(e.target.value)}
            />

            {renderSubstitutionsWidget()}
          </div>
        )}

        {/* 🎯 PENALTY KICK (PK) FORM */}
        {eventType === "pk" && (
          <div className="space-y-3.5 pt-2 border-t border-border/40">
            {teamTarget === "us" ? (
              <Select
                label="PK Taker (On-Field Players Only)"
                value={pkTakerId}
                onChange={(e: any) => setPkTakerId(e.target.value)}
                options={[{ value: "", label: "-- Select Taker --" }, ...pkTakerOptions]}
              />
            ) : (
              <Input
                label="Opponent Taker Jersey # (Optional)"
                placeholder="e.g. 10"
                value={oppPkTakerJersey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOppPkTakerJersey(e.target.value)}
              />
            )}

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted mb-1.5">
                Penalty Kick Result
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "goal", label: "Goal ⚽", class: "hover:border-emerald-500" },
                  { id: "saved", label: "Saved 🧤", class: "hover:border-blue-500" },
                  { id: "missed", label: "Missed ❌", class: "hover:border-rose-500" },
                  { id: "hit_post", label: "Hit Post 🥅", class: "hover:border-amber-500" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPkOutcome(item.id as any);
                      if (item.id === "goal") setIsReboundGoal(false);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-black border transition-all text-center cursor-pointer ${
                      pkOutcome === item.id
                        ? "bg-primary text-white border-primary shadow-xs"
                        : `bg-surface border-border text-muted ${item.class}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {pkOutcome !== "goal" && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                <Checkbox
                  label="Rebound / Follow-up Goal Scored?"
                  checked={isReboundGoal}
                  onChange={(val: any) => {
                    const isChecked = typeof val === "boolean" ? val : Boolean(val?.target?.checked);
                    setIsReboundGoal(isChecked);
                  }}
                />
                {isReboundGoal && (
                  <p className="text-[10px] text-muted flex items-center gap-1">
                    <CornerDownRight size={12} className="text-primary" />
                    <span>Saves initial PK result and logs follow-up goal event + kickoff stoppage.</span>
                  </p>
                )}
              </div>
            )}

            <Input
              label="Stoppage Details / PK Notes (Optional)"
              placeholder="e.g. Hand ball in penalty box, Ref stoppage notes"
              value={pkNotes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPkNotes(e.target.value)}
            />

            {renderSubstitutionsWidget()}
          </div>
        )}

        {/* ⏸️ STOPPAGE FORM (Injury, Weather, VAR, Other) */}
        {(eventType === "injury" || eventType === "weather" || eventType === "var" || eventType === "stoppage") && (
          <div className="space-y-4 pt-2 border-t border-border/40">
            <Input
              label="Stoppage Reason / Details (Optional)"
              placeholder="e.g. Head Injury Evaluation, Ref Timeout, Water Break"
              value={stoppageDetails}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoppageDetails(e.target.value)}
            />

            {renderSubstitutionsWidget()}
          </div>
        )}

        {/* PENDING SUB CONFIRMATION PROMPT */}
        {showPendingSubPrompt && pendingSubs.length > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
              <ArrowRightLeft size={16} />
              <span>Execute {pendingSubs.length} Queued Substitutions?</span>
            </div>
            <p className="text-[11px] text-muted">
              You have {pendingSubs.length} substitution(s) queued for this restart. Would you like to confirm and execute them before resuming match time?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleEndStoppageAndResume(false)}
                disabled={isPending}
                className="text-[10px]"
              >
                Resume Without Executing
              </Button>
              <Button
                variant="primary"
                size="xs"
                onClick={() => handleEndStoppageAndResume(true)}
                disabled={isPending}
                className="text-[10px] font-bold"
              >
                Confirm Subs & Resume Play
              </Button>
            </div>
          </div>
        )}

        {/* UNIFIED BOTTOM FOOTER ACTION BAR */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
          {activeStoppage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelStoppage}
              className="text-rose-500 hover:text-rose-600 border-rose-500/30 text-xs flex items-center gap-1 font-bold"
            >
              <Trash2 size={14} />
              <span>Cancel Stoppage</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}

          {eventType === "goal" ? (
            <Button variant="primary" size="sm" onClick={handleGoalSubmit} disabled={isPending}>
              Record Goal ⚽
            </Button>
          ) : eventType === "card" ? (
            <Button variant="primary" size="sm" onClick={handleCardSubmit} disabled={isPending}>
              Record Card 🟨🟥
            </Button>
          ) : eventType === "pk" ? (
            <Button variant="primary" size="sm" onClick={handlePkSubmit} disabled={isPending}>
              Log Penalty Kick 🎯
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleStoppageSubmit} disabled={isPending}>
              Log Stoppage ⏸️
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
