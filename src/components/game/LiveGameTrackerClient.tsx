"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Play,
  PauseCircle,
  Trophy,
  Users,
  Shield,
  Activity,
  AlertTriangle,
  Wifi,
  WifiOff,
  Plus,
  Target,
  Zap,
  Trash2,
  Check,
  Edit2,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore, { Player } from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import { useOnlineStatus } from "@/lib/offline/offlineSync";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";
import { formatTeamName } from "@/lib/utils/teamName";

export default function LiveGameTrackerClient() {
  const router = useRouter();
  const { id, teamSeasonId } = useParams<{ id: string; teamSeasonId: string }>();
  const { isOnline, queueCount } = useOnlineStatus();
  const [isPending, startTransition] = useTransition();

  // Zustand Store States
  const game = useGameStore((s) => s.game);
  const getGameStage = useGameStore((s) => s.getGameStage);
  const startNextPeriod = useGameStore((s) => s.startNextPeriod);
  const endPeriod = useGameStore((s) => s.endPeriod);
  const startStoppage = useGameStore((s) => s.startStoppage);
  const endStoppage = useGameStore((s) => s.endStoppage);
  const addGoalEvent = useGameStore((s) => s.addGoalEvent);
  const addDisciplineEvent = useGameStore((s) => s.addDisciplineEvent);
  const addPlayerAction = useGameStore((s) => s.addPlayerAction);
  const addTeamEvent = useGameStore((s) => s.addTeamEvent);
  const getCurrentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel);
  const initializeGame = useGameStore((s) => s.initializeGame);

  const players = useGamePlayersStore((s) => s.players);
  const {
    createPendingSub,
    confirmSub,
    cancelSub,
    confirmAllPendingSubs,
    getPendingSubsSync,
  } = useGameSubsStore();

  // Time calculations
  const calculateTotalTimeOnField = useGamePlayerTimeStore((s) => s.calculateTotalTimeOnField);
  const calculateCurrentTimeOnField = useGamePlayerTimeStore((s) => s.calculateCurrentTimeOnField);
  const calculateCurrentTimeOffField = useGamePlayerTimeStore((s) => s.calculateCurrentTimeOffField);

  // Clock local tick counter for UI smoothness & shift calculations
  const [gameTimeSeconds, setGameTimeSeconds] = useState<number>(0);
  const [, setTick] = useState<number>(0);

  // Unified Major Event Modal visibility and fields
  const [isMajorEventModalOpen, setIsMajorEventModalOpen] = useState(false);
  const [majorEventType, setMajorEventType] = useState<"goal" | "card" | "stoppage">("goal");

  // Recent Event deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Goal inputs
  const [goalScorerId, setGoalScorerId] = useState<string>("");
  const [goalAssistId, setGoalAssistId] = useState<string>("");
  const [goalType, setGoalType] = useState<string>("foot");
  const [isOpponentGoal, setIsOpponentGoal] = useState<boolean>(false);

  // Card inputs
  const [cardPlayerId, setCardPlayerId] = useState<string>("");
  const [cardType, setCardType] = useState<"yellow" | "red" | "yellow_red">("yellow");
  const [cardReason, setCardReason] = useState<string>("");

  // Stoppage inputs
  const [stoppageReason, setStoppageReason] = useState<string>("");

  // Substitution Quick Tap states
  const [subOutId, setSubOutId] = useState<string | null>(null); // player id
  const [subInId, setSubInId] = useState<string | null>(null);   // player id

  // Update tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      const storeTime = useGameStore.getState().getGameTime();
      setGameTimeSeconds(storeTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Automatic sub queueing when both an on-field and bench player are selected (Strict-mode safe)
  useEffect(() => {
    if (subOutId && subInId) {
      const outId = subOutId;
      const inId = subInId;

      // Clear selection states immediately to prevent race conditions & duplicate trigger in StrictMode
      setSubOutId(null);
      setSubInId(null);

      const executeAutoSub = async () => {
        try {
          const inPlayer = players.find((p) => String(p.id) === inId);
          const outPlayer = players.find((p) => String(p.id) === outId);

          if (inPlayer && outPlayer) {
            await createPendingSub(
              inPlayer.playerGameId,
              outPlayer.playerGameId,
              outPlayer.gameStatus === "goalkeeper"
            );
            toast.success(`Queued sub: ${outPlayer.fullName} 🔄 ${inPlayer.fullName}`);
          }
        } catch (err: any) {
          toast.error("Failed to queue sub: " + err.message);
        }
      };
      executeAutoSub();
    }
  }, [subOutId, subInId, players, createPendingSub]);

  if (!game) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading live match tracker...
      </div>
    );
  }

  const GAME_STAGES = useGameStore((s) => s.GAME_STAGES);
  const currentStage = getGameStage();
  const periodLabel = getCurrentPeriodLabel();

  // Validate starting lineup count
  const lineupValid = () => {
    if (!game?.settings?.playersOnField) return true;
    const starterCount = players.filter((p) => p.gameStatus === "starter").length;
    const gkCount = players.filter((p) => p.gameStatus === "goalkeeper").length;
    return (starterCount + gkCount) === game.settings.playersOnField;
  };
  const isLineupConfigured = lineupValid();

  // Short display names utilizing the teamName utility and abbreviation fields
  const ourShortName = formatTeamName({
    team_name: (game.isHome ? game.homeTeamName : game.awayTeamName) as string | null,
    club: {
      name: (game.isHome ? game.homeClubName : game.awayClubName) as string | null,
      abbreviation: (game.isHome ? game.homeClubAbbreviation : game.awayClubAbbreviation) as string | null,
    }
  }, "short");

  const opponentShortName = formatTeamName({
    team_name: (game.isHome ? game.awayTeamName : game.homeTeamName) as string | null,
    club: {
      name: (game.isHome ? game.awayClubName : game.homeClubName) as string | null,
      abbreviation: (game.isHome ? game.awayClubAbbreviation : game.homeClubAbbreviation) as string | null,
    }
  }, "short");

  // Filter on field vs game changers (bench reserves)
  const onFieldPlayers = players.filter(
    (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk" || p.gameStatus === "starter" || p.gameStatus === "goalkeeper"
  );

  // Group on-field goalkeeper separately
  const onFieldGks = onFieldPlayers.filter((p) => p.gameStatus === "goalkeeper" || p.fieldStatus === "onFieldGk");
  const onFieldFlds = onFieldPlayers.filter((p) => p.gameStatus !== "goalkeeper" && p.fieldStatus !== "onFieldGk");

  const gameChangers = players.filter(
    (p) => p.fieldStatus === "onBench" || p.gameStatus === "dressed"
  );

  // Auto-pause / start stoppage on event recording modal opening
  const handleOpenMajorEventModal = async () => {
    if (currentStage === GAME_STAGES.DURING_PERIOD) {
      try {
        await startStoppage("Recording event", "stoppage");
        toast.info("Clock paused automatically.");
        await initializeGame(id, teamSeasonId);
      } catch (err) {
        console.error("Auto stoppage error:", err);
      }
    }
    setIsMajorEventModalOpen(true);
  };

  // Auto-resume / end stoppage when modal is closed
  const handleCloseMajorEventModal = async () => {
    setIsMajorEventModalOpen(false);
    setStoppageReason("");
    setGoalScorerId("");
    setGoalAssistId("");
    setIsOpponentGoal(false);
    setCardPlayerId("");
    setCardReason("");

    const activeStoppage = game?.gameEventsMajor?.find(
      (s) => s.end_time === null && s.period === game.currentPeriodIndex + 1 && s.clock_should_run === 0
    );
    if (activeStoppage) {
      try {
        await endStoppage(activeStoppage.id);
        toast.success("Clock resumed.");
        await initializeGame(id, teamSeasonId);
      } catch (err) {
        console.error("Auto resume error:", err);
      }
    }
  };

  // Clock Actions
  const handleTogglePeriodClock = async () => {
    try {
      if (currentStage === GAME_STAGES.IN_STOPPAGE) {
        const activeStoppage = game.gameEventsMajor.find(
          (s) => s.end_time === null && s.period === game.currentPeriodIndex + 1 && s.clock_should_run === 0
        );
        if (activeStoppage) {
          await endStoppage(activeStoppage.id);
          toast.success("Clock resumed from stoppage.");
          await initializeGame(id, teamSeasonId);
        }
      } else if (currentStage === GAME_STAGES.BEFORE_START || currentStage === GAME_STAGES.BETWEEN_PERIODS) {
        if (!isLineupConfigured) {
          toast.error("Roster config mismatch. Set starting lineup first.");
          return;
        }
        await startNextPeriod();
        toast.success(`Started ${periodLabel}`);
      } else if (currentStage === GAME_STAGES.DURING_PERIOD) {
        await endPeriod();
        toast.info(`Ended ${periodLabel}`);
      }
    } catch (err: any) {
      toast.error("Clock action error: " + err.message);
    }
  };

  // Record Goal Action
  const handleRecordGoal = async () => {
    if (!isOpponentGoal && !goalScorerId) {
      toast.error("Please select the goal scorer.");
      return;
    }

    startTransition(async () => {
      try {
        const scorer = players.find((p) => String(p.id) === goalScorerId);
        const assist = players.find((p) => String(p.id) === goalAssistId);
        const teamSeasonVal = isOpponentGoal ? game.opponentId : game.teamSeasonId;

        const payload = {
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(teamSeasonVal),
          scorer_player_game_id: scorer?.playerGameId ? Number(scorer.playerGameId) : null,
          assist_player_game_id: assist?.playerGameId ? Number(assist.playerGameId) : null,
          is_own_goal: goalType === "own_goal",
          goal_types: goalType,
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
              is_own_goal: goalType === "own_goal",
              goal_types: goalType,
              scorer_player_game_id: scorer?.playerGameId ? Number(scorer.playerGameId) : null,
              assist_player_game_id: assist?.playerGameId ? Number(assist.playerGameId) : null,
            } as any,
            {
              id: newGoal.major_event_id,
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              game_time: gameTimeSeconds,
              clock_should_run: 1,
            } as any
          );
        }

        toast.success(`GOAL Recorded!`);
        await handleCloseMajorEventModal();
      } catch (err: any) {
        toast.error("Failed to record goal: " + err.message);
      }
    });
  };

  // Record Card Action
  const handleRecordCard = async () => {
    if (!cardPlayerId) {
      toast.error("Please select a player for the card.");
      return;
    }

    startTransition(async () => {
      try {
        const player = players.find((p) => String(p.id) === cardPlayerId);
        const payload = {
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(game.teamSeasonId),
          player_game_id: player?.playerGameId ? Number(player.playerGameId) : null,
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
              team_season_id: Number(game.teamSeasonId),
              card_type: cardType,
              card_reason: cardReason,
              player_game_id: player?.playerGameId ? Number(player.playerGameId) : null,
            } as any,
            {
              id: newCard.major_event_id,
              game_id: Number(game.game_id || game.id),
              period: game.currentPeriodIndex + 1,
              game_time: gameTimeSeconds,
              clock_should_run: 1,
            } as any
          );
        }

        toast.success(`${cardType.toUpperCase()} Card recorded!`);
        await handleCloseMajorEventModal();
      } catch (err: any) {
        toast.error("Failed to record card: " + err.message);
      }
    });
  };

  // Record Stoppage Action
  const handleRecordStoppage = async () => {
    if (!stoppageReason) {
      toast.error("Please specify a stoppage reason.");
      return;
    }
    startTransition(async () => {
      try {
        const activeStoppage = game?.gameEventsMajor?.find(
          (s) => s.end_time === null && s.period === game.currentPeriodIndex + 1 && s.clock_should_run === 0
        );
        if (activeStoppage) {
          await fetch(`/api/game_events_major?id=${activeStoppage.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ details: stoppageReason }),
          });
        }
        toast.success("Stoppage reason logged.");
        await handleCloseMajorEventModal();
      } catch (err: any) {
        toast.error("Failed to log stoppage: " + err.message);
      }
    });
  };

  // Record Micro Player Action (Shot, Save, Foul)
  const handleQuickPlayerAction = (
    playerId: string | number,
    actionType: "shot" | "shot_on_target" | "save" | "foul"
  ) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    addPlayerAction({
      id: Date.now(),
      game_id: Number(game.id),
      team_season_id: Number(game.teamSeasonId),
      player_game_id: Number(player.playerGameId),
      event_type: actionType as any,
      game_time: gameTimeSeconds,
      period: game.currentPeriodIndex + 1,
    } as any);

    toast.success(`Recorded ${actionType.replace("_", " ")} for ${player.fullName}`);
  };

  // Persistent team event increments (Corner, Offside, Foul)
  const handleAddTeamEvent = async (teamSeasonIdVal: number | string, eventType: "corner" | "offside" | "foul") => {
    try {
      const payload = {
        game_id: Number(game.game_id || game.id),
        team_season_id: Number(teamSeasonIdVal),
        event_type: eventType,
        game_time: gameTimeSeconds,
        period: game.currentPeriodIndex + 1,
      };

      const newEvent = await fetch(`/api/game_events_team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (newEvent?.id) {
        addTeamEvent({
          id: newEvent.id,
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(teamSeasonIdVal),
          event_type: eventType as any,
          game_time: gameTimeSeconds,
          period: game.currentPeriodIndex + 1,
        } as any);
        await initializeGame(id, teamSeasonId);
      }
    } catch (err: any) {
      toast.error(`Failed to log team event: ${err.message}`);
    }
  };

  // Persistent team event decrements
  const handleRemoveTeamEvent = async (teamSeasonIdVal: number | string, eventType: "corner" | "offside" | "foul") => {
    try {
      const teamEvents = game.gameEventsTeam || [];
      const matchEvents = teamEvents.filter(
        (e) => Number(e.team_season_id) === Number(teamSeasonIdVal) && e.event_type === eventType
      );
      if (matchEvents.length === 0) return;

      const lastEvent = matchEvents[matchEvents.length - 1];
      const deleteEventFn = useGameStore.getState().deleteEvent;
      await deleteEventFn(lastEvent.id, "team");
      await initializeGame(id, teamSeasonId);
      toast.success(`Removed team ${eventType.toUpperCase()}`);
    } catch (err: any) {
      toast.error(`Failed to remove team event: ${err.message}`);
    }
  };

  // Substitution commands for queue (Instant updates - no screen refresh)
  const handleConfirmSingleSub = async (subId: string | number) => {
    try {
      await confirmSub(subId);
      toast.success("Substitution entered.");
    } catch (err: any) {
      toast.error("Failed to enter sub: " + err.message);
    }
  };

  const handleCancelSub = async (subId: string | number) => {
    try {
      await cancelSub(subId);
      toast.success("Substitution cancelled.");
    } catch (err: any) {
      toast.error("Failed to cancel sub: " + err.message);
    }
  };

  const handleConfirmAllSubs = async () => {
    try {
      await confirmAllPendingSubs();
      toast.success("All pending substitutions entered.");
    } catch (err: any) {
      toast.error("Failed to enter subs: " + err.message);
    }
  };

  // Delete event handler
  const handleDeleteEvent = async (dbId: string | number, type: string) => {
    try {
      const deleteEventFn = useGameStore.getState().deleteEvent;
      let eventTypeKey: any = "major";
      if (type === "goal") eventTypeKey = "goal";
      if (type === "discipline") eventTypeKey = "discipline";
      if (type === "team") eventTypeKey = "team";

      await deleteEventFn(dbId, eventTypeKey);
      toast.success("Event deleted.");
    } catch (err: any) {
      toast.error("Failed to delete event: " + err.message);
    } finally {
      setConfirmDeleteId(null);
      await initializeGame(id, teamSeasonId);
    }
  };

  // Derived stats counters
  const ourId = Number(game.teamSeasonId);
  const oppId = Number(game.opponentId);
  const teamEvents = game.gameEventsTeam || [];

  const ourCorners = teamEvents.filter((e) => Number(e.team_season_id) === ourId && e.event_type === "corner").length;
  const oppCorners = teamEvents.filter((e) => Number(e.team_season_id) === oppId && e.event_type === "corner").length;

  const ourOffsides = teamEvents.filter((e) => Number(e.team_season_id) === ourId && e.event_type === "offside").length;
  const oppOffsides = teamEvents.filter((e) => Number(e.team_season_id) === oppId && e.event_type === "offside").length;

  const ourFouls = teamEvents.filter((e) => Number(e.team_season_id) === ourId && e.event_type === "foul").length;
  const oppFouls = teamEvents.filter((e) => Number(e.team_season_id) === oppId && e.event_type === "foul").length;

  // Chronological recent event list
  const recentEventsList = React.useMemo(() => {
    const list: { id: string; dbId: string | number; time: number; type: string; desc: string }[] = [];

    (game.gameEventsGoals || []).forEach((g: any) => {
      const scorer = players.find((p) => Number(p.playerGameId) === Number(g.scorer_player_game_id));
      const teamName = Number(g.team_season_id) === ourId ? "Us" : "Opponent";
      const desc = `Goal for ${teamName} by ${scorer ? scorer.fullName : "Unknown"}${g.is_own_goal ? " (OG)" : ""}`;
      list.push({ id: `goal-${g.id || g.goal_id}`, dbId: g.id || g.goal_id, time: g.game_time ?? 0, type: "goal", desc });
    });

    (game.gameEventsDiscipline || []).forEach((d: any) => {
      const player = players.find((p) => Number(p.playerGameId) === Number(d.player_game_id));
      const desc = `${d.card_type.toUpperCase()} Card to ${player ? player.fullName : "Unknown"}`;
      list.push({ id: `card-${d.id || d.discipline_id}`, dbId: d.id || d.discipline_id, time: d.game_time ?? 0, type: "discipline", desc });
    });

    (game.gameEventsTeam || []).forEach((t: any) => {
      const teamName = Number(t.team_season_id) === ourId ? "Us" : "Opponent";
      const desc = `Team ${t.event_type.toUpperCase()} for ${teamName}`;
      list.push({ id: `team-${t.id}`, dbId: t.id, time: t.game_time ?? 0, type: "team", desc });
    });

    return list.sort((a, b) => b.time - a.time);
  }, [game.gameEventsGoals, game.gameEventsDiscipline, game.gameEventsTeam, players, ourId]);

  // Sync pending subs list
  const pendingSubsList = getPendingSubsSync() || [];

  // Derived player event stats helper (Corrected type conversions for all IDs)
  const getPlayerStats = (player: Player) => {
    const pId = player.playerGameId;
    const playerActions = game.playerActions || [];
    const goalsEvents = game.gameEventsGoals || [];
    const disciplineEvents = game.gameEventsDiscipline || [];

    const shots = playerActions.filter((a) => Number(a.player_game_id) === Number(pId) && (a.event_type === "shot" || a.event_type === "shot_on_target")).length;
    const saves = playerActions.filter((a) => Number(a.player_game_id) === Number(pId) && a.event_type === "save").length;
    const goals = goalsEvents.filter((g) => Number(g.scorer_player_game_id) === Number(pId)).length;
    const assists = goalsEvents.filter((g) => Number(g.assist_player_game_id) === Number(pId)).length;
    
    const yellowCards = disciplineEvents.filter((d) => Number(d.player_game_id) === Number(pId) && d.card_type === "yellow").length;
    const redCards = disciplineEvents.filter((d) => Number(d.player_game_id) === Number(pId) && (d.card_type === "red" || d.card_type === "yellow_red")).length;
    
    // GA: Goals conceded while this player was goalkeeper
    const goalsAgainst = goalsEvents.filter((g) => Number(g.defending_gk_player_game_id) === Number(pId)).length;

    return { shots, saves, goals, assists, yellowCards, redCards, goalsAgainst };
  };

  const playerOptions = players.map((p) => ({
    value: String(p.id),
    label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
  }));

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden p-3 gap-2 bg-background select-none text-xs">
      
      {/* LINEUP VALIDATION WARNING */}
      {!isLineupConfigured && (
        <div className="shrink-0 p-2 border-l-4 border-l-amber-500 bg-amber-500/5 text-amber-800 dark:text-amber-300 rounded-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <span>Roster setup required: starting lineup size mismatch ({onFieldPlayers.length}/{game.settings?.playersOnField || 11}).</span>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => router.push(`/gamestats/${teamSeasonId}/${id}/lineup`)}
            className="text-[10px] h-5 py-0 px-2 text-amber-700 dark:text-amber-300 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20"
          >
            Configure Lineup
          </Button>
        </div>
      )}

      {/* Broadcast Scoreboard Header (NO Score Colors) */}
      <div className="shrink-0 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white px-5 py-3 shadow-md flex flex-col gap-2 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-6">
          {/* Home team */}
          <div className="flex items-center justify-end gap-3 min-w-0 flex-1 text-right">
            <span className="font-extrabold text-sm sm:text-base truncate tracking-tight">{ourShortName}</span>
            <span className="text-[9px] font-black shrink-0 bg-primary/25 border border-primary/45 px-1.5 py-0.5 rounded text-white">HOME</span>
            <span className="font-mono font-black text-3xl sm:text-4xl text-white pl-2">{game.goalsFor ?? 0}</span>
          </div>

          {/* LARGE MATCH TIME CLOCK */}
          <div className="flex flex-col items-center justify-center bg-black/40 border border-slate-700/60 px-5 py-1.5 rounded-xl shadow-inner min-w-[150px] shrink-0">
            <div className="flex items-center gap-1 font-mono font-black text-2xl sm:text-3xl text-yellow-400 tracking-tight">
              <span>{formatSecondsToMmss(gameTimeSeconds)}</span>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.75">
              {periodLabel}
            </span>
          </div>

          {/* Away team */}
          <div className="flex items-center justify-start gap-3 min-w-0 flex-1 text-left">
            <span className="font-mono font-black text-3xl sm:text-4xl text-white pr-2">{game.goalsAgainst ?? 0}</span>
            <span className="text-[9px] font-black shrink-0 bg-accent/25 border border-accent/45 px-1.5 py-0.5 rounded text-white">AWAY</span>
            <span className="font-extrabold text-sm sm:text-base truncate tracking-tight">{opponentShortName}</span>
          </div>
        </div>

        {/* System info bar and actions */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[9px] text-slate-400 font-bold">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <Wifi size={11} />
                <span>Sync Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <WifiOff size={11} />
                <span>Offline ({queueCount})</span>
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTogglePeriodClock}
              disabled={!isLineupConfigured && currentStage !== GAME_STAGES.DURING_PERIOD && currentStage !== GAME_STAGES.IN_STOPPAGE}
              className="h-6 py-0 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-black shadow-xs disabled:opacity-50 transition-colors"
            >
              {currentStage === GAME_STAGES.IN_STOPPAGE ? "Resume Clock" : currentStage === GAME_STAGES.DURING_PERIOD ? "End Period" : "Start Period"}
            </button>
            <button
              onClick={handleOpenMajorEventModal}
              className="h-6 py-0 px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[10px] font-black shadow-xs transition-colors"
            >
              Record Major Event
            </button>
          </div>
        </div>
      </div>

      {/* Main split grid: Left 70% (Rosters Stacked), Right 30% (Feeds Stacked) */}
      <div className="flex-1 min-h-0 flex gap-3">
        
        {/* LEFT COLUMN: ROSTER PANELS (70% WIDTH) */}
        <div className="w-[70%] flex flex-col gap-2.5 min-h-0">
          
          {/* PLAYERS ON FIELD card (TALL ENOUGH FOR 10 ROWS, NO SCROLLING) */}
          <Card variant="outlined" padding="sm" className="shrink-0 flex flex-col bg-surface shadow-xs rounded-xl p-2.5 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between border-b border-border/40 pb-1.5 px-1.5">
              <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-text flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Players On Field ({onFieldPlayers.length})</span>
              </h3>
              {subOutId && (
                <span className="text-[8px] uppercase font-black text-rose-500 animate-pulse bg-rose-50 border border-rose-500/20 px-1.5 py-0.25 rounded">
                  Select game changer row below to swap
                </span>
              )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-2.5 pt-2 overflow-hidden">
              {/* GOALKEEPER SECTION (IF ANY) */}
              {onFieldGks.length > 0 && (
                <div className="shrink-0 space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted tracking-wider px-1">Goalkeeper</span>
                  <div className="border border-border/60 bg-background/25 rounded-lg p-1.5">
                    <table className="w-full text-left select-none border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/40 text-muted uppercase font-black text-[9px]">
                          <th className="py-1 px-1 text-center w-8 align-middle">#</th>
                          <th className="py-1 px-2 w-1/3 align-middle">Name</th>
                          <th className="py-1 px-2 text-right w-12 align-middle">Saves</th>
                          <th className="py-1 px-2 text-right w-12 align-middle">GA</th>
                          <th className="py-1 px-2 text-center w-10 align-middle">+/-</th>
                          <th className="py-1 px-2 text-right w-16 align-middle">Total Time</th>
                          <th className="py-1 px-2 text-right w-16 align-middle">Shift Time</th>
                          <th className="py-1 px-2 text-center w-40 align-middle">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onFieldGks.map((player) => {
                          const isSelected = subOutId === String(player.id);
                          const totalTime = calculateTotalTimeOnField(player, gameTimeSeconds);
                          const shiftTime = calculateCurrentTimeOnField(player, gameTimeSeconds);
                          const stats = getPlayerStats(player);
                          const isRedCarded = stats.redCards > 0 || stats.yellowCards >= 2;

                          let rowClass = "hover:bg-background/60 transition-colors cursor-pointer text-text font-bold text-xs";
                          if (isRedCarded) {
                            rowClass = "opacity-40 bg-slate-100 dark:bg-slate-900 pointer-events-none text-xs font-bold text-muted-foreground";
                          } else if (isSelected) {
                            rowClass = "bg-rose-500/10 border-l-2 border-l-rose-500 font-extrabold text-rose-700 dark:text-rose-300 cursor-pointer text-xs";
                          } else if (player.subStatus === "pendingOut") {
                            rowClass = "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-l-2 border-l-rose-400 font-bold cursor-pointer text-xs";
                          }

                          return (
                            <tr
                              key={player.id}
                              className={rowClass}
                              onClick={() => !isRedCarded && setSubOutId(isSelected ? null : String(player.id))}
                            >
                              <td className="py-1 px-1 text-center font-bold font-mono align-middle">
                                {player.jerseyNumber || "—"}
                              </td>
                              <td className="py-1 px-2 font-bold truncate align-middle" title={player.fullName}>
                                <div className="flex items-center gap-1.5">
                                  <span>{player.fullName}</span>
                                  {/* Card Indicator badges - style min sizes strictly */}
                                  {Array.from({ length: stats.yellowCards }).map((_, idx) => (
                                    <span
                                      key={`y-${idx}`}
                                      className="inline-block w-2.5 h-3.5 bg-amber-400 border border-amber-500 rounded-xs shrink-0 shadow-xs"
                                      style={{ minWidth: "10px", minHeight: "14px" }}
                                    />
                                  ))}
                                  {Array.from({ length: stats.redCards }).map((_, idx) => (
                                    <span
                                      key={`r-${idx}`}
                                      className="inline-block w-2.5 h-3.5 bg-rose-500 border border-rose-600 rounded-xs shrink-0 shadow-xs"
                                      style={{ minWidth: "10px", minHeight: "14px" }}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="py-1 px-2 text-right font-mono font-bold text-emerald-600 align-middle">{stats.saves || "—"}</td>
                              <td className="py-1 px-2 text-right font-mono font-bold text-rose-500 align-middle">{stats.goalsAgainst || "—"}</td>
                              <td className="py-1 px-2 text-center font-mono font-black text-slate-600 align-middle">{player.plusMinus || 0}</td>
                              <td className="py-1 px-2 text-right font-mono text-muted align-middle">{formatSecondsToMmss(totalTime)}</td>
                              <td className="py-1 px-2 text-right font-mono font-black text-primary align-middle">{formatSecondsToMmss(shiftTime)}</td>
                              <td className="py-1 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                {!isRedCarded ? (
                                  <div className="flex gap-2 justify-center items-center">
                                    <button
                                      onClick={() => handleQuickPlayerAction(player.id, "save")}
                                      className="px-3 py-1 bg-background border border-border/80 hover:border-emerald-500 text-[10.5px] font-black rounded-md shadow-xs shrink-0"
                                    >
                                      SAVE
                                    </button>
                                    <button
                                      onClick={() => setSubOutId(isSelected ? null : String(player.id))}
                                      className={`px-3 py-1 border rounded-md text-[10.5px] font-black shadow-xs shrink-0 ${
                                        isSelected ? "bg-rose-500 text-white border-rose-500" : "bg-background border-border text-rose-500 hover:bg-rose-500/10"
                                      }`}
                                    >
                                      Sub Out
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-bold text-rose-600 uppercase">SENT OFF</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FIELD PLAYERS SECTION (NO SCROLLBAR) */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-muted tracking-wider px-1">Field Players</span>
                <div className="border border-border/60 bg-background/25 rounded-lg p-1.5 overflow-visible">
                  <table className="w-full text-left select-none border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-muted uppercase font-black text-[9px]">
                        <th className="py-1 px-1 text-center w-8 align-middle">#</th>
                        <th className="py-1 px-2 w-1/3 align-middle">Name</th>
                        <th className="py-1 px-2 text-right w-10 align-middle">Shots</th>
                        <th className="py-1 px-2 text-right w-10 align-middle">Goals</th>
                        <th className="py-1 px-2 text-right w-10 align-middle">Assts</th>
                        <th className="py-1 px-2 text-center w-10 align-middle">+/-</th>
                        <th className="py-1 px-2 text-right w-16 align-middle">Total Time</th>
                        <th className="py-1 px-2 text-right w-16 align-middle">Shift Time</th>
                        <th className="py-1 px-2 text-center w-40 align-middle">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {onFieldFlds.map((player) => {
                        const isSelected = subOutId === String(player.id);
                        const totalTime = calculateTotalTimeOnField(player, gameTimeSeconds);
                        const shiftTime = calculateCurrentTimeOnField(player, gameTimeSeconds);
                        const stats = getPlayerStats(player);
                        const isRedCarded = stats.redCards > 0 || stats.yellowCards >= 2;

                        let rowClass = "hover:bg-background/60 transition-colors cursor-pointer text-text font-bold text-xs";
                        if (isRedCarded) {
                          rowClass = "opacity-40 bg-slate-100 dark:bg-slate-900 pointer-events-none text-xs font-bold text-muted-foreground";
                        } else if (isSelected) {
                          rowClass = "bg-rose-500/10 border-l-2 border-l-rose-500 font-extrabold text-rose-700 dark:text-rose-300 cursor-pointer text-xs";
                        } else if (player.subStatus === "pendingOut") {
                          rowClass = "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-l-2 border-l-rose-400 font-bold cursor-pointer text-xs";
                        }

                        return (
                          <tr
                            key={player.id}
                            className={rowClass}
                            onClick={() => !isRedCarded && setSubOutId(isSelected ? null : String(player.id))}
                          >
                            <td className="py-1 px-1 text-center font-bold font-mono align-middle">
                              {player.jerseyNumber || "—"}
                            </td>
                            <td className="py-1 px-2 font-bold truncate align-middle" title={player.fullName}>
                              <div className="flex items-center gap-1.5">
                                <span>{player.fullName}</span>
                                {/* Card Indicator badges */}
                                {Array.from({ length: stats.yellowCards }).map((_, idx) => (
                                  <span
                                    key={`y-${idx}`}
                                    className="inline-block w-2.5 h-3.5 bg-amber-400 border border-amber-500 rounded-xs shrink-0 shadow-xs"
                                    style={{ minWidth: "10px", minHeight: "14px" }}
                                  />
                                ))}
                                {Array.from({ length: stats.redCards }).map((_, idx) => (
                                  <span
                                    key={`r-${idx}`}
                                    className="inline-block w-2.5 h-3.5 bg-rose-500 border border-rose-600 rounded-xs shrink-0 shadow-xs"
                                    style={{ minWidth: "10px", minHeight: "14px" }}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="py-1 px-2 text-right font-mono font-bold text-muted align-middle">{stats.shots || "—"}</td>
                            <td className="py-1 px-2 text-right font-mono font-bold text-primary align-middle">{stats.goals || "—"}</td>
                            <td className="py-1 px-2 text-right font-mono font-bold text-blue-600 align-middle">{stats.assists || "—"}</td>
                            <td className="py-1 px-2 text-center font-mono font-black text-slate-600 align-middle">{player.plusMinus || 0}</td>
                            <td className="py-1 px-2 text-right font-mono text-muted align-middle">{formatSecondsToMmss(totalTime)}</td>
                            <td className="py-1 px-2 text-right font-mono font-black text-primary align-middle">{formatSecondsToMmss(shiftTime)}</td>
                            <td className="py-1 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                              {!isRedCarded ? (
                                <div className="flex gap-2 justify-center items-center">
                                  <button
                                    onClick={() => handleQuickPlayerAction(player.id, "shot")}
                                    className="px-3 py-1 bg-background border border-border/80 hover:border-primary text-[10.5px] font-black rounded-md shadow-xs shrink-0"
                                  >
                                    SHOT
                                  </button>
                                  <button
                                    onClick={() => setSubOutId(isSelected ? null : String(player.id))}
                                    className={`px-3 py-1 border rounded-md text-[10.5px] font-black shadow-xs shrink-0 ${
                                      isSelected ? "bg-rose-500 text-white border-rose-500" : "bg-background border-border text-rose-500 hover:bg-rose-500/10"
                                    }`}
                                  >
                                    Sub Out
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-rose-600 uppercase">SENT OFF</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>

          {/* GAME CHANGERS (BENCH RESERVES) Table at bottom of left stack - fills remaining height and scrolls */}
          <Card variant="outlined" padding="sm" className="flex-1 min-h-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
            <div className="shrink-0 flex items-center justify-between border-b border-border/40 pb-1.5 px-1.5">
              <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-text flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Game Changers (Bench Reserves) ({gameChangers.length})</span>
              </h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto border border-border/60 bg-background/25 rounded-lg p-1.5 mt-2">
              <table className="w-full text-left select-none border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted uppercase font-black text-[9px]">
                    <th className="py-1 px-1 text-center w-8 align-middle">#</th>
                    <th className="py-1 px-2 w-1/3 align-middle">Name</th>
                    <th className="py-1 px-2 text-right w-10 align-middle">Shots</th>
                    <th className="py-1 px-2 text-right w-10 align-middle">Goals</th>
                    <th className="py-1 px-2 text-right w-10 align-middle">Assts</th>
                    <th className="py-1 px-2 text-center w-10 align-middle">+/-</th>
                    <th className="py-1 px-2 text-right w-16 align-middle">Total Time</th>
                    <th className="py-1 px-2 text-right w-16 align-middle">Bench Time</th>
                    <th className="py-1 px-2 text-center w-28 align-middle">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {gameChangers.map((player) => {
                    const isSelected = subInId === String(player.id);
                    const totalTime = calculateTotalTimeOnField(player, gameTimeSeconds);
                    const benchTime = calculateCurrentTimeOffField(player, gameTimeSeconds);
                    const stats = getPlayerStats(player);

                    let rowClass = "hover:bg-background/60 transition-colors cursor-pointer text-text font-bold text-xs";
                    if (isSelected) {
                      rowClass = "bg-emerald-500/10 border-l-2 border-l-emerald-500 font-extrabold text-emerald-700 dark:text-emerald-300 cursor-pointer text-xs";
                    } else if (player.subStatus === "pendingIn") {
                      rowClass = "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-l-2 border-l-emerald-400 font-bold cursor-pointer text-xs";
                    }

                    return (
                      <tr
                        key={player.id}
                        className={rowClass}
                        onClick={() => setSubInId(isSelected ? null : String(player.id))}
                      >
                        <td className="py-1 px-1 text-center font-bold font-mono align-middle">
                          {player.jerseyNumber || "—"}
                        </td>
                        <td className="py-1 px-2 font-bold truncate align-middle" title={player.fullName}>
                          <div className="flex items-center gap-1.5">
                            <span>{player.fullName}</span>
                            {/* Card Indicator badges */}
                            {Array.from({ length: stats.yellowCards }).map((_, idx) => (
                              <span
                                key={`y-${idx}`}
                                className="inline-block w-2.5 h-3.5 bg-amber-400 border border-amber-500 rounded-xs shrink-0 shadow-xs"
                                style={{ minWidth: "10px", minHeight: "14px" }}
                              />
                            ))}
                            {Array.from({ length: stats.redCards }).map((_, idx) => (
                              <span
                                key={`r-${idx}`}
                                className="inline-block w-2.5 h-3.5 bg-rose-500 border border-rose-600 rounded-xs shrink-0 shadow-xs"
                                style={{ minWidth: "10px", minHeight: "14px" }}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-muted align-middle">{stats.shots || "—"}</td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-primary align-middle">{stats.goals || "—"}</td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-blue-600 align-middle">{stats.assists || "—"}</td>
                        <td className="py-1 px-2 text-center font-mono font-black text-slate-600 align-middle">{player.plusMinus || 0}</td>
                        <td className="py-1 px-2 text-right font-mono text-muted align-middle">{formatSecondsToMmss(totalTime)}</td>
                        <td className="py-1 px-2 text-right font-mono font-black text-amber-600 align-middle">{formatSecondsToMmss(benchTime)}</td>
                        <td className="py-1 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSubInId(isSelected ? null : String(player.id))}
                            className={`px-3 py-1 border rounded-md text-[10.5px] font-black shadow-xs shrink-0 ${
                              isSelected
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-primary text-white border-primary hover:bg-primary/95"
                            }`}
                          >
                            {isSelected ? "Selected" : "Sub In"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: ACTION & FEED PANEL (30% WIDTH) */}
        <div className="w-[30%] flex flex-col gap-2.5 min-h-0">
          
          {/* Card 1: Team Counters (Enlarged to h-[165px] to fit three rows comfortably) */}
          <Card variant="outlined" padding="sm" className="h-[165px] shrink-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
            <div className="flex items-center gap-1 border-b border-border/40 pb-1 px-1 shrink-0">
              <Zap size={11} className="text-primary" />
              <span className="font-extrabold uppercase tracking-wider text-[10px] text-text">Team Counters</span>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2 text-[10px] p-1.5 min-h-0 overflow-y-auto mt-1">
              {/* Our Team */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-[9px] uppercase text-primary border-b border-primary/10 pb-0.5 truncate" title={game.ourName}>
                  {ourShortName}
                </h4>
                <div className="space-y-1 font-semibold text-text">
                  <div className="flex items-center justify-between">
                    <span>Corners: {ourCorners}</span>
                    <div className="flex gap-0.5">
                      <button onClick={() => handleRemoveTeamEvent(ourId, "corner")} className="p-0.5 text-muted hover:text-danger"><MinusCircle size={12} /></button>
                      <button onClick={() => handleAddTeamEvent(ourId, "corner")} className="p-0.5 text-primary hover:text-primary-hover"><PlusCircle size={12} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Offsides: {ourOffsides}</span>
                    <div className="flex gap-0.5">
                      <button onClick={() => handleRemoveTeamEvent(ourId, "offside")} className="p-0.5 text-muted hover:text-danger"><MinusCircle size={12} /></button>
                      <button onClick={() => handleAddTeamEvent(ourId, "offside")} className="p-0.5 text-primary hover:text-primary-hover"><PlusCircle size={12} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fouls: {ourFouls}</span>
                    <div className="flex gap-0.5">
                      <button onClick={() => handleRemoveTeamEvent(ourId, "foul")} className="p-0.5 text-muted hover:text-danger"><MinusCircle size={12} /></button>
                      <button onClick={() => handleAddTeamEvent(ourId, "foul")} className="p-0.5 text-primary hover:text-primary-hover"><PlusCircle size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opponent Team */}
              <div className="space-y-1 border-l border-border/60 pl-2">
                <h4 className="font-extrabold text-[9px] uppercase text-accent border-b border-accent/10 pb-0.5 truncate" title={game.opponentName}>
                  {opponentShortName}
                </h4>
                <div className="space-y-1 font-semibold text-text">
                  <div className="flex items-center justify-between">
                    <span>Corners: {oppCorners}</span>
                    <div className="flex gap-0.5">
                      <button onClick={() => handleRemoveTeamEvent(oppId, "corner")} className="p-0.5 text-muted hover:text-danger"><MinusCircle size={12} /></button>
                      <button onClick={() => handleAddTeamEvent(oppId, "corner")} className="p-0.5 text-accent hover:text-accent-hover"><PlusCircle size={12} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Offsides: {oppOffsides}</span>
                    <div className="flex gap-0.5">
                      <button onClick={() => handleRemoveTeamEvent(oppId, "offside")} className="p-0.5 text-muted hover:text-danger"><MinusCircle size={12} /></button>
                      <button onClick={() => handleAddTeamEvent(oppId, "offside")} className="p-0.5 text-accent hover:text-accent-hover"><PlusCircle size={12} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fouls: {oppFouls}</span>
                    <div className="flex gap-0.5">
                      <button onClick={() => handleRemoveTeamEvent(oppId, "foul")} className="p-0.5 text-muted hover:text-danger"><MinusCircle size={12} /></button>
                      <button onClick={() => handleAddTeamEvent(oppId, "foul")} className="p-0.5 text-accent hover:text-accent-hover"><PlusCircle size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Upcoming Substitutions (FLEX-1: LONGER CARD) */}
          <Card variant="outlined" padding="sm" className="flex-1 min-h-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
            <div className="flex items-center justify-between border-b border-border/40 pb-1 px-1 shrink-0">
              <div className="flex items-center gap-1">
                <Users size={11} className="text-primary" />
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-text">Upcoming Subs ({pendingSubsList.length})</span>
              </div>
              {pendingSubsList.length > 0 && (
                <button
                  onClick={handleConfirmAllSubs}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] rounded-md transition-colors"
                >
                  Enter All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-1 mt-1.5 space-y-1.5 text-[9px] min-h-0">
              {pendingSubsList.length === 0 ? (
                <p className="text-muted text-center py-6">No pending subs in queue.</p>
              ) : (
                pendingSubsList.map((sub) => {
                  const inPl = players.find((p) => p.playerGameId === sub.inPlayerId);
                  const outPl = players.find((p) => p.playerGameId === sub.outPlayerId);

                  return (
                    <div key={sub.subId} className="flex items-center justify-between gap-1.5 p-1.5 border border-border/30 bg-background/50 rounded animate-in slide-in-from-right duration-200">
                      <span className="font-semibold text-text truncate flex-1 text-left">
                        Out: {outPl?.fullName || "Unknown"} 🔄 In: {inPl?.fullName || "Unknown"}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleConfirmSingleSub(sub.subId)} className="p-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-md"><Check size={11} /></button>
                        <button onClick={() => handleCancelSub(sub.subId)} className="p-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-md"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Card 3: Recent Events (h-[160px] shrink-0: SHORTER) */}
          <Card variant="outlined" padding="sm" className="h-[160px] shrink-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
            <div className="flex items-center gap-1 border-b border-border/40 pb-1 px-1 shrink-0">
              <Trophy size={11} className="text-primary" />
              <span className="font-extrabold uppercase tracking-wider text-[10px] text-text">Recent Events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-1 mt-1.5 space-y-1.5 text-[9px] min-h-0">
              {recentEventsList.length === 0 ? (
                <p className="text-muted text-center py-8">No events logged yet.</p>
              ) : (
                recentEventsList.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 p-1.5 border border-border/20 bg-background/30 rounded">
                    <span className="font-extrabold text-primary shrink-0 align-middle">
                      {formatSecondsToMmss(e.time)}
                    </span>
                    <span className="truncate text-text font-semibold flex-1 text-left align-middle">{e.desc}</span>
                    
                    {/* Event Delete action with Inline Confirm */}
                    <div className="flex gap-1 shrink-0 align-middle" onClick={(evt) => evt.stopPropagation()}>
                      {confirmDeleteId === e.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDeleteEvent(e.dbId, e.type)}
                            className="px-1.5 py-0.5 bg-emerald-500 text-white font-bold text-[8px] rounded hover:bg-emerald-600 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 bg-slate-500 text-white font-bold text-[8px] rounded hover:bg-slate-600 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(e.id)}
                          className="p-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>
      </div>

      {/* UNIFIED MAJOR EVENT MODAL */}
      <Modal
        isOpen={isMajorEventModalOpen}
        onClose={handleCloseMajorEventModal}
        title="Record Major Match Event"
        subtitle="Log goals, cards, and stoppages to the live match feed"
      >
        <div className="space-y-4 text-xs">
          
          <Select
            label="Event Type"
            value={majorEventType}
            onChange={(val: string) => setMajorEventType(val as any)}
            options={[
              { value: "goal", label: "Goal" },
              { value: "card", label: "Disciplinary Card" },
              { value: "stoppage", label: "Stoppage / Pause" },
            ]}
          />

          {/* Goal Event Fields */}
          {majorEventType === "goal" && (
            <div className="space-y-3.5 pt-2 border-t border-border/40">
              <Checkbox
                label={`Goal for Opponent (${opponentShortName})`}
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
                    value={goalScorerId}
                    onChange={(val: string) => setGoalScorerId(val)}
                    options={[{ value: "", label: "-- Scorer --" }, ...playerOptions]}
                  />
                  <Select
                    label="Assist By"
                    value={goalAssistId}
                    onChange={(val: string) => setGoalAssistId(val)}
                    options={[{ value: "", label: "-- None --" }, ...playerOptions]}
                  />
                </>
              )}

              <Select
                label="Goal Type"
                value={goalType}
                onChange={(val: string) => setGoalType(val)}
                options={[
                  { value: "foot", label: "Standard Shot" },
                  { value: "header", label: "Header" },
                  { value: "penalty", label: "Penalty Kick" },
                  { value: "free_kick", label: "Free Kick" },
                  { value: "own_goal", label: "Own Goal" },
                ]}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleCloseMajorEventModal}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleRecordGoal} disabled={isPending}>
                  Record Goal
                </Button>
              </div>
            </div>
          )}

          {/* Card Event Fields */}
          {majorEventType === "card" && (
            <div className="space-y-3.5 pt-2 border-t border-border/40">
              <Select
                label="Select Player"
                value={cardPlayerId}
                onChange={(val: string) => setCardPlayerId(val)}
                options={[{ value: "", label: "-- Player --" }, ...playerOptions]}
              />

              <Select
                label="Card Type"
                value={cardType}
                onChange={(val: string) => setCardType(val as any)}
                options={[
                  { value: "yellow", label: "Yellow Card" },
                  { value: "red", label: "Red Card" },
                  { value: "yellow_red", label: "Second Yellow (Red)" },
                ]}
              />

              <Input
                label="Reason for Card (Optional)"
                placeholder="e.g. Unsporting Behavior"
                value={cardReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardReason(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleCloseMajorEventModal}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleRecordCard} disabled={isPending}>
                  Record Card
                </Button>
              </div>
            </div>
          )}

          {/* Stoppage Event Fields */}
          {majorEventType === "stoppage" && (
            <div className="space-y-3.5 pt-2 border-t border-border/40">
              <Input
                label="Reason for Stoppage / Timeout"
                placeholder="e.g. Injury, Referee Timeout, Water break"
                value={stoppageReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoppageReason(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleCloseMajorEventModal}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleRecordStoppage} disabled={isPending}>
                  Log Stoppage
                </Button>
              </div>
            </div>
          )}

        </div>
      </Modal>
    </div>
  );
}
