"use client";

import React, { useState, useTransition } from "react";
import { Settings, Clock, RotateCcw, Shield, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import useGameStore from "@/stores/gameStore";
import type { GameSettings } from "@/types/game";
import { updateGameSettings } from "@/lib/actions/gameSettings-actions";
import { toast } from "sonner";

interface GameSettingsEditorProps {
  gameId: number;
  teamSeasonId: number;
}

const PERIOD_DURATION_OPTIONS = [
  { value: 1200, label: "20 min" },
  { value: 1500, label: "25 min" },
  { value: 1800, label: "30 min" },
  { value: 2400, label: "40 min" },
  { value: 2700, label: "45 min" },
  { value: 3600, label: "60 min" },
];

const OT_DURATION_OPTIONS = [
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
  { value: 900, label: "15 min" },
];

const PERIOD_COUNT_OPTIONS = [
  { value: 1, label: "1 Period" },
  { value: 2, label: "2 Halves" },
  { value: 4, label: "4 Quarters" },
];

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
    }
  );

  if (!game) return null;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateGameSettings(gameId, teamSeasonId, {
          periodCount: localSettings.periodCount,
          periodDuration: localSettings.periodDuration,
          hasOvertime: localSettings.hasOvertime,
          overtimeDuration: localSettings.overtimeDuration,
          hasShootout: localSettings.hasShootout,
        });

        // Sync to store
        updateGame({ settings: localSettings });

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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Match Settings</h2>
          <p className="text-xs text-muted">Configure the rules for this specific game</p>
        </div>
      </div>

      {/* Period Format */}
      <Card variant="default" padding="md">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/60">
          <Clock size={16} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Period Format</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Period Count */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Number of Periods
            </label>
            <div className="flex flex-wrap gap-2">
              {PERIOD_COUNT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLocalSettings((s) => ({ ...s, periodCount: value }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    localSettings.periodCount === value
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-background border-border text-muted hover:text-text hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Period Duration */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Period Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {PERIOD_DURATION_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLocalSettings((s) => ({ ...s, periodDuration: value }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    localSettings.periodDuration === value
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-background border-border text-muted hover:text-text hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm text-primary font-semibold">
          {localSettings.periodCount} × {localSettings.periodDuration / 60} min ={" "}
          {(localSettings.periodCount * localSettings.periodDuration) / 60} min total regulation
        </div>
      </Card>

      {/* Overtime */}
      <Card variant="default" padding="md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Overtime</h3>
          </div>
          <Toggle
            checked={localSettings.hasOvertime}
            onChange={(val: boolean) => setLocalSettings((s) => ({ ...s, hasOvertime: val }))}
          />
        </div>

        {localSettings.hasOvertime && (
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              OT Period Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {OT_DURATION_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLocalSettings((s) => ({ ...s, overtimeDuration: value }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    localSettings.overtimeDuration === value
                      ? "bg-accent text-white border-accent shadow-sm"
                      : "bg-background border-border text-muted hover:text-text hover:border-accent/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!localSettings.hasOvertime && (
          <p className="text-sm text-muted/70">Overtime is disabled — the game ends at full time.</p>
        )}
      </Card>

      {/* Shootout */}
      <Card variant="default" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-warning" />
            <div>
              <h3 className="text-sm font-bold text-text">Penalty Shootout</h3>
              <p className="text-xs text-muted mt-0.5">
                {localSettings.hasOvertime
                  ? "If still tied after overtime, go to penalties"
                  : "If tied at full time, go to penalties"}
              </p>
            </div>
          </div>
          <Toggle
            checked={localSettings.hasShootout}
            onChange={(val: boolean) => setLocalSettings((s) => ({ ...s, hasShootout: val }))}
          />
        </div>
      </Card>

      {/* Roster Size */}
      <Card variant="default" padding="md">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/60">
          <Shield size={16} className="text-success" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Roster</h3>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Players on Field
          </label>
          <div className="flex flex-wrap gap-2">
            {[7, 8, 9, 11].map((n) => (
              <button
                key={n}
                onClick={() => setLocalSettings((s) => ({ ...s, playersOnField: n }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  localSettings.playersOnField === n
                    ? "bg-success text-white border-success shadow-sm"
                    : "bg-background border-border text-muted hover:text-text hover:border-success/50"
                }`}
              >
                {n}v{n}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Save Controls */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant={isDirty ? "primary" : "outline"}
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className="flex items-center gap-2 px-6"
        >
          {isPending ? (
            <span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full" />
          ) : saved ? (
            <CheckCircle size={16} />
          ) : null}
          {isPending ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>

        {isDirty && !isPending && (
          <div className="flex items-center gap-1 text-xs text-warning font-semibold">
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
      </div>
    </div>
  );
}
