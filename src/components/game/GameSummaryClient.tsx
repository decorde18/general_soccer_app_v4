"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  BarChart2,
  Shield,
  Pencil,
  Clock,
  Search,
  Activity,
  ArrowUpDown,
  Info,
  Trash2,
  AlertTriangle,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import { apiFetch } from "@/app/api/fetcher";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";

export interface UnifiedPlayEvent {
  id: string; // unique timeline id
  rawId: string | number; // database record id
  rawType: "goal" | "penalty" | "discipline" | "sub" | "major" | "player_action" | "team";
  majorEventId?: string | number | null;
  period: number;
  gameTime: number; // raw seconds within period
  cumulativeTime: number; // total cumulative match seconds
  matchMinute: number; // cumulative match minute (0', 11', 42', etc.)
  category: "goal" | "shot" | "card" | "penalty" | "sub" | "team_event" | "stoppage" | "period_marker";
  team: "us" | "opp" | "neutral";
  teamName: string;
  title: string;
  primaryPlayer?: { id?: string | number | null; name: string; jerseyNumber?: string | number | null };
  secondaryPlayer?: { id?: string | number | null; name: string; jerseyNumber?: string | number | null };
  subInPlayer?: { id?: string | number | null; name: string; jerseyNumber?: string | number | null };
  subOutPlayer?: { id?: string | number | null; name: string; jerseyNumber?: string | number | null };
  details?: string | null;
  notes?: string | null;
  scoreSnapshot?: string;
  colorClass: string;
  rawRecord?: any;
}

export default function GameSummaryClient() {
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);
  const initializeGame = useGameStore((s) => s.initializeGame);
  const deleteEvent = useGameStore((s) => s.deleteEvent);

  const calculateTotalTimeOnField = useGamePlayerTimeStore((s) => s.calculateTotalTimeOnField);
  const calculateAllGoalkeeperTime = useGamePlayerTimeStore((s) => s.calculateAllGoalkeeperTime);

  // Tab State: "boxscore" | "playbyplay"
  const [activeTab, setActiveTab] = useState<"boxscore" | "playbyplay">("boxscore");

  // Selected Event Popup Modal State
  const [selectedEvent, setSelectedEvent] = useState<UnifiedPlayEvent | null>(null);

  // Delete Confirmation State
  const [deletingEvent, setDeletingEvent] = useState<UnifiedPlayEvent | null>(null);

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<UnifiedPlayEvent | null>(null);
  const [editPeriod, setEditPeriod] = useState<string>("1");
  const [editTimeMin, setEditTimeMin] = useState<string>("0");
  const [editTimeSec, setEditTimeSec] = useState<string>("0");
  const [editPrimaryPlayerId, setEditPrimaryPlayerId] = useState<string>("");
  const [editSecondaryPlayerId, setEditSecondaryPlayerId] = useState<string>("");
  const [editGoalType, setEditGoalType] = useState<string>("open_play");
  const [editPkOutcome, setEditPkOutcome] = useState<string>("goal");
  const [editCardType, setEditCardType] = useState<string>("yellow");
  const [editCardReason, setEditCardReason] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editIsOpponent, setEditIsOpponent] = useState<boolean>(false);

  // Play-by-Play Filter & Search State
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!game) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading game summary...
      </div>
    );
  }

  const teamSeasonId = game.teamSeasonId || (game.isHome ? game.home_team_season_id : game.away_team_season_id);
  const gameIdVal = game.id || game.game_id || "";
  const calculateMatchEndSeconds = () => {
    if (!game || !game.periods || game.periods.length === 0) return 4800;
    const regSecs = (game.settings?.periodDuration) || 2400;
    return game.periods.reduce((total, p) => {
      if (p.endTime && p.startTime) {
        return total + Math.round((p.endTime - p.startTime) / 1000);
      }
      return total + regSecs;
    }, 0);
  };
  const matchDurationSeconds = calculateMatchEndSeconds();
  const gameTimeSeconds = useGameStore.getState().getGameTime() || matchDurationSeconds;
  const gkTimesMap = calculateAllGoalkeeperTime(gameIdVal, gameTimeSeconds);

  // Aggregate team stats
  const goalsFor = game.goalsFor ?? 0;
  const goalsAgainst = game.goalsAgainst ?? 0;

  const yellowCardsCount = game.gameEventsDiscipline?.filter((d) => (d as any).card_type === "yellow").length || 0;
  const redCardsCount = game.gameEventsDiscipline?.filter((d) => (d as any).card_type === "red" || (d as any).card_type === "yellow_red").length || 0;

  // Separate Goalkeepers vs Field Players
  const goalkeepers = players.filter(
    (p) => p.gameStatus === "goalkeeper" || p.saves > 0 || (gkTimesMap[p.id] || 0) > 0 || p.goalkeeperTime > 0
  );

  const fieldPlayers = players.filter(
    (p) => calculateTotalTimeOnField(p, gameTimeSeconds) > 0 || p.gameStatus === "starter" || p.gameStatus === "dressed" || p.gameStatus === "goalkeeper"
  );

  const ourTeamSeasonId = game.teamSeasonId || (game.isHome ? game.home_team_season_id : game.away_team_season_id);
  const ourTeamName = game.ourName || "Our Team";
  const oppTeamName = game.opponentName || "Opponent";

  // Build Player Map (Map player_game_id AND player_id to player data)
  const playerMap = useMemo(() => {
    const map = new Map<string | number, { id: string | number; name: string; jersey: string | number | null }>();
    players.forEach((p) => {
      const info = { id: p.playerGameId || p.id, name: p.fullName, jersey: p.jerseyNumber || null };
      if (p.id) map.set(String(p.id), info);
      if (p.playerGameId) map.set(String(p.playerGameId), info);
    });
    return map;
  }, [players]);

  // COMPILE PLAY-BY-PLAY EVENT TIMELINE
  const playByPlayEvents = useMemo(() => {
    if (!game) return [];

    const compiled: UnifiedPlayEvent[] = [];

    // Period Duration for cumulative match time calculation (default: 40 mins = 2400s)
    const regPeriodSecs = (game.settings?.periodDuration) || 2400;

    // Helper to process DB game_time (stored as continuous seconds from kickoff)
    const computeEventTime = (period: number, dbGameTime: number) => {
      const cumSecs = Math.max(0, Number(dbGameTime || 0));
      const p = Math.max(1, period || 1);

      let precedingOffset = 0;
      for (let i = 1; i < p; i++) {
        const matchingP = (game.periods || []).find((item: any) => (item.periodNumber || item.period_number) === i);
        if (matchingP && matchingP.endTime && matchingP.startTime) {
          precedingOffset += Math.round((matchingP.endTime - matchingP.startTime) / 1000);
        } else {
          precedingOffset += regPeriodSecs;
        }
      }

      const periodRelativeTime = Math.max(0, cumSecs - precedingOffset);

      return {
        gameTime: periodRelativeTime,
        cumulativeTime: cumSecs,
        matchMinute: Math.floor(cumSecs / 60),
      };
    };

    // Calculate maximum game_time in each period to ensure Whistle/Full Time markers sit cleanly at the end
    const maxGameTimeByPeriod = new Map<number, number>();
    const trackMaxTime = (p: number, t: number) => {
      const cumSecs = Number(t || 0);
      const curr = maxGameTimeByPeriod.get(p) || 0;
      if (cumSecs > curr) maxGameTimeByPeriod.set(p, cumSecs);
    };

    (game.gameEventsMajor || []).forEach((m) => trackMaxTime(Number(m.period || 1), Number(m.game_time || 0)));
    (game.playerActions || []).forEach((pa) => trackMaxTime(Number(pa.period || 1), Number(pa.game_time || 0)));
    (game.gameSubs || []).forEach((s) => s.sub_time !== null && trackMaxTime(Number(s.period || 1), Number(s.sub_time)));
    (game.gameEventsTeam || []).forEach((te) => trackMaxTime(Number(te.period || 1), Number(te.game_time || 0)));

    // 1. Period Kickoff & End Markers
    (game.periods || []).forEach((p) => {
      const periodNum = p.periodNumber || 1;
      const periodLabel = periodNum <= (game.settings?.periodCount || 2) ? `Period ${periodNum}` : `OT ${periodNum - (game.settings?.periodCount || 2)}`;
      
      let startOffset = 0;
      for (let i = 1; i < periodNum; i++) {
        const matchingP = (game.periods || []).find((item: any) => (item.periodNumber || item.period_number) === i);
        if (matchingP && matchingP.endTime && matchingP.startTime) {
          startOffset += Math.round((matchingP.endTime - matchingP.startTime) / 1000);
        } else {
          startOffset += regPeriodSecs;
        }
      }
      const startTimes = computeEventTime(periodNum, startOffset);

      // Period Start Marker
      compiled.push({
        id: `period_start_${periodNum}`,
        rawId: p.id,
        rawType: "major",
        period: periodNum,
        gameTime: 0,
        cumulativeTime: startTimes.cumulativeTime,
        matchMinute: startTimes.matchMinute,
        category: "period_marker",
        team: "neutral",
        teamName: "Match Official",
        title: `⚽ Kickoff — ${periodLabel} Starts`,
        colorClass: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
        notes: `Official ${periodLabel} Kickoff`,
      });

      // Period End Marker (if finished)
      if (p.endTime && p.startTime) {
        const measuredSecs = Math.round((p.endTime - p.startTime) / 1000);
        const endCumSecs = startOffset + measuredSecs;
        const maxCumSecs = maxGameTimeByPeriod.get(periodNum) || 0;
        const finalEndCumSecs = Math.max(endCumSecs, maxCumSecs + 1, startOffset + regPeriodSecs);
        const endTimes = computeEventTime(periodNum, finalEndCumSecs);

        compiled.push({
          id: `period_end_${periodNum}`,
          rawId: p.id,
          rawType: "major",
          period: periodNum,
          gameTime: endTimes.gameTime,
          cumulativeTime: endTimes.cumulativeTime,
          matchMinute: endTimes.matchMinute,
          category: "period_marker",
          team: "neutral",
          teamName: "Match Official",
          title: periodNum === (game.settings?.periodCount || 2) ? "🏁 Full Time — End of Match" : `⏸️ Whistle — End of ${periodLabel}`,
          colorClass: "text-slate-600 bg-slate-500/10 border-slate-500/30",
          notes: `Official ${periodLabel} End (${formatSecondsToMmss(endTimes.gameTime)} played)`,
        });
      }
    });

    // 2. Major Events (Goals, Discipline, Penalties, Stoppages)
    (game.gameEventsMajor || []).forEach((m) => {
      const pNum = Number(m.period || 1);
      const timeInfo = computeEventTime(pNum, Number(m.game_time || 0));

      if (m.event_type === "goal") {
        const linkedGoals = (game.gameEventsGoals || []).filter(
          (g) => String((g as any).major_event_id) === String(m.id)
        );

        if (linkedGoals.length > 0) {
          linkedGoals.forEach((g: any, idx) => {
            const scorer = g.scorer_player_game_id ? playerMap.get(String(g.scorer_player_game_id)) : null;
            const assist = g.assist_player_game_id ? playerMap.get(String(g.assist_player_game_id)) : null;
            const isOur = String(g.team_season_id) === String(ourTeamSeasonId) && !g.is_own_goal;

            let methodStr = "";
            if (g.goal_types) {
              try {
                const rawGoalTypes = typeof g.goal_types === "string" ? g.goal_types : JSON.stringify(g.goal_types);
                const parsed = JSON.parse(rawGoalTypes);
                if (Array.isArray(parsed)) methodStr = parsed.map((s: string) => String(s).replace("_", " ")).join(", ");
                else methodStr = String(rawGoalTypes).replace("_", " ");
              } catch {}
            }

            compiled.push({
              id: `goal_${g.id || m.id}_${idx}`,
              rawId: g.id || g.goal_id || m.id,
              rawType: "goal",
              majorEventId: m.id,
              period: pNum,
              gameTime: timeInfo.gameTime,
              cumulativeTime: timeInfo.cumulativeTime,
              matchMinute: timeInfo.matchMinute,
              category: "goal",
              team: isOur ? "us" : "opp",
              teamName: isOur ? ourTeamName : oppTeamName,
              title: g.is_own_goal ? "⚽ OWN GOAL" : isOur ? "⚽ GOAL!" : "⚽ OPPONENT GOAL",
              primaryPlayer: scorer ? { id: g.scorer_player_game_id, name: scorer.name, jerseyNumber: scorer.jersey } : undefined,
              secondaryPlayer: assist ? { id: g.assist_player_game_id, name: assist.name, jerseyNumber: assist.jersey } : undefined,
              details: methodStr || (g.is_own_goal ? "Own Goal" : "Goal"),
              notes: m.details || (isOur ? `Goal scored for ${ourTeamName}` : `Goal scored for ${oppTeamName}`),
              colorClass: isOur
                ? "text-emerald-600 bg-emerald-500/15 border-emerald-500/40"
                : "text-rose-600 bg-rose-500/15 border-rose-500/40",
              rawRecord: g,
            });
          });
        } else {
          compiled.push({
            id: `goal_major_${m.id}`,
            rawId: m.id,
            rawType: "major",
            majorEventId: m.id,
            period: pNum,
            gameTime: timeInfo.gameTime,
            cumulativeTime: timeInfo.cumulativeTime,
            matchMinute: timeInfo.matchMinute,
            category: "goal",
            team: "us",
            teamName: ourTeamName,
            title: "⚽ GOAL!",
            details: m.details || "Goal Scored",
            notes: m.details || "Goal Kickoff Stoppage",
            colorClass: "text-emerald-600 bg-emerald-500/15 border-emerald-500/40",
            rawRecord: m,
          });
        }
      } else if (m.event_type === "penalty") {
        const linkedPens = (game.gameEventsPenalties || []).filter(
          (p) => String((p as any).major_event_id) === String(m.id)
        );

        if (linkedPens.length > 0) {
          linkedPens.forEach((p: any, idx) => {
            const shooter = p.shooter_player_game_id ? playerMap.get(String(p.shooter_player_game_id)) : null;
            const gk = p.gk_player_game_id ? playerMap.get(String(p.gk_player_game_id)) : null;
            const isOur = String(p.team_season_id) === String(ourTeamSeasonId);
            const outcomeStr = String(p.outcome || "taken").toUpperCase();

            compiled.push({
              id: `penalty_${p.id || m.id}_${idx}`,
              rawId: p.id || p.penalty_id || m.id,
              rawType: "penalty",
              majorEventId: m.id,
              period: pNum,
              gameTime: timeInfo.gameTime,
              cumulativeTime: timeInfo.cumulativeTime,
              matchMinute: timeInfo.matchMinute,
              category: "penalty",
              team: isOur ? "us" : "opp",
              teamName: isOur ? ourTeamName : oppTeamName,
              title: `🥅 Penalty Kick (${outcomeStr})`,
              primaryPlayer: shooter
                ? { id: p.shooter_player_game_id, name: shooter.name, jerseyNumber: shooter.jersey }
                : p.opponent_jersey_number
                ? { name: `Jersey #${p.opponent_jersey_number}` }
                : undefined,
              secondaryPlayer: gk ? { id: p.gk_player_game_id, name: `GK: ${gk.name}`, jerseyNumber: gk.jersey } : undefined,
              details: `Outcome: ${p.outcome || "taken"}`,
              notes: m.details || `Penalty Kick event (${outcomeStr})`,
              colorClass: "text-indigo-600 bg-indigo-500/15 border-indigo-500/40",
              rawRecord: p,
            });
          });
        } else {
          compiled.push({
            id: `penalty_major_${m.id}`,
            rawId: m.id,
            rawType: "major",
            majorEventId: m.id,
            period: pNum,
            gameTime: timeInfo.gameTime,
            cumulativeTime: timeInfo.cumulativeTime,
            matchMinute: timeInfo.matchMinute,
            category: "penalty",
            team: "us",
            teamName: ourTeamName,
            title: "🥅 Penalty Kick Event",
            details: m.details || "Penalty Kick Stoppage",
            notes: m.details || "Penalty Kick",
            colorClass: "text-indigo-600 bg-indigo-500/15 border-indigo-500/40",
            rawRecord: m,
          });
        }
      } else if (m.event_type === "card") {
        const linkedCards = (game.gameEventsDiscipline || []).filter(
          (d) => String((d as any).major_event_id) === String(m.id)
        );

        if (linkedCards.length > 0) {
          linkedCards.forEach((d: any, idx) => {
            const player = d.player_game_id ? playerMap.get(String(d.player_game_id)) : null;
            const isOur = String(d.team_season_id) === String(ourTeamSeasonId);
            const cardReasonStr = typeof d.card_reason === "string" ? d.card_reason : "";

            compiled.push({
              id: `card_${d.id || m.id}_${idx}`,
              rawId: d.id || d.discipline_id || m.id,
              rawType: "discipline",
              majorEventId: m.id,
              period: pNum,
              gameTime: timeInfo.gameTime,
              cumulativeTime: timeInfo.cumulativeTime,
              matchMinute: timeInfo.matchMinute,
              category: "card",
              team: isOur ? "us" : "opp",
              teamName: isOur ? ourTeamName : oppTeamName,
              title: d.card_type === "yellow" ? "🟨 Yellow Card" : "🟥 Red Card",
              primaryPlayer: player
                ? { id: d.player_game_id, name: player.name, jerseyNumber: player.jersey }
                : d.opponent_jersey_number
                ? { name: `Jersey #${d.opponent_jersey_number}` }
                : undefined,
              details: cardReasonStr || (d.card_type === "yellow" ? "Yellow Card Issued" : "Red Card Ejection"),
              notes: m.details || cardReasonStr || "Disciplinary Action",
              colorClass: d.card_type === "yellow" ? "text-amber-600 bg-amber-500/15 border-amber-500/40" : "text-rose-600 bg-rose-500/15 border-rose-500/40",
              rawRecord: d,
            });
          });
        }
      } else if (["stoppage", "injury", "hydration", "weather", "var"].includes(m.event_type)) {
        compiled.push({
          id: `stoppage_${m.id}`,
          rawId: m.id,
          rawType: "major",
          majorEventId: m.id,
          period: pNum,
          gameTime: timeInfo.gameTime,
          cumulativeTime: timeInfo.cumulativeTime,
          matchMinute: timeInfo.matchMinute,
          category: "stoppage",
          team: "neutral",
          teamName: "Stoppage",
          title: `🛑 ${m.details || "Match Stoppage"}`,
          details: `Stoppage at game minute ${timeInfo.matchMinute}'`,
          notes: m.details || "Clock paused for referee stoppage",
          colorClass: "text-slate-600 bg-slate-500/10 border-slate-500/30",
          rawRecord: m,
        });
      }
    });

    // 3. Player Actions (Shots on Goal)
    (game.playerActions || []).forEach((pa: any) => {
      const pNum = Number(pa.period || 1);
      const timeInfo = computeEventTime(pNum, Number(pa.game_time || 0));

      const matchesGoal = compiled.some(
        (e) => e.category === "goal" && Math.abs(e.cumulativeTime - timeInfo.cumulativeTime) <= 2
      );

      if (!matchesGoal) {
        const player = playerMap.get(String(pa.player_game_id));
        compiled.push({
          id: `action_${pa.id}`,
          rawId: pa.id,
          rawType: "player_action",
          period: pNum,
          gameTime: timeInfo.gameTime,
          cumulativeTime: timeInfo.cumulativeTime,
          matchMinute: timeInfo.matchMinute,
          category: "shot",
          team: "us",
          teamName: ourTeamName,
          title: pa.event_type === "save" ? "🧤 Goalkeeper Save" : "🎯 Shot on Goal",
          primaryPlayer: player ? { id: pa.player_game_id, name: player.name, jerseyNumber: player.jersey } : undefined,
          details: pa.event_type === "save" ? "Save recorded" : "Shot taken",
          notes: `Action recorded at game minute ${timeInfo.matchMinute}'`,
          colorClass: "text-cyan-600 bg-cyan-500/10 border-cyan-500/30",
          rawRecord: pa,
        });
      }
    });

    // 4. Substitutions
    (game.gameSubs || []).forEach((s) => {
      if (s.sub_time !== null && s.sub_time !== undefined) {
        const pNum = Number(s.period || 1);
        const timeInfo = computeEventTime(pNum, Number(s.sub_time));

        const pIn = s.in_player_id ? playerMap.get(String(s.in_player_id)) : null;
        const pOut = s.out_player_id ? playerMap.get(String(s.out_player_id)) : null;

        compiled.push({
          id: `sub_${s.id}`,
          rawId: s.id,
          rawType: "sub",
          period: pNum,
          gameTime: timeInfo.gameTime,
          cumulativeTime: timeInfo.cumulativeTime,
          matchMinute: timeInfo.matchMinute,
          category: "sub",
          team: "us",
          teamName: ourTeamName,
          title: "🔄 Substitution",
          subInPlayer: pIn ? { id: s.in_player_id, name: pIn.name, jerseyNumber: pIn.jersey } : undefined,
          subOutPlayer: pOut ? { id: s.out_player_id, name: pOut.name, jerseyNumber: pOut.jersey } : undefined,
          details: `Substitution at game minute ${timeInfo.matchMinute}'`,
          notes: `Tactical substitution executed at game minute ${timeInfo.matchMinute}'`,
          colorClass: "text-blue-600 bg-blue-500/10 border-blue-500/30",
          rawRecord: s,
        });
      }
    });

    // 5. Team Events (Corners, Fouls, Offsides)
    (game.gameEventsTeam || []).forEach((te) => {
      const pNum = Number(te.period || 1);
      const timeInfo = computeEventTime(pNum, Number(te.game_time || 0));

      const isOur = String(te.team_season_id) === String(ourTeamSeasonId);
      const titleMap: Record<string, string> = {
        corner: "🚩 Corner Kick",
        foul: "⚠️ Foul Committed",
        offside: "🚩 Offside Call",
        throw_in: "🤾 Throw-In",
        goal_kick: "⚽ Goal Kick",
        free_kick: "🎯 Free Kick",
      };

      compiled.push({
        id: `team_event_${te.id}`,
        rawId: te.id,
        rawType: "team",
        period: pNum,
        gameTime: timeInfo.gameTime,
        cumulativeTime: timeInfo.cumulativeTime,
        matchMinute: timeInfo.matchMinute,
        category: "team_event",
        team: isOur ? "us" : "opp",
        teamName: isOur ? ourTeamName : oppTeamName,
        title: titleMap[te.event_type] || `Team Event (${te.event_type})`,
        details: isOur ? ourTeamName : oppTeamName,
        notes: `Team action for ${isOur ? ourTeamName : oppTeamName}`,
        colorClass: "text-amber-600 bg-amber-500/10 border-amber-500/30",
        rawRecord: te,
      });
    });

    // SORT STRICTLY BY CUMULATIVE MATCH TIME CHRONOLOGICALLY (0' → 80')
    compiled.sort((a, b) => {
      if (a.cumulativeTime !== b.cumulativeTime) return a.cumulativeTime - b.cumulativeTime;
      return a.id.localeCompare(b.id);
    });

    // COMPUTE RUNNING SCORE SNAPSHOT FOR GOALS
    let runningOurGoals = 0;
    let runningOppGoals = 0;

    compiled.forEach((e) => {
      if (e.category === "goal") {
        if (e.team === "us") runningOurGoals++;
        else runningOppGoals++;
        e.scoreSnapshot = `${runningOurGoals} - ${runningOppGoals}`;
      }
    });

    return compiled;
  }, [game, playerMap, ourTeamSeasonId, ourTeamName, oppTeamName]);

  // FILTERED & SORTED PLAY-BY-PLAY EVENTS
  const filteredPlayByPlay = useMemo(() => {
    let result = [...playByPlayEvents];

    // Period Filter
    if (periodFilter !== "all") {
      result = result.filter((e) => String(e.period) === periodFilter);
    }

    // Category Filter
    if (categoryFilter !== "all") {
      result = result.filter((e) => e.category === categoryFilter);
    }

    // Team Filter
    if (teamFilter !== "all") {
      result = result.filter((e) => e.team === teamFilter || e.team === "neutral");
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.details && e.details.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          (e.primaryPlayer && e.primaryPlayer.name.toLowerCase().includes(q)) ||
          (e.secondaryPlayer && e.secondaryPlayer.name.toLowerCase().includes(q)) ||
          (e.subInPlayer && e.subInPlayer.name.toLowerCase().includes(q)) ||
          (e.subOutPlayer && e.subOutPlayer.name.toLowerCase().includes(q)) ||
          e.teamName.toLowerCase().includes(q)
      );
    }

    // Sort Order Toggle
    if (sortOrder === "desc") {
      result.reverse();
    }

    return result;
  }, [playByPlayEvents, periodFilter, categoryFilter, teamFilter, sortOrder, searchQuery]);

  // DELETE EVENT HANDLER
  const handleDeleteEvent = async (event: UnifiedPlayEvent) => {
    try {
      await deleteEvent(event.rawId, event.rawType);
      await initializeGame(String(gameIdVal), String(teamSeasonId || ""));
      toast.success(`Deleted ${event.title} successfully.`);
      setDeletingEvent(null);
      setSelectedEvent(null);
    } catch (err: any) {
      toast.error("Failed to delete event: " + err.message);
    }
  };

  // OPEN EDIT MODAL & PRE-POPULATE FIELDS
  const openEditModal = (event: UnifiedPlayEvent) => {
    setEditingEvent(event);
    setEditPeriod(String(event.period || 1));

    const totalSec = event.gameTime || 0;
    setEditTimeMin(String(Math.floor(totalSec / 60)));
    setEditTimeSec(String(totalSec % 60));

    setEditPrimaryPlayerId(event.primaryPlayer?.id ? String(event.primaryPlayer.id) : event.subInPlayer?.id ? String(event.subInPlayer.id) : "");
    setEditSecondaryPlayerId(event.secondaryPlayer?.id ? String(event.secondaryPlayer.id) : event.subOutPlayer?.id ? String(event.subOutPlayer.id) : "");
    setEditNotes(event.notes || event.details || "");
    setEditIsOpponent(event.team === "opp");

    if (event.category === "goal" && event.rawRecord) {
      setEditGoalType(event.rawRecord.goal_types ? String(event.rawRecord.goal_types) : "open_play");
    } else if (event.category === "penalty" && event.rawRecord) {
      setEditPkOutcome(event.rawRecord.outcome || "goal");
    } else if (event.category === "card" && event.rawRecord) {
      setEditCardType(event.rawRecord.card_type || "yellow");
      setEditCardReason(event.rawRecord.card_reason || "");
    }
  };

  // SAVE EDIT EVENT HANDLER
  const handleSaveEditEvent = async () => {
    if (!editingEvent) return;

    try {
      const totalSeconds = Number(editTimeMin) * 60 + Number(editTimeSec);
      const periodNum = Number(editPeriod);

      if (editingEvent.category === "goal" && editingEvent.rawType === "goal") {
        const goalPayload = {
          team_season_id: editIsOpponent ? Number(game.opponentId) : Number(teamSeasonId),
          scorer_player_game_id: editPrimaryPlayerId ? Number(editPrimaryPlayerId) : null,
          assist_player_game_id: editSecondaryPlayerId ? Number(editSecondaryPlayerId) : null,
          goal_types: editGoalType,
        };
        await apiFetch("game_events_goals", "PUT", goalPayload, editingEvent.rawId);

        if (editingEvent.majorEventId) {
          await apiFetch("game_events_major", "PUT", {
            period: periodNum,
            game_time: totalSeconds,
            details: editNotes || undefined,
          }, editingEvent.majorEventId);
        }
      } else if (editingEvent.category === "penalty" && editingEvent.rawType === "penalty") {
        const penPayload = {
          shooter_player_game_id: editPrimaryPlayerId ? Number(editPrimaryPlayerId) : null,
          outcome: editPkOutcome,
        };
        await apiFetch("game_events_penalties", "PUT", penPayload, editingEvent.rawId);

        if (editingEvent.majorEventId) {
          await apiFetch("game_events_major", "PUT", {
            period: periodNum,
            game_time: totalSeconds,
            details: editNotes || `Penalty Kick (${editPkOutcome.toUpperCase()})`,
          }, editingEvent.majorEventId);
        }
      } else if (editingEvent.category === "card" && editingEvent.rawType === "discipline") {
        const cardPayload = {
          player_game_id: editPrimaryPlayerId ? Number(editPrimaryPlayerId) : null,
          card_type: editCardType,
          card_reason: editCardReason || null,
        };
        await apiFetch("game_events_discipline", "PUT", cardPayload, editingEvent.rawId);

        if (editingEvent.majorEventId) {
          await apiFetch("game_events_major", "PUT", {
            period: periodNum,
            game_time: totalSeconds,
            details: editCardReason || `${editCardType.toUpperCase()} Card`,
          }, editingEvent.majorEventId);
        }
      } else if (editingEvent.category === "sub" && editingEvent.rawType === "sub") {
        const subPayload = {
          in_player_id: editPrimaryPlayerId ? Number(editPrimaryPlayerId) : null,
          out_player_id: editSecondaryPlayerId ? Number(editSecondaryPlayerId) : null,
          period: periodNum,
          sub_time: totalSeconds,
        };
        await apiFetch("game_subs", "PUT", subPayload, editingEvent.rawId);
      } else if (editingEvent.rawType === "major") {
        await apiFetch("game_events_major", "PUT", {
          period: periodNum,
          game_time: totalSeconds,
          details: editNotes || undefined,
        }, editingEvent.rawId);
      } else if (editingEvent.category === "shot" && editingEvent.rawType === "player_action") {
        await apiFetch("player_actions", "PUT", {
          period: periodNum,
          game_time: totalSeconds,
          player_game_id: editPrimaryPlayerId ? Number(editPrimaryPlayerId) : null,
        }, editingEvent.rawId);
      } else if (editingEvent.category === "team_event" && editingEvent.rawType === "team") {
        await apiFetch("game_events_team", "PUT", {
          period: periodNum,
          game_time: totalSeconds,
        }, editingEvent.rawId);
      }

      await initializeGame(String(gameIdVal), String(teamSeasonId || ""));
      toast.success("Match event updated successfully.");
      setEditingEvent(null);
      setSelectedEvent(null);
    } catch (err: any) {
      toast.error("Failed to update event: " + err.message);
    }
  };

  const playerSelectOptions = players.map((p) => ({
    value: String(p.playerGameId || p.id),
    label: `#${p.jerseyNumber || "?"} ${p.fullName}`,
  }));

  const periodSelectOptions = (game.periods || []).map((p) => ({
    value: String(p.periodNumber),
    label: `Period ${p.periodNumber}`,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* HOME TEAM */}
          <div className="flex items-center gap-4 text-left">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-extrabold text-primary text-xl">
              ⚽
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Home</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text">{game.ourName}</h2>
            </div>
          </div>

          {/* FINAL SCORE */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-widest border border-primary/20">
              Final Match Result
            </span>
            <div className="flex items-center gap-4 font-mono font-black text-5xl sm:text-6xl text-text tracking-tighter">
              <span>{goalsFor}</span>
              <span className="text-muted/40">:</span>
              <span>{goalsAgainst}</span>
            </div>

            {Boolean(game.id || game.game_id) && Boolean(game.teamSeasonId || game.home_team_season_id) && (
              <Link
                href={`/gamestats/${game.teamSeasonId || game.home_team_season_id}/${game.id || game.game_id}/manage`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-all mt-1 cursor-pointer"
                title="Edit match clocks, substitutions, goals, and disciplinary logs"
              >
                <Pencil size={13} />
                <span>Edit Match Details & Clocks</span>
              </Link>
            )}
          </div>

          {/* AWAY TEAM */}
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
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("boxscore")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              activeTab === "boxscore"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface text-muted hover:text-text hover:bg-background/80"
            }`}
          >
            <BarChart2 size={15} />
            <span>Match Overview & Box Score</span>
          </button>

          <button
            onClick={() => setActiveTab("playbyplay")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              activeTab === "playbyplay"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface text-muted hover:text-text hover:bg-background/80"
            }`}
          >
            <Clock size={15} />
            <span>Detailed Play-by-Play</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === "playbyplay" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
            }`}>
              {playByPlayEvents.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: BOX SCORE VIEW */}
      {activeTab === "boxscore" && (
        <div className="space-y-8 animate-fadeIn">
          {/* TEAM STAT COMPARISON TABLE */}
          <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/70 pb-3">
              <BarChart2 size={16} className="text-primary" />
              <h3 className="font-extrabold text-sm text-text uppercase tracking-wider">
                Match Statistical Breakdown
              </h3>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              {/* Goals */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-background/50">
                <span className="font-mono font-black text-primary text-base">{goalsFor}</span>
                <span className="text-muted text-[11px] font-bold uppercase">Goals Scored</span>
                <span className="font-mono font-black text-accent text-base">{goalsAgainst}</span>
              </div>

              {/* Yellow Cards */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-background/50">
                <span className="font-mono font-bold text-text">{yellowCardsCount}</span>
                <span className="text-muted text-[11px] font-bold uppercase">Yellow Cards</span>
                <span className="font-mono font-bold text-text">0</span>
              </div>

              {/* Red Cards */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-background/50">
                <span className="font-mono font-bold text-text">{redCardsCount}</span>
                <span className="text-muted text-[11px] font-bold uppercase">Red Cards</span>
                <span className="font-mono font-bold text-text">0</span>
              </div>
            </div>
          </Card>

          {/* FIELD PLAYERS BOX SCORE TABLE */}
          <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/70 pb-3">
              <Users size={16} className="text-primary" />
              <h3 className="font-extrabold text-sm text-text uppercase tracking-wider">
                Field Players Box Score
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-background/60 text-[10px] font-bold uppercase text-muted">
                    <th className="p-3">#</th>
                    <th className="p-3">Player Name</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">MIN</th>
                    <th className="p-3 text-center">+/-</th>
                    <th className="p-3 text-center">Goals</th>
                    <th className="p-3 text-center">Assists</th>
                    <th className="p-3 text-center">Shots</th>
                    <th className="p-3 text-center">Cards</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldPlayers.map((p) => {
                    const totalSec = calculateTotalTimeOnField(p, gameTimeSeconds);
                    const plusMinusStr = p.plusMinus > 0 ? `+${p.plusMinus}` : String(p.plusMinus || 0);

                    return (
                      <tr key={p.id} className="border-b border-border/40 hover:bg-background/25">
                        <td className="p-3 font-mono font-bold text-primary">#{p.jerseyNumber || "?"}</td>
                        <td className="p-3 font-bold text-text">{p.fullName}</td>
                        <td className="p-3 text-center capitalize text-muted text-[10px] font-bold">
                          {p.gameStatus}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-text">
                          {formatSecondsToMmss(totalSec)}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-600">
                          {plusMinusStr}
                        </td>
                        <td className="p-3 text-center font-bold text-text">{p.goals || 0}</td>
                        <td className="p-3 text-center font-bold text-text">{p.assists || 0}</td>
                        <td className="p-3 text-center font-bold text-muted">{p.shots || 0}</td>
                        <td className="p-3 text-center font-bold text-text">
                          {p.yellowCards > 0 && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 rounded mr-1">Y</span>}
                          {p.redCards > 0 && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-600 rounded">R</span>}
                          {!p.yellowCards && !p.redCards && "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* GOALKEEPERS BOX SCORE TABLE */}
          {goalkeepers.length > 0 && (
            <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs">
              <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                <Shield size={16} className="text-emerald-600" />
                <h3 className="font-extrabold text-sm text-text uppercase tracking-wider">
                  Goalkeepers Box Score
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-background/60 text-[10px] font-bold uppercase text-muted">
                      <th className="p-3">#</th>
                      <th className="p-3">Keeper Name</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Total MIN</th>
                      <th className="p-3 text-right">MIN in Goal</th>
                      <th className="p-3 text-center">Saves</th>
                      <th className="p-3 text-center">GA</th>
                      <th className="p-3 text-center">Clean Sheet</th>
                      <th className="p-3 text-center">Cards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalkeepers.map((p) => {
                      const totalSec = calculateTotalTimeOnField(p, gameTimeSeconds);
                      const gkSec = gkTimesMap[p.id] || p.goalkeeperTime || 0;

                      return (
                        <tr key={p.id} className="border-b border-border/40 hover:bg-background/25">
                          <td className="p-3 font-mono font-bold text-emerald-600">#{p.jerseyNumber || "?"}</td>
                          <td className="p-3 font-bold text-text">{p.fullName}</td>
                          <td className="p-3 text-center capitalize text-muted text-[10px] font-bold">
                            {p.gameStatus}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-text">
                            {formatSecondsToMmss(totalSec)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            {formatSecondsToMmss(gkSec)}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600">{p.saves || 0}</td>
                          <td className="p-3 text-center font-mono font-bold text-rose-500">{p.goalsAgainst || 0}</td>
                          <td className="p-3 text-center font-bold text-text">{p.cleanSheet ? "Yes" : "No"}</td>
                          <td className="p-3 text-center font-bold text-text">
                            {p.yellowCards > 0 && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 rounded mr-1">Y</span>}
                            {p.redCards > 0 && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-600 rounded">R</span>}
                            {!p.yellowCards && !p.redCards && "--"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: DETAILED PLAY-BY-PLAY VIEW */}
      {activeTab === "playbyplay" && (
        <div className="space-y-6 animate-fadeIn">
          {/* SEARCH & FILTER CONTROLS BAR */}
          <Card variant="outlined" padding="md" className="bg-surface space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search player, event, details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border text-text placeholder:text-muted/60 focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs font-semibold">
                {/* Period Filter */}
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-background border border-border text-text text-xs font-bold focus:outline-hidden focus:border-primary cursor-pointer"
                >
                  <option value="all">All Periods</option>
                  <option value="1">1st Half</option>
                  <option value="2">2nd Half</option>
                  <option value="3">OT 1</option>
                  <option value="4">OT 2</option>
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-background border border-border text-text text-xs font-bold focus:outline-hidden focus:border-primary cursor-pointer"
                >
                  <option value="all">All Event Types</option>
                  <option value="goal">Goals ⚽</option>
                  <option value="shot">Shots 🎯</option>
                  <option value="card">Cards 🟨🟥</option>
                  <option value="sub">Substitutions 🔄</option>
                  <option value="team_event">Corners & Fouls 🚩</option>
                  <option value="stoppage">Stoppages 🛑</option>
                </select>

                {/* Team Filter */}
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-background border border-border text-text text-xs font-bold focus:outline-hidden focus:border-primary cursor-pointer"
                >
                  <option value="all">All Teams</option>
                  <option value="us">{ourTeamName}</option>
                  <option value="opp">{oppTeamName}</option>
                </select>

                {/* Sort Order Toggle */}
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-text text-xs font-bold hover:bg-surface transition-all cursor-pointer"
                  title="Toggle Chronological / Reverse order"
                >
                  <ArrowUpDown size={13} className="text-primary" />
                  <span>{sortOrder === "asc" ? "0' → 80'" : "80' → 0'"}</span>
                </button>
              </div>
            </div>
          </Card>

          {/* PLAY-BY-PLAY EVENT FEED */}
          {filteredPlayByPlay.length === 0 ? (
            <Card variant="outlined" padding="lg" className="text-center py-12 bg-surface">
              <Activity className="mx-auto h-8 w-8 text-muted/50 mb-2" />
              <p className="text-xs font-bold text-muted">No match events match the current filter selection.</p>
            </Card>
          ) : (
            <div className="relative space-y-3">
              {/* Timeline Connector Line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border/60 z-0 hidden sm:block" />

              {filteredPlayByPlay.map((item) => {
                const isPeriodMarker = item.category === "period_marker";

                return (
                  <div
                    key={item.id}
                    className={`relative z-10 rounded-2xl border p-4 transition-all bg-surface hover:border-primary/60 shadow-2xs hover:shadow-md ${
                      item.category === "goal"
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : isPeriodMarker
                        ? "border-border/80 bg-background/80"
                        : "border-border/70"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Time & Event Details */}
                      <div
                        onClick={() => setSelectedEvent(item)}
                        className="flex items-start sm:items-center gap-3 cursor-pointer flex-1"
                      >
                        {/* Time Badge (Cumulative Match Minute) */}
                        <div className="shrink-0 flex flex-col items-center justify-center h-11 w-11 rounded-xl bg-background border border-border/80 text-center shadow-2xs">
                          <span className="text-[9px] font-extrabold uppercase text-muted leading-tight">
                            MIN
                          </span>
                          <span className="font-mono font-black text-xs text-text leading-tight">
                            {item.matchMinute}'
                          </span>
                        </div>

                        {/* Title & Player Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-black tracking-wide border ${item.colorClass}`}>
                              {item.title}
                            </span>

                            {item.teamName && !isPeriodMarker && item.category !== "stoppage" && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-0.5 rounded-md bg-background border border-border/60">
                                {item.teamName}
                              </span>
                            )}

                            {item.scoreSnapshot && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-mono font-black tracking-widest shadow-2xs">
                                SCORE: {item.scoreSnapshot}
                              </span>
                            )}
                          </div>

                          {/* GOALS: Scorer & Assist Badges */}
                          {item.category === "goal" && (
                            <div className="flex items-center gap-2 text-xs font-bold text-text pt-0.5 flex-wrap">
                              {item.primaryPlayer && (
                                <span className="flex items-center gap-1">
                                  <span className="text-muted text-[11px] font-extrabold">Scorer:</span>
                                  {item.primaryPlayer.jerseyNumber && (
                                    <span className="font-mono text-primary font-black">#{item.primaryPlayer.jerseyNumber}</span>
                                  )}
                                  <span>{item.primaryPlayer.name}</span>
                                </span>
                              )}

                              {item.secondaryPlayer && (
                                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-md text-[11px] border border-emerald-500/30 font-extrabold">
                                  <span>Assist:</span>
                                  {item.secondaryPlayer.jerseyNumber && (
                                    <span className="font-mono">#{item.secondaryPlayer.jerseyNumber}</span>
                                  )}
                                  <span>{item.secondaryPlayer.name}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* SUBSTITUTIONS: IN & OUT Badges */}
                          {item.category === "sub" && (
                            <div className="flex items-center gap-2 text-xs font-bold text-text pt-0.5 flex-wrap">
                              {item.subInPlayer && (
                                <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-md text-[11px] border border-blue-500/30 font-extrabold">
                                  <span className="text-blue-600 font-black">IN:</span>
                                  {item.subInPlayer.jerseyNumber && (
                                    <span className="font-mono">#{item.subInPlayer.jerseyNumber}</span>
                                  )}
                                  <span>{item.subInPlayer.name}</span>
                                </span>
                              )}

                              {item.subOutPlayer && (
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-500/15 px-2.5 py-0.5 rounded-md text-[11px] border border-slate-500/30 font-extrabold">
                                  <span className="text-slate-500 font-black">OUT:</span>
                                  {item.subOutPlayer.jerseyNumber && (
                                    <span className="font-mono">#{item.subOutPlayer.jerseyNumber}</span>
                                  )}
                                  <span>{item.subOutPlayer.name}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* OTHER EVENTS: Primary Player */}
                          {item.category !== "goal" && item.category !== "sub" && item.primaryPlayer && (
                            <div className="flex items-center gap-2 text-xs font-bold text-text pt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                {item.primaryPlayer.jerseyNumber && (
                                  <span className="font-mono text-primary font-black">#{item.primaryPlayer.jerseyNumber}</span>
                                )}
                                <span>{item.primaryPlayer.name}</span>
                              </span>

                              {item.secondaryPlayer && (
                                <span className="text-muted text-[11px] font-semibold">
                                  ({item.secondaryPlayer.name})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Additional Event Details */}
                          {item.details && item.category !== "sub" && (
                            <p className="text-[11px] text-muted font-medium pt-0.5">{item.details}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions Bar & Time (PROMINENT HIGH-CONTRAST PILL BUTTONS) */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted/80 font-bold mr-1">
                          {formatSecondsToMmss(item.gameTime)} (P{item.period})
                        </span>

                        {!isPeriodMarker && (
                          <>
                            {/* EDIT BUTTON */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(item);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="Edit Event Details"
                            >
                              <Pencil size={13} />
                              <span>Edit</span>
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingEvent(item);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 hover:bg-rose-600 hover:text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="Delete Event"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </>
                        )}

                        {/* DETAILS/INFO BUTTON */}
                        <button
                          onClick={() => setSelectedEvent(item)}
                          className="px-2.5 py-1 rounded-xl bg-slate-500/10 border border-slate-500/30 text-text hover:bg-slate-700 hover:text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="View Full Notes & Info"
                        >
                          <Info size={13} />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENT DETAILS POPUP MODAL */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Event Details & Notes"
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-6 py-2">
            {/* Header Event Badge & Time */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border/80">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-sm font-black border ${selectedEvent.colorClass}`}>
                  {selectedEvent.title}
                </span>
                <span className="text-xs font-extrabold text-muted">
                  Game Minute {selectedEvent.matchMinute}' (Period {selectedEvent.period} @ {formatSecondsToMmss(selectedEvent.gameTime)})
                </span>
              </div>

              {selectedEvent.scoreSnapshot && (
                <div className="px-3 py-1 rounded-full bg-emerald-500 text-white font-mono font-black text-xs tracking-widest shadow-2xs">
                  {selectedEvent.scoreSnapshot}
                </div>
              )}
            </div>

            {/* Action Bar inside Popup Modal */}
            {selectedEvent.category !== "period_marker" && (
              <div className="flex items-center justify-end gap-2.5 border-b border-border/70 pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(selectedEvent)}
                  className="flex items-center gap-1.5 text-xs font-bold"
                >
                  <Pencil size={13} />
                  <span>Edit Event</span>
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeletingEvent(selectedEvent)}
                  className="flex items-center gap-1.5 text-xs font-bold"
                >
                  <Trash2 size={13} />
                  <span>Delete Event</span>
                </Button>
              </div>
            )}

            {/* Event Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Team Context */}
              <div className="p-3.5 rounded-xl bg-surface border border-border/70 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Team</span>
                <p className="font-extrabold text-text text-sm">{selectedEvent.teamName}</p>
              </div>

              {/* Event Category */}
              <div className="p-3.5 rounded-xl bg-surface border border-border/70 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Category</span>
                <p className="font-extrabold text-text text-sm capitalize">{selectedEvent.category.replace("_", " ")}</p>
              </div>

              {/* GOAL SCORER */}
              {selectedEvent.category === "goal" && selectedEvent.primaryPlayer && (
                <div className="p-3.5 rounded-xl bg-surface border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Goal Scorer</span>
                  <p className="font-extrabold text-text text-sm flex items-center gap-1.5">
                    {selectedEvent.primaryPlayer.jerseyNumber && (
                      <span className="text-primary font-mono">#{selectedEvent.primaryPlayer.jerseyNumber}</span>
                    )}
                    <span>{selectedEvent.primaryPlayer.name}</span>
                  </p>
                </div>
              )}

              {/* GOAL ASSISTER */}
              {selectedEvent.category === "goal" && selectedEvent.secondaryPlayer && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Assister</span>
                  <p className="font-extrabold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                    {selectedEvent.secondaryPlayer.jerseyNumber && (
                      <span className="font-mono">#{selectedEvent.secondaryPlayer.jerseyNumber}</span>
                    )}
                    <span>{selectedEvent.secondaryPlayer.name}</span>
                  </p>
                </div>
              )}

              {/* SUB IN PLAYER */}
              {selectedEvent.category === "sub" && selectedEvent.subInPlayer && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Player Subbing IN</span>
                  <p className="font-extrabold text-blue-800 dark:text-blue-300 text-sm flex items-center gap-1.5">
                    {selectedEvent.subInPlayer.jerseyNumber && (
                      <span className="font-mono">#{selectedEvent.subInPlayer.jerseyNumber}</span>
                    )}
                    <span>{selectedEvent.subInPlayer.name}</span>
                  </p>
                </div>
              )}

              {/* SUB OUT PLAYER */}
              {selectedEvent.category === "sub" && selectedEvent.subOutPlayer && (
                <div className="p-3.5 rounded-xl bg-slate-500/10 border border-slate-500/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Player Subbing OUT</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-300 text-sm flex items-center gap-1.5">
                    {selectedEvent.subOutPlayer.jerseyNumber && (
                      <span className="font-mono">#{selectedEvent.subOutPlayer.jerseyNumber}</span>
                    )}
                    <span>{selectedEvent.subOutPlayer.name}</span>
                  </p>
                </div>
              )}

              {/* OTHER PRIMARY PLAYER */}
              {selectedEvent.category !== "goal" && selectedEvent.category !== "sub" && selectedEvent.primaryPlayer && (
                <div className="p-3.5 rounded-xl bg-surface border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Primary Player</span>
                  <p className="font-extrabold text-text text-sm flex items-center gap-1.5">
                    {selectedEvent.primaryPlayer.jerseyNumber && (
                      <span className="text-primary font-mono">#{selectedEvent.primaryPlayer.jerseyNumber}</span>
                    )}
                    <span>{selectedEvent.primaryPlayer.name}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Notes & Details Section */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                Event Notes & Match Details
              </span>
              <div className="p-4 rounded-xl bg-background border border-border/80 text-xs font-semibold text-text leading-relaxed">
                {selectedEvent.notes || selectedEvent.details || "No additional notes recorded for this match event."}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE EVENT CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deletingEvent)}
        onClose={() => setDeletingEvent(null)}
        title="Delete Match Event"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingEvent(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deletingEvent && handleDeleteEvent(deletingEvent)}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        {deletingEvent && (
          <div className="space-y-3 py-2 text-xs">
            <div className="flex items-center gap-3 text-rose-600 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="font-bold">
                Are you sure you want to delete this event? This will update team scores and player statistics immediately.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-background border border-border/80 font-bold text-text space-y-1">
              <p className="text-sm">{deletingEvent.title}</p>
              <p className="text-muted text-[11px]">
                Game Minute {deletingEvent.matchMinute}' (Period {deletingEvent.period})
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT EVENT MODAL */}
      <Modal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        title={`Edit ${editingEvent?.title || "Match Event"}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingEvent(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEditEvent} className="flex items-center gap-1.5">
              <Save size={13} />
              <span>Save Changes</span>
            </Button>
          </div>
        }
      >
        {editingEvent && (
          <div className="space-y-4 py-2 text-xs font-semibold">
            {/* Period & Time Controls */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Period</label>
                <select
                  value={editPeriod}
                  onChange={(e) => setEditPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                >
                  {periodSelectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Min in Period</label>
                <input
                  type="number"
                  min="0"
                  value={editTimeMin}
                  onChange={(e) => setEditTimeMin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Sec in Period</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editTimeSec}
                  onChange={(e) => setEditTimeSec(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                />
              </div>
            </div>

            {/* GOAL SPECIFIC FIELDS */}
            {editingEvent.category === "goal" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Goal Scorer</label>
                  <select
                    value={editPrimaryPlayerId}
                    onChange={(e) => setEditPrimaryPlayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                  >
                    <option value="">-- Select Goal Scorer --</option>
                    {playerSelectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Assister (Optional)</label>
                  <select
                    value={editSecondaryPlayerId}
                    onChange={(e) => setEditSecondaryPlayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                  >
                    <option value="">-- Unassisted / None --</option>
                    {playerSelectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* PENALTY KICK SPECIFIC FIELDS */}
            {editingEvent.category === "penalty" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">PK Shooter</label>
                  <select
                    value={editPrimaryPlayerId}
                    onChange={(e) => setEditPrimaryPlayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                  >
                    <option value="">-- Select PK Shooter --</option>
                    {playerSelectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Penalty Outcome</label>
                  <select
                    value={editPkOutcome}
                    onChange={(e) => setEditPkOutcome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold cursor-pointer"
                  >
                    <option value="goal">Goal Scored ⚽</option>
                    <option value="saved">Saved by Keeper 🧤</option>
                    <option value="missed">Missed / Off Target ❌</option>
                    <option value="hit_post">Hit Post 🥅</option>
                  </select>
                </div>
              </>
            )}

            {/* SUBSTITUTION SPECIFIC FIELDS */}
            {editingEvent.category === "sub" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Player Subbing IN</label>
                  <select
                    value={editPrimaryPlayerId}
                    onChange={(e) => setEditPrimaryPlayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                  >
                    <option value="">-- Select Player IN --</option>
                    {playerSelectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Player Subbing OUT</label>
                  <select
                    value={editSecondaryPlayerId}
                    onChange={(e) => setEditSecondaryPlayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                  >
                    <option value="">-- Select Player OUT --</option>
                    {playerSelectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* CARD SPECIFIC FIELDS */}
            {editingEvent.category === "card" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Carded Player</label>
                  <select
                    value={editPrimaryPlayerId}
                    onChange={(e) => setEditPrimaryPlayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                  >
                    <option value="">-- Select Carded Player --</option>
                    {playerSelectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Card Type</label>
                  <select
                    value={editCardType}
                    onChange={(e) => setEditCardType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
                  >
                    <option value="yellow">Yellow Card 🟨</option>
                    <option value="red">Red Card 🟥</option>
                  </select>
                </div>
              </>
            )}

            {/* Event Notes / Stoppage Details */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-muted mb-1">Event Notes & Details</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Stoppage notes, referee comments, details..."
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-text font-bold"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
