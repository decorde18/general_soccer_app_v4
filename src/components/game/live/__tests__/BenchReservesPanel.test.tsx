import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BenchReservesPanel from "../BenchReservesPanel";
import { Player } from "@/stores/gamePlayersStore";

const mockBenchPlayer: Player = {
  id: "res1",
  playerGameId: 201,
  fullName: "Kylian Mbappe",
  jerseyNumber: "7",
  gameStatus: "dressed",
  fieldStatus: "onBench",
  subStatus: null,
  plusMinus: 0,
} as any as Player;

describe("BenchReservesPanel", () => {
  const defaultProps = {
    gameChangers: [mockBenchPlayer],
    subInId: null,
    pendingSubsList: [],
    gameTimeSeconds: 1200,
    calculateTotalTimeOnField: () => 300,
    calculateCurrentTimeOffField: () => 900,
    getPlayerStats: () => ({
      shots: 1,
      saves: 0,
      goals: 0,
      assists: 1,
      yellowCards: 0,
      redCards: 0,
      goalsAgainst: 0,
    }),
    setSubInId: vi.fn(),
  };

  it("renders bench reserves header and player rows", () => {
    render(<BenchReservesPanel {...defaultProps} />);

    expect(screen.getByText("Game Changers (Bench Reserves) (1)")).toBeInTheDocument();
    expect(screen.getByText("Kylian Mbappe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sub In" })).toBeInTheDocument();
  });

  it("triggers setSubInId when Sub In button or row is clicked", () => {
    render(<BenchReservesPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Sub In" }));
    expect(defaultProps.setSubInId).toHaveBeenCalledWith("res1");
  });

  it("renders Selected button state when subInId matches player id", () => {
    render(<BenchReservesPanel {...defaultProps} subInId="res1" />);

    expect(screen.getByRole("button", { name: "Selected" })).toBeInTheDocument();
  });
});
