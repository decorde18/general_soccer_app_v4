// stores/gamePlayerTimeStore.ts
// Player time calculations with stoppage time handling and period boundary fixes

import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore, { Player } from "./gamePlayersStore";

/* ==================== HELPERS ==================== */

const normalizeSubs = (subs: any[]): any[] =>
  (subs || [])
    .filter((sub) => sub.gameTime !== null)
    .sort((a, b) => (a.gameTime ?? 0) - (b.gameTime ?? 0));

/**
 * Splits a game_time segment into chunks that fall within actual periods
 * Excludes time between periods (breaks)
 */
const splitSegmentByPeriods = (
  segment: { start: number; end: number },
  periods: any[],
  gameStartTime: number,
) => {
  const chunks: { start: number; end: number; periodNumber: number }[] = [];

  periods.forEach((period) => {
    if (!period.startTime) return;

    const periodStartGameTime = Math.floor(
      (period.startTime - gameStartTime) / 1000,
    );
    const periodEndGameTime = period.endTime
      ? Math.floor((period.endTime - gameStartTime) / 1000)
      : Infinity;

    const chunkStart = Math.max(segment.start, periodStartGameTime);
    const chunkEnd = Math.min(segment.end, periodEndGameTime);

    if (chunkEnd > chunkStart) {
      chunks.push({
        start: chunkStart,
        end: chunkEnd,
        periodNumber: period.periodNumber,
      });
    }
  });

  return chunks;
};

/**
 * Calculate stoppage time within a specific time range
 * Assumes stoppage start/end are already in game_time seconds
 */
const calculateStoppageTimeInRange = (
  stoppages: any[],
  rangeStart: number,
  rangeEnd: number,
  periodNumber: number,
) =>
  stoppages
    .filter((s) => s.periodNumber === periodNumber && s.endTime !== null)
    .reduce((total, stoppage) => {
      const overlapStart = Math.max(stoppage.startTime, rangeStart);
      const overlapEnd = Math.min(stoppage.endTime, rangeEnd);
      return overlapEnd > overlapStart
        ? total + (overlapEnd - overlapStart)
        : total;
    }, 0);

/**
 * Determine if a player is currently on the field
 */
const isPlayerOnFieldNow = (player: Player) => {
  const ins = normalizeSubs(player.ins);
  const outs = normalizeSubs(player.outs);

  const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);

  const lastIn = ins[ins.length - 1];
  const lastOut = outs[outs.length - 1];

  if (isStarter && !lastIn && !lastOut) return true;
  if (!lastIn) return false;

  return !lastOut || lastIn.gameTime > lastOut.gameTime;
};

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
    if (!game || !game.gameStartTime) return 0;

    const ins = normalizeSubs(player.ins);
    const outs = normalizeSubs(player.outs);
    const periods = game.periods || [];
    const stoppages = (game.stoppages as any) || [];

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);
    const segments: { start: number; end: number }[] = [];

    if (isStarter) {
      const firstOut = outs[0];
      segments.push({
        start: 0,
        end: firstOut ? firstOut.gameTime : currentGameTime,
      });

      for (let i = 0; i < ins.length; i++) {
        const start = ins[i].gameTime;
        const end = outs[i + 1] ? outs[i + 1].gameTime : currentGameTime;
        if (end > start) segments.push({ start, end });
      }
    } else {
      for (let i = 0; i < ins.length; i++) {
        const start = ins[i].gameTime;
        const end = outs[i] ? outs[i].gameTime : currentGameTime;
        if (end > start) segments.push({ start, end });
      }
    }

    let total = 0;

    segments.forEach((segment) => {
      const chunks = splitSegmentByPeriods(
        segment,
        periods,
        game.gameStartTime as number,
      );

      chunks.forEach((chunk) => {
        const chunkTime = chunk.end - chunk.start;
        const stoppageTime = calculateStoppageTimeInRange(
          stoppages,
          chunk.start,
          chunk.end,
          chunk.periodNumber,
        );
        total += Math.max(0, chunkTime - stoppageTime);
      });
    });

    return Math.round(total);
  },

  calculateCurrentTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game || !game.gameStartTime) return 0;

    if (!isPlayerOnFieldNow(player)) return 0;

    const ins = normalizeSubs(player.ins);
    const lastIn = ins[ins.length - 1];
    if (!lastIn) return 0;

    const periods = game.periods || [];
    const stoppages = (game.stoppages as any) || [];

    const segment = { start: lastIn.gameTime, end: currentGameTime };
    const chunks = splitSegmentByPeriods(segment, periods, game.gameStartTime as number);

    let total = 0;

    chunks.forEach((chunk) => {
      const chunkTime = chunk.end - chunk.start;
      const stoppageTime = calculateStoppageTimeInRange(
        stoppages,
        chunk.start,
        chunk.end,
        chunk.periodNumber,
      );
      total += Math.max(0, chunkTime - stoppageTime);
    });

    return Math.round(total);
  },

  calculateCurrentTimeOffField: (player, currentGameTime) => {
    if (!player) return 0;

    if (isPlayerOnFieldNow(player)) return 0;

    const outs = normalizeSubs(player.outs);
    if (!outs.length) return Math.round(currentGameTime);

    const lastOut = outs[outs.length - 1];
    return Math.max(0, Math.round(currentGameTime - lastOut.gameTime));
  },

  isPlayerOnField: (player) => !!player && isPlayerOnFieldNow(player),

  isPlayerOnFieldAtTime: (player, gameTime) => {
    if (!player) return false;

    const ins = normalizeSubs(player.ins).filter(
      (sub) => sub.gameTime <= gameTime,
    );
    const outs = normalizeSubs(player.outs).filter(
      (sub) => sub.gameTime <= gameTime,
    );

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);
    const effectiveIns = isStarter ? ins.length + 1 : ins.length;

    return effectiveIns > outs.length;
  },

  /* ==================== PLUS / MINUS ==================== */

  calculatePlusMinus: (player, gameId) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game || game.game_id !== gameId) return 0;

    let plusMinus = 0;

    (game.gameEventsGoals || []).forEach((goal: any) => {
      if (get().isPlayerOnFieldAtTime(player, goal.game_time)) {
        plusMinus += goal.team_season_id === player.teamSeasonId ? 1 : -1;
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
    if (!game || !game.gameStartTime) return 0;

    const ins = normalizeSubs(player.ins);
    const outs = normalizeSubs(player.outs);
    const periods = game.periods || [];

    const stoppages =
      game.gameEventsMajor?.filter((e: any) => e.clock_should_run === 0) || [];

    const gkSegments: { start: number; end: number }[] = [];
    const startedAsGK = player.gameStatus === "goalkeeper";

    const gkIns = ins.filter((s) => s.gkSub);
    const gkOuts = outs.filter((s) => s.gkSub);

    if (startedAsGK) {
      const firstOut = gkOuts[0] || outs[0];
      gkSegments.push({
        start: 0,
        end: firstOut ? firstOut.gameTime : currentGameTime,
      });
    }

    for (let i = 0; i < gkIns.length; i++) {
      const start = gkIns[i].gameTime;
      const end = gkOuts[i] ? gkOuts[i].gameTime : currentGameTime;
      if (end > start) gkSegments.push({ start, end });
    }

    let total = 0;

    gkSegments.forEach((segment) => {
      const chunks = splitSegmentByPeriods(
        segment,
        periods,
        game.gameStartTime as number,
      );

      chunks.forEach((chunk) => {
        const chunkTime = chunk.end - chunk.start;
        const stoppageTime = calculateStoppageTimeInRange(
          stoppages,
          chunk.start,
          chunk.end,
          chunk.periodNumber,
        );
        total += Math.max(0, chunkTime - stoppageTime);
      });
    });

    return Math.round(total);
  },

  isPlayerCurrentlyGoalkeeper: (player) => {
    if (!player || !isPlayerOnFieldNow(player)) return false;

    if (player.gameStatus === "goalkeeper") return true;

    const ins = normalizeSubs(player.ins);
    const lastIn = ins[ins.length - 1];
    return lastIn?.gkSub === true;
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
