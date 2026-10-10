import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LineupReconcileModal from "../LineupReconcileModal";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock offlineSync
vi.mock("@/lib/offline/offlineSync", () => ({
  saveGameCache: vi.fn(),
}));

// Mock fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe("LineupReconcileModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useGameStore.setState({
      game: {
        id: 923,
        game_id: 923,
        currentPeriodIndex: 1,
        teamSeasonId: 121,
      } as any,
      getGameTime: () => 1500,
      getCurrentPeriodNumber: () => 2,
    });

    useGamePlayersStore.setState({
      players: [
        {
          id: 1,
          playerGameId: 1538,
          fullName: "Leighton Hurley",
          jerseyNumber: "10",
          gameStatus: "starter",
          fieldStatus: "onField",
          ins: [],
          outs: [],
        },
        {
          id: 2,
          playerGameId: 1541,
          fullName: "Adelyne Wooten",
          jerseyNumber: "7",
          gameStatus: "dressed",
          fieldStatus: "onBench",
          ins: [],
          outs: [],
        },
      ] as any,
      calculateFieldStatus: (p: any) => (p.ins?.length > p.outs?.length ? "onField" : "onBench"),
    });
  });

  it("renders on-field and on-bench player columns", () => {
    render(<LineupReconcileModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Reconcile Lineup & Field Status")).toBeInTheDocument();
    expect(screen.getByText("Leighton Hurley")).toBeInTheDocument();
    expect(screen.getByText("Adelyne Wooten")).toBeInTheDocument();
  });

  it("allows selecting players and triggers swap via API", async () => {
    globalFetch.mockResolvedValueOnce({
      json: async () => ({ success: true, id: 999 }),
    });

    const onClose = vi.fn();
    render(<LineupReconcileModal isOpen={true} onClose={onClose} />);

    // Select Leighton (field) and Adelyne (bench)
    fireEvent.click(screen.getByText("Leighton Hurley"));
    fireEvent.click(screen.getByText("Adelyne Wooten"));

    const swapBtn = screen.getByRole("button", { name: "Swap Field / Bench Status" });
    expect(swapBtn).not.toBeDisabled();

    fireEvent.click(swapBtn);

    await waitFor(() => {
      expect(globalFetch).toHaveBeenCalledWith(
        "/api/game_subs",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"in_player_id":1541'),
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});
