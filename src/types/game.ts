import type { ReactNode } from "react";

// NOTE: These are pragmatic types inferred from how the JSX/JS files used
// these values (field names, what's read/written). They're not generated
// from your DB schema, so double check anything DB-shaped (the *_id,
// snake_case fields) against your actual column types (e.g. is game_id a
// number or string in your DB? I typed it as `number | string` where the
// code compares it both ways with `==`).

// ==================== GAME STAGE ====================

export const GAME_STAGES = {
  BEFORE_START: "before_start",
  DURING_PERIOD: "during_period",
  BETWEEN_PERIODS: "between_periods",
  IN_STOPPAGE: "in_stoppage",
  END_GAME: "end_game",
} as const;

export type GameStage = (typeof GAME_STAGES)[keyof typeof GAME_STAGES];

// ==================== SETTINGS ====================

export interface GameSettings {
  playersOnField: number;
  periodCount: number;
  periodDuration: number; // seconds
  hasOvertime: boolean;
  overtimePeriods: number;
  overtimeDuration: number; // seconds
  hasShootout: boolean;
  clockDirection: string; // e.g. "up" | "down"
}

// ==================== PERIODS ====================

export interface GamePeriod {
  id: number | string;
  periodNumber: number;
  index: number;
  startTime: number | null; // Unix ms
  endTime: number | null; // Unix ms
}

// ==================== EVENTS ====================
// These mirror the DB rows returned by apiFetch for each events table.
// Field sets are inferred from what the store code actually reads/writes —
// there may be additional DB columns not referenced here.

export interface GameEventMajor {
  id: number | string;
  game_id: number | string;
  event_type: string;
  game_time: number;
  end_time: number | null;
  period: number;
  clock_should_run: 0 | 1;
  details?: string;
  [key: string]: unknown;
}

export interface GameEventGoal {
  id?: number | string;
  goal_id?: number | string;
  game_id: number | string;
  team_season_id: number | string;
  is_own_goal?: boolean;
  [key: string]: unknown;
}

export interface GameEventDiscipline {
  id?: number | string;
  discipline_id?: number | string;
  game_id: number | string;
  [key: string]: unknown;
}

export interface GameEventPenalty {
  id?: number | string;
  penalty_id?: number | string;
  game_id: number | string;
  [key: string]: unknown;
}

export interface PlayerAction {
  id: number | string;
  event_type: string;
  [key: string]: unknown;
}

export interface GameEventTeam {
  id: number | string;
  event_type: string;
  team_season_id: number | string;
  [key: string]: unknown;
}

export interface TeamStatTotals {
  corner: { us: number; them: number };
  offside: { us: number; them: number };
  foul: { us: number; them: number };
  shots: number;
  saves: number;
  [key: string]: unknown;
}

// ==================== SUBS ====================

export interface GameSub {
  id: number | string;
  game_id: number | string;
  in_player_id: number | string | null;
  out_player_id: number | string | null;
  sub_time: number | null;
  gk_sub: 0 | 1;
  [key: string]: unknown;
}

// ==================== GAME ====================

export interface OtConfig {
  ot_if_tied?: 0 | 1;
  max_ot_periods?: number | string;
  default_ot_1_minutes?: number | string;
  so_if_tied?: 0 | 1;
  [key: string]: unknown;
}

export interface Game {
  // Spread from the raw DB row (v_games) — these are the fields the store
  // code itself relies on; the raw row may carry more.
  // NOTE: gameStore internals consistently use `game.game_id` (e.g. the PUT
  // calls in endGame/syncGameStatus), but the original GameNavBar.jsx read
  // `game.id` instead. I couldn't confirm from the store code alone whether
  // v_games returns both columns — `id` is typed optional here so it
  // compiles either way. Worth confirming against your actual view and
  // picking one consistently in GameNavBar.
  id?: number | string;
  game_id: number | string;
  home_team_season_id: number | string;
  away_team_season_id: number | string;
  home_club_name?: string;
  away_club_name?: string;
  home_team_name?: string;
  away_team_name?: string;
  status: string;
  default_reg_periods?: number | string;

  // camelCase aliases — mapped explicitly in initializeGame() for consistent component access
  homeTeamName?: string;
  awayTeamName?: string;
  startDate?: string | null;
  startTime?: string | null;
  locationName?: string | null;
  gameType?: string | null;

  // Derived/computed by initializeGame()
  opponentId: number | string;
  opponentClub?: string;
  opponentTeamName?: string;
  opponentName: string;
  isHome: boolean;
  settings: GameSettings;
  periods: GamePeriod[];
  gameEventsGoals: GameEventGoal[];
  gameEventsDiscipline: GameEventDiscipline[];
  gameEventsPenalties: GameEventPenalty[];
  gameEventsMajor: GameEventMajor[];
  playerActions: PlayerAction[];
  gameEventsTeam: GameEventTeam[];
  currentPeriodIndex: number;
  gameStartTime: number | null;
  gameSubs: GameSub[];
  pendingSubs: GameSub[];
  goalsFor: number;
  goalsAgainst: number;
  ourName: string;
  teamStatTotals: TeamStatTotals;
  gameStage?: GameStage;

  [key: string]: unknown;
}

// ==================== PLAYERS ====================

export type FieldStatus =
  | "onField"
  | "onFieldGk"
  | "onBench"
  | "subbingIn"
  | "subbingOut"
  | "subbingOutGk";

export type GameStatus = "dressed" | "starter" | "goalkeeper" | string;

export type SubStatus = "pendingBoth" | "pendingIn" | "pendingOut" | null;

export interface PlayerSubRecord {
  gameTime: number | null;
  subId: number | string;
  gkSub: boolean;
}

export interface Player {
  id: number | string;
  playerGameId: number | string;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname?: string;
  jerseyNumber: number | string | null;
  position?: string;

  teamId: number | string;
  teamSeasonId: number | string;
  homeAway: "home" | "away";

  gameStatus: GameStatus;
  fieldStatus: FieldStatus;
  started: boolean;
  isGuest: boolean;

  ins: PlayerSubRecord[];
  outs: PlayerSubRecord[];
  subStatus: SubStatus;

  goals: number;
  penaltyGoals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;

  saves: number;
  goalsAgainst: number;
  penaltiesFaced: number;
  penaltySaves: number;
  cleanSheet: number;

  yellowCards: number;
  redCards: number;

  foulsCommitted: number;
  foulsDrawn: number;

  goalkeeperTime: number;
  plusMinus: number;
}

// ==================== UI-LAYER TYPES (menu/nav) ====================
// Used by GameMenuPage/GameNavBar — kept here since they build directly
// off the domain types above.

export type ActionVariant = "primary" | "secondary" | "outline";

export interface QuickAction {
  label: string;
  subLabel: string;
  path: string;
  icon: ReactNode;
  variant: ActionVariant;
  span?: string;
}

export interface StageInfo {
  title: string;
  subtitle: string;
  statusColor: string;
  accentColor: string;
  icon: ReactNode;
  actions: QuickAction[];
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
}
