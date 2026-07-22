// stores/gameSubsStore.ts
// Substitution management - creating, confirming, updating, canceling subs
// ACTUAL FIX: Don't call updateAllSubStatuses after creating subs - it overwrites our changes!

import { create } from "zustand";
import useGamePlayersStore, {
  type Player,
  type SubStatus,
} from "./gamePlayersStore";
import { apiFetch } from "@/app/api/fetcher";
import useGameStore from "./gameStore";

// ==================== TYPES ====================

/**
 * Row shape for the `game_subs` table, as returned by the API.
 */
export interface GameSub {
  id: string | number;
  game_id: string | number;
  in_player_id: string | number | null;
  out_player_id: string | number | null;
  /** Game time (seconds) the sub was confirmed at, or null if still pending */
  sub_time: number | null;
  period: number;
  gk_sub: 0 | 1;
}

/** Partial update payload for updatePendingSub */
export type GameSubUpdate = Partial<
  Pick<
    GameSub,
    "in_player_id" | "out_player_id" | "sub_time" | "gk_sub" | "period"
  >
>;

/**
 * Normalized pending-sub shape used by the UI (as opposed to the raw
 * snake_case GameSub row).
 */
export interface PendingSub {
  subId: string | number;
  inPlayerId: string | number | null;
  outPlayerId: string | number | null;
  gkSub: boolean;
  period?: number;
  isComplete: boolean;
}

export interface ConfirmAllResult {
  confirmed: number;
  errors?: string[];
  pending?: number;
}

export interface GameSubsState {
  // ---- helpers ----
  getCurrentGoalkeeper: () => Promise<Player | null | undefined>;
  isCurrentGoalkeeper: (playerId: string | number) => Promise<boolean>;
  isGkSubstitution: (
    inPlayerId: string | number | null,
    outPlayerId: string | number | null,
  ) => Promise<boolean>;
  isBothOnField: (
    inPlayerId: string | number | null,
    outPlayerId: string | number | null,
  ) => boolean;

  // ---- pending sub queries ----
  getPendingSubs: () => Promise<PendingSub[]>;
  getPendingSubsSync: () => PendingSub[];

  // ---- mutations ----
  createPendingSub: (
    inPlayerId?: string | number | null,
    outPlayerId?: string | number | null,
    isGkSub?: boolean,
  ) => Promise<GameSub | null>;
  updatePendingSub: (
    subId: string | number,
    updates: GameSubUpdate,
  ) => Promise<GameSub | null>;
  confirmSub: (subId: string | number) => Promise<void>;
  confirmAllPendingSubs: () => Promise<ConfirmAllResult>;
  cancelSub: (subId: string | number) => Promise<void>;
}

/**
 * Derives the pending subStatus for a player from their pending ins/outs.
 */
function computeSubStatus(
  pendingInsCount: number,
  pendingOutsCount: number,
): SubStatus | null {
  if (pendingInsCount > 0 && pendingOutsCount > 0) return "pendingBoth";
  if (pendingInsCount > 0) return "pendingIn";
  if (pendingOutsCount > 0) return "pendingOut";
  return null;
}

const useGameSubsStore = create<GameSubsState>()((set, get) => ({
  // ==================== HELPER FUNCTIONS ====================

  /**
   * Determines who the current goalkeeper is based on:
   * 1. Most recent CONFIRMED gk_sub (gk_sub=1 AND sub_time IS NOT NULL)
   * 2. OR player with gameStatus='goalkeeper' if no GK subs have been confirmed
   *
   * IMPORTANT: gameStatus never changes during the game - it reflects lineup only.
   * GK subs during the game override the starting GK.
   */
  getCurrentGoalkeeper: async () => {
    const gameId = useGameStore.getState().game?.game_id;
    if (!gameId) return null;

    try {
      // Fetch all CONFIRMED GK subs (sub_time IS NOT NULL)
      const confirmedGkSubs = await apiFetch<GameSub[]>(
        "game_subs",
        "GET",
        null,
        null,
        {
          filters: {
            game_id: gameId,
            gk_sub: 1,
            sub_time_is_not_null: true,
          },
        },
      );

      // If there are confirmed GK subs, find the most recent one
      if (confirmedGkSubs && confirmedGkSubs.length > 0) {
        // Sort by sub_time descending to get most recent
        const mostRecentGkSub = [...confirmedGkSubs].sort(
          (a, b) => (b.sub_time ?? 0) - (a.sub_time ?? 0),
        )[0];

        // The IN player from the most recent GK sub is the current GK
        const players = useGamePlayersStore.getState().players;
        const currentGk = players.find(
          (p) => p.playerGameId === mostRecentGkSub.in_player_id,
        );

        if (currentGk) {
          return currentGk;
        }
      }

      // If no confirmed GK subs, use the starting GK (gameStatus='goalkeeper')
      const players = useGamePlayersStore.getState().players;
      const startingGk = players.find((p) => p.gameStatus === "goalkeeper");

      return startingGk;
    } catch (error) {
      console.error("Error finding current goalkeeper:", error);

      // Fallback to gameStatus check
      const players = useGamePlayersStore.getState().players;
      return players.find((p) => p.gameStatus === "goalkeeper");
    }
  },

  /**
   * Checks if a player is currently the goalkeeper
   */
  isCurrentGoalkeeper: async (playerId) => {
    const currentGk = await get().getCurrentGoalkeeper();
    return currentGk?.id === playerId;
  },

  /**
   * Determines if this is a GK sub based on players involved
   */
  isGkSubstitution: async (inPlayerId, outPlayerId) => {
    if (!inPlayerId && !outPlayerId) return false;

    const players = useGamePlayersStore.getState().players;

    const inPlayer = inPlayerId
      ? players.find((p) => p.playerGameId === inPlayerId)
      : null;
    const outPlayer = outPlayerId
      ? players.find((p) => p.playerGameId === outPlayerId)
      : null;

    // Check if either player is the current GK
    const currentGk = await get().getCurrentGoalkeeper();
    const involvesCurrentGk = Boolean(
      currentGk &&
      (inPlayer?.id === currentGk.id || outPlayer?.id === currentGk.id),
    );

    return involvesCurrentGk;
  },

  /**
   * Checks if both players in a sub are currently on field
   */
  isBothOnField: (inPlayerId, outPlayerId) => {
    const players = useGamePlayersStore.getState().players;

    const inPlayer = inPlayerId
      ? players.find((p) => p.playerGameId === inPlayerId)
      : null;
    const outPlayer = outPlayerId
      ? players.find((p) => p.playerGameId === outPlayerId)
      : null;

    const inOnField =
      inPlayer?.fieldStatus === "onField" ||
      inPlayer?.fieldStatus === "onFieldGk";
    const outOnField =
      outPlayer?.fieldStatus === "onField" ||
      outPlayer?.fieldStatus === "onFieldGk";

    return Boolean(inOnField && outOnField);
  },

  // ==================== PENDING SUB QUERIES ====================

  getPendingSubs: async () => {
    const gameId = useGameStore.getState().game?.game_id;
    if (!gameId) return [];

    try {
      const pendingSubs = await apiFetch<GameSub[]>(
        "game_subs",
        "GET",
        null,
        null,
        {
          filters: { game_id: gameId, sub_time_is_null: true },
        },
      );
      return pendingSubs.map((sub) => ({
        subId: sub.id,
        inPlayerId: sub.in_player_id,
        outPlayerId: sub.out_player_id,
        gkSub: sub.gk_sub === 1,
        period: sub.period,
        isComplete: sub.in_player_id !== null && sub.out_player_id !== null,
      }));
    } catch (error) {
      console.error("Error fetching pending subs:", error);
      return [];
    }
  },

  getPendingSubsSync: () => {
    const allSubs: PendingSub[] = [];
    const seenSubIds = new Set<string | number>();
    const players = useGamePlayersStore.getState().players;

    players.forEach((player) => {
      (player.ins || []).forEach((sub) => {
        if (sub.gameTime === null && !seenSubIds.has(sub.subId)) {
          seenSubIds.add(sub.subId);
          allSubs.push({
            subId: sub.subId,
            inPlayerId: player.playerGameId,
            outPlayerId: null,
            gkSub: sub.gkSub,
            isComplete: false,
          });
        }
      });

      (player.outs || []).forEach((sub) => {
        if (sub.gameTime === null) {
          const existing = allSubs.find((s) => s.subId === sub.subId);
          if (existing) {
            existing.outPlayerId = player.playerGameId;
          } else if (!seenSubIds.has(sub.subId)) {
            seenSubIds.add(sub.subId);
            allSubs.push({
              subId: sub.subId,
              inPlayerId: null,
              outPlayerId: player.playerGameId,
              gkSub: sub.gkSub,
              isComplete: false,
            });
          }
        }
      });
    });

    return allSubs.map((sub) => ({
      ...sub,
      isComplete: sub.inPlayerId !== null && sub.outPlayerId !== null,
    }));
  },

  // ==================== CREATE PENDING SUB (FIXED) ====================

  createPendingSub: async (
    inPlayerId = null,
    outPlayerId = null,
    isGkSub = false,
  ) => {
    const gameId = useGameStore.getState().game?.game_id;
    if (!gameId) {
      console.error("No active game");
      return null;
    }

    // Auto-detect if this is a GK sub
    if (!isGkSub && (inPlayerId || outPlayerId)) {
      isGkSub = await get().isGkSubstitution(inPlayerId, outPlayerId);
    }

    try {
      const sub = await apiFetch<GameSub>("game_subs", "POST", {
        game_id: gameId,
        in_player_id: inPlayerId,
        out_player_id: outPlayerId,
        sub_time: null,
        period: useGameStore.getState().getCurrentPeriodNumber(),
        gk_sub: isGkSub ? 1 : 0,
      });

      const playersStore = useGamePlayersStore.getState();
      const calculateFieldStatus = playersStore.calculateFieldStatus;

      // Update players with the new sub - CRITICAL: Do this in ONE operation
      playersStore.setPlayers(
        playersStore.players.map((player) => {
          let updatedPlayer: Player = { ...player };

          // Add to ins
          if (inPlayerId && player.playerGameId === inPlayerId) {
            updatedPlayer = {
              ...updatedPlayer,
              ins: [
                ...(player.ins || []),
                { gameTime: null, subId: sub.id, gkSub: isGkSub },
              ],
            };
          }

          // Add to outs
          if (outPlayerId && player.playerGameId === outPlayerId) {
            updatedPlayer = {
              ...updatedPlayer,
              outs: [
                ...(player.outs || []),
                { gameTime: null, subId: sub.id, gkSub: isGkSub },
              ],
            };
          }

          // Calculate subStatus for this player
          const pendingIns = (updatedPlayer.ins || []).filter(
            (s) => s.gameTime === null,
          );
          const pendingOuts = (updatedPlayer.outs || []).filter(
            (s) => s.gameTime === null,
          );

          const subStatus = computeSubStatus(
            pendingIns.length,
            pendingOuts.length,
          );

          // Recalculate field status if ins or outs changed
          const hasChanged =
            updatedPlayer.ins !== player.ins ||
            updatedPlayer.outs !== player.outs;

          return {
            ...updatedPlayer,
            subStatus,
            fieldStatus: hasChanged
              ? calculateFieldStatus(updatedPlayer)
              : player.fieldStatus,
          };
        }),
      );

      // ❌ DO NOT CALL updateAllSubStatuses - it overwrites everything!
      // await playersStore.updateAllSubStatuses(gameId);

      return sub;
    } catch (error) {
      console.error("Error creating pending sub:", error);
      return null;
    }
  },

  // ==================== UPDATE PENDING SUB ====================

  updatePendingSub: async (subId, updates) => {
    try {
      const currentSubs = await apiFetch<GameSub[] | GameSub>(
        "game_subs",
        "GET",
        null,
        null,
        {
          filters: { id: subId },
        },
      );
      const currentSub = Array.isArray(currentSubs)
        ? currentSubs[0]
        : currentSubs;

      if (!currentSub) {
        console.error("Sub not found");
        return null;
      }

      const newInPlayerId = updates.in_player_id ?? currentSub.in_player_id;
      const newOutPlayerId = updates.out_player_id ?? currentSub.out_player_id;

      // Auto-detect if this should be a GK sub
      const shouldBeGkSub = await get().isGkSubstitution(
        newInPlayerId,
        newOutPlayerId,
      );

      // Update gk_sub flag
      updates.gk_sub = shouldBeGkSub ? 1 : 0;

      // Update in database
      await apiFetch(`game_subs?id=${subId}`, "PUT", updates);

      // Fetch the updated sub
      const updatedSubs = await apiFetch<GameSub[] | GameSub>(
        "game_subs",
        "GET",
        null,
        null,
        {
          filters: { id: subId },
        },
      );
      const updatedSub = Array.isArray(updatedSubs)
        ? updatedSubs[0]
        : updatedSubs;

      if (!updatedSub) {
        console.error("No sub found after update");
        return null;
      }

      const playersStore = useGamePlayersStore.getState();
      const calculateFieldStatus = playersStore.calculateFieldStatus;

      // Update in ONE operation to avoid race conditions
      playersStore.setPlayers(
        playersStore.players.map((player) => {
          let updatedPlayer: Player = { ...player };

          // Remove old sub from all players
          updatedPlayer = {
            ...updatedPlayer,
            ins: (player.ins || []).filter((s) => s.subId !== subId),
            outs: (player.outs || []).filter((s) => s.subId !== subId),
          };

          // Add updated sub to appropriate players
          if (
            updatedSub.in_player_id &&
            player.playerGameId === updatedSub.in_player_id
          ) {
            updatedPlayer.ins = [
              ...updatedPlayer.ins,
              {
                gameTime: updatedSub.sub_time,
                subId: updatedSub.id,
                gkSub: updatedSub.gk_sub === 1,
              },
            ];
          }

          if (
            updatedSub.out_player_id &&
            player.playerGameId === updatedSub.out_player_id
          ) {
            updatedPlayer.outs = [
              ...updatedPlayer.outs,
              {
                gameTime: updatedSub.sub_time,
                subId: updatedSub.id,
                gkSub: updatedSub.gk_sub === 1,
              },
            ];
          }

          // Calculate subStatus
          const pendingIns = updatedPlayer.ins.filter(
            (s) => s.gameTime === null,
          );
          const pendingOuts = updatedPlayer.outs.filter(
            (s) => s.gameTime === null,
          );

          const subStatus = computeSubStatus(
            pendingIns.length,
            pendingOuts.length,
          );

          return {
            ...updatedPlayer,
            subStatus,
            fieldStatus: calculateFieldStatus(updatedPlayer),
          };
        }),
      );

      // ❌ DO NOT CALL updateAllSubStatuses
      // await playersStore.updateAllSubStatuses(gameStore.getState().game?.game_id);

      return updatedSub;
    } catch (error) {
      console.error("Error updating pending sub:", error);
      return null;
    }
  },

  // ==================== CONFIRM SUB ====================

  confirmSub: async (subId) => {
    const gameStore = useGameStore.getState();
    const gameStage = gameStore.getGameStage();

    let gameTime: number;

    if (gameStage === "between_periods") {
      console.log("Sub will be confirmed at start of next period");
      return;
    } else {
      gameTime = gameStore.getGameTime();
    }

    try {
      // Get the sub details
      const subs = await apiFetch<GameSub[] | GameSub>(
        "game_subs",
        "GET",
        null,
        null,
        {
          filters: { id: subId },
        },
      );
      const sub = Array.isArray(subs) ? subs[0] : subs;

      if (!sub) {
        console.error("Sub not found");
        return;
      }

      const isGkSub = sub.gk_sub === 1;

      // Confirm the sub (set sub_time)
      await apiFetch(`game_subs?id=${subId}`, "PUT", {
        sub_time: gameTime,
      });

      // Update ins/outs in player state - ONE operation
      const playersStore = useGamePlayersStore.getState();
      const calculateFieldStatus = playersStore.calculateFieldStatus;

      playersStore.setPlayers(
        playersStore.players.map((player) => {
          const updatedIns = (player.ins || []).map((s) =>
            s.subId === subId ? { ...s, gameTime } : s,
          );

          const updatedOuts = (player.outs || []).map((s) =>
            s.subId === subId ? { ...s, gameTime } : s,
          );

          const hasUpdatedIn = updatedIns.some(
            (s) => s.subId === subId && s.gameTime !== null,
          );
          const hasUpdatedOut = updatedOuts.some(
            (s) => s.subId === subId && s.gameTime !== null,
          );

          if (hasUpdatedIn || hasUpdatedOut) {
            const updatedPlayer: Player = {
              ...player,
              ins: updatedIns,
              outs: updatedOuts,
            };

            // Calculate subStatus
            const pendingIns = updatedIns.filter((s) => s.gameTime === null);
            const pendingOuts = updatedOuts.filter((s) => s.gameTime === null);

            const subStatus = computeSubStatus(
              pendingIns.length,
              pendingOuts.length,
            );

            return {
              ...updatedPlayer,
              subStatus,
              fieldStatus: calculateFieldStatus(updatedPlayer),
            };
          }

          return player;
        }),
      );

      // ❌ DO NOT CALL updateAllSubStatuses
      // await playersStore.updateAllSubStatuses(gameStore.game?.game_id);

      console.log(
        `Confirmed ${isGkSub ? "GK " : ""}sub ${subId} at game time ${gameTime} seconds`,
      );
    } catch (error) {
      console.error("Error confirming sub:", error);
    }
  },

  // ==================== CONFIRM ALL PENDING SUBS ====================

  confirmAllPendingSubs: async () => {
    const gameStore = useGameStore.getState();
    const gameStage = gameStore.getGameStage();

    const pendingSubs = get().getPendingSubsSync();
    const completeSubs = pendingSubs.filter((sub) => sub.isComplete);
    const incompleteSubs = pendingSubs.filter((sub) => !sub.isComplete);

    if (completeSubs.length === 0 && incompleteSubs.length === 0) {
      console.log("No subs to confirm");
      return { confirmed: 0, errors: [] };
    }

    if (gameStage === "between_periods") {
      console.log("Subs will be confirmed at start of next period");
      return {
        confirmed: 0,
        pending: completeSubs.length + incompleteSubs.length,
      };
    }

    // Confirm all subs (complete and incomplete)
    const allSubsToConfirm = [...completeSubs, ...incompleteSubs];

    const results = await Promise.allSettled(
      allSubsToConfirm.map((sub) => get().confirmSub(sub.subId)),
    );

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => (r.reason?.message as string) || "Unknown error");

    const confirmed = results.filter((r) => r.status === "fulfilled").length;

    return { confirmed, errors };
  },

  // ==================== CANCEL SUB ====================

  cancelSub: async (subId) => {
    try {
      // Get the sub first to check if it exists and get details
      const subs = await apiFetch<GameSub[] | GameSub>(
        "game_subs",
        "GET",
        null,
        null,
        {
          filters: { id: subId },
        },
      );
      const sub = Array.isArray(subs) ? subs[0] : subs;

      if (!sub) {
        console.error("Sub not found");
        return;
      }

      await apiFetch(`game_subs?id=${subId}`, "DELETE");

      const playersStore = useGamePlayersStore.getState();
      const calculateFieldStatus = playersStore.calculateFieldStatus;

      playersStore.setPlayers(
        playersStore.players.map((player) => {
          const updatedIns = (player.ins || []).filter(
            (s) => s.subId !== subId,
          );
          const updatedOuts = (player.outs || []).filter(
            (s) => s.subId !== subId,
          );

          if (
            updatedIns.length !== player.ins.length ||
            updatedOuts.length !== player.outs.length
          ) {
            const updatedPlayer: Player = {
              ...player,
              ins: updatedIns,
              outs: updatedOuts,
            };

            // Calculate subStatus
            const pendingIns = updatedIns.filter((s) => s.gameTime === null);
            const pendingOuts = updatedOuts.filter((s) => s.gameTime === null);

            const subStatus = computeSubStatus(
              pendingIns.length,
              pendingOuts.length,
            );

            return {
              ...updatedPlayer,
              subStatus,
              fieldStatus: calculateFieldStatus(updatedPlayer),
            };
          }

          return player;
        }),
      );

      // ❌ DO NOT CALL updateAllSubStatuses
      // await playersStore.updateAllSubStatuses(useGameStore.getState().game?.game_id);

      console.log(`Cancelled sub ${subId}`);
    } catch (error) {
      console.error("Error cancelling sub:", error);
    }
  },
}));

export default useGameSubsStore;
