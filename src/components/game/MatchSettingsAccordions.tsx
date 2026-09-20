"use client";

import React, { useState } from "react";
import {
  Clock,
  RotateCcw,
  Shield,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Toggle from "@/components/ui/Toggle";
import type { GameSettings, TiebreakerMode } from "@/types/game";

interface MatchSettingsAccordionsProps {
  settings: GameSettings;
  onChange: (updatedSettings: GameSettings) => void;
  defaultExpandedAll?: boolean;
}

const PERIOD_DURATION_OPTIONS = [
  { value: 1500, label: "25 min" },
  { value: 1800, label: "30 min" },
  { value: 2100, label: "35 min" },
  { value: 2400, label: "40 min" },
  { value: 2700, label: "45 min" },
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

export default function MatchSettingsAccordions({
  settings,
  onChange,
  defaultExpandedAll = true,
}: MatchSettingsAccordionsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    periods: defaultExpandedAll,
    overtime: defaultExpandedAll,
    subs: defaultExpandedAll,
    format: defaultExpandedAll,
  });

  const [customMinsText, setCustomMinsText] = useState<string>(
    String(Math.round((settings.periodDuration || 2400) / 60))
  );

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setExpandedSections({ periods: true, overtime: true, subs: true, format: true });
  };

  const collapseAll = () => {
    setExpandedSections({ periods: false, overtime: false, subs: false, format: false });
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const tiebreakerMode: TiebreakerMode =
    settings.tiebreakerMode ||
    (settings.hasOvertime
      ? "overtime_then_pk"
      : settings.hasShootout
      ? "pk_only"
      : "none");

  const handleTiebreakerChange = (mode: TiebreakerMode) => {
    if (mode === "none") {
      onChange({
        ...settings,
        tiebreakerMode: "none",
        hasOvertime: false,
        hasShootout: false,
      });
    } else if (mode === "pk_only") {
      onChange({
        ...settings,
        tiebreakerMode: "pk_only",
        hasOvertime: false,
        hasShootout: true,
      });
    } else {
      onChange({
        ...settings,
        tiebreakerMode: "overtime_then_pk",
        hasOvertime: true,
        hasShootout: settings.hasShootout ?? true,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Accordion Expand / Collapse Toolbar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <Sliders size={14} className="text-primary" />
          <span>Match Rules Accordions</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[11px] font-extrabold text-primary hover:underline cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[11px] font-extrabold text-muted hover:text-text cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* 1. PERIOD FORMAT & CLOCK ACCORDION */}
      <Card variant="default" padding="none" className="overflow-hidden border border-border/80 rounded-xl">
        <button
          type="button"
          onClick={() => toggleSection("periods")}
          className="w-full flex items-center justify-between p-3.5 bg-surface hover:bg-background/80 transition-colors text-left cursor-pointer border-b border-border/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Periods & Match Clock</h3>
              <p className="text-[11px] text-muted">
                {settings.periodCount || 2} Periods • {Math.round((settings.periodDuration || 2400) / 60)} mins per period ({((settings.periodCount || 2) * (settings.periodDuration || 2400)) / 60} mins total)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
              {settings.clockDirection === "down" ? "Countdown" : "Count Up"}
            </span>
            {expandedSections.periods ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
          </div>
        </button>

        {expandedSections.periods && (
          <div className="p-4 space-y-5 bg-background/25">
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
                      type="button"
                      onClick={() => updateSetting("periodCount", value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        settings.periodCount === value
                          ? "bg-primary text-white border-primary shadow-xs"
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
                <div className="flex flex-wrap gap-2 mb-3">
                  {PERIOD_DURATION_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        updateSetting("periodDuration", value);
                        setCustomMinsText(String(value / 60));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        settings.periodDuration === value
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-background border-border text-muted hover:text-text hover:border-primary/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-medium">Custom Minutes:</span>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    value={customMinsText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setCustomMinsText(raw);
                      const parsed = parseInt(raw);
                      if (!isNaN(parsed) && parsed > 0) {
                        updateSetting("periodDuration", parsed * 60);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(customMinsText);
                      if (isNaN(parsed) || parsed < 5) {
                        const fallback = Math.round((settings.periodDuration || 2400) / 60) || 40;
                        setCustomMinsText(String(fallback));
                        updateSetting("periodDuration", fallback * 60);
                      }
                    }}
                    className="w-20 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="40"
                  />
                  <span className="text-xs text-muted font-medium">mins per period</span>
                </div>
              </div>
            </div>

            {/* Clock Direction & Auto Stoppage */}
            <div className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Scoreboard Clock Direction
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSetting("clockDirection", "up")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      (settings.clockDirection || "up") === "up"
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-background border-border text-muted hover:text-text"
                    }`}
                  >
                    Count Up (0:00 ➔ 40:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSetting("clockDirection", "down")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      settings.clockDirection === "down"
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-background border-border text-muted hover:text-text"
                    }`}
                  >
                    Count Down (40:00 ➔ 0:00)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border/60">
                <div>
                  <div className="text-xs font-bold text-text">Auto-Pause Clock on Major Event</div>
                  <div className="text-[10px] text-muted">Automatically pauses clock when goal, card, or injury occurs</div>
                </div>
                <Toggle
                  checked={Boolean(settings.autoStopClockOnMajorEvent)}
                  onChange={(val: boolean) => updateSetting("autoStopClockOnMajorEvent", val)}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 2. OVERTIME & TIEBREAKERS ACCORDION */}
      <Card variant="default" padding="none" className="overflow-hidden border border-border/80 rounded-xl">
        <button
          type="button"
          onClick={() => toggleSection("overtime")}
          className="w-full flex items-center justify-between p-3.5 bg-surface hover:bg-background/80 transition-colors text-left cursor-pointer border-b border-border/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <RotateCcw size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Overtime & Tiebreakers</h3>
              <p className="text-[11px] text-muted">
                {tiebreakerMode === "none"
                  ? "No Overtime / End as Draw"
                  : tiebreakerMode === "pk_only"
                  ? "Direct to Penalty Shootout"
                  : `${settings.overtimePeriods || 2} OT Periods (${Math.round((settings.overtimeDuration || 600) / 60)} min each) ${settings.goldenGoal ? "• Golden Goal" : "• Full Duration"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono">
              {tiebreakerMode === "none" ? "No OT" : tiebreakerMode === "pk_only" ? "PK Only" : "OT Enabled"}
            </span>
            {expandedSections.overtime ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
          </div>
        </button>

        {expandedSections.overtime && (
          <div className="p-4 space-y-5 bg-background/25">
            {/* Tiebreaker Policy Mode */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                If Tied at Full Time (Regulation End)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { mode: "none", label: "No Overtime", desc: "Game ends in a draw at full time" },
                  { mode: "overtime_then_pk", label: "Overtime, then PKs", desc: "Play overtime first; go to PKs if still tied" },
                  { mode: "pk_only", label: "Direct to Penalties", desc: "Skip overtime and go directly to shootout" },
                ].map(({ mode, label, desc }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleTiebreakerChange(mode as TiebreakerMode)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      tiebreakerMode === mode
                        ? "bg-accent/10 border-accent text-text shadow-xs"
                        : "bg-surface border-border text-muted hover:border-accent/50"
                    }`}
                  >
                    <div className="text-xs font-bold text-text">{label}</div>
                    <div className="text-[10px] text-muted mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Overtime Configuration Options */}
            {settings.hasOvertime && (
              <div className="space-y-4 pt-3 border-t border-border/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* OT Period Count */}
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      Number of Overtime Periods
                    </label>
                    <div className="flex gap-2">
                      {[1, 2].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => updateSetting("overtimePeriods", num)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            (settings.overtimePeriods || 2) === num
                              ? "bg-accent text-white border-accent shadow-xs"
                              : "bg-background border-border text-muted hover:text-text"
                          }`}
                        >
                          {num} {num === 1 ? "Period" : "Periods"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* OT Period Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      OT Period Duration
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {OT_DURATION_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateSetting("overtimeDuration", value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            settings.overtimeDuration === value
                              ? "bg-accent text-white border-accent shadow-xs"
                              : "bg-background border-border text-muted hover:text-text hover:border-accent/50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Golden Goal vs Full Duration */}
                <div className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border/60">
                  <div>
                    <div className="text-xs font-bold text-text">Golden Goal / Sudden Death</div>
                    <div className="text-[10px] text-muted">First goal scored in overtime instantly ends and wins match</div>
                  </div>
                  <Toggle
                    checked={Boolean(settings.goldenGoal)}
                    onChange={(val: boolean) => updateSetting("goldenGoal", val)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 3. SUBSTITUTION RESTRICTIONS ACCORDION */}
      <Card variant="default" padding="none" className="overflow-hidden border border-border/80 rounded-xl">
        <button
          type="button"
          onClick={() => toggleSection("subs")}
          className="w-full flex items-center justify-between p-3.5 bg-surface hover:bg-background/80 transition-colors text-left cursor-pointer border-b border-border/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Substitution Restrictions & Rules</h3>
              <p className="text-[11px] text-muted">
                {settings.reentryRule === "no_reentry" ? "No Re-Entry" : settings.reentryRule === "one_per_half" ? "1 Re-Entry / Half" : settings.reentryRule === "ncaa_college" ? "NCAA Rules" : "Unlimited Re-Entry"}
                {settings.maxSubWindowsPerGame ? ` • ${settings.maxSubWindowsPerGame} Windows/Game` : ""}
                {settings.maxTotalSubsPerTeam ? ` • Max ${settings.maxTotalSubsPerTeam} Total Subs` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
              {settings.reentryRule || "unlimited"}
            </span>
            {expandedSections.subs ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
          </div>
        </button>

        {expandedSections.subs && (
          <div className="p-4 space-y-5 bg-background/25">
            {/* Re-Entry Policy */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Re-Entry Policy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: "unlimited", label: "Unlimited Re-Entry", desc: "Youth standard — players can re-enter freely" },
                  { value: "one_per_half", label: "1 Re-Entry Per Half", desc: "NFHS / US Club — max 1 re-entry per half/period" },
                  { value: "ncaa_college", label: "NCAA College Rules", desc: "No 1st half re-entry; 1 2nd half re-entry; no OT re-entry" },
                  { value: "one_per_game", label: "1 Re-Entry Per Game", desc: "Max 1 re-entry for the entire match" },
                  { value: "no_reentry", label: "No Re-Entry", desc: "IFAB / FIFA adult rules — once subbed out, cannot return" },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateSetting("reentryRule", value as any)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      (settings.reentryRule || "unlimited") === value
                        ? "bg-emerald-500/10 border-emerald-500 text-text shadow-xs"
                        : "bg-surface border-border text-muted hover:border-emerald-500/50"
                    }`}
                  >
                    <div className="text-xs font-bold text-text">{label}</div>
                    <div className="text-[10px] text-muted mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Substitution Limits Grid */}
            <div className="pt-4 border-t border-border/40 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Max Total Subs */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Max Total Subs Per Team
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: undefined, label: "Unlimited" },
                    { value: 5, label: "5 Subs (IFAB)" },
                    { value: 7, label: "7 Subs" },
                  ].map(({ value, label }) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => updateSetting("maxTotalSubsPerTeam", value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        settings.maxTotalSubsPerTeam === value
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-surface border-border text-muted hover:text-text hover:border-emerald-500/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Windows Per Game */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Max Windows Per Game
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: undefined, label: "Unlimited" },
                    { value: 3, label: "3 (IFAB)" },
                    { value: 4, label: "4" },
                    { value: 5, label: "5" },
                  ].map(({ value, label }) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => updateSetting("maxSubWindowsPerGame", value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        settings.maxSubWindowsPerGame === value
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-surface border-border text-muted hover:text-text hover:border-emerald-500/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Windows Per Half */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Max Windows Per Half
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: undefined, label: "Unlimited" },
                    { value: 1, label: "1" },
                    { value: 2, label: "2" },
                    { value: 3, label: "3" },
                  ].map(({ value, label }) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => updateSetting("maxSubWindowsPerHalf", value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                        settings.maxSubWindowsPerHalf === value
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-surface border-border text-muted hover:text-text hover:border-emerald-500/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 4. MATCH FORMAT & FIELD SIZE ACCORDION */}
      <Card variant="default" padding="none" className="overflow-hidden border border-border/80 rounded-xl">
        <button
          type="button"
          onClick={() => toggleSection("format")}
          className="w-full flex items-center justify-between p-3.5 bg-surface hover:bg-background/80 transition-colors text-left cursor-pointer border-b border-border/40"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Match Format & Field Size</h3>
              <p className="text-[11px] text-muted">
                {settings.playersOnField || 11}v{settings.playersOnField || 11} ({settings.playersOnField || 11} Starters On Field)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono">
              {settings.playersOnField || 11}v{settings.playersOnField || 11}
            </span>
            {expandedSections.format ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
          </div>
        </button>

        {expandedSections.format && (
          <div className="p-4 space-y-4 bg-background/25">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Players on Field (Starter Limit)
              </label>
              <div className="flex flex-wrap gap-2">
                {[5, 7, 8, 9, 11].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateSetting("playersOnField", n)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      (settings.playersOnField || 11) === n
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs scale-105"
                        : "bg-surface border-border text-muted hover:text-text hover:border-blue-500/50"
                    }`}
                  >
                    {n}v{n} ({n} Starters)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
