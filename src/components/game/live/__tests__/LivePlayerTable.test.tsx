import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LivePlayerTable from "../LivePlayerTable";
import { Player } from "@/stores/gamePlayersStore";

const mockPlayer: Player = {
  id: "p1",
  playerGameId: 101,
  fullName: "Luka Modric",
  jerseyNumber: "10",
  gameStatus: "starter",
  fieldStatus: "onField",
  subStatus: null,
  plusMinus: 3,
} as any as Player;

describe("LivePlayerTable", () => {
  const defaultProps = {
    players: [mockPlayer],
    tableType: "field" as const,
    subSelectedId: null,
    pendingSubsList: [],
    gameTimeSeconds: 1200,
    calculateTotalTimeOnField: () => 1200,
    calculateSecondaryTime: () => 600,
    getPlayerStats: () => ({
      shots: 2,
      saves: 0,
      goals: 1,
      assists: 1,
      yellowCards: 0,
      redCards: 0,
      goalsAgainst: 0,
    }),
    onSelectPlayer: vi.fn(),
    onQuickAction: vi.fn(),
  };

  it("renders player row with stats and sub out button", () => {
    render(<LivePlayerTable {...defaultProps} />);

    expect(screen.getByText("Luka Modric")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sub Out" })).toBeInTheDocument();
  });

  it("renders Pending Out badge instead of button when player is pending out", () => {
    render(
      <LivePlayerTable
        {...defaultProps}
        pendingSubsList={[{ subId: "1", inPlayerId: 99, outPlayerId: 101, gkSub: false, isComplete: false }]}
      />
    );

    expect(screen.getByText("Pending Out")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sub Out" })).not.toBeInTheDocument();
  });

  it("triggers onSelectPlayer when Sub Out button is clicked", () => {
    render(<LivePlayerTable {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Sub Out" }));
    expect(defaultProps.onSelectPlayer).toHaveBeenCalledWith("p1");
  });
});
