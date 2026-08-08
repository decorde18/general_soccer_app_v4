import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BroadcastScoreboard from "../BroadcastScoreboard";

const GAME_STAGES = {
  BEFORE_START: 0,
  DURING_PERIOD: 1,
  BETWEEN_PERIODS: 2,
  IN_STOPPAGE: 3,
  ENDED: 4,
};

describe("BroadcastScoreboard", () => {
  const defaultProps = {
    ourShortName: "Lions FC",
    opponentShortName: "Tigers FC",
    goalsFor: 2,
    goalsAgainst: 1,
    gameTimeSeconds: 1250, // 20:50
    periodLabel: "1st Half",
    isOnline: true,
    queueCount: 0,
    currentStage: GAME_STAGES.DURING_PERIOD,
    GAME_STAGES,
    isLineupConfigured: true,
    onTogglePeriodClock: vi.fn(),
    onOpenMajorEventModal: vi.fn(),
  };

  it("renders score, team names, and formatted clock", () => {
    render(<BroadcastScoreboard {...defaultProps} />);

    expect(screen.getByText("Lions FC")).toBeInTheDocument();
    expect(screen.getByText("Tigers FC")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("20:50")).toBeInTheDocument();
    expect(screen.getByText("1st Half")).toBeInTheDocument();
    expect(screen.getByText("Sync Active")).toBeInTheDocument();
  });

  it("renders offline status when isOnline is false", () => {
    render(<BroadcastScoreboard {...defaultProps} isOnline={false} queueCount={3} />);

    expect(screen.getByText("Offline (3)")).toBeInTheDocument();
  });

  it("renders correct button label for clock stages", () => {
    const { rerender } = render(
      <BroadcastScoreboard {...defaultProps} currentStage={GAME_STAGES.BEFORE_START} />
    );
    expect(screen.getByRole("button", { name: "Start Period" })).toBeInTheDocument();

    rerender(<BroadcastScoreboard {...defaultProps} currentStage={GAME_STAGES.DURING_PERIOD} />);
    expect(screen.getByRole("button", { name: "End Period" })).toBeInTheDocument();

    rerender(<BroadcastScoreboard {...defaultProps} currentStage={GAME_STAGES.IN_STOPPAGE} />);
    expect(screen.getByRole("button", { name: "Resume Clock" })).toBeInTheDocument();
  });

  it("calls callbacks when action buttons are clicked", () => {
    render(<BroadcastScoreboard {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "End Period" }));
    expect(defaultProps.onTogglePeriodClock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Record Major Event" }));
    expect(defaultProps.onOpenMajorEventModal).toHaveBeenCalledTimes(1);
  });
});
