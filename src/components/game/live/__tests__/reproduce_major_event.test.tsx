import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import LiveGameTrackerClient from "@/components/game/LiveGameTrackerClient";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "923", teamSeasonId: "121" }),
  useRouter: () => ({ push: vi.fn() }),
}));

describe("LiveGameTrackerClient - Game 923 reproduction", () => {
  beforeEach(() => {
    // Reset stores
    useGameStore.setState({
      game: {
        id: 923,
        game_id: 923,
        season_id: 2,
        home_team_season_id: 121,
        away_team_season_id: 138,
        home_team_name: "U12 (2014/15) Williamson Girls Elite",
        away_team_name: "One Knox U12G Pre GA",
        home_club_name: "Tennessee Soccer Club",
        away_club_name: "One Knox",
        homeClubAbbreviation: "TSC",
        awayClubAbbreviation: "OK",
        isHome: true,
        status: "in_progress",
        game_type: "group_stage",
        settings: {
          periodCount: 2,
          periodDuration: 40,
          playersOnField: 9,
          reentryRule: "unlimited",
          autoStopClockOnMajorEvent: true,
        },
        periods: [
          {
            id: 212,
            periodNumber: 1,
            index: 0,
            startTime: 1791640348274,
            endTime: null, // actively in period 1
          },
        ],
        gameStartTime: 1791640348274,
        currentPeriodIndex: 0,
        gameEventsGoals: [],
        gameEventsDiscipline: [],
        gameEventsPenalties: [],
        gameEventsMajor: [],
        playerActions: [],
        gameEventsTeam: [],
        gameSubs: [],
        pendingSubs: [],
        goalsFor: 0,
        goalsAgainst: 0,
      } as any,
    });

    useGamePlayersStore.setState({
      players: [
        {
          id: 271,
          playerGameId: 1538,
          fullName: "Leighton Hurley",
          jerseyNumber: 27,
          gameStatus: "starter",
          fieldStatus: "onField",
          ins: [],
          outs: [],
          subStatus: null,
        },
        {
          id: 277,
          playerGameId: 1541,
          fullName: "Adelyne Wooten",
          jerseyNumber: 51,
          gameStatus: "dressed",
          fieldStatus: "onBench",
          ins: [],
          outs: [],
          subStatus: null,
        },
      ] as any,
    });
  });

  it("clicks Record Major Event button and opens modal without throwing error", async () => {
    render(<LiveGameTrackerClient />);

    const majorBtn = screen.getByRole("button", { name: /Record Major Event/i });
    expect(majorBtn).toBeInTheDocument();

    // Click Record Major Event
    fireEvent.click(majorBtn);

    // Modal should open
    expect(screen.getByText("Record Major Match Event")).toBeInTheDocument();
  });
});
