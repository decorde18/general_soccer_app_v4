import { create } from "zustand";
import { LineupPlayer } from "@/lib/actions/gameLineup-actions";

interface GamePlayersState {
  players: LineupPlayer[];
  setPlayers: (players: LineupPlayer[]) => void;
  updateGameStatus: (playerId: number, status: string) => void;
}

export const useGamePlayersStore = create<GamePlayersState>((set) => ({
  players: [],
  setPlayers: (players) => set({ players }),
  updateGameStatus: (playerId, status) =>
    set((state) => {
      const targetPlayer = state.players.find((p) => p.id === playerId);
      if (!targetPlayer) return {};

      let updatedPlayers = state.players;

      // Rule: Only one goalkeeper is allowed at a time on the field.
      // If the player is being set as goalkeeper, find the previous goalkeeper and make them a regular starter.
      if (status === "goalkeeper") {
        updatedPlayers = state.players.map((p) =>
          p.gameStatus === "goalkeeper"
            ? { ...p, gameStatus: "starter" as const }
            : p
        );
      }

      // Map the player to their new gameStatus
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === playerId
          ? { ...p, gameStatus: status as any }
          : p
      );

      return { players: updatedPlayers };
    }),
}));

export default useGamePlayersStore;
