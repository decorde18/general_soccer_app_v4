import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore, { Player } from "./gamePlayersStore";
import {
  calculateActivePlayerTimeOnField,
  calculateActivePlayerTimeOffField,
  calculateRecentPlayerTimeOffField,
  calculateRecentPlayerTimeOnField,
} from "@/lib/utils/dateTimeUtils";

/* ==================== HELPERS ==================== */

const normalizeSubs = (subs: any[]): any[] =>
  (subs || [])
    .filter((sub) => (sub.gameTime !== null && sub.gameTime !== undefined) || (sub.sub_time !== null && sub.sub_time !== undefined))
    .filter((sub) => !sub.isSwap && !sub.is_swap && sub.is_swap !== 1)
    .sort((a, b) => Number(a.gameTime ?? a.sub_time ?? 0) - Number(b.gameTime ?? b.sub_time ?? 0));

/**
 * Determine if a player is currently on the field
 */
const isPlayerOnFieldNow = (player: Player) => {
  const ins = normalizeSubs(player.ins).filter((s) => !s.isSwap && !s.is_swap && s.is_swap !== 1);
  const outs = normalizeSubs(player.outs).filter((s) => !s.isSwap && !s.is_swap && s.is_swap !== 1);

  const events: { type: "IN" | "OUT"; gameTime: number }[] = [];
  ins.forEach((i) => events.push({ type: "IN", gameTime: Number(i.gameTime ?? i.sub_time ?? 0) }));
  outs.forEach((o) => events.push({ type: "OUT", gameTime: Number(o.gameTime ?? o.sub_time ?? 0) }));
  events.sort((a, b) => a.gameTime - b.gameTime);

  const isStarter = Boolean(player.started || ["starter", "goalkeeper"].includes(player.gameStatus));
  let onField = isStarter;

  events.forEach((evt) => {
    if (evt.type === "IN") onField = true;
    else if (evt.type === "OUT") onField = false;
  });

  return onField;
};

function getGamePeriodIntervals(game: any, currentGameTime: number = 0): { start: number; end: number }[] {
  if (!game) return [];
  const periods = game.periods || [];
  const regSecs = (game.settings?.periodDuration) || 2400;

  if (periods.length === 0) {
    const defaultEnd = currentGameTime > 0 ? currentGameTime : regSecs * 2;
    return [{ start: 0, end: defaultEnd }];
  }

  const p1Start = periods[0]?.startTime ? Number(periods[0].startTime) : null;
  const intervals: { start: number; end: number }[] = [];

  if (p1Start) {
    periods.forEach((p: any, idx: number) => {
      const pStartMs = p.startTime ? Number(p.startTime) : null;
      const pEndMs = p.endTime ? Number(p.endTime) : null;

      if (pStartMs) {
        const startSec = Math.max(0, Math.floor((pStartMs - p1Start) / 1000));
        let endSec = startSec + regSecs;
        if (pEndMs) {
          endSec = Math.max(startSec, Math.floor((pEndMs - p1Start) / 1000));
        } else if (currentGameTime > startSec) {
          endSec = currentGameTime;
        }
        intervals.push({ start: startSec, end: endSec });
      } else {
        const startSec = idx * regSecs;
        intervals.push({ start: startSec, end: startSec + regSecs });
      }
    });
  } else {
    periods.forEach((p: any, idx: number) => {
      const startSec = idx * regSecs;
      intervals.push({ start: startSec, end: startSec + regSecs });
    });
  }

  return intervals;
}

function getGameStoppageIntervals(game: any): { startTime: number; endTime: number | null }[] {
  if (!game) return [];
  const intervals: { startTime: number; endTime: number | null }[] = [];

  if (Array.isArray(game.stoppages)) {
    game.stoppages.forEach((s: any) => {
      intervals.push({
        startTime: Number(s.startTime ?? s.game_time ?? 0),
        endTime: s.endTime !== null && s.endTime !== undefined ? Number(s.endTime) : null,
      });
    });
  }

  if (Array.isArray(game.gameEventsMajor)) {
    game.gameEventsMajor.forEach((m: any) => {
      if (
        m.clock_should_run === 0 ||
        m.clock_should_run === false ||
        (m.clock_should_run === undefined && m.event_type === "stoppage")
      ) {
        // Ignore orphan cards/goals whose child event was deleted
        if (m.event_type === "card" && (!game.gameEventsDiscipline || !game.gameEventsDiscipline.some((d: any) => String(d.major_event_id) === String(m.id)))) {
          return;
        }
        if (m.event_type === "goal" && (!game.gameEventsGoals || !game.gameEventsGoals.some((g: any) => String(g.major_event_id) === String(m.id)))) {
          return;
        }

        const startSec = Number(m.game_time ?? 0);
        let endSec: number | null = null;

        if (m.end_time !== null && m.end_time !== undefined) {
          if (typeof m.end_time === "number" && m.end_time > 1000000000000 && game.gameStartTime) {
            endSec = Math.max(startSec, Math.floor((m.end_time - game.gameStartTime) / 1000));
          } else {
            endSec = Number(m.end_time);
          }
        }

        intervals.push({ startTime: startSec, endTime: endSec });
      }
    });
  }

  return intervals;
}

/* ==================== STORE ==================== */

export interface GamePlayerTimeStoreState {
  calculateTotalTimeOnField: (player: Player, currentGameTime: number) => number;
  calculateCurrentTimeOnField: (player: Player, currentGameTime: number) => number;
  calculateCurrentTimeOffField: (player: Player, currentGameTime: number) => number;
  isPlayerOnField: (player: Player) => boolean;
  isPlayerOnFieldAtTime: (player: Player, gameTime: number) => boolean;
  calculatePlusMinus: (player: Player, gameId: string | number) => number;
  calculateAllPlusMinus: (gameId: string | number) => Record<string | number, number>;
  getPlayersOnField: () => Player[];
  getPlayersOnBench: () => Player[];
  calculateGoalkeeperTime: (player: Player, currentGameTime: number) => number;
  isPlayerCurrentlyGoalkeeper: (player: Player) => boolean;
  calculateAllGoalkeeperTime: (gameId: string | number, currentGameTime: number) => Record<string | number, number>;
}

const useGamePlayerTimeStore = create<GamePlayerTimeStoreState>((set, get) => ({
  /* ==================== FIELD PLAYER TIME ==================== */

  calculateTotalTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    const periods = getGamePeriodIntervals(game, currentGameTime);
    const stoppages = getGameStoppageIntervals(game);

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);

    return calculateActivePlayerTimeOnField(
      isStarter,
      player.ins,
      player.outs,
      periods,
      stoppages,
      currentGameTime
    );
  },

  calculateCurrentTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    const periods = getGamePeriodIntervals(game, currentGameTime);
    const stoppages = getGameStoppageIntervals(game);
    const isStarter = Boolean(player.started || ["starter", "goalkeeper"].includes(player.gameStatus));

    return calculateRecentPlayerTimeOnField(
      isStarter,
      player.ins,
      player.outs,
      periods,
      stoppages,
      currentGameTime
    );
  },

  calculateCurrentTimeOffField: (player, currentGameTime) => {
    if (!player) return 0;

    if (isPlayerOnFieldNow(player)) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    const periods = getGamePeriodIntervals(game, currentGameTime);
    const stoppages = getGameStoppageIntervals(game);

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);

    return calculateRecentPlayerTimeOffField(
      isStarter,
      player.ins,
      player.outs,
      periods,
      stoppages,
      currentGameTime
    );
  },

  isPlayerOnField: (player) => !!player && isPlayerOnFieldNow(player),

  isPlayerOnFieldAtTime: (player, gameTime) => {
    if (!player) return false;

    // Subs that occurred before this timestamp
    // Exclude position swaps where neither player enters or leaves the field
    const ins = normalizeSubs(player.ins)
      .filter((s) => !s.isSwap && !s.is_swap && s.is_swap !== 1)
      .filter((sub) => {
        const t = Number(sub.gameTime ?? sub.sub_time ?? 0);
        // A sub made at the stoppage of a goal (same timestamp) takes effect after the goal
        return gameTime > 0 ? t < gameTime : t <= gameTime;
      });

    const outs = normalizeSubs(player.outs)
      .filter((s) => !s.isSwap && !s.is_swap && s.is_swap !== 1)
      .filter((sub) => {
        const t = Number(sub.gameTime ?? sub.sub_time ?? 0);
        return gameTime > 0 ? t < gameTime : t <= gameTime;
      });

    const events: { type: "IN" | "OUT"; gameTime: number }[] = [];
    ins.forEach((i) => events.push({ type: "IN", gameTime: Number(i.gameTime ?? i.sub_time ?? 0) }));
    outs.forEach((o) => events.push({ type: "OUT", gameTime: Number(o.gameTime ?? o.sub_time ?? 0) }));
    events.sort((a, b) => a.gameTime - b.gameTime);

    const isStarter = Boolean(
      player.started || ["starter", "goalkeeper"].includes(player.gameStatus)
    );
    let onField = isStarter;

    events.forEach((evt) => {
      if (evt.type === "IN") onField = true;
      else if (evt.type === "OUT") onField = false;
    });

    return onField;
  },

  /* ==================== PLUS / MINUS ==================== */

  calculatePlusMinus: (player, gameId) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    const gId = Number(game.game_id || game.id);
    const targetGameId = Number(gameId);
    if (gId !== targetGameId) return 0;

    let plusMinus = 0;

    const ourTeamSeasonId = Number(
      player.teamSeasonId ||
      game.teamSeasonId ||
      (game.isHome ? game.home_team_season_id : game.away_team_season_id) ||
      0
    );

    (game.gameEventsGoals || []).forEach((goal: any) => {
      // Resolve goal game time from goal itself, or from its associated major event:
      let goalTime: number | null = null;
      if (goal.game_time !== null && goal.game_time !== undefined) {
        goalTime = Number(goal.game_time);
      } else if (goal.major_event_id) {
        const major = (game.gameEventsMajor || []).find(
          (m: any) => Number(m.id) === Number(goal.major_event_id)
        );
        if (major && major.game_time !== null && major.game_time !== undefined) {
          goalTime = Number(major.game_time);
        }
      }

      const effectiveGoalTime = goalTime ?? 0;

      if (get().isPlayerOnFieldAtTime(player, effectiveGoalTime)) {
        const goalTeamSeasonId = Number(goal.team_season_id);
        const isOurTeamGoal = goalTeamSeasonId === ourTeamSeasonId;
        plusMinus += isOurTeamGoal ? 1 : -1;
      }
    });

    return plusMinus;
  },

  calculateAllPlusMinus: (gameId) => {
    const game = useGameStore.getState().game;
    const players = useGamePlayersStore.getState().players;
    const map: Record<string | number, number> = {};
    
    players.forEach(
      (player) =>
        (map[player.id] = get().calculatePlusMinus(player, game ? game.game_id : gameId)),
    );
    return map;
  },

  getPlayersOnField: () =>
    useGamePlayersStore
      .getState()
      .players.filter((p) => get().isPlayerOnField(p)),

  getPlayersOnBench: () =>
    useGamePlayersStore
      .getState()
      .players.filter((p) => !get().isPlayerOnField(p)),

  /* ==================== GOALKEEPER TIME ==================== */

  calculateGoalkeeperTime: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    const periods = getGamePeriodIntervals(game, currentGameTime);
    const stoppages = getGameStoppageIntervals(game);

    const players = useGamePlayersStore
      .getState()
      .players.filter((p) => String(p.teamSeasonId) === String(player.teamSeasonId));

    const startingGk = players.find((p) => p.gameStatus === "goalkeeper");

    const gkEvents: { subTime: number; inPlayerId: string | number }[] = [];
    const seenSubIds = new Set<string | number>();

    players.forEach((p) => {
      (p.ins || []).forEach((s) => {
        if (s.gkSub && s.gameTime !== null && s.gameTime !== undefined && !seenSubIds.has(String(s.subId))) {
          seenSubIds.add(String(s.subId));
          gkEvents.push({
            subTime: Number(s.gameTime),
            inPlayerId: p.playerGameId || p.id,
          });
        }
      });
    });

    gkEvents.sort((a, b) => a.subTime - b.subTime);

    let activeTimelineLimit = currentGameTime;
    if (activeTimelineLimit <= 0 && periods && periods.length > 0) {
      activeTimelineLimit = periods[periods.length - 1].end;
    }

    const playerGkStints: { start: number; end: number }[] = [];
    let currentGkId = startingGk ? (startingGk.playerGameId || startingGk.id) : null;
    let stintStart = 0;

    gkEvents.forEach((ev) => {
      if (ev.subTime > stintStart) {
        if (currentGkId && (String(currentGkId) === String(player.playerGameId) || String(currentGkId) === String(player.id))) {
          playerGkStints.push({ start: stintStart, end: ev.subTime });
        }
      }
      currentGkId = ev.inPlayerId;
      stintStart = ev.subTime;
    });

    if (currentGkId && (String(currentGkId) === String(player.playerGameId) || String(currentGkId) === String(player.id))) {
      if (activeTimelineLimit > stintStart) {
        playerGkStints.push({ start: stintStart, end: activeTimelineLimit });
      }
    }

    const effectivePeriods =
      periods && periods.length > 0 ? periods : [{ start: 0, end: activeTimelineLimit }];

    let totalGkActiveSeconds = 0;

    for (const inv of playerGkStints) {
      for (const p of effectivePeriods) {
        const overlapStart = Math.max(inv.start, p.start);
        const overlapEnd = Math.min(inv.end, p.end);

        if (overlapEnd > overlapStart) {
          let activeSecs = overlapEnd - overlapStart;

          for (const s of stoppages) {
            const sEnd = s.endTime !== null && s.endTime !== undefined ? s.endTime : overlapEnd;
            const sOverlapStart = Math.max(overlapStart, s.startTime);
            const sOverlapEnd = Math.min(overlapEnd, sEnd);

            if (sOverlapEnd > sOverlapStart) {
              activeSecs -= sOverlapEnd - sOverlapStart;
            }
          }

          totalGkActiveSeconds += Math.max(0, activeSecs);
        }
      }
    }

    return Math.round(totalGkActiveSeconds);
  },

  isPlayerCurrentlyGoalkeeper: (player) => {
    if (!player || !isPlayerOnFieldNow(player)) return false;

    const players = useGamePlayersStore
      .getState()
      .players.filter((p) => String(p.teamSeasonId) === String(player.teamSeasonId));

    const allGkSubs: { subTime: number; inPlayerId: string | number }[] = [];
    const seenSubIds = new Set<string | number>();

    players.forEach((p) => {
      (p.ins || []).forEach((s) => {
        if (s.gkSub && s.gameTime !== null && s.gameTime !== undefined && !seenSubIds.has(String(s.subId))) {
          seenSubIds.add(String(s.subId));
          allGkSubs.push({
            subTime: Number(s.gameTime),
            inPlayerId: p.playerGameId || p.id,
          });
        }
      });
    });

    allGkSubs.sort((a, b) => b.subTime - a.subTime);

    if (allGkSubs.length > 0) {
      const latestGkSub = allGkSubs[0];
      return (
        String(latestGkSub.inPlayerId) === String(player.playerGameId) ||
        String(latestGkSub.inPlayerId) === String(player.id)
      );
    }

    return player.gameStatus === "goalkeeper";
  },

  calculateAllGoalkeeperTime: (gameId, currentGameTime) => {
    const players = useGamePlayersStore.getState().players;
    const map: Record<string | number, number> = {};
    players.forEach(
      (p) => (map[p.id] = get().calculateGoalkeeperTime(p, currentGameTime)),
    );
    return map;
  },
}));

export default useGamePlayerTimeStore;
