"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Play,
  PauseCircle,
  StopCircle,
  Trophy,
  Users,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Wifi,
  WifiOff,
  UserPlus,
  Plus,
  X,
  Target,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Dialog from "@/components/ui/Dialog";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore, { Player } from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import { useOnlineStatus, enqueueOfflineAction } from "@/lib/offline/offlineSync";
import { addGuestPlayersToGames } from "@/lib/actions/guestPlayer-actions";

export default function LiveGameTrackerClient() {
  const router = useRouter();
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

  const players = useGamePlayersStore((s) => s.players);
  const setPlayers = useGamePlayersStore((s) => s.setPlayers);
  const { createPendingSub, confirmSub } = useGameSubsStore();

  // Clock local tick counter for UI smoothness
  const [gameTimeSeconds, setGameTimeSeconds] = useState<number>(0);

  // Modals visibility states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isShootoutModalOpen, setIsShootoutModalOpen] = useState(false);

  // Goal modal inputs
  const [goalScorerId, setGoalScorerId] = useState<string>("");
  const [goalAssistId, setGoalAssistId] = useState<string>("");
  const [goalType, setGoalType] = useState<string>("foot");
  const [isOpponentGoal, setIsOpponentGoal] = useState<boolean>(false);

  // Card modal inputs
  const [cardPlayerId, setCardPlayerId] = useState<string>("");
  const [cardType, setCardType] = useState<"yellow" | "red" | "yellow_red">("yellow");
  const [cardReason, setCardReason] = useState<string>("");

  // Sub modal inputs
  const [subInPlayerId, setSubInPlayerId] = useState<string>("");
  const [subOutPlayerId, setSubOutPlayerId] = useState<string>("");
  const [isGkSub, setIsGkSub] = useState<boolean>(false);

  // Guest modal inputs
  const [guestFirstName, setGuestFirstName] = useState<string>("");
  const [guestLastName, setGuestLastName] = useState<string>("");
  const [guestJersey, setGuestJersey] = useState<string>("");

  // Penalty Shootout inputs
  const [penaltyShooterId, setPenaltyShooterId] = useState<string>("");
  const [penaltyOutcome, setPenaltyOutcome] = useState<"goal" | "saved" | "missed" | "hit_post">("goal");

  // Filter on field vs bench players
  const onFieldPlayers = React.useMemo(() => {
    return players.filter(
      (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk" || p.gameStatus === "starter" || p.gameStatus === "goalkeeper"
    );
  }, [players]);

  const benchPlayers = React.useMemo(() => {
    return players.filter(
      (p) => p.fieldStatus === "onBench" || p.gameStatus === "dressed"
    );
  }, [players]);

  // Update tick
  useEffect(() => {
    const interval = setInterval(() => {
      const storeTime = useGameStore.getState().getGameTime();
      setGameTimeSeconds(storeTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Helper to format seconds as MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Clock Actions
  const handleTogglePeriodClock = async () => {
    try {
      if (currentStage === GAME_STAGES.BEFORE_START || currentStage === GAME_STAGES.BETWEEN_PERIODS) {
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

        const goalPayload = {
          game_id: game.id,
          team_season_id: isOpponentGoal ? game.opponentId : game.teamSeasonId,
          scorer_player_game_id: scorer?.playerGameId || null,
          assist_player_game_id: assist?.playerGameId || null,
          is_own_goal: goalType === "own_goal",
          goal_types: goalType,
          game_time: gameTimeSeconds,
        };

        if (!isOnline) {
          enqueueOfflineAction("goal", "game_events_goals", "POST", goalPayload);
        } else {
          // Add to store optimistic
          addGoalEvent(
            {
              id: Date.now(),
              major_event_id: Date.now(),
              team_season_id: Number(goalPayload.team_season_id),
              is_own_goal: goalType === "own_goal",
              goal_types: goalType,
              scorer_player_game_id: scorer?.playerGameId ? Number(scorer.playerGameId) : null,
              assist_player_game_id: assist?.playerGameId ? Number(assist.playerGameId) : null,
            } as any,
            {
              id: Date.now(),
              game_id: Number(game.id),
              period: game.currentPeriodIndex + 1,
              game_time: gameTimeSeconds,
              clock_should_run: 1,
            } as any
          );
        }

        toast.success(`GOAL Recorded! (${isOpponentGoal ? game.opponentName : game.ourName})`);
        setIsGoalModalOpen(false);
        setGoalScorerId("");
        setGoalAssistId("");
        setIsOpponentGoal(false);
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
        const cardPayload = {
          game_id: game.id,
          team_season_id: game.teamSeasonId,
          player_game_id: player?.playerGameId || null,
          card_type: cardType,
          card_reason: cardReason || null,
          game_time: gameTimeSeconds,
        };

        if (!isOnline) {
          enqueueOfflineAction("discipline", "game_events_discipline", "POST", cardPayload);
        } else {
          addDisciplineEvent(
            {
              id: Date.now(),
              major_event_id: Date.now(),
              team_season_id: Number(game.teamSeasonId),
              card_type: cardType,
              card_reason: cardReason,
              player_game_id: player?.playerGameId ? Number(player.playerGameId) : null,
            } as any,
            {
              id: Date.now(),
              game_id: Number(game.id),
              period: game.currentPeriodIndex + 1,
              game_time: gameTimeSeconds,
              clock_should_run: 1,
            } as any
          );
        }

        toast.success(`${cardType.toUpperCase()} Card recorded for ${player?.fullName}`);
        setIsCardModalOpen(false);
        setCardPlayerId("");
        setCardReason("");
      } catch (err: any) {
        toast.error("Failed to record card: " + err.message);
      }
    });
  };

  // Record Substitution Action
  const handleRecordSub = async () => {
    if (!subInPlayerId || !subOutPlayerId) {
      toast.error("Select both an IN player and an OUT player.");
      return;
    }

    startTransition(async () => {
      try {
        const inPlayer = players.find((p) => String(p.id) === subInPlayerId);
        const outPlayer = players.find((p) => String(p.id) === subOutPlayerId);

        const sub = await createPendingSub(
          inPlayer?.playerGameId || subInPlayerId,
          outPlayer?.playerGameId || subOutPlayerId,
          isGkSub
        );

        if (sub?.id) {
          await confirmSub(sub.id);
        }

        toast.success(`Subbed IN ${inPlayer?.fullName} for ${outPlayer?.fullName}`);
        setIsSubModalOpen(false);
        setSubInPlayerId("");
        setSubOutPlayerId("");
      } catch (err: any) {
        toast.error("Failed to execute substitution: " + err.message);
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

  // Record Team Event
  const handleQuickTeamEvent = (eventType: "corner" | "offside" | "foul" | "timeout") => {
    addTeamEvent({
      id: Date.now(),
      game_id: Number(game.id),
      team_season_id: Number(game.teamSeasonId),
      event_type: eventType as any,
      game_time: gameTimeSeconds,
      period: game.currentPeriodIndex + 1,
    } as any);

    toast.success(`Recorded Team ${eventType.toUpperCase()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* TOP SCOREBOARD HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* TEAM 1 (OUR TEAM) */}
          <div className="flex items-center gap-4 text-left">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-extrabold text-primary text-xl">
              ⚽
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Home</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text">{game.ourName}</h2>
            </div>
          </div>

          {/* SCORE & CLOCK */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-4 font-mono font-black text-4xl sm:text-5xl text-text tracking-tighter">
              <span>{game.goalsFor ?? 0}</span>
              <span className="text-muted/40">:</span>
              <span>{game.goalsAgainst ?? 0}</span>
            </div>

            {/* CLOCK DISPLAY */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border/80 shadow-xs">
              <Activity size={14} className="text-primary animate-pulse" />
              <span className="font-mono text-sm font-extrabold text-text">
                {formatTime(gameTimeSeconds)}
              </span>
              <span className="text-[10px] font-extrabold text-muted uppercase border-l border-border pl-2">
                {periodLabel}
              </span>
            </div>
          </div>

          {/* TEAM 2 (OPPONENT) */}
          <div className="flex items-center gap-4 text-right flex-row-reverse">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-extrabold text-accent text-xl">
              🛡️
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Away</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text">{game.opponentName}</h2>
            </div>
          </div>
        </div>

        {/* OFFLINE STATUS PILL */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                <Wifi size={14} />
                <span>Online (Live Sync Active)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-[11px]">
                <WifiOff size={14} />
                <span>Offline Mode ({queueCount} pending actions queued)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={currentStage === GAME_STAGES.DURING_PERIOD ? "danger" : "success"}
              size="sm"
              onClick={handleTogglePeriodClock}
              className="flex items-center gap-1.5 font-bold"
            >
              {currentStage === GAME_STAGES.DURING_PERIOD ? (
                <>
                  <PauseCircle size={14} />
                  <span>Pause/End Period</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Start Period Clock</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* QUICK ACTION TOOLBAR */}
      <Card variant="default" padding="md" className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          <span>Match Event Quick Bar</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <Button
            variant="success"
            size="sm"
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center justify-center gap-1.5"
          >
            <Trophy size={14} />
            <span>+ GOAL</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSubModalOpen(true)}
            className="flex items-center justify-center gap-1.5"
          >
            <Users size={14} />
            <span>SUB IN/OUT</span>
          </Button>

          <Button
            variant="warning"
            size="sm"
            onClick={() => setIsCardModalOpen(true)}
            className="flex items-center justify-center gap-1.5"
          >
            <AlertTriangle size={14} />
            <span>CARD</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickTeamEvent("corner")}
            className="flex items-center justify-center gap-1.5"
          >
            <Target size={14} />
            <span>CORNER</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickTeamEvent("offside")}
            className="flex items-center justify-center gap-1.5"
          >
            <Shield size={14} />
            <span>OFFSIDE</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGuestModalOpen(true)}
            className="flex items-center justify-center gap-1.5"
          >
            <UserPlus size={14} />
            <span>+ GUEST</span>
          </Button>
        </div>
      </Card>

      {/* ON-FIELD VS BENCH PLAYER ROSTER LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ON-FIELD PLAYERS */}
        <Card variant="outlined" padding="md" className="space-y-3 bg-surface shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Players On Field ({onFieldPlayers.length})</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {onFieldPlayers.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No players currently on field.</p>
            ) : (
              onFieldPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/50 hover:bg-background transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary text-xs">
                      #{player.jerseyNumber || "?"}
                    </span>
                    <div>
                      <p className="font-bold text-text">{player.fullName}</p>
                      <span className="text-[10px] text-muted capitalize">{player.position || "Field"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickPlayerAction(player.id, "shot")}
                      className="px-2 py-1 bg-surface border border-border hover:border-primary text-muted hover:text-primary rounded-lg font-bold text-[10px]"
                      title="Record Shot"
                    >
                      SHOT
                    </button>
                    <button
                      onClick={() => handleQuickPlayerAction(player.id, "save")}
                      className="px-2 py-1 bg-surface border border-border hover:border-emerald-500 text-muted hover:text-emerald-500 rounded-lg font-bold text-[10px]"
                      title="Record Save"
                    >
                      SAVE
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* BENCH PLAYERS */}
        <Card variant="outlined" padding="md" className="space-y-3 bg-surface shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Bench Reserves ({benchPlayers.length})</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {benchPlayers.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No players currently on bench.</p>
            ) : (
              benchPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-lg bg-surface border border-border flex items-center justify-center font-mono font-bold text-muted text-xs">
                      #{player.jerseyNumber || "?"}
                    </span>
                    <div>
                      <p className="font-bold text-text">{player.fullName}</p>
                      <span className="text-[10px] text-muted">On Bench</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSubInPlayerId(String(player.id));
                      setIsSubModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-primary text-white hover:bg-primary/90 rounded-lg font-bold text-[10px]"
                  >
                    SUB IN
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* MODAL 1: GOAL RECORDING */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Record Match Goal"
        subtitle="Log goal scorer, assist player, and goal type"
      >
        <div className="space-y-4 text-xs">
          <Checkbox
            label={`Goal for Opponent (${game.opponentName})`}
            checked={isOpponentGoal}
            onChange={(e: any) => setIsOpponentGoal(e.target.checked)}
          />

          {!isOpponentGoal && (
            <>
              <Select
                label="Goal Scorer"
                value={goalScorerId}
                onChange={(e: any) => setGoalScorerId(e.target.value)}
                options={players.map((p) => ({
                  value: String(p.id),
                  label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
                }))}
                placeholder="Select Goal Scorer"
                width="full"
              />

              <Select
                label="Assist Player (Optional)"
                value={goalAssistId}
                onChange={(e: any) => setGoalAssistId(e.target.value)}
                options={players.map((p) => ({
                  value: String(p.id),
                  label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
                }))}
                placeholder="Select Assist Player (Optional)"
                width="full"
              />
            </>
          )}

          <Select
            label="Goal Type"
            value={goalType}
            onChange={(e: any) => setGoalType(e.target.value)}
            options={[
              { value: "foot", label: "Normal Shot / Foot" },
              { value: "header", label: "Header" },
              { value: "free_kick", label: "Direct Free Kick" },
              { value: "penalty", label: "Penalty Kick" },
              { value: "own_goal", label: "Own Goal" },
            ]}
            width="full"
            showPlaceholder={false}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={handleRecordGoal} disabled={isPending}>
              Confirm Goal
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: CARD DISCIPLINE */}
      <Modal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        title="Record Card Discipline"
        subtitle="Log yellow or red card for player"
      >
        <div className="space-y-4 text-xs">
          <Select
            label="Player"
            value={cardPlayerId}
            onChange={(e: any) => setCardPlayerId(e.target.value)}
            options={players.map((p) => ({
              value: String(p.id),
              label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
            }))}
            placeholder="Select Card Recipient"
            width="full"
          />

          <Select
            label="Card Type"
            value={cardType}
            onChange={(e: any) => setCardType(e.target.value)}
            options={[
              { value: "yellow", label: "Yellow Card" },
              { value: "red", label: "Red Card" },
              { value: "yellow_red", label: "Second Yellow (Red)" },
            ]}
            width="full"
            showPlaceholder={false}
          />

          <Input
            label="Reason / Notes (Optional)"
            value={cardReason}
            onChange={(e: any) => setCardReason(e.target.value)}
            placeholder="e.g. Unsporting behavior, dangerous tackle"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="warning" size="sm" onClick={handleRecordCard} disabled={isPending}>
              Issue Card
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: SUBSTITUTION */}
      <Modal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title="Player Substitution"
        subtitle="Swap bench player IN for on-field player OUT"
      >
        <div className="space-y-4 text-xs">
          <Select
            label="Player Entering IN (Bench)"
            value={subInPlayerId}
            onChange={(e: any) => setSubInPlayerId(e.target.value)}
            options={benchPlayers.map((p) => ({
              value: String(p.id),
              label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
            }))}
            placeholder="Select Player Subbing IN"
            width="full"
          />

          <Select
            label="Player Exiting OUT (Field)"
            value={subOutPlayerId}
            onChange={(e: any) => setSubOutPlayerId(e.target.value)}
            options={onFieldPlayers.map((p) => ({
              value: String(p.id),
              label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
            }))}
            placeholder="Select Player Subbing OUT"
            width="full"
          />

          <Checkbox
            label="Goalkeeper Change"
            checked={isGkSub}
            onChange={(e: any) => setIsGkSub(e.target.checked)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsSubModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRecordSub} disabled={isPending}>
              Execute Substitution
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
