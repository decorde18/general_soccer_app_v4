"use client";

import React, { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import { formatTeamName } from "@/lib/utils/teamName";
import { toast } from "sonner";

interface MajorEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentShortName?: string;
  playerOptions?: Array<{ value: string; label: string }>;
  onRecordGoal?: (data: {
    scorerId: string;
    assistId: string;
    goalType: string;
    isOpponentGoal: boolean;
  }) => void;
  onRecordCard?: (data: {
    playerId: string;
    cardType: "yellow" | "red" | "yellow_red";
    cardReason: string;
  }) => void;
  onRecordStoppage?: (data: { reason: string }) => void;
  isPending?: boolean;
}

export default function MajorEventModal(props: MajorEventModalProps) {
  const { isOpen, onClose } = props;

  const game = useGameStore((s) => s.game);
  const addGoalEvent = useGameStore((s) => s.addGoalEvent);
  const addDisciplineEvent = useGameStore((s) => s.addDisciplineEvent);
  const players = useGamePlayersStore((s) => s.players);

  const [localIsPending, startTransition] = useTransition();
  const isPending = props.isPending ?? localIsPending;

  const [majorEventType, setMajorEventType] = useState<"goal" | "card" | "stoppage">("goal");

  // Goal state
  const [goalScorerId, setGoalScorerId] = useState("");
  const [goalAssistId, setGoalAssistId] = useState("");
  const [goalType, setGoalType] = useState("foot");
  const [isOpponentGoal, setIsOpponentGoal] = useState(false);

  // Card state
  const [cardPlayerId, setCardPlayerId] = useState("");
  const [cardType, setCardType] = useState<"yellow" | "red" | "yellow_red">("yellow");
  const [cardReason, setCardReason] = useState("");

  // Stoppage state
  const [stoppageReason, setStoppageReason] = useState("");

  const getValue = (val: any) => (typeof val === "string" ? val : val?.target?.value ?? "");

  const opponentShortName = props.opponentShortName ?? (game ? formatTeamName({
    team_name: (game.isHome ? game.awayTeamName : game.homeTeamName) as string | null,
    club: {
      name: (game.isHome ? game.awayClubName : game.homeClubName) as string | null,
      abbreviation: (game.isHome ? game.awayClubAbbreviation : game.homeClubAbbreviation) as string | null,
    }
  }, "short") : "Opponent");

  const eligiblePlayers = players.filter(
    (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed"
  );

  const playerOptions = props.playerOptions ?? eligiblePlayers.map((p) => ({
    value: String(p.id),
    label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
  }));

  const defaultRecordGoal = (data: { scorerId: string; assistId: string; goalType: string; isOpponentGoal: boolean }) => {
    if (!game) return;
    if (!data.isOpponentGoal && !data.scorerId) {
      toast.error("Please select the goal scorer.");
      return;
    }

    startTransition(async () => {
      try {
        const scorer = players.find((p) => String(p.id) === data.scorerId);
        const assist = players.find((p) => String(p.id) === data.assistId);
        const teamSeasonVal = data.isOpponentGoal ? game.opponentId : game.teamSeasonId;
        const gameTimeSeconds = useGameStore.getState().getGameTime();

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
        onClose();
      } catch (err: any) {
        toast.error("Failed to record goal: " + err.message);
      }
    });
  };

  const defaultRecordCard = (data: { playerId: string; cardType: "yellow" | "red" | "yellow_red"; cardReason: string }) => {
    if (!game) return;
    if (!data.playerId) {
      toast.error("Please select a player for the card.");
      return;
    }

    startTransition(async () => {
      try {
        const player = players.find((p) => String(p.id) === data.playerId);
        const gameTimeSeconds = useGameStore.getState().getGameTime();
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
        onClose();
      } catch (err: any) {
        toast.error("Failed to record card: " + err.message);
      }
    });
  };

  const defaultRecordStoppage = (data: { reason: string }) => {
    if (!game) return;
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
        onClose();
      } catch (err: any) {
        toast.error("Failed to log stoppage: " + err.message);
      }
    });
  };

  const onRecordGoal = props.onRecordGoal ?? defaultRecordGoal;
  const onRecordCard = props.onRecordCard ?? defaultRecordCard;
  const onRecordStoppage = props.onRecordStoppage ?? defaultRecordStoppage;

  const handleGoalSubmit = () => {
    onRecordGoal({
      scorerId: goalScorerId,
      assistId: goalAssistId,
      goalType,
      isOpponentGoal,
    });
  };

  const handleCardSubmit = () => {
    onRecordCard({
      playerId: cardPlayerId,
      cardType,
      cardReason,
    });
  };

  const handleStoppageSubmit = () => {
    onRecordStoppage({
      reason: stoppageReason,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Major Match Event"
      subtitle="Log goals, cards, and stoppages to the live match feed"
    >
      <div className="space-y-4 text-xs">
        <Select
          label="Event Type"
          value={majorEventType}
          onChange={(e: any) => setMajorEventType(getValue(e) as any)}
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
                if (checked) {
                  setGoalScorerId("");
                  setGoalAssistId("");
                }
              }}
            />

            {!isOpponentGoal && (
              <>
                <Select
                  label="Goal Scorer"
                  value={goalScorerId}
                  onChange={(e: any) => setGoalScorerId(getValue(e))}
                  options={[{ value: "", label: "-- Scorer --" }, ...playerOptions]}
                />
                <Select
                  label="Assist By"
                  value={goalAssistId}
                  onChange={(e: any) => setGoalAssistId(getValue(e))}
                  options={[{ value: "", label: "-- None --" }, ...playerOptions]}
                />
              </>
            )}

            <Select
              label="Goal Type"
              value={goalType}
              onChange={(e: any) => setGoalType(getValue(e))}
              options={[
                { value: "foot", label: "Standard Shot" },
                { value: "header", label: "Header" },
                { value: "penalty", label: "Penalty Kick" },
                { value: "free_kick", label: "Free Kick" },
                { value: "own_goal", label: "Own Goal" },
              ]}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGoalSubmit} disabled={isPending}>
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
              onChange={(e: any) => setCardPlayerId(getValue(e))}
              options={[{ value: "", label: "-- Player --" }, ...playerOptions]}
            />

            <Select
              label="Card Type"
              value={cardType}
              onChange={(e: any) => setCardType(getValue(e) as any)}
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
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCardSubmit} disabled={isPending}>
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
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleStoppageSubmit} disabled={isPending}>
                Log Stoppage
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
