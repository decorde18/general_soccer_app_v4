// stores/gameStore.ts
import { create } from "zustand";
import { apiFetch } from "@/app/api/fetcher";
import {
  calculateGameTime,
  calculatePeriodTime,
} from "@/lib/utils/dateTimeUtils";
import useGameSubsStore from "./gameSubsStore";
import useGamePlayersStore from "./gamePlayersStore";
import {
  GAME_STAGES,
  type Game,
  type GameStage,
  type GamePeriod,
  type GameEventMajor,
  type GameEventGoal,
  type GameEventDiscipline,
  type GameEventPenalty,
  type PlayerAction,
  type GameEventTeam,
  type TeamStatTotals,
  type GameSettings,
  type OtConfig,
} from "@/types/game";

type EventTypeKey =
  | "major"
  | "goal"
  | "discipline"
  | "penalty"
  | "player_action"
  | "team";

const EVENT_TABLE_MAP: Record<EventTypeKey, string> = {
  major: "game_events_major",
  goal: "game_events_goals",
  discipline: "game_events_discipline",
  penalty: "game_events_penalties",
  player_action: "game_events_player_actions",
  team: "game_events_team",
};

const DEFAULT_GAME_SETTINGS: GameSettings = {
  playersOnField: 11,
  periodCount: 2,
  periodDuration: 2400, // 40 minutes in seconds
  hasOvertime: false,
  overtimePeriods: 2,
  overtimeDuration: 600, // 10 minutes in seconds
  hasShootout: true,
  clockDirection: "up",
  reentryRule: "unlimited",
  autoStopClockOnMajorEvent: true,
  clockRuleProfile: "NFHS",
};

interface CalculateTeamStatTotalsInput {
  gameEventsTeam?: GameEventTeam[];
  playerActions?: PlayerAction[];
  isHome: boolean;
  home_team_season_id: number | string;
  away_team_season_id: number | string;
  [key: string]: unknown;
}

export interface GameStoreState {
  // State
  game: Game | null;
  otConfig: OtConfig | null;
  isLoading: boolean;
  error: string | null;

  // Initialization
  initializeGame: (
    gameId: number | string,
    teamSeasonId: number | string,
  ) => Promise<Game | { notFound: true } | null>;
  updateGame: (updates: Partial<Game>) => void;

  // Stage calculation
  getGameStage: () => GameStage;
  syncGameStatus: () => Promise<void>;

  // Time calculations
  getGameTime: () => number;
  getPeriodTime: (atMs?: number) => number;
  getScoreboardTime: (atMs?: number) => number;
  getPeriodDuration: (periodIndex: number) => number;

  // Game actions
  startNextPeriod: () => Promise<void>;
  endPeriod: () => Promise<void>;
  startStoppage: (reason?: string, eventType?: string) => Promise<void>;
  endStoppage: (stoppageId: number | string) => Promise<void>;
  endGame: () => Promise<void>;

  // Manual management
  deletePeriod: (periodId: number | string) => Promise<void>;
  updatePeriod: (
    periodId: number | string,
    updates: { start_time?: number; end_time?: number | null },
  ) => Promise<void>;
  updateEvent: (
    eventId: number | string,
    updates: Record<string, unknown>,
    eventType?: EventTypeKey,
  ) => Promise<void>;
  deleteSub: (subId: number | string) => Promise<void>;
  updateSub: (
    subId: number | string,
    updates: Record<string, unknown>,
  ) => Promise<void>;

  // Optimistic update methods
  addTeamEvent: (teamEvent: GameEventTeam) => void;
  replaceTeamEvent: (oldId: number | string, newEvent: GameEventTeam) => void;
  removeTeamEvent: (eventId: number | string) => void;
  deleteEvent: (
    eventId: number | string,
    eventType?: EventTypeKey,
  ) => Promise<void>;

  addGoalEvent: (goalEvent: GameEventGoal, majorEvent: GameEventMajor) => void;
  replaceGoalEvent: (
    optimisticGoalId: number | string,
    realGoalEvent: GameEventGoal,
    optimisticMajorId: number | string,
    realMajorEvent: GameEventMajor,
  ) => void;
  removeGoalEvent: (
    goalId: number | string,
    majorEventId: number | string,
  ) => void;

  addDisciplineEvent: (
    disciplineEvent: GameEventDiscipline,
    majorEvent: GameEventMajor,
  ) => void;
  replaceDisciplineEvent: (
    optimisticCardId: number | string,
    realCardEvent: GameEventDiscipline,
    optimisticMajorId: number | string,
    realMajorEvent: GameEventMajor,
  ) => void;
  removeDisciplineEvent: (
    cardId: number | string,
    majorEventId: number | string,
  ) => void;

  addPenaltyEvent: (
    penaltyEvent: GameEventPenalty,
    majorEvent: GameEventMajor,
    goalEvent?: GameEventGoal | null,
    saveAction?: PlayerAction | null,
  ) => void;

  addMajorEvent: (majorEvent: any) => void;
  addPlayerAction: (action: PlayerAction) => void;
  replacePlayerAction: (
    optimisticActionId: number | string,
    realAction: PlayerAction,
  ) => void;
  removePlayerAction: (actionId: number | string) => void;

  calculateTeamStatTotals: (
    gameData?: CalculateTeamStatTotalsInput,
  ) => TeamStatTotals | Record<string, never>;

  // Helpers
  getCurrentPeriodNumber: () => number;
  getPeriodLabel: (periodIndex: number) => string;
  getCurrentPeriodLabel: () => string;

  GAME_STAGES: typeof GAME_STAGES;
}

const useGameStore = create<GameStoreState>((set, get) => {
  return {
    // State
    game: null,
    otConfig: null,
    isLoading: false,
    error: null,
    // ==================== INITIALIZATION ====================

    initializeGame: async (gameId, teamSeasonId) => {
      set({ isLoading: true, error: null });

      try {
        // Fetch game view and raw game record in parallel
        const [dbGameViewResult, rawGameResult] = await Promise.all([
          apiFetch("v_games", "GET", null, null, {
            filters: { game_id: gameId },
          }),
          apiFetch("games", "GET", null, null, {
            filters: { id: gameId },
          }),
        ]);

        const dbGameView = Array.isArray(dbGameViewResult) ? dbGameViewResult[0] : dbGameViewResult;
        const rawGameRecord = Array.isArray(rawGameResult) ? rawGameResult[0] : rawGameResult;

        if (!dbGameView && !rawGameRecord) {
          set({ error: "Game not found", isLoading: false });
          return { notFound: true };
        }

        const dbGame = { ...(rawGameRecord || {}), ...(dbGameView || {}) };

        // Fetch OT configuration
        const [otConfig]: OtConfig[] = await apiFetch(
          "games_overtimes",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          },
        );

        // Fetch existing periods (start_time and end_time are BIGINT Unix ms)
        const existingPeriods = await apiFetch(
          "game_periods",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          },
        );

        // Fetch subs
        const allSubs = await apiFetch("game_subs", "GET", null, null, {
          filters: { game_id: gameId },
        });
        const gameSubs = allSubs.filter(
          (s: { sub_time: number | null }) => s.sub_time !== null,
        );
        const pendingSubs = allSubs.filter(
          (s: { sub_time: number | null }) => s.sub_time === null,
        );

        // Fetch all game events in parallel
        let [
          rawGoals,
          rawDiscipline,
          rawPenalties,
          gameEventsMajor,
          playerActions,
          gameEventsTeam,
        ]: [
          any[],
          any[],
          any[],
          any[],
          any[],
          any[],
        ] = await Promise.all([
          apiFetch("v_game_events_goals_complete", "GET", null, null, {
            filters: { game_id: gameId },
          }).catch(() => []),
          apiFetch("v_game_events_discipline_complete", "GET", null, null, {
            filters: { game_id: gameId },
          }).catch(() => []),
          apiFetch("v_game_events_penalties_complete", "GET", null, null, {
            filters: { game_id: gameId },
          }).catch(() => []),
          apiFetch("game_events_major", "GET", null, null, {
            filters: { game_id: gameId },
          }).catch(() => []),
          apiFetch("game_events_player_actions", "GET", null, null, {
            filters: { game_id: gameId },
          }).catch(() => []),
          apiFetch("game_events_team", "GET", null, null, {
            filters: { game_id: gameId },
          }).catch(() => []),
        ]);

        // Fallback: If view query returns empty, fetch goals/discipline/penalties directly using major_event_id
        const majorIds = (gameEventsMajor || []).map((m: any) => Number(m.id));
        if ((!rawGoals || rawGoals.length === 0) && majorIds.length > 0) {
          const allGoals = await apiFetch("game_events_goals", "GET").catch(() => []);
          if (Array.isArray(allGoals)) {
            rawGoals = allGoals.filter((g: any) => majorIds.includes(Number(g.major_event_id)));
          }
        }
        if ((!rawDiscipline || rawDiscipline.length === 0) && majorIds.length > 0) {
          const allCards = await apiFetch("game_events_discipline", "GET").catch(() => []);
          if (Array.isArray(allCards)) {
            rawDiscipline = allCards.filter((d: any) => majorIds.includes(Number(d.major_event_id)));
          }
        }
        if ((!rawPenalties || rawPenalties.length === 0) && majorIds.length > 0) {
          const allPenalties = await apiFetch("game_events_penalties", "GET").catch(() => []);
          if (Array.isArray(allPenalties)) {
            rawPenalties = allPenalties.filter((p: any) => majorIds.includes(Number(p.major_event_id)));
          }
        }

        const gameEventsGoals = rawGoals || [];
        const gameEventsDiscipline = rawDiscipline || [];
        const gameEventsPenalties = rawPenalties || [];

        // Build opponent info
        const { home_team_season_id, away_team_season_id } = dbGame;
        const isHome = teamSeasonId == home_team_season_id;

        const opponent = {
          opponentId: isHome ? away_team_season_id : home_team_season_id,
          opponentClub: isHome ? dbGame.away_club_name : dbGame.home_club_name,
          opponentClubAbbreviation: isHome ? dbGame.awayClubAbbreviation : dbGame.homeClubAbbreviation,
          opponentTeamName: isHome
            ? dbGame.away_team_name
            : dbGame.home_team_name,
          opponentName: isHome
            ? `${dbGame.away_club_name} ${dbGame.away_team_name}`
            : `${dbGame.home_club_name} ${dbGame.home_team_name}`,
        };

        // Build game settings
        const settings: GameSettings = {
          ...DEFAULT_GAME_SETTINGS,
          playersOnField: (() => {
            if (dbGame.notes) {
              try {
                let parsed = JSON.parse(dbGame.notes);
                if (typeof parsed === "string") {
                  try { parsed = JSON.parse(parsed); } catch {}
                }
                if (typeof parsed === "object" && parsed !== null && typeof parsed.playersOnField === "number") {
                  return parsed.playersOnField;
                }
              } catch {}
            }
            const nodeName = dbGame.league_node_names || dbGame.league_name || "";
            if (nodeName.includes("7v7") || nodeName.includes("7-v-7") || nodeName.includes("U9") || nodeName.includes("U10")) return 7;
            if (nodeName.includes("9v9") || nodeName.includes("9-v-9") || nodeName.includes("U11") || nodeName.includes("U12")) return 9;
            if (nodeName.includes("5v5") || nodeName.includes("5-v-5")) return 5;
            return DEFAULT_GAME_SETTINGS.playersOnField;
          })(),
          periodCount: parseInt(dbGame.default_reg_periods) || 2,
          periodDuration: dbGame.period_duration !== undefined && dbGame.period_duration !== null
            ? Number(dbGame.period_duration)
            : DEFAULT_GAME_SETTINGS.periodDuration,
          hasOvertime: dbGame.ot_if_tied ?? (otConfig?.ot_if_tied === 1),
          overtimeDuration: dbGame.ot_duration !== undefined && dbGame.ot_duration !== null
            ? Number(dbGame.ot_duration)
            : (otConfig?.default_ot_1_minutes
                ? parseInt(String(otConfig.default_ot_1_minutes)) * 60
                : DEFAULT_GAME_SETTINGS.overtimeDuration),
          hasShootout: dbGame.so_if_tied ?? (otConfig?.so_if_tied === 1),
          reentryRule: (() => {
            if (dbGame.reentry_rule) return dbGame.reentry_rule;
            if (dbGame.notes) {
              try {
                let parsed = JSON.parse(dbGame.notes);
                if (typeof parsed === "string") {
                  try { parsed = JSON.parse(parsed); } catch {}
                }
                if (parsed && typeof parsed === "object" && parsed.reentryRule) {
                  return parsed.reentryRule;
                }
              } catch {
                if (dbGame.notes.includes("reentryRule:")) {
                  const match = dbGame.notes.match(/reentryRule:\s*([a_z_]+)/i);
                  if (match?.[1]) return match[1];
                }
              }
            }
            return DEFAULT_GAME_SETTINGS.reentryRule;
          })(),
          autoStopClockOnMajorEvent: (() => {
            if (dbGame.notes) {
              try {
                let parsed = JSON.parse(dbGame.notes);
                if (typeof parsed === "string") {
                  try { parsed = JSON.parse(parsed); } catch {}
                }
                if (parsed && typeof parsed === "object" && typeof parsed.autoStopClockOnMajorEvent === "boolean") {
                  return parsed.autoStopClockOnMajorEvent;
                }
              } catch {}
            }
            return DEFAULT_GAME_SETTINGS.autoStopClockOnMajorEvent;
          })(),
        };

        // Build periods array (all timestamps are Unix ms from DB BIGINT)
        const periods: GamePeriod[] = existingPeriods
          .sort(
            (a: { period_number: number }, b: { period_number: number }) =>
              a.period_number - b.period_number,
          )
          .map(
            (p: {
              id: number | string;
              period_number: number;
              start_time: number;
              end_time: number | null;
            }) => ({
              id: p.id,
              periodNumber: p.period_number,
              index: p.period_number - 1,
              startTime: p.start_time, // Unix ms
              endTime: p.end_time || null, // Unix ms or null
            }),
          );

        // Calculate scores based on goals
        const goalsFor = gameEventsGoals.filter(
          (g) => g.team_season_id == teamSeasonId,
        ).length;
        const goalsAgainst = gameEventsGoals.filter(
          (g) => g.team_season_id != teamSeasonId,
        ).length;

        // Determine current state
        const gameStartTime = periods.length > 0 ? periods[0].startTime : null;
        const currentPeriodIndex = periods.length > 0 ? periods.length - 1 : -1;

        // Calculate team stat totals
        const teamStatTotals = get().calculateTeamStatTotals({
          gameEventsTeam,
          playerActions,
          isHome,
          home_team_season_id,
          away_team_season_id,
        });

        const finalGame: Game = {
          ...dbGame,
          ...opponent,
          isHome,
          settings,
          periods,
          gameEventsGoals,
          gameEventsDiscipline,
          gameEventsPenalties,
          gameEventsMajor,
          playerActions,
          gameEventsTeam,
          currentPeriodIndex,
          gameStartTime,
          gameSubs,
          pendingSubs,
          goalsFor,
          goalsAgainst,
          ourName: isHome
            ? `${dbGame.home_club_name} ${dbGame.home_team_name}`
            : `${dbGame.away_club_name} ${dbGame.away_team_name}`,
          ourClubAbbreviation: isHome ? dbGame.homeClubAbbreviation : dbGame.awayClubAbbreviation,
          teamStatTotals: teamStatTotals as TeamStatTotals,

          // camelCase aliases for consistent component access
          homeTeamName: dbGame.home_team_name,
          awayTeamName: dbGame.away_team_name,
          startDate: dbGame.start_date,
          startTime: dbGame.start_time,
          locationName: dbGame.location_name,
          gameType: dbGame.game_type,
        };

        set({
          game: finalGame,
          otConfig,
          isLoading: false,
        });

        // Recalculate real-time player event stats (goals, assists, GA, cards)
        useGamePlayersStore.getState().recalculatePlayerStatsFromEvents(
          finalGame.gameEventsGoals,
          finalGame.gameEventsDiscipline
        );

        // Calculate and sync game stage/status
        await get().syncGameStatus();

        return finalGame;
      } catch (error) {
        console.error("Error loading game:", error);
        set({
          error: error instanceof Error ? error.message : "Error loading game",
          isLoading: false,
        });
        return null;
      }
    },

    updateGame: (updates) => {
      const currentGame = get().game;
      if (!currentGame) return;

      const updatedGame: Game = { ...currentGame, ...updates };

      // If we updated actions or events, recalculate the totals
      if (updates.playerActions || updates.gameEventsTeam) {
        updatedGame.teamStatTotals = get().calculateTeamStatTotals(
          updatedGame as unknown as CalculateTeamStatTotalsInput,
        ) as TeamStatTotals;
      }

      set({ game: updatedGame });
    },

    // ==================== GAME STAGE CALCULATION ====================

    getGameStage: () => {
      const game = get().game;
      if (!game?.gameStartTime) return GAME_STAGES.BEFORE_START;

      const currentPeriod = game.periods[game.currentPeriodIndex];

      // Check for active stoppage in major events
      const activeStoppage = game.gameEventsMajor.find(
        (s) =>
          s.end_time === null &&
          s.period === game.currentPeriodIndex + 1 &&
          s.clock_should_run === 0,
      );
      if (activeStoppage && currentPeriod && !currentPeriod.endTime) {
        return GAME_STAGES.IN_STOPPAGE;
      }

      // Check if currently in a period
      if (currentPeriod && !currentPeriod.endTime) {
        return GAME_STAGES.DURING_PERIOD;
      }

      // Calculate total periods including overtime
      const regularPeriods = game.settings.periodCount;
      const maxPeriods =
        regularPeriods +
        (game.settings.hasOvertime ? game.settings.overtimePeriods : 0);

      // Check if game should be over
      const allRegularPeriodsComplete =
        game.currentPeriodIndex >= regularPeriods - 1 && currentPeriod?.endTime;

      if (allRegularPeriodsComplete) {
        const isTied = game.goalsFor === game.goalsAgainst;

        if (isTied && game.settings.hasOvertime) {
          if (game.currentPeriodIndex >= maxPeriods - 1) {
            return GAME_STAGES.END_GAME;
          }
          return GAME_STAGES.BETWEEN_PERIODS;
        }

        return GAME_STAGES.END_GAME;
      }

      return GAME_STAGES.BETWEEN_PERIODS;
    },

    syncGameStatus: async () => {
      const game = get().game;
      if (!game) return;

      const stage = get().getGameStage();
      let newStatus = game.status;

      if (stage === GAME_STAGES.BEFORE_START) {
        newStatus = "scheduled";
      } else if (stage === GAME_STAGES.END_GAME) {
        newStatus = "completed";
      } else {
        newStatus = "in_progress";
      }

      // Update game stage in state
      get().updateGame({ gameStage: stage });

      // Update DB if status changed
      if (newStatus !== game.status) {
        try {
          await apiFetch(`games?id=${game.game_id}`, "PUT", {
            status: newStatus,
          });
          get().updateGame({ status: newStatus });
        } catch (error) {
          console.error("Error syncing game status:", error);
        }
      }
    },

    // ==================== TIME CALCULATIONS ====================

    getGameTime: () => {
      const game = get().game;
      if (!game || !game.gameStartTime) return 0;

      let currentMs: number | undefined;

      if (game.gameStage === GAME_STAGES.END_GAME && game.periods.length > 0) {
        const latestPeriod = game.periods.reduce<GamePeriod | null>(
          (latest, current) => {
            return !latest || current.periodNumber > latest.periodNumber
              ? current
              : latest;
          },
          null,
        );

        if (latestPeriod?.endTime) {
          currentMs = latestPeriod.endTime;
        }
      }

      if (!currentMs) {
        currentMs = Date.now();
      }

      return calculateGameTime(game.gameStartTime, currentMs);
    },

    getPeriodTime: (atMs?: number) => {
      const game = get().game;
      if (!game) return 0;

      const currentPeriod = game.periods[game.currentPeriodIndex];
      if (!currentPeriod?.startTime) return 0;

      const currentMs = atMs || currentPeriod.endTime || Date.now();

      const periodStoppages = (game.gameEventsMajor || [])
        .filter(
          (s) =>
            s.period === currentPeriod.periodNumber && s.clock_should_run === 0,
        )
        .map((e) => ({
          startTime: e.game_time,
          endTime: e.end_time,
        }));

      return calculatePeriodTime(
        currentPeriod.startTime,
        currentMs,
        periodStoppages,
      );
    },

    getScoreboardTime: (atMs?: number) => {
      return get().getPeriodTime(atMs);
    },

    getPeriodDuration: (periodIndex) => {
      const game = get().game;
      if (!game) return 0;

      const regularPeriods = game.settings.periodCount;
      return periodIndex < regularPeriods
        ? game.settings.periodDuration
        : game.settings.overtimeDuration;
    },

    // ==================== GAME ACTIONS ====================

    startNextPeriod: async () => {
      const game = get().game;
      if (!game) return;

      const nowMs = Date.now();
      const isFirstPeriod = game.periods.length === 0;
      const nextIndex = isFirstPeriod ? 0 : game.currentPeriodIndex + 1;
      const nextNumber = nextIndex + 1;

      try {
        const periodData = await apiFetch("game_periods", "POST", {
          game_id: game.game_id,
          period_number: nextNumber,
          start_time: nowMs,
          end_time: null,
        });

        const newPeriod: GamePeriod = {
          id: periodData.id,
          periodNumber: nextNumber,
          index: nextIndex,
          startTime: nowMs,
          endTime: null,
        };

        get().updateGame({
          ...(isFirstPeriod && {
            gameStartTime: nowMs,
            gameEventsGoals: [],
            gameEventsDiscipline: [],
            gameEventsPenalties: [],
            gameEventsMajor: [],
            playerActions: [],
            gameEventsTeam: [],
            goalsFor: 0,
            goalsAgainst: 0,
          }),
          currentPeriodIndex: nextIndex,
          periods: [...game.periods, newPeriod],
        });

        if (isFirstPeriod) {
          await get().syncGameStatus();
        }

        // Confirm all pending subs synchronously (0ms delay) on period start
        useGameSubsStore.getState().confirmAllPendingSubs();
      } catch (error) {
        console.error("Error starting next period:", error);
      }
    },

    endPeriod: async () => {
      const game = get().game;
      if (!game) return;

      const nowMs = Date.now();
      const currentPeriod = game.periods[game.currentPeriodIndex];

      try {
        await apiFetch(`game_periods?id=${currentPeriod.id}`, "PUT", {
          end_time: nowMs,
        });

        const updatedPeriods = [...game.periods];
        updatedPeriods[game.currentPeriodIndex] = {
          ...updatedPeriods[game.currentPeriodIndex],
          endTime: nowMs,
        };

        get().updateGame({ periods: updatedPeriods });
        await get().syncGameStatus();
      } catch (error) {
        console.error("Error ending period:", error);
      }
    },

    startStoppage: async (reason = "", eventType = "stoppage") => {
      const game = get().game;
      if (!game) return;

      const gameTime = get().getGameTime();
      const period = get().getCurrentPeriodNumber();
      const validEventType = ["goal", "card", "penalty", "substitution", "stoppage", "period_end"].includes(eventType) ? eventType : "stoppage";

      try {
        const stoppageEvent = await apiFetch("game_events_major", "POST", {
          game_id: game.game_id,
          event_type: validEventType,
          game_time: gameTime,
          end_time: null,
          period: period,
          clock_should_run: 0,
          details: reason,
        });

        const newStoppage: GameEventMajor = {
          id: stoppageEvent.id,
          game_id: game.game_id,
          event_type: eventType,
          game_time: gameTime,
          end_time: null,
          period: period,
          clock_should_run: 0,
          details: reason,
        };

        get().updateGame({
          gameEventsMajor: [...game.gameEventsMajor, newStoppage],
        });
      } catch (error) {
        console.error("Error starting stoppage:", error);
      }
    },

    endStoppage: async (stoppageId) => {
      const game = get().game;
      if (!game) return;

      const gameTime = get().getGameTime();

      // 1. Update Zustand local state synchronously (0ms lag)
      const updatedStoppages = (game.gameEventsMajor || []).map((s) =>
        String(s.id) === String(stoppageId) ? { ...s, end_time: gameTime } : s,
      );
      get().updateGame({ gameEventsMajor: updatedStoppages });

      // 2. Non-blocking server update
      try {
        await apiFetch("game_events_major", "PUT", { end_time: gameTime }, stoppageId);
      } catch (error) {
        console.error("Error ending stoppage on server:", error);
      }
    },

    endGame: async () => {
      const game = get().game;
      if (!game) return;

      try {
        await apiFetch(`games?id=${game.game_id}`, "PUT", {
          status: "completed",
        });

        get().updateGame({ status: "completed" });
      } catch (error) {
        console.error("Error ending game:", error);
      }
    },

    // ==================== MANUAL MANAGEMENT ====================

    deletePeriod: async (periodId) => {
      try {
        await apiFetch(`game_periods?id=${periodId}`, "DELETE");

        const game = get().game;
        if (!game) return;

        const updatedPeriods = game.periods.filter((p) => p.id !== periodId);
        get().updateGame({
          periods: updatedPeriods,
          currentPeriodIndex: Math.max(0, updatedPeriods.length - 1),
        });

        await get().syncGameStatus();
      } catch (error) {
        console.error("Error deleting period:", error);
        throw error;
      }
    },

    updatePeriod: async (periodId, updates) => {
      try {
        await apiFetch(`game_periods?id=${periodId}`, "PUT", updates);

        const game = get().game;
        if (!game) return;

        const updatedPeriods = game.periods.map((p) =>
          p.id === periodId
            ? {
                ...p,
                startTime: updates.start_time ?? p.startTime,
                endTime:
                  updates.end_time !== undefined ? updates.end_time : p.endTime,
              }
            : p,
        );
        get().updateGame({ periods: updatedPeriods });

        await get().syncGameStatus();
      } catch (error) {
        console.error("Error updating period:", error);
        throw error;
      }
    },

    updateEvent: async (eventId, updates, eventType = "major") => {
      try {
        const table = EVENT_TABLE_MAP[eventType] || "game_events_major";
        await apiFetch(`${table}?id=${eventId}`, "PUT", updates);
      } catch (error) {
        console.error("Error updating event:", error);
        throw error;
      }
    },

    deleteSub: async (subId) => {
      try {
        await apiFetch(`game_subs?id=${subId}`, "DELETE");
      } catch (error) {
        console.error("Error deleting sub:", error);
        throw error;
      }
    },

    updateSub: async (subId, updates) => {
      try {
        await apiFetch(`game_subs?id=${subId}`, "PUT", updates);
      } catch (error) {
        console.error("Error updating sub:", error);
        throw error;
      }
    },

    // ==================== OPTIMISTIC UPDATE METHODS ====================

    addTeamEvent: (teamEvent) => {
      const game = get().game;
      if (!game) return;

      const updatedGame: Game = {
        ...game,
        gameEventsTeam: [...game.gameEventsTeam, teamEvent],
      };

      updatedGame.teamStatTotals = get().calculateTeamStatTotals(
        updatedGame as unknown as CalculateTeamStatTotalsInput,
      ) as TeamStatTotals;

      set({ game: updatedGame });
    },

    replaceTeamEvent: (oldId, newEvent) => {
      const game = get().game;
      if (!game) return;

      const updatedGame: Game = {
        ...game,
        gameEventsTeam: game.gameEventsTeam.map((e) =>
          e.id === oldId ? newEvent : e,
        ),
      };

      updatedGame.teamStatTotals = get().calculateTeamStatTotals(
        updatedGame as unknown as CalculateTeamStatTotalsInput,
      ) as TeamStatTotals;

      set({ game: updatedGame });
    },

    removeTeamEvent: (eventId) => {
      const game = get().game;
      if (!game) return;

      const updatedGame: Game = {
        ...game,
        gameEventsTeam: game.gameEventsTeam.filter((e) => e.id !== eventId),
      };

      updatedGame.teamStatTotals = get().calculateTeamStatTotals(
        updatedGame as unknown as CalculateTeamStatTotalsInput,
      ) as TeamStatTotals;

      set({ game: updatedGame });
    },

    deleteEvent: async (eventId, eventType = "major") => {
      try {
        const game = get().game;
        if (!game) return;

        let majorIdToDelete: number | string | null = null;
        let goalIdToDelete: number | string | null = null;
        let disciplineIdToDelete: number | string | null = null;
        let penaltyIdToDelete: number | string | null = null;

        if (eventType === "major") {
          majorIdToDelete = eventId;
          const linkedGoal = game.gameEventsGoals?.find(
            (g) => String(g.major_event_id) === String(eventId)
          );
          if (linkedGoal) goalIdToDelete = linkedGoal.id ?? linkedGoal.goal_id ?? null;

          const linkedDiscipline = game.gameEventsDiscipline?.find(
            (d) => String(d.major_event_id) === String(eventId)
          );
          if (linkedDiscipline) disciplineIdToDelete = linkedDiscipline.id ?? linkedDiscipline.discipline_id ?? null;

          const linkedPenalty = game.gameEventsPenalties?.find(
            (p) => String(p.major_event_id) === String(eventId)
          );
          if (linkedPenalty) penaltyIdToDelete = linkedPenalty.id ?? linkedPenalty.penalty_id ?? null;
        } else if (eventType === "goal") {
          goalIdToDelete = eventId;
          const goal = game.gameEventsGoals?.find(
            (g) => String(g.id) === String(eventId) || String(g.goal_id) === String(eventId)
          );
          if ((goal as any)?.major_event_id) majorIdToDelete = (goal as any).major_event_id;
        } else if (eventType === "discipline") {
          disciplineIdToDelete = eventId;
          const disc = game.gameEventsDiscipline?.find(
            (d) => String(d.id) === String(eventId) || String(d.discipline_id) === String(eventId)
          );
          if ((disc as any)?.major_event_id) majorIdToDelete = (disc as any).major_event_id;
        } else if (eventType === "penalty") {
          penaltyIdToDelete = eventId;
          const pen = game.gameEventsPenalties?.find(
            (p) => String(p.id) === String(eventId) || String(p.penalty_id) === String(eventId)
          );
          if ((pen as any)?.major_event_id) majorIdToDelete = (pen as any).major_event_id;
        }

        // 1. Update Zustand game state synchronously (0ms lag)
        const updates: Partial<Game> = {};

        if (majorIdToDelete) {
          updates.gameEventsMajor = (game.gameEventsMajor || []).filter(
            (s) => String(s.id) !== String(majorIdToDelete)
          );
        }
        if (goalIdToDelete || eventType === "goal") {
          const targetGoalId = goalIdToDelete || eventId;
          const remainingGoals = (game.gameEventsGoals || []).filter(
            (g) => String(g.goal_id) !== String(targetGoalId) && String(g.id) !== String(targetGoalId)
          );
          updates.gameEventsGoals = remainingGoals;
          const teamSeasonId = game.isHome
            ? game.home_team_season_id
            : game.away_team_season_id;
          updates.goalsFor = remainingGoals.filter(
            (g) => g.team_season_id === teamSeasonId && !g.is_own_goal
          ).length;
          updates.goalsAgainst = remainingGoals.filter(
            (g) =>
              (g.team_season_id !== teamSeasonId && !g.is_own_goal) ||
              (g.team_season_id === teamSeasonId && g.is_own_goal)
          ).length;
        }
        if (disciplineIdToDelete || eventType === "discipline") {
          const targetDiscId = disciplineIdToDelete || eventId;
          updates.gameEventsDiscipline = (game.gameEventsDiscipline || []).filter(
            (d) => String(d.discipline_id) !== String(targetDiscId) && String(d.id) !== String(targetDiscId)
          );
        }
        if (penaltyIdToDelete || eventType === "penalty") {
          const targetPenId = penaltyIdToDelete || eventId;
          updates.gameEventsPenalties = (game.gameEventsPenalties || []).filter(
            (p) => String(p.penalty_id) !== String(targetPenId) && String(p.id) !== String(targetPenId)
          );
        }
        if (eventType === "player_action") {
          const remainingActions = (game.playerActions || []).filter(
            (a) => String(a.id) !== String(eventId)
          );
          updates.playerActions = remainingActions;
          updates.teamStatTotals = get().calculateTeamStatTotals({
            ...(game as unknown as CalculateTeamStatTotalsInput),
            ...updates,
          }) as TeamStatTotals;
        }
        if (eventType === "team") {
          const remainingTeamEvents = (game.gameEventsTeam || []).filter(
            (t) => String(t.id) !== String(eventId)
          );
          updates.gameEventsTeam = remainingTeamEvents;
          updates.teamStatTotals = get().calculateTeamStatTotals({
            ...(game as unknown as CalculateTeamStatTotalsInput),
            ...updates,
          }) as TeamStatTotals;
        }

        get().updateGame(updates);
        useGamePlayersStore.getState().recalculatePlayerStatsFromEvents(
          updates.gameEventsGoals || game.gameEventsGoals,
          updates.gameEventsDiscipline || game.gameEventsDiscipline
        );

        // 2. Non-blocking server deletion
        const deletePromises: Promise<any>[] = [];

        if (majorIdToDelete) {
          deletePromises.push(apiFetch("game_events_major", "DELETE", null, majorIdToDelete));
        }
        if (goalIdToDelete) {
          deletePromises.push(apiFetch("game_events_goals", "DELETE", null, goalIdToDelete));
        }
        if (disciplineIdToDelete) {
          deletePromises.push(apiFetch("game_events_discipline", "DELETE", null, disciplineIdToDelete));
        }
        if (penaltyIdToDelete) {
          deletePromises.push(apiFetch("game_events_penalties", "DELETE", null, penaltyIdToDelete));
        }
        if (eventType === "player_action") {
          deletePromises.push(apiFetch("player_actions", "DELETE", null, eventId));
        }
        if (eventType === "team") {
          deletePromises.push(apiFetch("game_events_team", "DELETE", null, eventId));
        }

        Promise.all(deletePromises).catch((err) => {
          console.error("Error deleting event on server:", err);
        });
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    },

    addGoalEvent: (goalEvent, majorEvent) => {
      const game = get().game;
      if (!game) return;

      const ourTeamSeasonId =
        game.teamSeasonId ||
        (game.isHome ? game.home_team_season_id : game.away_team_season_id);

      const isOurGoal =
        String(goalEvent.team_season_id) === String(ourTeamSeasonId) && !goalEvent.is_own_goal;
      const isTheirGoal =
        String(goalEvent.team_season_id) !== String(ourTeamSeasonId) || goalEvent.is_own_goal;

      const updatedGame: Game = {
        ...game,
        gameEventsGoals: [...(game.gameEventsGoals || []), goalEvent],
        gameEventsMajor: [...(game.gameEventsMajor || []), majorEvent],
        goalsFor: (game.goalsFor || 0) + (isOurGoal ? 1 : 0),
        goalsAgainst: (game.goalsAgainst || 0) + (isTheirGoal ? 1 : 0),
      };

      set({ game: updatedGame });
      useGamePlayersStore.getState().recalculatePlayerStatsFromEvents(
        updatedGame.gameEventsGoals,
        updatedGame.gameEventsDiscipline
      );
    },

    replaceGoalEvent: (
      optimisticGoalId,
      realGoalEvent,
      optimisticMajorId,
      realMajorEvent,
    ) => {
      const game = get().game;
      if (!game) return;

      const updatedGame: Game = {
        ...game,
        gameEventsGoals: game.gameEventsGoals.map((g) =>
          g.id === optimisticGoalId || g.goal_id === optimisticGoalId
            ? realGoalEvent
            : g,
        ),
        gameEventsMajor: game.gameEventsMajor.map((m) =>
          m.id === optimisticMajorId ? realMajorEvent : m,
        ),
      };

      set({ game: updatedGame });
      useGamePlayersStore.getState().recalculatePlayerStatsFromEvents(
        updatedGame.gameEventsGoals,
        updatedGame.gameEventsDiscipline
      );
    },

    removeGoalEvent: (goalId, majorEventId) => {
      const game = get().game;
      if (!game) return;

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      // Find the goal to determine if it was ours or theirs
      const goalToRemove = game.gameEventsGoals.find(
        (g) => g.id === goalId || g.goal_id === goalId,
      );
      const isOurGoal = Boolean(
        goalToRemove &&
        goalToRemove.team_season_id === teamSeasonId &&
        !goalToRemove.is_own_goal,
      );
      const isTheirGoal = Boolean(
        goalToRemove &&
        (goalToRemove.team_season_id !== teamSeasonId ||
          goalToRemove.is_own_goal),
      );

      const updatedGame: Game = {
        ...game,
        gameEventsGoals: game.gameEventsGoals.filter(
          (g) => g.id !== goalId && g.goal_id !== goalId,
        ),
        gameEventsMajor: game.gameEventsMajor.filter(
          (m) => m.id !== majorEventId,
        ),
        goalsFor: game.goalsFor - (isOurGoal ? 1 : 0),
        goalsAgainst: game.goalsAgainst - (isTheirGoal ? 1 : 0),
      };

      set({ game: updatedGame });
      useGamePlayersStore.getState().recalculatePlayerStatsFromEvents(
        updatedGame.gameEventsGoals,
        updatedGame.gameEventsDiscipline
      );
    },

    addMajorEvent: (majorEvent: any) => {
      const game = get().game;
      if (!game) return;

      const updatedGame: Game = {
        ...game,
        gameEventsMajor: [...game.gameEventsMajor, majorEvent],
      };

      set({ game: updatedGame });
    },

    addDisciplineEvent: (disciplineEvent, majorEvent) => {
      const game = get().game;
      if (!game) return;

      const updatedGame: Game = {
        ...game,
        gameEventsDiscipline: [...game.gameEventsDiscipline, disciplineEvent],
        gameEventsMajor: [...game.gameEventsMajor, majorEvent],
      };

      set({ game: updatedGame });
      useGamePlayersStore.getState().recalculatePlayerStatsFromEvents(
        updatedGame.gameEventsGoals,
        updatedGame.gameEventsDiscipline
      );
    },

    replaceDisciplineEvent: (
      optimisticCardId,
      realCardEvent,
      optimisticMajorId,
      realMajorEvent,
    ) => {
      const game = get().game;
      if (!game) return;

      const updatedGame: Game = {
        ...game,
        gameEventsDiscipline: game.gameEventsDiscipline.map((d) =>
          d.id === optimisticCardId || d.discipline_id === optimisticCardId
            ? realCardEvent
            : d,
        ),
        gameEventsMajor: game.gameEventsMajor.map((m) =>
          m.id === optimisticMajorId ? realMajorEvent : m,
        ),
      };

      set({ game: updatedGame });
    },

    removeDisciplineEvent: (cardId, majorEventId) => {
      const game = get().game;
      if (!game) return;

      const updatedGame: Game = {
        ...game,
        gameEventsDiscipline: game.gameEventsDiscipline.filter(
          (d) => d.id !== cardId && d.discipline_id !== cardId,
        ),
        gameEventsMajor: game.gameEventsMajor.filter(
          (m) => m.id !== majorEventId,
        ),
      };

      set({ game: updatedGame });
    },

    addPenaltyEvent: (
      penaltyEvent,
      majorEvent,
      goalEvent = null,
      saveAction = null,
    ) => {
      const game = get().game;
      if (!game) return;

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      const updatedGame: Game = {
        ...game,
        gameEventsPenalties: [...game.gameEventsPenalties, penaltyEvent],
        gameEventsMajor: [...game.gameEventsMajor, majorEvent],
      };

      if (goalEvent) {
        const isOurGoal = goalEvent.team_season_id === teamSeasonId;
        updatedGame.gameEventsGoals = [...game.gameEventsGoals, goalEvent];
        updatedGame.goalsFor = game.goalsFor + (isOurGoal ? 1 : 0);
        updatedGame.goalsAgainst = game.goalsAgainst + (isOurGoal ? 0 : 1);
      }

      if (saveAction) {
        updatedGame.playerActions = [...game.playerActions, saveAction];
        updatedGame.teamStatTotals = get().calculateTeamStatTotals(
          updatedGame as unknown as CalculateTeamStatTotalsInput,
        ) as TeamStatTotals;
      }

      set({ game: updatedGame });
    },

    addPlayerAction: (action) => {
      const game = get().game;
      if (!game) return;

      const updatedActions = [...(game.playerActions || []), action];
      const updatedGame: Game = { ...game, playerActions: updatedActions };

      set({
        game: {
          ...updatedGame,
          teamStatTotals: get().calculateTeamStatTotals(
            updatedGame as unknown as CalculateTeamStatTotalsInput,
          ) as TeamStatTotals,
        },
      });
    },

    replacePlayerAction: (optimisticActionId, realAction) => {
      const game = get().game;
      if (!game) return;

      const updatedActions = game.playerActions.map((a) =>
        a.id === optimisticActionId ? realAction : a,
      );
      const updatedGame: Game = { ...game, playerActions: updatedActions };

      set({
        game: {
          ...updatedGame,
          teamStatTotals: get().calculateTeamStatTotals(
            updatedGame as unknown as CalculateTeamStatTotalsInput,
          ) as TeamStatTotals,
        },
      });
    },

    removePlayerAction: (actionId) => {
      const game = get().game;
      if (!game) return;

      const updatedActions = game.playerActions.filter(
        (a) => a.id !== actionId,
      );
      const updatedGame: Game = { ...game, playerActions: updatedActions };

      set({
        game: {
          ...updatedGame,
          teamStatTotals: get().calculateTeamStatTotals(
            updatedGame as unknown as CalculateTeamStatTotalsInput,
          ) as TeamStatTotals,
        },
      });
    },

    calculateTeamStatTotals: (gameData) => {
      const game =
        gameData || (get().game as unknown as CalculateTeamStatTotalsInput);
      if (!game) return {};

      const teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      return {
        ...(game.gameEventsTeam?.reduce(
          (acc: Record<string, { us: number; them: number }>, e) => {
            const eventType = e.event_type;
            if (!acc[eventType]) {
              acc[eventType] = { us: 0, them: 0 };
            }

            const side = e.team_season_id === teamSeasonId ? "us" : "them";
            acc[eventType][side]++;

            return acc;
          },
          {
            corner: { us: 0, them: 0 },
            offside: { us: 0, them: 0 },
            foul: { us: 0, them: 0 },
          },
        ) || {
          corner: { us: 0, them: 0 },
          offside: { us: 0, them: 0 },
          foul: { us: 0, them: 0 },
        }),
        shots:
          game.playerActions?.filter(
            (e) => e.event_type === "shot" || e.event_type === "shot_on_target",
          ).length || 0,
        saves:
          game.playerActions?.filter((e) => e.event_type === "save").length ||
          0,
      } as TeamStatTotals;
    },

    // ==================== HELPER FUNCTIONS ====================

    getCurrentPeriodNumber: () => {
      const game = get().game;
      if (!game || game.currentPeriodIndex < 0) return 0;
      return game.currentPeriodIndex + 1;
    },

    getPeriodLabel: (periodIndex) => {
      const game = get().game;
      if (!game) return "";

      const regularPeriods = game.settings.periodCount;
      if (periodIndex < regularPeriods) {
        return `Period ${periodIndex + 1}`;
      }
      return `OT ${periodIndex - regularPeriods + 1}`;
    },

    getCurrentPeriodLabel: () => {
      const game = get().game;
      if (!game || game.currentPeriodIndex < 0) return "";
      return get().getPeriodLabel(game.currentPeriodIndex);
    },

    GAME_STAGES,
  };
});

export default useGameStore;
