// Pragmatic types inferred from authStore.jsx / userContextStore.jsx usage.
// Swap in your real User/permissions shape if you have one defined
// elsewhere (e.g. from your API layer).

export interface User {
  userId: number | string;
  systemRole?: string;
  [key: string]: unknown;
}

export interface TeamAccess {
  team_season_id: number | string;
  club_id?: number | string;
  role?: string;
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
