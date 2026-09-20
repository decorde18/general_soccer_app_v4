import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore, { Player } from "./gamePlayersStore";
import { calculateActivePlayerTimeOnField, calculateActivePlayerTimeOffField, calculateRecentPlayerTimeOffField } from "@/lib/utils/dateTimeUtils";

/* ==================== HELPERS ==================== */

const normalizeSubs = (subs: any[]): any[] =>
  (subs || [])
    .filter((sub) => sub.gameTime !== null && sub.gameTime !== undefined || sub.sub_time !== null && sub.sub_time !== undefined)
    .sort((a, b) => Number(a.gameTime ?? a.sub_time ?? 0) - Number(b.gameTime ?? b.sub_time ?? 0));

/**
 * Determine if a player is currently on the field
 */
const isPlayerOnFieldNow = (player: Player) => {
  const ins = normalizeSubs(player.ins);
  const outs = normalizeSubs(player.outs);

  const events: { type: "IN" | "OUT"; gameTime: number }[] = [];
  ins.forEach((i) => events.push({ type: "IN", gameTime: Number(i.gameTime ?? i.sub_time ?? 0) }));
  outs.forEach((o) => events.push({ type: "OUT", gameTime: Number(o.gameTime ?? o.sub_time ?? 0) }));
  events.sort((a, b) => a.gameTime - b.gameTime);

  const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);
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
      if (m.clock_should_run === 0 || m.event_type === "stoppage") {
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

    if (!isPlayerOnFieldNow(player)) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    const periods = getGamePeriodIntervals(game, currentGameTime);
    const stoppages = getGameStoppageIntervals(game);

    const ins = normalizeSubs(player.ins);
    const lastIn = ins[ins.length - 1];
    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);

    const activeIns = lastIn ? [lastIn] : [];

    return calculateActivePlayerTimeOnField(
      isStarter && !lastIn,
      activeIns,
      [],
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

    const ins = normalizeSubs(player.ins).filter(
      (sub) => Number(sub.gameTime ?? sub.sub_time ?? 0) <= gameTime
    );
    const outs = normalizeSubs(player.outs).filter(
      (sub) => Number(sub.gameTime ?? sub.sub_time ?? 0) <= gameTime
    );

    const events: { type: "IN" | "OUT"; gameTime: number }[] = [];
    ins.forEach((i) => events.push({ type: "IN", gameTime: Number(i.gameTime ?? i.sub_time ?? 0) }));
    outs.forEach((o) => events.push({ type: "OUT", gameTime: Number(o.gameTime ?? o.sub_time ?? 0) }));
    events.sort((a, b) => a.gameTime - b.gameTime);

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);
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
    if (!game || game.game_id !== gameId) return 0;

    let plusMinus = 0;

    (game.gameEventsGoals || []).forEach((goal: any) => {
      if (get().isPlayerOnFieldAtTime(player, Number(goal.game_time ?? 0))) {
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
    if (!game) return 0;

    const periods = getGamePeriodIntervals(game, currentGameTime);
    const stoppages = getGameStoppageIntervals(game);

    const ins = normalizeSubs(player.ins);
    const outs = normalizeSubs(player.outs);
    const gkIns = ins.filter((s) => s.gkSub);
    const gkOuts = outs.filter((s) => s.gkSub);

    const startedAsGK = player.gameStatus === "goalkeeper";

    return calculateActivePlayerTimeOnField(
      startedAsGK,
      gkIns,
      gkOuts,
      periods,
      stoppages,
      currentGameTime
    );
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
