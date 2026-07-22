// Pragmatic types inferred from authStore.jsx / userContextStore.jsx usage.
// Swap in your real User/permissions shape if you have one defined
// elsewhere (e.g. from your API layer).

export interface User {
  userId: number | string;
  systemRole?: string;
  systemAdmin?: boolean | 0 | 1;
  system_admin?: boolean | 0 | 1;
  [key: string]: unknown;
}

export type Role =
  | "system_admin"
  | "club_admin"
  | "club_owner"
  | "head_coach"
  | "assistant_coach"
  | "team_admin"
  | "stats_keeper"
  | "player"
  | "parent"
  | "fan";

export interface RolePermissionSet {
  can_edit: boolean;
  can_enter_stats: boolean;
  can_manage_roster: boolean;
  can_view: boolean;
}

export interface TeamAccessResult extends RolePermissionSet {
  role: Role | string;
  access_type?: string;
}

export interface ClubAccessResult {
  role: Role | string;
  is_admin: boolean;
}

export interface TeamAccess {
  team_season_id: number | string;
  club_id?: number | string;
  role?: string;
  access_type?: string;
  [key: string]: unknown;
}

export interface ClubAccess {
  club_id: number | string;
  [key: string]: unknown;
}

export interface FavoriteTeam {
  id: number | string;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  token: string;
  user: User;
  [key: string]: unknown;
}