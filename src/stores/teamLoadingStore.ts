import { create } from "zustand";

interface TeamLoadingState {
  isTeamLoading: boolean;
  targetTeamName: string | null;
  setIsTeamLoading: (loading: boolean, teamName?: string | null) => void;
}

export const useTeamLoadingStore = create<TeamLoadingState>((set) => ({
  isTeamLoading: false,
  targetTeamName: null,
  setIsTeamLoading: (loading, teamName = null) =>
    set({ isTeamLoading: loading, targetTeamName: teamName }),
}));
