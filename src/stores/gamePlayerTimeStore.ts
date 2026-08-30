// stores/gamePlayerTimeStore.ts
// Player playing time & goalkeeper time calculations using the dual-time model.
// Input timestamps & sub events use Absolute Time (continuous seconds since match start).
// Output field/goalkeeper playing times calculate active Scoreboard Time (excluding stoppages & period breaks).

import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore, { Player } from "./gamePlayersStore";

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

    const periods = game.periods || [];
    const regSecs = (game.settings?.periodDuration) || 2400;
    let matchEndSecs = 0;

    if (periods.length > 0) {
      periods.forEach((p: any) => {
        let pDur = 0;
        if (p.endTime && p.startTime) {
          pDur = Math.round((p.endTime - p.startTime) / 1000);
        } else {
          pDur = regSecs;
        }
        matchEndSecs += pDur;
      });
    } else {
      matchEndSecs = regSecs * 2;
    }

    const effectiveTime = currentGameTime > 0 ? currentGameTime : matchEndSecs;

    const ins = normalizeSubs(player.ins);
    const outs = normalizeSubs(player.outs);

    const events: { type: "IN" | "OUT"; gameTime: number }[] = [];
    ins.forEach((i) => events.push({ type: "IN", gameTime: Number(i.gameTime ?? i.sub_time ?? 0) }));
    outs.forEach((o) => events.push({ type: "OUT", gameTime: Number(o.gameTime ?? o.sub_time ?? 0) }));
    events.sort((a, b) => a.gameTime - b.gameTime);

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);
    const intervals: { start: number; end: number }[] = [];

    let onField = isStarter;
    let shiftStart: number | null = isStarter ? 0 : null;

    events.forEach((evt) => {
      if (evt.type === "IN") {
        if (!onField) {
          onField = true;
          shiftStart = evt.gameTime;
        }
      } else if (evt.type === "OUT") {
        if (onField && shiftStart !== null) {
          if (evt.gameTime > shiftStart) {
            intervals.push({ start: shiftStart, end: evt.gameTime });
          }
          onField = false;
          shiftStart = null;
        }
      }
    });

    if (onField && shiftStart !== null) {
      if (effectiveTime > shiftStart) {
        intervals.push({ start: shiftStart, end: effectiveTime });
      }
    }

    let total = 0;
    intervals.forEach((inv) => {
      total += Math.max(0, inv.end - inv.start);
    });

    return Math.round(total);
  },

  calculateCurrentTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    if (!isPlayerOnFieldNow(player)) return 0;

    const ins = normalizeSubs(player.ins);
    const lastIn = ins[ins.length - 1];
    if (!lastIn) return 0;

    const lastInTime = Number(lastIn.gameTime ?? lastIn.sub_time ?? 0);
    return Math.max(0, Math.round(currentGameTime - lastInTime));
  },

  calculateCurrentTimeOffField: (player, currentGameTime) => {
    if (!player) return 0;

    if (isPlayerOnFieldNow(player)) return 0;

    const outs = normalizeSubs(player.outs);
    if (!outs.length) return Math.round(currentGameTime);

    const lastOut = outs[outs.length - 1];
    const lastOutTime = Number(lastOut.gameTime ?? lastOut.sub_time ?? 0);
    return Math.max(0, Math.round(currentGameTime - lastOutTime));
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

    const periods = game.periods || [];
    const regSecs = (game.settings?.periodDuration) || 2400;
    let matchEndSecs = 0;

    if (periods.length > 0) {
      periods.forEach((p: any) => {
        let pDur = 0;
        if (p.endTime && p.startTime) {
          pDur = Math.round((p.endTime - p.startTime) / 1000);
        } else {
          pDur = regSecs;
        }
        matchEndSecs += pDur;
      });
    } else {
      matchEndSecs = regSecs * 2;
    }

    const effectiveTime = currentGameTime > 0 ? currentGameTime : matchEndSecs;

    const ins = normalizeSubs(player.ins);
    const outs = normalizeSubs(player.outs);
    const gkIns = ins.filter((s) => s.gkSub);
    const gkOuts = outs.filter((s) => s.gkSub);

    const events: { type: "IN" | "OUT"; gameTime: number }[] = [];
    gkIns.forEach((i) => events.push({ type: "IN", gameTime: Number(i.gameTime ?? i.sub_time ?? 0) }));
    gkOuts.forEach((o) => events.push({ type: "OUT", gameTime: Number(o.gameTime ?? o.sub_time ?? 0) }));
    events.sort((a, b) => a.gameTime - b.gameTime);

    const startedAsGK = player.gameStatus === "goalkeeper";
    const intervals: { start: number; end: number }[] = [];

    let isGK = startedAsGK;
    let shiftStart: number | null = startedAsGK ? 0 : null;

    events.forEach((evt) => {
      if (evt.type === "IN") {
        if (!isGK) {
          isGK = true;
          shiftStart = evt.gameTime;
        }
      } else if (evt.type === "OUT") {
        if (isGK && shiftStart !== null) {
          if (evt.gameTime > shiftStart) {
            intervals.push({ start: shiftStart, end: evt.gameTime });
          }
          isGK = false;
          shiftStart = null;
        }
      }
    });

    if (isGK && shiftStart !== null) {
      if (effectiveTime > shiftStart) {
        intervals.push({ start: shiftStart, end: effectiveTime });
      }
    }

    let total = 0;
    intervals.forEach((inv) => {
      total += Math.max(0, inv.end - inv.start);
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
