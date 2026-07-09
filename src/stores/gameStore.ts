import { create } from "zustand";
import { Game } from "@/lib/data/queries";

interface GameState {
  game: Game | null;
  setGame: (game: Game) => void;
}

export const useGameStore = create<GameState>((set) => ({
  game: null,
  setGame: (game) => set({ game }),
}));

export default useGameStore;
