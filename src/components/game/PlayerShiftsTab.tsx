"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Timer,
  ArrowRightLeft,
  Users,
  Shield,
  Search,
  ChevronDown,
  ChevronRight,
  Sliders,
  Eye,
  Activity,
  CheckCircle,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatSecondsToMmss, getPlayerOnFieldIntervals } from "@/lib/utils/dateTimeUtils";
import { Player } from "@/stores/gamePlayersStore";
import { Game } from "@/types/game";

interface PlayerShiftsTabProps {
  game: Game;
  players: Player[];
}

export interface PlayerStint {
  id: string;
  type: "field" | "bench";
  stintNumber: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  periodLabel: string;
}

export interface PlayerShiftData {
  player: Player;
  isStarter: boolean;
  totalFieldSec: number;
  totalBenchSec: number;
  shiftCount: number;
  avgShiftSec: number;
  maxShiftSec: number;
  minShiftSec: number;
  stints: PlayerStint[];
  fieldStints: PlayerStint[];
  benchStints: PlayerStint[];
}

export default function PlayerShiftsTab({ game, players }: PlayerShiftsTabProps) {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "starters" | "subs">("all");
  const [expandedPlayerIds, setExpandedPlayerIds] = useState<Set<string | number>>(new Set());

  // Moment-in-Time Inspector state
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [inspectTimeSec, setInspectTimeSec] = useState(0);

  // Toggle expand/collapse for player breakdown
  const toggleExpand = (id: string | number) => {
    setExpandedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPlayerIds(new Set(eligiblePlayers.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedPlayerIds(new Set());
  };

  // 1. Periods & Match Duration Bounds
  const periodIntervals = useMemo(() => {
    if (!game) return [];
    const periods = game.periods || [];
    const regSecs = game.settings?.periodDuration || 2400;

    if (periods.length === 0) {
      return [
        { start: 0, end: regSecs, periodNumber: 1, label: "Period 1" },
        { start: regSecs, end: regSecs * 2, periodNumber: 2, label: "Period 2" },
      ];
    }

    const p1Start = periods[0]?.startTime ? Number(periods[0].startTime) : null;
    const intervals: { start: number; end: number; periodNumber: number; label: string }[] = [];

    if (p1Start) {
      periods.forEach((p: any, idx: number) => {
        const pStartMs = p.startTime ? Number(p.startTime) : null;
        const pEndMs = p.endTime ? Number(p.endTime) : null;
        const pNum = p.periodNumber || idx + 1;
        const pLabel = pNum <= 2 ? `Period ${pNum}` : `OT ${pNum - 2}`;

        if (pStartMs) {
          const startSec = Math.max(0, Math.floor((pStartMs - p1Start) / 1000));
          let endSec = startSec + regSecs;
          if (pEndMs) {
            endSec = Math.max(startSec, Math.floor((pEndMs - p1Start) / 1000));
          }
          intervals.push({ start: startSec, end: endSec, periodNumber: pNum, label: pLabel });
        } else {
          const startSec = idx * regSecs;
          intervals.push({ start: startSec, end: startSec + regSecs, periodNumber: pNum, label: pLabel });
        }
      });
    } else {
      periods.forEach((p: any, idx: number) => {
        const startSec = idx * regSecs;
        const pNum = p.periodNumber || idx + 1;
        const pLabel = pNum <= 2 ? `Period ${pNum}` : `OT ${pNum - 2}`;
        intervals.push({ start: startSec, end: startSec + regSecs, periodNumber: pNum, label: pLabel });
      });
    }

    return intervals;
  }, [game]);

  const totalMatchSeconds = useMemo(() => {
    if (periodIntervals.length === 0) return 4800;
    return periodIntervals[periodIntervals.length - 1].end;
  }, [periodIntervals]);

  // 2. Eligible Roster Players
  const eligiblePlayers = useMemo(() => {
    return players
      .filter((p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper" || p.gameStatus === "dressed")
      .sort((a, b) => Number(a.jerseyNumber || 999) - Number(b.jerseyNumber || 999));
  }, [players]);

  // 3. Shift and Stint Calculations per Player
  const playerShiftsData: PlayerShiftData[] = useMemo(() => {
    return eligiblePlayers.map((player) => {
      const isStarter = Boolean(player.started || ["starter", "goalkeeper"].includes(player.gameStatus));
      const onFieldIntervals = getPlayerOnFieldIntervals(
        isStarter,
        player.ins || [],
        player.outs || [],
        periodIntervals,
        totalMatchSeconds
      );

      const stints: PlayerStint[] = [];
      let currentCursor = 0;
      let fieldStintNum = 0;
      let benchStintNum = 0;

      onFieldIntervals.forEach((interval) => {
        if (interval.start > currentCursor) {
          benchStintNum += 1;
          const benchDuration = interval.start - currentCursor;
          const p = periodIntervals.find((pi) => currentCursor >= pi.start && currentCursor < pi.end) || periodIntervals[0];
          stints.push({
            id: `bench_${player.id}_${benchStintNum}`,
            type: "bench",
            stintNumber: benchStintNum,
            startSec: currentCursor,
            endSec: interval.start,
            durationSec: benchDuration,
            periodLabel: p ? p.label : "Period 1",
          });
        }

        fieldStintNum += 1;
        const fieldDuration = Math.max(0, interval.end - interval.start);
        const p = periodIntervals.find((pi) => interval.start >= pi.start && interval.start < pi.end) || periodIntervals[0];
        stints.push({
          id: `field_${player.id}_${fieldStintNum}`,
          type: "field",
          stintNumber: fieldStintNum,
          startSec: interval.start,
          endSec: interval.end,
          durationSec: fieldDuration,
          periodLabel: p ? p.label : "Period 1",
        });

        currentCursor = Math.max(currentCursor, interval.end);
      });

      if (currentCursor < totalMatchSeconds) {
        benchStintNum += 1;
        const benchDuration = totalMatchSeconds - currentCursor;
        const p = periodIntervals.find((pi) => currentCursor >= pi.start && currentCursor < pi.end) || periodIntervals[periodIntervals.length - 1];
        stints.push({
          id: `bench_${player.id}_${benchStintNum}`,
          type: "bench",
          stintNumber: benchStintNum,
          startSec: currentCursor,
          endSec: totalMatchSeconds,
          durationSec: benchDuration,
          periodLabel: p ? p.label : "Period 2",
        });
      }

      const fieldStints = stints.filter((s) => s.type === "field");
      const benchStints = stints.filter((s) => s.type === "bench");

      const totalFieldSec = fieldStints.reduce((sum, s) => sum + s.durationSec, 0);
      const totalBenchSec = benchStints.reduce((sum, s) => sum + s.durationSec, 0);
      const shiftCount = fieldStints.length;
      const avgShiftSec = shiftCount > 0 ? Math.round(totalFieldSec / shiftCount) : 0;
      const maxShiftSec = shiftCount > 0 ? Math.max(...fieldStints.map((s) => s.durationSec)) : 0;
      const minShiftSec = shiftCount > 0 ? Math.min(...fieldStints.map((s) => s.durationSec)) : 0;

      return {
        player,
        isStarter,
        totalFieldSec,
        totalBenchSec,
        shiftCount,
        avgShiftSec,
        maxShiftSec,
        minShiftSec,
        stints,
        fieldStints,
        benchStints,
      };
    });
  }, [eligiblePlayers, periodIntervals, totalMatchSeconds]);

  // 4. Filtered Players
  const filteredData = useMemo(() => {
    return playerShiftsData.filter((item) => {
      if (roleFilter === "starters" && !item.isStarter) return false;
      if (roleFilter === "subs" && item.isStarter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const num = String(item.player.jerseyNumber || "");
        const name = `${item.player.firstName || ""} ${item.player.lastName || ""}`.toLowerCase();
        return num.includes(query) || name.includes(query);
      }

      return true;
    });
  }, [playerShiftsData, roleFilter, searchQuery]);

  // 5. Team-Level KPI Stats
  const teamKpis = useMemo(() => {
    const playersWithShifts = playerShiftsData.filter((p) => p.shiftCount > 0);
    const totalShifts = playerShiftsData.reduce((sum, p) => sum + p.shiftCount, 0);
    const totalFieldSecondsAll = playerShiftsData.reduce((sum, p) => sum + p.totalFieldSec, 0);
    const avgShiftDuration = totalShifts > 0 ? Math.round(totalFieldSecondsAll / totalShifts) : 0;

    let longestShiftSec = 0;
    let longestShiftPlayer: Player | null = null;
    playerShiftsData.forEach((p) => {
      if (p.maxShiftSec > longestShiftSec) {
        longestShiftSec = p.maxShiftSec;
        longestShiftPlayer = p.player;
      }
    });

    return {
      totalDressed: eligiblePlayers.length,
      playedCount: playersWithShifts.length,
      totalShifts,
      avgShiftDuration,
      longestShiftSec,
      longestShiftPlayer,
    };
  }, [playerShiftsData, eligiblePlayers]);

  // 6. Moment-in-Time Snapshot
  const momentSnapshot = useMemo(() => {
    if (!isInspectorActive) return null;
    const onField: Array<{ player: Player; stintNum: number; currentShiftSec: number; totalShiftSec: number }> = [];
    const onBench: Array<{ player: Player; stintNum: number; currentRestSec: number; totalRestSec: number }> = [];

    playerShiftsData.forEach((item) => {
      const activeStint =
        item.stints.find((s) => inspectTimeSec >= s.startSec && inspectTimeSec < s.endSec) ||
        (inspectTimeSec >= totalMatchSeconds ? item.stints[item.stints.length - 1] : null);

      if (activeStint?.type === "field") {
        onField.push({
          player: item.player,
          stintNum: activeStint.stintNumber,
          currentShiftSec: Math.max(0, inspectTimeSec - activeStint.startSec),
          totalShiftSec: activeStint.durationSec,
        });
      } else if (activeStint?.type === "bench") {
        onBench.push({
          player: item.player,
          stintNum: activeStint.stintNumber,
          currentRestSec: Math.max(0, inspectTimeSec - activeStint.startSec),
          totalRestSec: activeStint.durationSec,
        });
      } else {
        onBench.push({
          player: item.player,
          stintNum: 1,
          currentRestSec: 0,
          totalRestSec: 0,
        });
      }
    });

    // Find active period for inspect time
    const activePeriod = periodIntervals.find((p) => inspectTimeSec >= p.start && inspectTimeSec < p.end) || periodIntervals[0];

    return { onField, onBench, activePeriod };
  }, [isInspectorActive, inspectTimeSec, playerShiftsData, totalMatchSeconds, periodIntervals]);

  return (
    <div className="space-y-6 animate-fadeIn select-none text-text">
      {/* SECTION HEADER & KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card variant="outlined" padding="md" className="bg-surface/80 border-border/80 shadow-xs">
          <div className="flex items-center gap-2 text-muted text-[11px] font-bold uppercase tracking-wider mb-1">
            <Users size={14} className="text-primary" />
            <span>Players Used</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-black text-2xl text-text">{teamKpis.playedCount}</span>
            <span className="text-xs text-muted font-bold">/ {teamKpis.totalDressed} Dressed</span>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="bg-surface/80 border-border/80 shadow-xs">
          <div className="flex items-center gap-2 text-muted text-[11px] font-bold uppercase tracking-wider mb-1">
            <ArrowRightLeft size={14} className="text-blue-500" />
            <span>Total Team Shifts</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-black text-2xl text-blue-500">{teamKpis.totalShifts}</span>
            <span className="text-xs text-muted font-bold">Stints on field</span>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="bg-surface/80 border-border/80 shadow-xs">
          <div className="flex items-center gap-2 text-muted text-[11px] font-bold uppercase tracking-wider mb-1">
            <Timer size={14} className="text-emerald-500" />
            <span>Avg Shift Length</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-black text-2xl text-emerald-500">
              {formatSecondsToMmss(teamKpis.avgShiftDuration)}
            </span>
            <span className="text-xs text-muted font-bold">per stint</span>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="bg-surface/80 border-border/80 shadow-xs">
          <div className="flex items-center gap-2 text-muted text-[11px] font-bold uppercase tracking-wider mb-1">
            <Clock size={14} className="text-amber-500" />
            <span>Longest Shift</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-black text-2xl text-amber-500">
              {formatSecondsToMmss(teamKpis.longestShiftSec)}
            </span>
            {teamKpis.longestShiftPlayer && (
              <span className="text-xs text-muted font-bold truncate max-w-[100px]">
                (#{(teamKpis.longestShiftPlayer as Player).jerseyNumber || "?"})
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* MOMENT-IN-TIME INSPECTOR TOOLBAR */}
      <Card variant="outlined" padding="md" className="bg-gradient-to-r from-surface via-background/60 to-surface border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Eye size={16} />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-text flex items-center gap-2">
                <span>Moment-in-Time Match Clock Inspector</span>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  Interactive
                </span>
              </h4>
              <p className="text-[11px] text-muted">
                Drag the match clock to see who was on the field vs bench and how long they had been out.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const nextState = !isInspectorActive;
                setIsInspectorActive(nextState);
                if (nextState && inspectTimeSec === 0) {
                  setInspectTimeSec(Math.round(totalMatchSeconds / 2));
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                isInspectorActive
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface hover:bg-background border-border text-muted hover:text-text"
              }`}
            >
              <Sliders size={13} />
              <span>{isInspectorActive ? "Hide Inspector" : "Activate Inspector"}</span>
            </button>
          </div>
        </div>

        {isInspectorActive && momentSnapshot && (
          <div className="pt-3 space-y-4">
            {/* Slider Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted uppercase text-[10px] tracking-wider">
                  Inspecting at:{" "}
                  <span className="text-primary font-mono text-sm font-black">
                    {formatSecondsToMmss(inspectTimeSec)}
                  </span>{" "}
                  ({momentSnapshot.activePeriod?.label || "Match Time"})
                </span>
                <span className="font-mono text-[11px] text-muted">
                  Total Match: {formatSecondsToMmss(totalMatchSeconds)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={totalMatchSeconds}
                step={15}
                value={inspectTimeSec}
                onChange={(e) => setInspectTimeSec(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-background rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted font-mono">
                {periodIntervals.map((pi, idx) => (
                  <span key={idx}>
                    {pi.label}: {formatSecondsToMmss(pi.start)} - {formatSecondsToMmss(pi.end)}
                  </span>
                ))}
              </div>
            </div>

            {/* Split Snapshot: On Field vs On Bench at this exact second */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* ON FIELD */}
              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-extrabold text-xs uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>On Field ({momentSnapshot.onField.length})</span>
                  </div>
                  <span className="text-[10px] text-muted font-semibold">Current Shift Duration</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {momentSnapshot.onField.map(({ player, stintNum, currentShiftSec, totalShiftSec }) => (
                    <div
                      key={player.id}
                      className="p-1.5 rounded-xl bg-surface/90 border border-emerald-500/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-emerald-500 text-[11px]">
                          #{player.jerseyNumber || "?"}
                        </span>
                        <span className="font-bold truncate text-[11px]">
                          {player.firstName} {player.lastName}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-extrabold text-[11px] text-emerald-500">
                          {formatSecondsToMmss(currentShiftSec)}
                        </span>
                        <span className="text-[9px] text-muted block">
                          of {formatSecondsToMmss(totalShiftSec)} (S{stintNum})
                        </span>
                      </div>
                    </div>
                  ))}
                  {momentSnapshot.onField.length === 0 && (
                    <p className="text-xs text-muted italic col-span-2 py-2 text-center">No active players on field at this second.</p>
                  )}
                </div>
              </div>

              {/* ON BENCH */}
              <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-xs uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span>On Bench ({momentSnapshot.onBench.length})</span>
                  </div>
                  <span className="text-[10px] text-muted font-semibold">Continuous Bench Rest</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {momentSnapshot.onBench.map(({ player, stintNum, currentRestSec, totalRestSec }) => (
                    <div
                      key={player.id}
                      className="p-1.5 rounded-xl bg-surface/90 border border-border/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-muted text-[11px]">
                          #{player.jerseyNumber || "?"}
                        </span>
                        <span className="font-bold truncate text-[11px] text-text">
                          {player.firstName} {player.lastName}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-extrabold text-[11px] text-slate-400">
                          {formatSecondsToMmss(currentRestSec)}
                        </span>
                        <span className="text-[9px] text-muted block">
                          of {formatSecondsToMmss(totalRestSec)} (Rest {stintNum})
                        </span>
                      </div>
                    </div>
                  ))}
                  {momentSnapshot.onBench.length === 0 && (
                    <p className="text-xs text-muted italic col-span-2 py-2 text-center">No players on bench at this second.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by player or jersey #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-1 bg-background p-0.5 rounded-xl border border-border/80">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                roleFilter === "all" ? "bg-primary text-white" : "text-muted hover:text-text"
              }`}
            >
              All ({playerShiftsData.length})
            </button>
            <button
              onClick={() => setRoleFilter("starters")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                roleFilter === "starters" ? "bg-primary text-white" : "text-muted hover:text-text"
              }`}
            >
              Starters
            </button>
            <button
              onClick={() => setRoleFilter("subs")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                roleFilter === "subs" ? "bg-primary text-white" : "text-muted hover:text-text"
              }`}
            >
              Substitutes
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={expandAll}
            className="text-xs text-muted hover:text-primary font-bold underline transition-colors"
          >
            Expand All
          </button>
          <span className="text-muted/40">•</span>
          <button
            onClick={collapseAll}
            className="text-xs text-muted hover:text-primary font-bold underline transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* TIMELINE RULER LEGEND */}
      <div className="px-4 py-2 bg-surface/50 border border-border/60 rounded-xl flex items-center justify-between text-[11px] font-bold text-muted">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded bg-emerald-500 shadow-xs" />
            <span>On-Field Shift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded bg-slate-800/80 border border-slate-700/60" />
            <span>Bench Stint</span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          {periodIntervals.map((pi, idx) => (
            <span key={idx} className="bg-background px-2 py-0.5 rounded border border-border/70">
              {pi.label}: {formatSecondsToMmss(pi.start)} - {formatSecondsToMmss(pi.end)}
            </span>
          ))}
        </div>
      </div>

      {/* PLAYER SHIFTS LIST */}
      <div className="space-y-3">
        {filteredData.map((item) => {
          const isExpanded = expandedPlayerIds.has(item.player.id);
          const hasPlayed = item.shiftCount > 0;

          return (
            <Card
              key={item.player.id}
              variant="outlined"
              padding="sm"
              className="bg-surface hover:border-primary/40 transition-colors border-border overflow-hidden"
            >
              {/* PLAYER ROW HEADER */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-2.5">
                {/* Player info & badges */}
                <div className="flex items-center gap-3 min-w-0 lg:w-72 shrink-0">
                  <div className="h-9 w-9 rounded-xl bg-background border border-border flex items-center justify-center font-mono font-black text-sm text-primary shrink-0 shadow-xs">
                    #{item.player.jerseyNumber || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-black text-xs text-text truncate">
                        {item.player.firstName} {item.player.lastName}
                      </span>
                      {item.isStarter ? (
                        <span className="px-1.5 py-0.2 rounded bg-primary/15 text-primary text-[9px] font-black border border-primary/25 shrink-0 uppercase">
                          Starter
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-slate-500/15 text-muted text-[9px] font-black border border-slate-500/25 shrink-0 uppercase">
                          Sub
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted font-mono pt-0.5">
                      <span>Position: {item.player.position || "FLD"}</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-500">
                        {item.shiftCount} {item.shiftCount === 1 ? "shift" : "shifts"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VISUAL TIMELINE TRACK */}
                <div className="flex-1 min-w-0 px-2">
                  <div className="relative h-6 w-full bg-slate-900/90 rounded-lg overflow-hidden border border-slate-800 shadow-inner flex items-center">
                    {/* Period dividers overlay */}
                    {periodIntervals.map((pi, idx) => {
                      if (idx === 0) return null;
                      const leftPercent = (pi.start / totalMatchSeconds) * 100;
                      return (
                        <div
                          key={idx}
                          style={{ left: `${leftPercent}%` }}
                          className="absolute top-0 bottom-0 w-px bg-white/25 z-10 pointer-events-none"
                          title={`Period divider: ${formatSecondsToMmss(pi.start)}`}
                        />
                      );
                    })}

                    {/* Stint blocks */}
                    {item.stints.map((stint) => {
                      const leftPct = (stint.startSec / totalMatchSeconds) * 100;
                      const widthPct = Math.max(1, ((stint.endSec - stint.startSec) / totalMatchSeconds) * 100);
                      const isField = stint.type === "field";

                      return (
                        <div
                          key={stint.id}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          className={`absolute top-0.5 bottom-0.5 rounded transition-all cursor-pointer group ${
                            isField
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-125 border border-emerald-400/40 shadow-xs"
                              : "bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/40"
                          }`}
                          title={`${isField ? `Shift ${stint.stintNumber}` : `Bench ${stint.stintNumber}`}: ${formatSecondsToMmss(stint.startSec)} - ${formatSecondsToMmss(stint.endSec)} (${formatSecondsToMmss(stint.durationSec)}) [${stint.periodLabel}]`}
                        >
                          {widthPct >= 10 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white px-1 truncate select-none drop-shadow-xs">
                              {isField ? `${formatSecondsToMmss(stint.durationSec)}` : ""}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side summary totals & accordion expander */}
                <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="text-right">
                      <span className="text-[9px] text-muted block uppercase font-sans font-bold">On Field</span>
                      <span className="font-extrabold text-emerald-500">
                        {formatSecondsToMmss(item.totalFieldSec)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-muted block uppercase font-sans font-bold">Bench Rest</span>
                      <span className="font-extrabold text-slate-400">
                        {formatSecondsToMmss(item.totalBenchSec)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(item.player.id)}
                    className="p-1.5 rounded-lg bg-background hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer border border-border"
                    title={isExpanded ? "Collapse shift breakdown" : "Expand shift breakdown"}
                  >
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                </div>
              </div>

              {/* EXPANDED ACCORDION: CHRONOLOGICAL STINTS BREAKDOWN TABLE */}
              {isExpanded && (
                <div className="mt-2 border-t border-border/60 p-3 bg-background/50 space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-muted">
                    <span className="uppercase tracking-wider text-[10px]">
                      Complete Shift Timeline Breakdown ({item.stints.length} stints recorded)
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span>Avg Shift: <strong className="text-text">{formatSecondsToMmss(item.avgShiftSec)}</strong></span>
                      <span>•</span>
                      <span>Max Shift: <strong className="text-text">{formatSecondsToMmss(item.maxShiftSec)}</strong></span>
                      <span>•</span>
                      <span>Min Shift: <strong className="text-text">{formatSecondsToMmss(item.minShiftSec)}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {item.stints.map((stint) => {
                      const isField = stint.type === "field";
                      return (
                        <div
                          key={stint.id}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between text-xs gap-1.5 transition-all ${
                            isField
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-surface/80 border-border/70 text-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  isField ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                              <span>{isField ? `Shift #${stint.stintNumber}` : `Bench #${stint.stintNumber}`}</span>
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-background text-[9px] font-bold border border-border/60 text-muted">
                              {stint.periodLabel}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between pt-1">
                            <span className="font-mono text-base font-black text-text">
                              {formatSecondsToMmss(stint.durationSec)}
                            </span>
                            <span className="font-mono text-[10px] text-muted">
                              {formatSecondsToMmss(stint.startSec)} → {formatSecondsToMmss(stint.endSec)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {filteredData.length === 0 && (
          <div className="py-12 text-center text-xs text-muted bg-surface rounded-2xl border border-dashed border-border">
            No players match the current search or role filters.
          </div>
        )}
      </div>
    </div>
  );
}
