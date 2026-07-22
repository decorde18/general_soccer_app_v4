// stores/userContextStore.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TeamAccess, ClubAccess, FavoriteTeam } from "@/types/user";

export type UserRole =
  | "system_admin"
  | "club_admin"
  | "head_coach"
  | "assistant_coach"
  | "team_admin"
  | "stats_keeper"
  | string
  | null;

interface UserContextState {
  // User's relationships (loaded on login)
  myTeams: TeamAccess[];
  myClubs: ClubAccess[];
  favoriteTeams: FavoriteTeam[];

  // Current context (when viewing a specific team)
  currentTeamSeasonId: number | string | null;
  currentRole: UserRole;

  isLoading: boolean;
  error: string | null;

  // Load user's full context
  loadUserContext: (userId: number | string) => Promise<{
    teams?: TeamAccess[];
    clubs?: ClubAccess[];
    favorites?: FavoriteTeam[];
    [key: string]: unknown;
  }>;

  // Set context when viewing a team
  setTeamContext: (teamSeasonId: number | string) => void;

  // Permission checks (deprecated - use contextPermissions.js instead)
  canEdit: () => boolean;
  canEnterStats: () => boolean;
  canManageRoster: () => boolean;

  // Add/remove favorites
  addFavorite: (teamId: number | string) => Promise<void>;
  removeFavorite: (teamId: number | string) => Promise<void>;

  clearContext: () => void;
}

export const useUserContextStore = create<UserContextState>()(
  persist<UserContextState, [], [], Partial<UserContextState>>(
    (set, get) => ({
      // User's relationships (loaded on login)
      myTeams: [],
      myClubs: [],
      favoriteTeams: [],

      // Current context (when viewing a specific team)
      currentTeamSeasonId: null,
      currentRole: null,

      isLoading: false,
      error: null,

      // Load user's full context
      loadUserContext: async (userId) => {
        set({ isLoading: true, error: null });

        try {
          // Just fetch from API - no database imports!
          const response = await fetch(`/api/users/${userId}/context`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to load user context");
          }

          const data = await response.json();

          set({
            myTeams: data.teams || [], // From team_staff, player_teams, parent relationships
            myClubs: data.clubs || [], // From club_staff
            favoriteTeams: data.favorites || [], // From user_favorites
            isLoading: false,
          });

          return data;
        } catch (error) {
          console.error("Context load error:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to load user context",
            isLoading: false,
          });
          throw error;
        }
      },

      // Set context when viewing a team
      setTeamContext: (teamSeasonId) => {
        const { myTeams, myClubs } = get();

        // Find user's role for this team
        const teamAccess = myTeams.find(
          (t) => t.team_season_id === teamSeasonId,
        );

        // Check if user is club admin for this team's club
        const isClubAdmin = myClubs.some(
          (c) =>
            myTeams.find((t) => t.team_season_id === teamSeasonId)
              ?.club_id === c.club_id,
        );

        set({
          currentTeamSeasonId: teamSeasonId,
          currentRole: isClubAdmin ? "club_admin" : teamAccess?.role || null,
        });
      },

      // Permission checks (deprecated - use contextPermissions.js instead)
      canEdit: () => {
        const { currentRole } = get();
        return [
          "system_admin",
          "club_admin",
          "head_coach",
          "assistant_coach",
          "team_admin",
        ].includes(currentRole as string);
      },

      canEnterStats: () => {
        const { currentRole } = get();
        return [
          "system_admin",
          "club_admin",
          "head_coach",
          "assistant_coach",
          "stats_keeper",
        ].includes(currentRole as string);
      },

      canManageRoster: () => {
        const { currentRole } = get();
        return [
          "system_admin",
          "club_admin",
          "head_coach",
          "team_admin",
        ].includes(currentRole as string);
      },

      // Add/remove favorites
      addFavorite: async (teamId) => {
        try {
          // Get token from auth store
          const { default: useAuthStore } = await import("./authStore");
          const token = useAuthStore.getState().token;

          const response = await fetch("/api/favorites", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ teamId }),
          });

          if (response.ok) {
            const team: FavoriteTeam = await response.json();
            set((state) => ({
              favoriteTeams: [...state.favoriteTeams, team],
            }));
          }
        } catch (error) {
          console.error("Failed to add favorite:", error);
        }
      },

      removeFavorite: async (teamId) => {
        try {
          // Get token from auth store
          const { default: useAuthStore } = await import("./authStore");
          const token = useAuthStore.getState().token;

          await fetch(`/api/favorites/${teamId}`, {
            method: "DELETE",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          set((state) => ({
            favoriteTeams: state.favoriteTeams.filter((t) => t.id !== teamId),
          }));
        } catch (error) {
          console.error("Failed to remove favorite:", error);
        }
      },

      clearContext: () =>
        set({
          myTeams: [],
          myClubs: [],
          favoriteTeams: [],
          currentTeamSeasonId: null,
          currentRole: null,
        }),
    }),
    {
      name: "user-context-storage",
      partialize: (state) => ({
        myTeams: state.myTeams,
        myClubs: state.myClubs,
        favoriteTeams: state.favoriteTeams,
        currentTeamSeasonId: state.currentTeamSeasonId,
        currentRole: state.currentRole,
      }),
    },
  ),
);