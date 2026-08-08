"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";

interface MajorEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentShortName: string;
  playerOptions: Array<{ value: string; label: string }>;
  onRecordGoal: (data: {
    scorerId: string;
    assistId: string;
    goalType: string;
    isOpponentGoal: boolean;
  }) => void;
  onRecordCard: (data: {
    playerId: string;
    cardType: "yellow" | "red" | "yellow_red";
    cardReason: string;
  }) => void;
  onRecordStoppage: (data: { reason: string }) => void;
  isPending: boolean;
}

export default function MajorEventModal({
  isOpen,
  onClose,
  opponentShortName,
  playerOptions,
  onRecordGoal,
  onRecordCard,
  onRecordStoppage,
  isPending,
}: MajorEventModalProps) {
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
