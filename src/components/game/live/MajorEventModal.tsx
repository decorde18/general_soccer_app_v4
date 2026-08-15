"use client";

import React, { useState, useEffect, useTransition } from "react";
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
} from "lucide-react";

export type MajorEventType =
  | "goal"
  | "card"
  | "pk"
  | "injury"
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

  // Active unended stoppage
  const activeStoppage = game?.gameEventsMajor?.find(
    (s) => s.end_time === null && s.period === (game?.currentPeriodIndex || 0) + 1 && s.clock_should_run === 0
  );

  useEffect(() => {
    if (!isOpen) return;

    const gameSec = useGameStore.getState().getGameTime();
    setLiveSeconds(gameSec);

    const interval = setInterval(() => {
      setLiveSeconds(useGameStore.getState().getGameTime());
    }, 1000);

    if (activeStoppage) {
      setIsPausedLocally(true);
    } else if (game?.settings?.autoStopClockOnMajorEvent && game) {
      // Auto-create stoppage if setting enabled and clock is currently running
      fetch(`/api/game_events_major`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: Number(game.game_id || game.id),
          event_type: "stoppage",
          period: game.currentPeriodIndex + 1,
          game_time: gameSec,
          clock_should_run: 0,
          details: "Major Event Clock Pause",
        }),
      })
        .then((r) => r.json())
        .then((newMajor) => {
          if (newMajor?.id) {
            addMajorEvent({
              id: newMajor.id,
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              game_time: gameSec,
              clock_should_run: 0,
              details: "Major Event Clock Pause",
              start_time: Date.now(),
              end_time: null,
            });
          }
        })
        .catch(() => {});
      setIsPausedLocally(true);
    }

    return () => clearInterval(interval);
  }, [isOpen, game?.settings?.autoStopClockOnMajorEvent, game?.currentPeriodIndex, activeStoppage]);

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
      toast.error("Please select both player OUT and player IN for the substitution.");
      return;
    }
    try {
      await createPendingSub(stoppageSubInId, stoppageSubOutId);
      setStoppageSubOutId("");
      setStoppageSubInId("");
      toast.success("Substitution queued for restart.");
    } catch (err: any) {
      toast.error("Failed to queue sub: " + err.message);
    }
  };

  // Execute sub immediately during stoppage
  const handleExecuteSubImmediately = async () => {
    if (!stoppageSubOutId || !stoppageSubInId) {
      toast.error("Please select both player OUT and player IN for the substitution.");
      return;
    }
    try {
      const newSub = await createPendingSub(stoppageSubInId, stoppageSubOutId);
      if (newSub?.id) {
        await confirmSub(newSub.id);
      }
      setStoppageSubOutId("");
      setStoppageSubInId("");
      toast.success("Substitution executed immediately!");
    } catch (err: any) {
      toast.error("Failed to execute sub: " + err.message);
    }
  };

  // Execute specific queued pending sub
  const handleExecuteSingleQueuedSub = async (subId: string | number) => {
    try {
      await confirmSub(subId);
      toast.success("Queued sub executed immediately!");
    } catch (err: any) {
      toast.error("Failed to execute sub: " + err.message);
    }
  };

  // Delete specific queued pending sub
  const handleDeleteSingleQueuedSub = async (subId: string | number) => {
    try {
      await cancelSub(subId);
      toast.success("Queued sub canceled.");
    } catch (err: any) {
      toast.error("Failed to cancel sub: " + err.message);
    }
  };

  // Cancel active stoppage
  const handleCancelStoppage = async () => {
    if (!activeStoppage) {
      onClose();
      return;
    }
    try {
      await deleteEvent(activeStoppage.id, "major");
      setIsPausedLocally(false);
      onClose();
    } catch (err: any) {
      toast.error("Failed to cancel stoppage: " + err.message);
    }
  };

  // End stoppage & resume clock
  const handleEndStoppageAndResume = async (confirmPendingSubs = false) => {
    if (!activeStoppage) {
      onClose();
      return;
    }

    startTransition(async () => {
      try {
        if (confirmPendingSubs && pendingSubs.length > 0) {
          await confirmAllPendingSubs();
        }
        await endStoppage(activeStoppage.id);
        setIsPausedLocally(false);
        setShowPendingSubPrompt(false);
        onClose();
      } catch (err: any) {
        toast.error("Failed to end stoppage: " + err.message);
      }
    });
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

    startTransition(async () => {
      try {
        const isOpp = teamTarget === "opp";
        const scorer = players.find((p) => String(p.id) === goalScorerId);
        const assist = players.find((p) => String(p.id) === goalAssistId);
        const teamSeasonVal = isOpp ? game.opponentId : game.teamSeasonId;
        const gameTimeSeconds = useGameStore.getState().getGameTime();
        const goalMethodsStr = Array.from(selectedMethods).join(",");

        const payload = {
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(teamSeasonVal),
          scorer_player_game_id: !isOpp && scorer?.playerGameId ? Number(scorer.playerGameId) : null,
          assist_player_game_id: !isOpp && assist?.playerGameId ? Number(assist.playerGameId) : null,
          opponent_jersey_number: isOpp && oppScorerJersey ? Number(oppScorerJersey) : null,
          is_own_goal: isOwnGoal,
          goal_types: goalMethodsStr || "open_play",
          game_time: gameTimeSeconds,
          period: game.currentPeriodIndex + 1,
        };

        const newGoal = await fetch(`/api/game_events_goals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((r) => r.json());

        if (newGoal?.id) {
          addGoalEvent(
            {
              id: newGoal.id,
              major_event_id: newGoal.major_event_id,
              team_season_id: Number(teamSeasonVal),
              is_own_goal: isOwnGoal,
              goal_types: goalMethodsStr || "open_play",
              scorer_player_game_id: !isOpp && scorer?.playerGameId ? Number(scorer.playerGameId) : null,
              assist_player_game_id: !isOpp && assist?.playerGameId ? Number(assist.playerGameId) : null,
            } as any,
            {
              id: newGoal.major_event_id,
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              game_time: gameTimeSeconds,
              clock_should_run: 0,
              details: goalNotes || (isOwnGoal ? "Own Goal Stoppage" : "Goal Kickoff Stoppage"),
              start_time: Date.now(),
              end_time: null,
            } as any
          );
        }

        toast.success(`GOAL Recorded for ${isOpp ? opponentShortName : "Our Team"}!`);
        setEventType("stoppage");
        setStoppageCategory("stoppage");
        setStoppageDetails(goalNotes || (isOwnGoal ? "Own Goal Kickoff Stoppage" : "Goal Kickoff Stoppage"));
      } catch (err: any) {
        toast.error("Failed to record goal: " + err.message);
      }
    });
  };

  // SUBMIT CARD / DISCIPLINE
  const handleCardSubmit = () => {
    if (!game) return;

    if (teamTarget === "us" && !cardPlayerId) {
      toast.error("Please select a player for the card.");
      return;
    }

    startTransition(async () => {
      try {
        const isOpp = teamTarget === "opp";
        const player = players.find((p) => String(p.id) === cardPlayerId);
        const gameTimeSeconds = useGameStore.getState().getGameTime();
        const payload = {
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(isOpp ? game.opponentId : game.teamSeasonId),
          player_game_id: !isOpp && player?.playerGameId ? Number(player.playerGameId) : null,
          opponent_jersey_number: isOpp && oppCardJersey ? Number(oppCardJersey) : null,
          card_type: cardType,
          card_reason: cardReason || null,
          game_time: gameTimeSeconds,
          period: game.currentPeriodIndex + 1,
        };

        const newCard = await fetch(`/api/game_events_discipline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((r) => r.json());

        if (newCard?.id) {
          addDisciplineEvent(
            {
              id: newCard.id,
              major_event_id: newCard.major_event_id,
              team_season_id: Number(isOpp ? game.opponentId : game.teamSeasonId),
              card_type: cardType,
              card_reason: cardReason,
              player_game_id: !isOpp && player?.playerGameId ? Number(player.playerGameId) : null,
            } as any,
            {
              id: newCard.major_event_id,
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              game_time: gameTimeSeconds,
              clock_should_run: 0,
              details: cardReason || `${cardType.toUpperCase()} Card Stoppage`,
              start_time: Date.now(),
              end_time: null,
            } as any
          );
        }

        toast.success(`${cardType.toUpperCase()} Card recorded!`);
        setEventType("stoppage");
        setStoppageCategory("stoppage");
        setStoppageDetails(cardReason || `${cardType.toUpperCase()} Card Stoppage`);
      } catch (err: any) {
        toast.error("Failed to record card: " + err.message);
      }
    });
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
        const gameTimeSeconds = useGameStore.getState().getGameTime();
        const finalOutcome = isReboundGoal ? "goal" : pkOutcome;

        const pkPayload = {
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(isOpp ? game.opponentId : game.teamSeasonId),
          shooter_player_game_id: !isOpp && taker?.playerGameId ? Number(taker.playerGameId) : null,
          opponent_jersey_number: isOpp && oppPkTakerJersey ? Number(oppPkTakerJersey) : null,
          outcome: finalOutcome,
          game_time: gameTimeSeconds,
          period: game.currentPeriodIndex + 1,
        };

        await fetch(`/api/game_events_penalties`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pkPayload),
        });

        if (finalOutcome === "goal" || isReboundGoal) {
          const goalPayload = {
            game_id: Number(game.game_id || game.id),
            team_season_id: Number(isOpp ? game.opponentId : game.teamSeasonId),
            scorer_player_game_id: !isOpp && taker?.playerGameId ? Number(taker.playerGameId) : null,
            goal_types: isReboundGoal ? "pk_rebound" : "penalty",
            game_time: gameTimeSeconds,
            period: game.currentPeriodIndex + 1,
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
                team_season_id: Number(isOpp ? game.opponentId : game.teamSeasonId),
                goal_types: isReboundGoal ? "pk_rebound" : "penalty",
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
          }

          toast.success("Penalty Kick GOAL recorded!");
        }

        setEventType("stoppage");
        setStoppageCategory("stoppage");
        setStoppageDetails(pkNotes || `Kickoff / PK (${finalOutcome.toUpperCase()}) Stoppage`);
      } catch (err: any) {
        toast.error("Failed to record penalty kick: " + err.message);
      }
    });
  };

  // SUBMIT STOPPAGE
  const handleStoppageSubmit = () => {
    if (!game) return;
    startTransition(async () => {
      try {
        const gameTimeSeconds = useGameStore.getState().getGameTime();
        const reasonStr = stoppageDetails || stoppageCategory.toUpperCase() + " Stoppage";

        const newMajor = await fetch(`/api/game_events_major`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: Number(game.game_id || game.id),
            event_type: "stoppage",
            period: game.currentPeriodIndex + 1,
            game_time: gameTimeSeconds,
            clock_should_run: 0,
            details: reasonStr,
          }),
        }).then((r) => r.json());

        if (newMajor?.id) {
          addMajorEvent({
            id: newMajor.id,
            game_id: Number(game.game_id || game.id),
            period: game.currentPeriodIndex + 1,
            game_time: gameTimeSeconds,
            clock_should_run: 0,
            details: reasonStr,
            start_time: Date.now(),
            end_time: null,
          });
        }

        setIsPausedLocally(true);
      } catch (err: any) {
        toast.error("Failed to log stoppage: " + err.message);
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
      showCloseButton={!activeStoppage}
      closeOnOverlayClick={!activeStoppage}
      title="Record Major Match Event"
      subtitle={activeStoppage ? "Active Stoppage in Progress — Must End or Cancel Stoppage" : "Immediate event logging with auto-clock pause controls"}
    >
      <div className="space-y-4 text-xs">
        {/* Header Bar: Live Clock & Clock Pause Control */}
        <div className="flex items-center justify-between p-3 bg-surface border border-border/80 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Game Time:</span>
            <span className="font-mono font-black text-sm text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
              {formatSecondsToMmss(liveSeconds)}
            </span>
            {activeStoppage && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                Active Stoppage
              </span>
            )}
          </div>

          {!activeStoppage && (
            <Button
              variant={isPausedLocally ? "primary" : "outline"}
              size="xs"
              onClick={handleToggleClock}
              className="flex items-center gap-1.5 font-bold text-[10px]"
            >
              {isPausedLocally ? (
                <>
                  <PlayCircle size={14} className="text-emerald-400" />
                  <span>Resume Clock</span>
                </>
              ) : (
                <>
                  <PauseCircle size={14} className="text-amber-500" />
                  <span>Pause Clock</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Quick Action Event Type Button Bar */}
        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted">
            Select Event Type
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {[
              { type: "goal", label: "Goal", icon: Trophy, color: "text-emerald-500" },
              { type: "card", label: "Card", icon: ShieldAlert, color: "text-amber-500" },
              { type: "pk", label: "PK", icon: Target, color: "text-blue-500" },
              { type: "injury", label: "Injury", icon: Activity, color: "text-rose-500" },
              { type: "weather", label: "Delay", icon: Zap, color: "text-yellow-500" },
              { type: "var", label: "VAR", icon: Tv, color: "text-indigo-500" },
              { type: "stoppage", label: "Pause", icon: PauseCircle, color: "text-slate-500" },
            ].map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => {
                  setEventType(type as MajorEventType);
                  if (type === "injury" || type === "weather" || type === "var" || type === "stoppage") {
                    setStoppageCategory(type as any);
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
                    label="Assist By (Excludes Scorer)"
                    value={goalAssistId}
                    onChange={(e: any) => setGoalAssistId(e.target.value)}
                    options={[{ value: "", label: "-- Unassisted / None --" }, ...assistOptions]}
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

        {/* UNIFIED BOTTOM FOOTER ACTION BAR (VISIBLE ON ALL EVENT TABS) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60">
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

          {activeStoppage ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleEndStoppageClick}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5"
            >
              <PlayCircle size={16} />
              <span>End Stoppage & Resume Play</span>
            </Button>
          ) : eventType === "goal" ? (
            <Button variant="primary" size="sm" onClick={handleGoalSubmit} disabled={isPending}>
              Record Goal
            </Button>
          ) : eventType === "card" ? (
            <Button variant="primary" size="sm" onClick={handleCardSubmit} disabled={isPending}>
              Record Card
            </Button>
          ) : eventType === "pk" ? (
            <Button variant="primary" size="sm" onClick={handlePkSubmit} disabled={isPending}>
              Log Penalty Kick
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleStoppageSubmit} disabled={isPending}>
              Log Stoppage
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
