"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import useGameStore from "@/stores/gameStore";
import type { GameSettings } from "@/types/game";
import { updateGameSettings } from "@/lib/actions/gameSettings-actions";
import MatchSettingsAccordions from "./MatchSettingsAccordions";
import { toast } from "sonner";

interface GameSettingsEditorProps {
  gameId: number;
  teamSeasonId: number;
}

export default function GameSettingsEditor({
  gameId,
  teamSeasonId,
}: GameSettingsEditorProps) {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Local editable state from store
  const [localSettings, setLocalSettings] = useState<GameSettings>(() =>
    game?.settings ?? {
      playersOnField: 11,
      periodCount: 2,
      periodDuration: 2400,
      hasOvertime: false,
      overtimePeriods: 2,
      overtimeDuration: 600,
      hasShootout: true,
      clockDirection: "up",
      reentryRule: "unlimited",
    }
  );

  // Synchronize local settings whenever store's game settings load or change
  useEffect(() => {
    if (game?.settings) {
      setLocalSettings(game.settings);
    }
  }, [game?.settings]);

  if (!game) return null;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateGameSettings(gameId, teamSeasonId, {
          playersOnField: localSettings.playersOnField,
          periodCount: localSettings.periodCount,
          periodDuration: localSettings.periodDuration,
          hasOvertime: localSettings.hasOvertime,
          overtimePeriods: localSettings.overtimePeriods,
          overtimeDuration: localSettings.overtimeDuration,
          goldenGoal: localSettings.goldenGoal,
          tiebreakerMode: localSettings.tiebreakerMode,
          hasShootout: localSettings.hasShootout,
          clockDirection: localSettings.clockDirection,
          reentryRule: localSettings.reentryRule,
          maxTotalSubsPerTeam: localSettings.maxTotalSubsPerTeam,
          maxSubWindowsPerGame: localSettings.maxSubWindowsPerGame,
          maxSubWindowsPerHalf: localSettings.maxSubWindowsPerHalf,
          autoStopClockOnMajorEvent: localSettings.autoStopClockOnMajorEvent,
        });

        // Sync to store
        updateGame({
          ...game,
          settings: {
            ...game.settings,
            ...localSettings,
          },
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast.success("Game settings updated!");
      } catch (err: any) {
        toast.error(err.message || "Failed to save settings");
      }
    });
  };

  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(game.settings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Match Rules & Settings</h2>
            <p className="text-xs text-muted">Configure period formats, tiebreakers, substitution rules & roster limits</p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3">
          {isDirty && !isPending && (
            <div className="flex items-center gap-1 text-xs text-warning font-semibold animate-pulse">
              <AlertCircle size={14} />
              Unsaved changes
            </div>
          )}

          {isDirty && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setLocalSettings(game.settings)}
              disabled={isPending}
            >
              Reset
            </Button>
          )}

          <Button
            variant={isDirty ? "primary" : "outline"}
            onClick={handleSave}
            disabled={!isDirty || isPending}
            className="flex items-center gap-2 px-5"
          >
            {isPending ? (
              <span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full" />
            ) : saved ? (
              <CheckCircle size={16} />
            ) : null}
            {isPending ? "Saving..." : saved ? "Saved!" : "Save Rules"}
          </Button>
        </div>
      </div>

      {/* Collapsible Category Accordions Component */}
      <MatchSettingsAccordions
        settings={localSettings}
        onChange={setLocalSettings}
      />
    </div>
  );
}
