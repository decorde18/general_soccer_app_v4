// stores/gamePlayerTimeStore.js
// Player time calculations with stoppage time handling and period boundary fixes

import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore from "./gamePlayersStore";

/* ==================== HELPERS ==================== */

const normalizeSubs = (subs) =>
  (subs || [])
    .filter((sub) => sub.gameTime !== null)
    .sort((a, b) => a.gameTime - b.gameTime);

/**
 * Splits a game_time segment into chunks that fall within actual periods
 * Excludes time between periods (breaks)
 */
const splitSegmentByPeriods = (segment, periods, gameStartTime) => {
  const chunks = [];

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
  stoppages,
  rangeStart,
  rangeEnd,
  periodNumber,
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
const isPlayerOnFieldNow = (player) => {
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

const useGamePlayerTimeStore = create((set, get) => ({
  /* ==================== FIELD PLAYER TIME ==================== */

  calculateTotalTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game || !game.gameStartTime) return 0;

    const ins = normalizeSubs(player.ins);
    const outs = normalizeSubs(player.outs);
    const periods = game.periods || [];
    const stoppages = game.stoppages || [];

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);
    const segments = [];

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
        game.gameStartTime,
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
    const stoppages = game.stoppages || [];

    const segment = { start: lastIn.gameTime, end: currentGameTime };
    const chunks = splitSegmentByPeriods(segment, periods, game.gameStartTime);

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

    (game.gameEventsGoals || []).forEach((goal) => {
      if (get().isPlayerOnFieldAtTime(player, goal.game_time)) {
        plusMinus += goal.team_season_id === player.teamSeasonId ? 1 : -1;
      }
    });

    return plusMinus;
  },

  calculateAllPlusMinus: (gameId) => {
    const game = useGameStore.getState().game;

    const players = useGamePlayersStore.getState().players;
    const map = {};
    players.forEach(
      (player) =>
        (map[player.id] = get().calculatePlusMinus(player, game.game_id)),
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
      game.gameEventsMajor?.filter((e) => e.clock_should_run === 0) || [];

    const gkSegments = [];
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
        game.gameStartTime,
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
    const map = {};
    players.forEach(
      (p) => (map[p.id] = get().calculateGoalkeeperTime(p, currentGameTime)),
    );
    return map;
  },
}));

export default useGamePlayerTimeStore;
