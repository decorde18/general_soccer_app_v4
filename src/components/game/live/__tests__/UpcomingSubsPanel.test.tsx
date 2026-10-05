import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UpcomingSubsPanel from "../UpcomingSubsPanel";
import { Player } from "@/stores/gamePlayersStore";
import { PendingSub } from "@/stores/gameSubsStore";

import useGameStore from "@/stores/gameStore";

vi.mock("@/stores/gameStore", () => {
  return {
    default: vi.fn(() => ({
      getGameStage: () => "DURING_PERIOD",
      GAME_STAGES: {
        BEFORE_START: "BEFORE_START",
        DURING_PERIOD: "DURING_PERIOD",
        IN_STOPPAGE: "IN_STOPPAGE",
        BETWEEN_PERIODS: "BETWEEN_PERIODS",
        END_GAME: "END_GAME",
      },
    })),
  };
});

const mockPlayers: Player[] = [
  { id: "1", playerGameId: 10, fullName: "Player Out", gameStatus: "starter", fieldStatus: "onField", subStatus: null, plusMinus: 0 } as any as Player,
  { id: "2", playerGameId: 20, fullName: "Player In", gameStatus: "dressed", fieldStatus: "onBench", subStatus: null, plusMinus: 0 } as any as Player,
];

const mockPendingSubs: PendingSub[] = [
  { subId: "sub-1", inPlayerId: 20, outPlayerId: 10, gkSub: false, isComplete: false },
];

describe("UpcomingSubsPanel", () => {
  const defaultProps = {
    pendingSubsList: mockPendingSubs,
    players: mockPlayers,
    onConfirmSingleSub: vi.fn(),
    onCancelSub: vi.fn(),
    onConfirmAllSubs: vi.fn(),
    onEditSub: vi.fn(),
  };

  it("renders empty state when queue is empty", () => {
    render(<UpcomingSubsPanel {...defaultProps} pendingSubsList={[]} />);

    expect(screen.getByText("No pending subs in queue.")).toBeInTheDocument();
  });

  it("renders pending sub item and triggers callbacks during period", () => {
    render(<UpcomingSubsPanel {...defaultProps} />);

    expect(screen.getByText("Player Out")).toBeInTheDocument();
    expect(screen.getByText("Player In")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Confirm Sub"));
    expect(defaultProps.onConfirmSingleSub).toHaveBeenCalledWith("sub-1");

    fireEvent.click(screen.getByLabelText("Cancel Sub"));
    expect(defaultProps.onCancelSub).toHaveBeenCalledWith("sub-1");

    fireEvent.click(screen.getByRole("button", { name: "Enter All" }));
    expect(defaultProps.onConfirmAllSubs).toHaveBeenCalled();
  });

  it("suppresses enter buttons during period breaks", () => {
    vi.mocked(useGameStore).mockReturnValue({
      getGameStage: () => "BETWEEN_PERIODS",
      GAME_STAGES: {
        BEFORE_START: "BEFORE_START",
        DURING_PERIOD: "DURING_PERIOD",
        IN_STOPPAGE: "IN_STOPPAGE",
        BETWEEN_PERIODS: "BETWEEN_PERIODS",
        END_GAME: "END_GAME",
      },
    } as any);

    render(<UpcomingSubsPanel {...defaultProps} />);

    expect(screen.getByText("Auto-enters at Start")).toBeInTheDocument();
    expect(screen.queryByLabelText("Confirm Sub")).not.toBeInTheDocument();
  });

  it("opens edit modal when edit button is clicked", () => {
    render(<UpcomingSubsPanel {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Edit Pending Sub"));
    expect(screen.getByText("Edit Pending Substitution")).toBeInTheDocument();
  });
});
