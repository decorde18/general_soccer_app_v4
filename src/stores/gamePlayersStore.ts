// stores/gamePlayersStore.ts
// Core player data management - loading, basic updates, field status
// UPDATED: Added goalkeeperTime field to player objects
import { create } from "zustand";
import { apiFetch } from "@/app/api/fetcher";

// ==================== TYPES ====================

export type GameStatus =
  | "dressed"
  | "starter"
  | "goalkeeper"
  | "not_dressed"
  | "injured"
  | "suspended"
  | "unavailable";

export type FieldStatus =
  | "onBench"
  | "onField"
  | "onFieldGk"
  | "subbingIn"
  | "subbingOut"
  | "subbingOutGk";

export type SubStatus = "pendingBoth" | "pendingIn" | "pendingOut";

export interface PlayerSubEntry {
  gameTime: number | null;
  subId: string | number;
  gkSub: boolean;
}

export interface Player {
  // Identity
  id: string | number;
  playerGameId: string | number;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname: string | null;
  jerseyNumber: string | number | null;
  position: string | null;

  // Team Context
  teamId: string | number;
  teamSeasonId: string | number;
  homeAway: "home" | "away";

  // Game Status
  gameStatus: GameStatus;
  fieldStatus: FieldStatus;
  started: boolean;
  isGuest: boolean;

  // Substitution Tracking
  ins: PlayerSubEntry[];
  outs: PlayerSubEntry[];
  subStatus: SubStatus | null;

  // Offensive Stats
  goals: number;
  penaltyGoals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;

  // Goalkeeper Stats
  saves: number;
  goalsAgainst: number;
  penaltiesFaced: number;
  penaltySaves: number;
  cleanSheet: number;

  // Disciplinary
  yellowCards: number;
  redCards: number;

  // Fouls
  foulsCommitted: number;
  foulsDrawn: number;

  // Time tracking
  goalkeeperTime: number;
  plusMinus: number;
}

/** Row shape from the `v_player_games` view (and the synthetic rows we build for newly-created players) */
interface PlayerGameRow {
  player_game_id: string | number;
  game_id: string | number;
  player_id: string | number;
  team_id: string | number;
  team_season_id: string | number;
  position_id: string | number | null;
  started: 0 | 1;
  game_status: GameStatus | null;
  is_guest: 0 | 1;
  first_name: string;
  last_name: string;
  full_name: string;
  nickname: string | null;
  jersey_number: string | number | null;
  primary_position: string | null;
  home_away: "home" | "away";
  created_at: string | null;
  modified_at: string | null;
}

/** Row shape from the `v_players` roster view */
interface RosterPlayerRow {
  player_id: string | number;
  team_season_id: string | number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  nickname?: string | null;
  jersey_number?: string | number | null;
  /** Some callers/rows use camelCase instead - kept for parity with the original fallback chain */
  jerseyNumber?: string | number | null;
  position?: string | null;
  is_guest?: 0 | 1 | boolean;
  player_is_active?: 0 | 1;
}

/** Row shape from the `v_player_game_stats_enhanced` view */
interface PlayerGameStatsRow {
  player_game_id: string | number;
  goals?: number;
  penalty_goals?: number;
  assists?: number;
  shots?: number;
  shots_on_target?: number;
  saves?: number;
  goals_against?: number;
  penalties_faced?: number;
  penalty_saves?: number;
  clean_sheet?: number;
  yellow_cards?: number;
  red_cards?: number;
  fouls_committed?: number;
  fouls_drawn?: number;
}

/** Row shape from the `game_subs` table */
interface GameSubRow {
  id: string | number;
  game_id: string | number;
  in_player_id: string | number | null;
  out_player_id: string | number | null;
  sub_time: number | null;
  gk_sub: 0 | 1;
  period?: number;
}

/** Row shape from the `games` table */
interface GameRow {
  id: string | number;
  home_team_season_id: string | number;
  away_team_season_id?: string | number;
}

/** Row returned by POSTing to `player_games` (and its auto-refetch) */
interface PlayerGameDbRow {
  id: string | number;
  game_id: string | number;
  player_id: string | number;
  /** Assumed populated server-side (derived from team_season_id) even though it isn't in the POST payload */
  team_id: string | number;
  team_season_id: string | number;
  position_id: string | number | null;
  started: 0 | 1;
  game_status: GameStatus;
  is_guest: 0 | 1;
}

type PlusMinusMap = Record<string | number, number>;
type GoalkeeperTimeMap = Record<string | number, number>;

export interface PendingSubBuckets {
  pendingIn: Player[];
  pendingOut: Player[];
  pendingBoth: Player[];
}

export interface GamePlayersState {
  // State
  players: Player[];
  isLoading: boolean;
  error: string | null;

  // Initialization
  loadPlayers: (
    gameId: string | number,
    teamSeasonId: string | number,
  ) => Promise<Player[]>;
  createPlayerGamesFromRoster: (
    gameId: string | number,
    teamSeasonId: string | number,
    rosterPlayers?: RosterPlayerRow[] | null,
  ) => Promise<Player[]>;

  // Field status
  calculateFieldStatus: (
    player: Pick<Player, "ins" | "outs" | "gameStatus"> | null | undefined,
  ) => FieldStatus;

  // Basic updates
  setPlayers: (players: Player[]) => void;
  updatePlayer: (
    playerId: string | number,
    updates: Partial<Player>,
  ) => Promise<void>;
  updateFieldStatus: (
    playerId: string | number,
    newStatus?: FieldStatus,
  ) => void;
  updateGameStatus: (
    playerId: string | number,
    action: GameStatus,
  ) => Promise<void>;

  // Sub status management
  updateAllSubStatuses: (gameId: string | number | undefined) => Promise<void>;

  // Plus/minus management
  calculateAndUpdatePlusMinus: (gameId: string | number) => Promise<void>;
  updatePlayerPlusMinus: (playerId: string | number, plusMinus: number) => void;
  updateAllPlusMinus: (plusMinusMap: PlusMinusMap) => void;
  forceUpdate: () => void;

  // Goalkeeper time management
  calculateAndUpdateGoalkeeperTime: (gameId: string | number) => Promise<void>;
  updatePlayerGoalkeeperTime: (
    playerId: string | number,
    goalkeeperTime: number,
  ) => void;
  updateAllGoalkeeperTime: (gkTimeMap: GoalkeeperTimeMap) => void;

  // Query helpers
  getPlayersByFieldStatus: (fieldStatus: FieldStatus) => Player[];
  getPlayersByGameStatus: (gameStatus: GameStatus) => Player[];
  getPlayerById: (playerId: string | number) => Player | undefined;
  getPlayerByPlayerGameId: (
    playerGameId: string | number,
  ) => Player | undefined;
  getStarters: () => Player[];
  getBench: () => Player[];
  getCurrentGoalkeeper: () => Player | undefined;
  getPlayersWithPendingSubs: () => PendingSubBuckets;
  getPlayersWhoPlayedGoalkeeper: () => Player[];
}

const useGamePlayersStore = create<GamePlayersState>()((set, get) => ({
  // State
  players: [],
  isLoading: false,
  error: null,

  // ==================== INITIALIZATION ====================

  loadPlayers: async (gameId, teamSeasonId) => {
    set({ isLoading: true, error: null });

    try {
      const existingPlayerGames = await apiFetch<PlayerGameRow[]>(
        "v_player_games",
        "GET",
        null,
        null,
        { filters: { game_id: gameId, team_id: teamSeasonId } },
      );

      const teamPlayers =
        (await apiFetch<RosterPlayerRow[]>("v_players", "GET", null, null, {
          filters: {
            team_season_id: teamSeasonId,
            player_is_active: 1,
          },
        })) || [];

      const rosterLookup = new Map<string | number, RosterPlayerRow>(
        teamPlayers.map((player) => [player.player_id, player]),
      );

      const missingPlayers = teamPlayers.filter(
        (p) => !existingPlayerGames.some((pg) => pg.player_id === p.player_id),
      );

      let createdPlayers: Player[] = [];
      if (missingPlayers.length > 0) {
        console.log(
          `Creating ${missingPlayers.length} missing player_games for game ${gameId}...`,
        );
        createdPlayers = await get().createPlayerGamesFromRoster(
          gameId,
          teamSeasonId,
          missingPlayers,
        );
      }

      const allPlayerGames: PlayerGameRow[] = [
        ...existingPlayerGames,
        ...createdPlayers.map(
          (pg): PlayerGameRow => ({
            player_game_id: pg.playerGameId,
            // FIX: `pg` is a `Player`, which has no `gameId` field (the original
            // JS read `pg.gameId`, which was always undefined) - use the
            // `gameId` this function was called with instead.
            game_id: gameId,
            player_id: pg.id,
            team_id: pg.teamId,
            team_season_id: pg.teamSeasonId,
            position_id: null,
            started: pg.started ? 1 : 0,
            game_status: pg.gameStatus,
            is_guest: pg.isGuest ? 1 : 0,
            first_name: pg.firstName,
            last_name: pg.lastName,
            full_name: pg.fullName,
            nickname: pg.nickname,
            jersey_number: pg.jerseyNumber,
            primary_position: pg.position,
            home_away: pg.homeAway,
            // FIX: `team_season_id` was listed twice in the original object
            // literal - TypeScript rejects duplicate object keys outright
            // (TS1117), so the second occurrence has been removed.
            created_at: null,
            modified_at: null,
          }),
        ),
      ];

      const allStats = await apiFetch<PlayerGameStatsRow[]>(
        "v_player_game_stats_enhanced",
        "GET",
        null,
        null,
        { filters: { game_id: gameId } },
      );
      const allSubs = await apiFetch<GameSubRow[]>(
        "game_subs",
        "GET",
        null,
        null,
        {
          filters: { game_id: gameId },
        },
      );
      const pendingSubs = allSubs.filter((sub) => sub.sub_time === null);
      const confirmedSubs = allSubs.filter((sub) => sub.sub_time !== null);

      const players: Player[] = allPlayerGames.map((pg) => {
        const playerIns: PlayerSubEntry[] = confirmedSubs
          .filter((sub) => sub.in_player_id === pg.player_game_id)
          .map((sub) => ({
            gameTime: sub.sub_time,
            subId: sub.id,
            gkSub: sub.gk_sub === 1,
          }));

        const playerOuts: PlayerSubEntry[] = confirmedSubs
          .filter((sub) => sub.out_player_id === pg.player_game_id)
          .map((sub) => ({
            gameTime: sub.sub_time,
            subId: sub.id,
            gkSub: sub.gk_sub === 1,
          }));

        const playerPendingIn = pendingSubs.find(
          (sub) => sub.in_player_id === pg.player_game_id,
        );
        const playerPendingOut = pendingSubs.find(
          (sub) => sub.out_player_id === pg.player_game_id,
        );

        if (playerPendingIn) {
          playerIns.push({
            gameTime: null,
            subId: playerPendingIn.id,
            gkSub: playerPendingIn.gk_sub === 1,
          });
        }
        if (playerPendingOut) {
          playerOuts.push({
            gameTime: null,
            subId: playerPendingOut.id,
            gkSub: playerPendingOut.gk_sub === 1,
          });
        }

        let subStatus: SubStatus | null = null;
        if (playerPendingIn && playerPendingOut) {
          subStatus = "pendingBoth";
        } else if (playerPendingIn) {
          subStatus = "pendingIn";
        } else if (playerPendingOut) {
          subStatus = "pendingOut";
        }

        const playerStats = allStats.find(
          (s) => s.player_game_id === pg.player_game_id,
        );

        const rosterPlayer = rosterLookup.get(pg.player_id);

        const playerBase: Omit<Player, "fieldStatus"> = {
          // Identity
          id: pg.player_id,
          playerGameId: pg.player_game_id,
          firstName: pg.first_name,
          lastName: pg.last_name,
          fullName: pg.full_name,
          nickname: pg.nickname,
          jerseyNumber:
            pg.jersey_number ??
            rosterPlayer?.jersey_number ??
            rosterPlayer?.jerseyNumber ??
            null,
          position: pg.primary_position,

          // Team Context
          teamId: pg.team_id,
          teamSeasonId: pg.team_season_id,
          homeAway: pg.home_away,

          // Game Status
          gameStatus: pg.game_status || "dressed",
          started: pg.started === 1,
          isGuest: pg.is_guest === 1,

          // Substitution Tracking
          ins: playerIns,
          outs: playerOuts,
          subStatus,

          // All Stats from Enhanced View
          // Offensive Stats
          goals: playerStats?.goals || 0,
          penaltyGoals: playerStats?.penalty_goals || 0,
          assists: playerStats?.assists || 0,
          shots: playerStats?.shots || 0,
          shotsOnTarget: playerStats?.shots_on_target || 0,

          // Goalkeeper Stats
          saves: playerStats?.saves || 0,
          goalsAgainst: playerStats?.goals_against || 0,
          penaltiesFaced: playerStats?.penalties_faced || 0,
          penaltySaves: playerStats?.penalty_saves || 0,
          cleanSheet: playerStats?.clean_sheet || 0,

          // Disciplinary
          yellowCards: playerStats?.yellow_cards || 0,
          redCards: playerStats?.red_cards || 0,

          // Fouls
          foulsCommitted: playerStats?.fouls_committed || 0,
          foulsDrawn: playerStats?.fouls_drawn || 0,

          // Time tracking (initialized to 0, calculated separately)
          goalkeeperTime: 0,
          plusMinus: 0,
        };

        const fieldStatus = get().calculateFieldStatus(playerBase);

        return { ...playerBase, fieldStatus };
      });

      set({ players, isLoading: false });

      // Calculate plus/minus and goalkeeper time for all players after loading
      get().calculateAndUpdatePlusMinus(gameId);
      get().calculateAndUpdateGoalkeeperTime(gameId);

      return players;
    } catch (error) {
      console.error("Error loading players:", error);
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
      return [];
    }
  },

  createPlayerGamesFromRoster: async (
    gameId,
    teamSeasonId,
    rosterPlayers = null,
  ) => {
    try {
      const game = await apiFetch<GameRow>("games", "GET", null, gameId);
      if (!game) throw new Error("Game not found");

      const teamPlayers =
        rosterPlayers ||
        (await apiFetch<RosterPlayerRow[]>("v_players", "GET", null, null, {
          filters: {
            team_season_id: teamSeasonId,
            player_is_active: 1,
          },
        })) ||
        [];

      const createdPlayerGames = await Promise.all(
        teamPlayers.map((p) =>
          apiFetch<PlayerGameDbRow>("player_games", "POST", {
            game_id: gameId,
            player_id: p.player_id,
            team_season_id: p.team_season_id,
            position_id: null,
            started: 0,
            game_status: "dressed",
            is_guest: p.is_guest === 1 || p.is_guest === true ? 1 : 0,
          }),
        ),
      );

      const players: Player[] = createdPlayerGames.map((pg, i) => {
        const p = teamPlayers[i];
        return {
          // Identity
          id: pg.player_id,
          playerGameId: pg.id,
          firstName: p.first_name || "",
          lastName: p.last_name || "",
          fullName: p.full_name || "",
          nickname: p.nickname ?? null,
          jerseyNumber: p.jersey_number ?? p.jerseyNumber ?? null,
          position: p.position ?? null,

          // Team Context
          teamId: pg.team_id,
          teamSeasonId: p.team_season_id,
          homeAway:
            p.team_season_id === game.home_team_season_id ? "home" : "away",

          // Game Status
          gameStatus: "dressed",
          fieldStatus: "onBench",
          started: false,
          isGuest: false,

          // Substitution Tracking
          ins: [],
          outs: [],
          subStatus: null,

          // Initialize All Stats to Zero
          // Offensive Stats
          goals: 0,
          penaltyGoals: 0,
          assists: 0,
          shots: 0,
          shotsOnTarget: 0,

          // Goalkeeper Stats
          saves: 0,
          goalsAgainst: 0,
          penaltiesFaced: 0,
          penaltySaves: 0,
          cleanSheet: 0,

          // Disciplinary
          yellowCards: 0,
          redCards: 0,

          // Fouls
          foulsCommitted: 0,
          foulsDrawn: 0,

          // Time tracking
          goalkeeperTime: 0,
          plusMinus: 0,
        };
      });

      console.log(`Created ${players.length} player_games for game ${gameId}`);
      return players;
    } catch (error) {
      console.error("Error creating player_games from roster:", error);
      throw error;
    }
  },

  // ==================== FIELD STATUS CALCULATION ====================

  calculateFieldStatus: (player) => {
    if (!player) return "onBench";

    const ins = player.ins || [];
    const outs = player.outs || [];

    const lastIn = ins[ins.length - 1];
    const lastOut = outs[outs.length - 1];
    const hasPendingIn = Boolean(lastIn && lastIn.gameTime === null);
    const hasPendingOut = Boolean(lastOut && lastOut.gameTime === null);

    if (hasPendingIn) return "subbingIn";
    if (hasPendingOut) {
      return player.gameStatus === "goalkeeper" ? "subbingOutGk" : "subbingOut";
    }

    const completedIns = ins.filter((sub) => sub.gameTime !== null).length;
    const completedOuts = outs.filter((sub) => sub.gameTime !== null).length;

    const isStarter = (["starter", "goalkeeper"] as GameStatus[]).includes(
      player.gameStatus,
    );
    const effectiveIns = isStarter ? completedIns + 1 : completedIns;

    const isCurrentlyOnField = effectiveIns > completedOuts;

    if (player.gameStatus === "goalkeeper") {
      return isCurrentlyOnField ? "onFieldGk" : "onBench";
    }

    return isCurrentlyOnField ? "onField" : "onBench";
  },

  // ==================== BASIC UPDATES ====================

  setPlayers: (players) => set({ players }),

  updatePlayer: async (playerId, updates) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, ...updates } : player,
      ),
    }));

    const player = get().players.find((p) => p.id === playerId);
    if (player?.playerGameId) {
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.gameStatus) dbUpdates.game_status = updates.gameStatus;
        if (updates.started !== undefined)
          dbUpdates.started = updates.started ? 1 : 0;

        await apiFetch(
          `player_games?id=${player.playerGameId}`,
          "PUT",
          dbUpdates,
        );
      } catch (error) {
        console.error("Error updating player_game:", error);
      }
    }
  },

  updateFieldStatus: (playerId, newStatus) => {
    const fieldStatusUpdates: Record<FieldStatus, FieldStatus> = {
      onField: "subbingOut",
      onBench: "subbingIn",
      subbingOut: "onField",
      subbingIn: "onBench",
      subbingOutGk: "onFieldGk",
      onFieldGk: "subbingOutGk",
    };

    const player = get().players.find((p) => p.id === playerId);
    if (!player) return;

    const updatedStatus = newStatus || fieldStatusUpdates[player.fieldStatus];
    get().updatePlayer(playerId, { fieldStatus: updatedStatus });
  },

  updateGameStatus: async (playerId, action) => {
    const players = get().players;
    const currentPlayer = players.find((p) => p.id === playerId);
    if (!currentPlayer) return;

    if (action === "goalkeeper") {
      const updates: Promise<void>[] = [];

      if (currentPlayer.gameStatus === "goalkeeper") {
        const newGameStatus: GameStatus = "starter";
        updates.push(
          get().updatePlayer(playerId, {
            gameStatus: newGameStatus,
            fieldStatus: get().calculateFieldStatus({
              ...currentPlayer,
              gameStatus: newGameStatus,
            }),
          }),
        );
      } else {
        for (const p of players) {
          if (p.id !== playerId && p.gameStatus === "goalkeeper") {
            const newGameStatus: GameStatus = "starter";
            updates.push(
              get().updatePlayer(p.id, {
                gameStatus: newGameStatus,
                fieldStatus: get().calculateFieldStatus({
                  ...p,
                  gameStatus: newGameStatus,
                }),
              }),
            );
          }
        }
        const newGameStatus: GameStatus = "goalkeeper";
        updates.push(
          get().updatePlayer(playerId, {
            gameStatus: newGameStatus,
            fieldStatus: get().calculateFieldStatus({
              ...currentPlayer,
              gameStatus: newGameStatus,
            }),
          }),
        );
      }

      await Promise.all(updates);
      return;
    }

    const newGameStatus = action;
    await get().updatePlayer(playerId, {
      gameStatus: newGameStatus,
      fieldStatus: get().calculateFieldStatus({
        ...currentPlayer,
        gameStatus: newGameStatus,
      }),
    });
  },

  // ==================== SUB STATUS MANAGEMENT ====================

  updateAllSubStatuses: async (gameId) => {
    if (!gameId) return;

    try {
      const pendingSubs = await apiFetch<GameSubRow[]>(
        "game_subs",
        "GET",
        null,
        null,
        {
          filters: { game_id: gameId, sub_time_is_null: true },
        },
      );

      set((state) => ({
        players: state.players.map((player) => {
          const pendingIn = pendingSubs.find(
            (sub) => sub.in_player_id === player.playerGameId,
          );
          const pendingOut = pendingSubs.find(
            (sub) => sub.out_player_id === player.playerGameId,
          );

          let subStatus: SubStatus | null = null;
          if (pendingIn && pendingOut) {
            subStatus = "pendingBoth";
          } else if (pendingIn) {
            subStatus = "pendingIn";
          } else if (pendingOut) {
            subStatus = "pendingOut";
          }

          return { ...player, subStatus };
        }),
      }));
    } catch (error) {
      console.error("Error updating sub statuses:", error);
    }
  },

  // ==================== PLUS/MINUS MANAGEMENT ====================

  /**
   * Calculate and update plus/minus for all players
   * Called automatically on load and can be called manually after goals
   */
  calculateAndUpdatePlusMinus: async (gameId) => {
    try {
      const { default: useGamePlayerTimeStore } =
        await import("./gamePlayerTimeStore");
      const gamePlayerTimeStore = useGamePlayerTimeStore.getState() as any;

      const plusMinusMap = gamePlayerTimeStore.calculateAllPlusMinus(gameId);

      get().updateAllPlusMinus(plusMinusMap);

      // Force update to ensure React detects the change
      get().forceUpdate();
    } catch (error) {
      console.error("Error calculating plus/minus:", error);
    }
  },

  /**
   * Update plusMinus for a single player
   */
  updatePlayerPlusMinus: (playerId, plusMinus) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, plusMinus } : player,
      ),
    }));
  },

  /**
   * Update plusMinus for all players (bulk update)
   *
   * FIX: the original file defined `updateAllPlusMinus` twice in the same
   * object literal. In plain JS the second definition silently wins (the
   * first - which logged each change - was dead code); in TypeScript,
   * duplicate object keys are a hard compile error (TS1117). Kept the
   * version with logging and removed the duplicate.
   */
  updateAllPlusMinus: (plusMinusMap) => {
    set((state) => {
      const updatedPlayers = state.players.map((player) => {
        const newPlusMinus = plusMinusMap[player.id] ?? player.plusMinus ?? 0;

        // Log if there's a change
        if (player.plusMinus !== newPlusMinus) {
          console.log(
            `  ${player.fullName}: ${player.plusMinus} -> ${newPlusMinus}`,
          );
        }

        return {
          ...player,
          plusMinus: newPlusMinus,
        };
      });

      return { players: updatedPlayers };
    });
  },

  /**
   * Force a re-render by creating a new array reference
   */
  forceUpdate: () => {
    set((state) => ({
      players: [...state.players],
    }));
  },

  // ==================== GOALKEEPER TIME MANAGEMENT ====================

  /**
   * Calculate and update goalkeeper time for all players
   * Called automatically on load and can be called manually after GK subs
   */
  calculateAndUpdateGoalkeeperTime: async (gameId) => {
    try {
      const { default: useGameStore } = await import("./gameStore");
      const { default: useGamePlayerTimeStore } =
        await import("./gamePlayerTimeStore");

      const gameStore = useGameStore.getState();
      const gamePlayerTimeStore = useGamePlayerTimeStore.getState() as any;
      const currentGameTime = gameStore.getGameTime();

      const gkTimeMap = gamePlayerTimeStore.calculateAllGoalkeeperTime(
        gameId,
        currentGameTime,
      );
      get().updateAllGoalkeeperTime(gkTimeMap);
    } catch (error) {
      console.error("Error calculating goalkeeper time:", error);
    }
  },

  /**
   * Update goalkeeperTime for a single player
   */
  updatePlayerGoalkeeperTime: (playerId, goalkeeperTime) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, goalkeeperTime } : player,
      ),
    }));
  },

  /**
   * Update goalkeeperTime for all players (bulk update)
   */
  updateAllGoalkeeperTime: (gkTimeMap) => {
    set((state) => ({
      players: state.players.map((player) => ({
        ...player,
        goalkeeperTime: gkTimeMap[player.id] ?? player.goalkeeperTime ?? 0,
      })),
    }));
  },

  // ==================== QUERY HELPERS ====================

  getPlayersByFieldStatus: (fieldStatus) => {
    return get().players.filter((player) => player.fieldStatus === fieldStatus);
  },

  getPlayersByGameStatus: (gameStatus) => {
    return get().players.filter((player) => player.gameStatus === gameStatus);
  },

  getPlayerById: (playerId) => {
    return get().players.find((player) => player.id === playerId);
  },

  getPlayerByPlayerGameId: (playerGameId) => {
    return get().players.find((player) => player.playerGameId === playerGameId);
  },

  getStarters: () => {
    return get().players.filter(
      (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper",
    );
  },

  getBench: () => {
    return get().players.filter((p) => p.gameStatus === "dressed");
  },

  getCurrentGoalkeeper: () => {
    return get().players.find((p) => p.gameStatus === "goalkeeper");
  },

  getPlayersWithPendingSubs: () => {
    const players = get().players;
    return {
      pendingIn: players.filter((p) => p.subStatus === "pendingIn"),
      pendingOut: players.filter((p) => p.subStatus === "pendingOut"),
      pendingBoth: players.filter((p) => p.subStatus === "pendingBoth"),
    };
  },

  /**
   * Get all players who have spent time as goalkeeper this game
   */
  getPlayersWhoPlayedGoalkeeper: () => {
    return get().players.filter((p) => p.goalkeeperTime > 0);
  },
}));

export default useGamePlayersStore;
