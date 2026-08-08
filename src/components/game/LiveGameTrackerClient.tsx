"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore, { Player } from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import { useOnlineStatus } from "@/lib/offline/offlineSync";
import { formatTeamName } from "@/lib/utils/teamName";

import LineupValidationBanner from "./live/LineupValidationBanner";
import BroadcastScoreboard from "./live/BroadcastScoreboard";
import OnFieldPlayersPanel from "./live/OnFieldPlayersPanel";
import BenchReservesPanel from "./live/BenchReservesPanel";
import TeamCountersPanel from "./live/TeamCountersPanel";
import UpcomingSubsPanel from "./live/UpcomingSubsPanel";
import RecentEventsPanel from "./live/RecentEventsPanel";
import MajorEventModal from "./live/MajorEventModal";
import LiveNavigationDrawer from "./live/LiveNavigationDrawer";

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
    updatePendingSub,
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

  // Modals & Navigation Drawer visibility
  const [isMajorEventModalOpen, setIsMajorEventModalOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // Recent Event deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Substitution Quick Tap states
  const [subOutId, setSubOutId] = useState<string | null>(null);
  const [subInId, setSubInId] = useState<string | null>(null);

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

  // Team Short Names
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

  // Filter eligible players participating in the match (starters, goalkeeper, dressed reserves)
  const eligiblePlayers = players.filter(
    (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed"
  );

  const onFieldPlayers = eligiblePlayers.filter(
    (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk"
  );
  const onFieldGks = onFieldPlayers.filter((p) => p.gameStatus === "goalkeeper" || p.fieldStatus === "onFieldGk");
  const onFieldFlds = onFieldPlayers.filter((p) => p.gameStatus !== "goalkeeper" && p.fieldStatus !== "onFieldGk");
  const gameChangers = eligiblePlayers.filter((p) => p.fieldStatus === "onBench" && p.gameStatus === "dressed");

  // Modal open / close auto-stoppage logic
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

  const handleCloseMajorEventModal = async () => {
    setIsMajorEventModalOpen(false);

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
  const handleRecordGoal = async (data: {
    scorerId: string;
    assistId: string;
    goalType: string;
    isOpponentGoal: boolean;
  }) => {
    if (!data.isOpponentGoal && !data.scorerId) {
      toast.error("Please select the goal scorer.");
      return;
    }

    startTransition(async () => {
      try {
        const scorer = players.find((p) => String(p.id) === data.scorerId);
        const assist = players.find((p) => String(p.id) === data.assistId);
        const teamSeasonVal = data.isOpponentGoal ? game.opponentId : game.teamSeasonId;

        const payload = {
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(teamSeasonVal),
          scorer_player_game_id: scorer?.playerGameId ? Number(scorer.playerGameId) : null,
          assist_player_game_id: assist?.playerGameId ? Number(assist.playerGameId) : null,
          is_own_goal: data.goalType === "own_goal",
          goal_types: data.goalType,
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
              is_own_goal: data.goalType === "own_goal",
              goal_types: data.goalType,
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
  const handleRecordCard = async (data: {
    playerId: string;
    cardType: "yellow" | "red" | "yellow_red";
    cardReason: string;
  }) => {
    if (!data.playerId) {
      toast.error("Please select a player for the card.");
      return;
    }

    startTransition(async () => {
      try {
        const player = players.find((p) => String(p.id) === data.playerId);
        const payload = {
          game_id: Number(game.game_id || game.id),
          team_season_id: Number(game.teamSeasonId),
          player_game_id: player?.playerGameId ? Number(player.playerGameId) : null,
          card_type: data.cardType,
          card_reason: data.cardReason || null,
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
              card_type: data.cardType,
              card_reason: data.cardReason,
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

        toast.success(`${data.cardType.toUpperCase()} Card recorded!`);
        await handleCloseMajorEventModal();
      } catch (err: any) {
        toast.error("Failed to record card: " + err.message);
      }
    });
  };

  // Record Stoppage Action
  const handleRecordStoppage = async (data: { reason: string }) => {
    if (!data.reason) {
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
            body: JSON.stringify({ details: data.reason }),
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

  // Persistent team event increments & decrements
  const handleAddTeamEvent = async (teamSeasonIdVal: number | string, eventType: "corner" | "offside" | "foul") => {
    const tid = Number(teamSeasonIdVal);
    if (!tid || isNaN(tid)) {
      toast.error("Invalid team season ID for counter");
      return;
    }

    try {
      const payload = {
        game_id: Number(game.game_id || game.id),
        team_season_id: tid,
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
          team_season_id: tid,
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

  // Substitution queue commands
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

  const handleEditSub = async (subId: string | number, inPlayerId: string | number, outPlayerId: string | number) => {
    try {
      await updatePendingSub(subId, {
        in_player_id: inPlayerId ? Number(inPlayerId) : null,
        out_player_id: outPlayerId ? Number(outPlayerId) : null,
      });
      toast.success("Pending substitution updated.");
    } catch (err: any) {
      toast.error("Failed to update sub: " + err.message);
    }
  };

  // Derived stats counters
  const ourId = Number(teamSeasonId || (game?.isHome ? game?.home_team_season_id : game?.away_team_season_id));
  const oppId = Number(game?.isHome ? game?.away_team_season_id : game?.home_team_season_id);
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
      const major = (game.gameEventsMajor || []).find((m) => Number(m.id) === Number(g.major_event_id));
      const eventTime = g.game_time ?? major?.game_time ?? 0;
      const scorer = players.find((p) => Number(p.playerGameId) === Number(g.scorer_player_game_id));
      const teamName = Number(g.team_season_id) === ourId ? "Us" : "Opponent";
      const desc = `Goal for ${teamName} by ${scorer ? scorer.fullName : "Unknown"}${g.is_own_goal ? " (OG)" : ""}`;
      list.push({ id: `goal-${g.id || g.goal_id}`, dbId: g.id || g.goal_id, time: eventTime, type: "goal", desc });
    });

    (game.gameEventsDiscipline || []).forEach((d: any) => {
      const major = (game.gameEventsMajor || []).find((m) => Number(m.id) === Number(d.major_event_id));
      const eventTime = d.game_time ?? major?.game_time ?? 0;
      const player = players.find((p) => Number(p.playerGameId) === Number(d.player_game_id));
      const cardKind = String(d.card_type || d.card_color || "Card").toUpperCase();
      const desc = `${cardKind} Card to ${player ? player.fullName : "Unknown"}`;
      list.push({ id: `card-${d.id || d.discipline_id}`, dbId: d.id || d.discipline_id, time: eventTime, type: "discipline", desc });
    });

    (game.gameEventsTeam || []).forEach((t: any) => {
      const teamName = Number(t.team_season_id) === ourId ? "Us" : "Opponent";
      const desc = `Team ${t.event_type.toUpperCase()} for ${teamName}`;
      list.push({ id: `team-${t.id}`, dbId: t.id, time: t.game_time ?? 0, type: "team", desc });
    });

    (game.gameEventsMajor || []).forEach((m: any) => {
      if (m.details || m.event_type === "stoppage") {
        const desc = m.details ? `Stoppage: ${m.details}` : `Stoppage Event`;
        list.push({ id: `major-${m.id}`, dbId: m.id, time: m.game_time ?? 0, type: "major", desc });
      }
    });

    return list.sort((a, b) => b.time - a.time);
  }, [game.gameEventsGoals, game.gameEventsDiscipline, game.gameEventsTeam, game.gameEventsMajor, players, ourId]);

  // Sync pending subs list
  const pendingSubsList = getPendingSubsSync() || [];

  // Derived player event stats helper
  const getPlayerStats = (player: Player) => {
    const pId = Number(player.playerGameId);
    const playerActions = game.playerActions || [];
    const goalsEvents = game.gameEventsGoals || [];
    const disciplineEvents = game.gameEventsDiscipline || [];

    const shots = playerActions.filter((a) => Number(a.player_game_id) === pId && (a.event_type === "shot" || a.event_type === "shot_on_target")).length;
    const saves = playerActions.filter((a) => Number(a.player_game_id) === pId && a.event_type === "save").length;
    const goals = goalsEvents.filter((g) => Number(g.scorer_player_game_id) === pId).length;
    const assists = goalsEvents.filter((g) => Number(g.assist_player_game_id) === pId).length;
    const yellowCards = disciplineEvents.filter((d) => Number(d.player_game_id) === pId && (d.card_type === "yellow" || d.card_color === "yellow")).length;
    const redCards = disciplineEvents.filter((d) => Number(d.player_game_id) === pId && (d.card_type === "red" || d.card_type === "yellow_red" || d.card_color === "red")).length;
    const goalsAgainst = goalsEvents.filter((g) => Number(g.defending_gk_player_game_id) === pId).length;

    return { shots, saves, goals, assists, yellowCards, redCards, goalsAgainst };
  };

  const playerOptions = eligiblePlayers.map((p) => ({
    value: String(p.id),
    label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
  }));

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden p-3 gap-2 bg-background select-none text-xs">
      {/* LINEUP VALIDATION WARNING */}
      <LineupValidationBanner
        isLineupConfigured={isLineupConfigured}
        onFieldCount={onFieldPlayers.length}
        playersOnFieldSetting={game.settings?.playersOnField || 11}
        teamSeasonId={teamSeasonId}
        gameId={id}
      />

      {/* Broadcast Scoreboard Header */}
      <BroadcastScoreboard
        ourShortName={ourShortName}
        opponentShortName={opponentShortName}
        goalsFor={game.goalsFor ?? 0}
        goalsAgainst={game.goalsAgainst ?? 0}
        gameTimeSeconds={gameTimeSeconds}
        periodLabel={periodLabel}
        isOnline={isOnline}
        queueCount={queueCount}
        currentStage={currentStage}
        GAME_STAGES={GAME_STAGES}
        isLineupConfigured={isLineupConfigured}
        onTogglePeriodClock={handleTogglePeriodClock}
        onOpenMajorEventModal={handleOpenMajorEventModal}
        onOpenNavDrawer={() => setIsNavDrawerOpen(true)}
      />

      {/* Main split grid: Left 70% (Rosters Stacked), Right 30% (Feeds Stacked) */}
      <div className="flex-1 min-h-0 flex gap-3">
        {/* LEFT COLUMN: ROSTER PANELS (70% WIDTH) */}
        <div className="w-[70%] flex flex-col gap-2.5 min-h-0">
          <OnFieldPlayersPanel
            onFieldGks={onFieldGks}
            onFieldFlds={onFieldFlds}
            onFieldCount={onFieldPlayers.length}
            subOutId={subOutId}
            pendingSubsList={pendingSubsList}
            gameTimeSeconds={gameTimeSeconds}
            calculateTotalTimeOnField={calculateTotalTimeOnField}
            calculateCurrentTimeOnField={calculateCurrentTimeOnField}
            getPlayerStats={getPlayerStats}
            setSubOutId={setSubOutId}
            handleQuickPlayerAction={handleQuickPlayerAction}
          />

          <BenchReservesPanel
            gameChangers={gameChangers}
            subInId={subInId}
            pendingSubsList={pendingSubsList}
            gameTimeSeconds={gameTimeSeconds}
            calculateTotalTimeOnField={calculateTotalTimeOnField}
            calculateCurrentTimeOffField={calculateCurrentTimeOffField}
            getPlayerStats={getPlayerStats}
            setSubInId={setSubInId}
          />
        </div>

        {/* RIGHT COLUMN: ACTION & FEED PANEL (30% WIDTH) */}
        <div className="w-[30%] flex flex-col gap-2.5 min-h-0">
          <TeamCountersPanel
            ourShortName={ourShortName}
            opponentShortName={opponentShortName}
            ourId={ourId}
            oppId={oppId}
            ourCorners={ourCorners}
            oppCorners={oppCorners}
            ourOffsides={ourOffsides}
            oppOffsides={oppOffsides}
            ourFouls={ourFouls}
            oppFouls={oppFouls}
            onAddTeamEvent={handleAddTeamEvent}
            onRemoveTeamEvent={handleRemoveTeamEvent}
          />

          <UpcomingSubsPanel
            pendingSubsList={pendingSubsList}
            players={players}
            onConfirmSingleSub={handleConfirmSingleSub}
            onCancelSub={handleCancelSub}
            onConfirmAllSubs={handleConfirmAllSubs}
            onEditSub={handleEditSub}
          />

          <RecentEventsPanel
            recentEventsList={recentEventsList}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
      </div>

      {/* UNIFIED MAJOR EVENT MODAL */}
      <MajorEventModal
        isOpen={isMajorEventModalOpen}
        onClose={handleCloseMajorEventModal}
        opponentShortName={opponentShortName}
        playerOptions={playerOptions}
        onRecordGoal={handleRecordGoal}
        onRecordCard={handleRecordCard}
        onRecordStoppage={handleRecordStoppage}
        isPending={isPending}
      />

      {/* COLLAPSIBLE SIDEBAR NAVIGATION DRAWER */}
      <LiveNavigationDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        teamSeasonId={teamSeasonId}
        gameId={id}
      />
    </div>
  );
}
