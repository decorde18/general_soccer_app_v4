import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import OnFieldPlayersPanel from "../OnFieldPlayersPanel";
import { Player } from "@/stores/gamePlayersStore";

const mockGk: Player = {
  id: "gk1",
  playerGameId: 101,
  fullName: "Manuel Neuer",
  jerseyNumber: "1",
  gameStatus: "goalkeeper",
  fieldStatus: "onFieldGk",
  subStatus: null,
  plusMinus: 1,
} as any as Player;

const mockFieldPlayer: Player = {
  id: "fld1",
  playerGameId: 102,
  fullName: "Lionel Messi",
  jerseyNumber: "10",
  gameStatus: "starter",
  fieldStatus: "onField",
  subStatus: null,
  plusMinus: 2,
} as any as Player;

describe("OnFieldPlayersPanel", () => {
  const defaultProps = {
    onFieldGks: [mockGk],
    onFieldFlds: [mockFieldPlayer],
    onFieldCount: 2,
    subOutId: null,
    pendingSubsList: [],
    gameTimeSeconds: 1200,
    calculateTotalTimeOnField: () => 1200,
    calculateCurrentTimeOnField: () => 600,
    getPlayerStats: (player: Player) => ({
      shots: player.id === "fld1" ? 3 : 0,
      saves: player.id === "gk1" ? 5 : 0,
      goals: player.id === "fld1" ? 1 : 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      goalsAgainst: 0,
    }),
    setSubOutId: vi.fn(),
    handleQuickPlayerAction: vi.fn(),
  };

  it("renders Goalkeeper and Field player names and stats", () => {
    render(<OnFieldPlayersPanel {...defaultProps} />);

    expect(screen.getByText("Players On Field (2)")).toBeInTheDocument();
    expect(screen.getByText("Manuel Neuer")).toBeInTheDocument();
    expect(screen.getByText("Lionel Messi")).toBeInTheDocument();
    expect(screen.getByText("SAVE")).toBeInTheDocument();
    expect(screen.getByText("SHOT")).toBeInTheDocument();
  });

  it("triggers handleQuickPlayerAction when action button clicked", () => {
    render(<OnFieldPlayersPanel {...defaultProps} />);

    fireEvent.click(screen.getByText("SAVE"));
    expect(defaultProps.handleQuickPlayerAction).toHaveBeenCalledWith("gk1", "save");

    fireEvent.click(screen.getByText("SHOT"));
    expect(defaultProps.handleQuickPlayerAction).toHaveBeenCalledWith("fld1", "shot");
  });

  it("triggers setSubOutId when row or sub out button is clicked", () => {
    render(<OnFieldPlayersPanel {...defaultProps} />);

    const subOutButtons = screen.getAllByRole("button", { name: "Sub Out" });
    fireEvent.click(subOutButtons[0]);
    expect(defaultProps.setSubOutId).toHaveBeenCalledWith("gk1");
  });

  it("displays SENT OFF when player has red card", () => {
    const propsWithRedCard = {
      ...defaultProps,
      getPlayerStats: (player: Player) => ({
        shots: 0,
        saves: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: player.id === "fld1" ? 1 : 0,
        goalsAgainst: 0,
      }),
    };

    render(<OnFieldPlayersPanel {...propsWithRedCard} />);
    expect(screen.getByText("SENT OFF")).toBeInTheDocument();
  });
});
