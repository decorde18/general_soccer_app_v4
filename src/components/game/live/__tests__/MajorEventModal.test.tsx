import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MajorEventModal from "../MajorEventModal";
import useGameStore from "@/stores/gameStore";

describe("MajorEventModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    opponentShortName: "Tigers FC",
    onRecordGoal: vi.fn(),
    onRecordCard: vi.fn(),
    onRecordStoppage: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 123 }),
    }) as any;
    useGameStore.setState({
      game: {
        id: 999,
        game_id: 999,
        isHome: true,
        currentPeriodIndex: 0,
        periods: [{ periodNumber: 1, startTime: Date.now() - 60000, endTime: null }],
        gameEventsMajor: [],
        settings: {
          autoStopClockOnMajorEvent: false,
        },
        goalsFor: 0,
        goalsAgainst: 0,
      } as any,
      getGameTime: () => 120,
    });
  });

  it("renders goal form options by default", () => {
    render(<MajorEventModal {...defaultProps} />);

    expect(screen.getByText("Record Major Match Event")).toBeInTheDocument();
    expect(screen.getByText("Our Team")).toBeInTheDocument();
    expect(screen.getByText("Tigers FC")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Record Goal/i })).toBeInTheDocument();
  });

  it("switches form step when quick event type button is clicked", () => {
    render(<MajorEventModal {...defaultProps} />);

    // Click Card button
    const cardBtn = screen.getByRole("button", { name: "Card" });
    fireEvent.click(cardBtn);

    expect(screen.getByRole("button", { name: /Record Card/i })).toBeInTheDocument();
  });

  it("switches to PK form when PK button is clicked", () => {
    render(<MajorEventModal {...defaultProps} />);

    const pkBtn = screen.getByRole("button", { name: "PK" });
    fireEvent.click(pkBtn);

    expect(screen.getByRole("button", { name: /Log Penalty Kick/i })).toBeInTheDocument();
    expect(screen.getByText("Penalty Kick Result")).toBeInTheDocument();
  });

  it("keeps clock running on non-NFHS games even when selecting Injury", () => {
    render(<MajorEventModal {...defaultProps} />);

    // By default, clock button shows "Clock Running ⏱️"
    expect(screen.getByRole("button", { name: /Clock Running/i })).toBeInTheDocument();

    // Click Injury button
    const injuryBtn = screen.getByRole("button", { name: "Injury" });
    fireEvent.click(injuryBtn);

    // Clock must still be running (not automatically paused)
    expect(screen.getByRole("button", { name: /Clock Running/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Clock Paused/i })).not.toBeInTheDocument();
  });

  it("triggers split confirmation dialog when pausing clock after running play has elapsed", () => {
    // Event opened at 100s, but game clock progressed to 130s (30s elapsed)
    let currentTime = 100;
    useGameStore.setState({
      getGameTime: () => currentTime,
    });

    const { rerender } = render(<MajorEventModal {...defaultProps} />);

    // Advance match clock by 30 seconds
    act(() => {
      currentTime = 130;
    });

    rerender(<MajorEventModal {...defaultProps} />);

    // Click to pause clock
    const clockRunningBtn = screen.getByRole("button", { name: /Clock Running/i });
    fireEvent.click(clockRunningBtn);

    // Dialog pops up with 3 scenarios
    expect(screen.getByText("Pause Match Clock?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yes, Pause Clock at Current Time/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pause from Event Start/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Keep Clock Running/i })).toBeInTheDocument();

    // Confirm split at current time
    fireEvent.click(screen.getByRole("button", { name: /Yes, Pause Clock at Current Time/i }));

    // Check that Zustand gameEventsMajor received the running segment and the paused stoppage
    const events = useGameStore.getState().game?.gameEventsMajor || [];
    expect(events.length).toBe(2);

    // Running segment (T1 -> T2 with clock_should_run: 1)
    const runningSegment = events.find((e: any) => e.clock_should_run === 1);
    expect(runningSegment).toBeDefined();
    expect(runningSegment?.game_time).toBe(100);
    expect(runningSegment?.end_time).toBe(130);

    // Paused stoppage at T2 (clock_should_run: 0, end_time: null)
    const pausedStoppage = events.find((e: any) => e.clock_should_run === 0);
    expect(pausedStoppage).toBeDefined();
    expect(pausedStoppage?.game_time).toBe(130);
    expect(pausedStoppage?.end_time).toBeNull();

    // Clock toggle button should now display "Clock Paused ⏸️"
    expect(screen.getByRole("button", { name: /Clock Paused/i })).toBeInTheDocument();
  });

  it("handles Scenario 2: confirms the whole event should be a stopped clock from event start", () => {
    let currentTime = 100;
    useGameStore.setState({
      getGameTime: () => currentTime,
    });

    const { rerender } = render(<MajorEventModal {...defaultProps} />);

    act(() => {
      currentTime = 145;
    });
    rerender(<MajorEventModal {...defaultProps} />);

    // Click to pause clock
    const clockRunningBtn = screen.getByRole("button", { name: /Clock Running/i });
    fireEvent.click(clockRunningBtn);

    // Choose: Pause from Event Start (100s)
    const pauseFromStartBtn = screen.getByRole("button", { name: /Pause from Event Start/i });
    fireEvent.click(pauseFromStartBtn);

    const events = useGameStore.getState().game?.gameEventsMajor || [];
    // Only 1 stoppage event created (at 100s), no running interval split
    expect(events.length).toBe(1);
    expect(events[0].clock_should_run).toBe(0);
    expect(events[0].game_time).toBe(100);
    expect(events[0].end_time).toBeNull();

    expect(screen.getByRole("button", { name: /Clock Paused/i })).toBeInTheDocument();
  });

  it("handles Scenario 1: cancels the clock stop change and keeps clock running", () => {
    render(<MajorEventModal {...defaultProps} />);

    // Click to pause clock
    const clockRunningBtn = screen.getByRole("button", { name: /Clock Running/i });
    fireEvent.click(clockRunningBtn);

    expect(screen.getByText("Pause Match Clock?")).toBeInTheDocument();

    // Choose: Keep Clock Running
    const cancelBtn = screen.getByRole("button", { name: /Keep Clock Running/i });
    fireEvent.click(cancelBtn);

    // Clock must still be running and no stoppage created
    expect(screen.getByRole("button", { name: /Clock Running/i })).toBeInTheDocument();
    const events = useGameStore.getState().game?.gameEventsMajor || [];
    expect(events.length).toBe(0);
  });
});
