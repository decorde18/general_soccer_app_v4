import { describe, it, expect, beforeEach } from "vitest";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";

describe("Own Goal Attribution & Score Calculation", () => {
  const OUR_TEAM_ID = 101;
  const OPP_TEAM_ID = 202;

  beforeEach(() => {
    useGameStore.setState({
      game: {
        id: 1,
        game_id: 1,
        teamSeasonId: OUR_TEAM_ID,
        opponentId: OPP_TEAM_ID,
        isHome: true,
        home_team_season_id: OUR_TEAM_ID,
        away_team_season_id: OPP_TEAM_ID,
        currentPeriodIndex: 0,
        gameEventsGoals: [],
        gameEventsMajor: [],
        gameEventsDiscipline: [],
        periods: [{ id: 1, periodNumber: 1, index: 0, startTime: 1000, endTime: null }],
        settings: { periodCount: 2, periodDuration: 2400, autoStopClockOnMajorEvent: false } as any,
        goalsFor: 0,
        goalsAgainst: 0,
      } as any,
    });

    useGamePlayersStore.setState({
      players: [
        { id: 10, playerGameId: 10, fullName: "Player One", fieldStatus: "onField", goals: 0, assists: 0 },
        { id: 11, playerGameId: 11, fullName: "Player Two", fieldStatus: "onField", goals: 0, assists: 0 },
      ] as any[],
    });
  });

  it("adds +1 to Our Team goalsFor when Opponent scores an own goal into their net (team_season_id = OUR_TEAM_ID)", () => {
    const store = useGameStore.getState();

    // Goal awarded to Our Team (teamTarget = "us")
    store.addGoalEvent(
      {
        id: "goal-1",
        major_event_id: "major-1",
        team_season_id: OUR_TEAM_ID,
        is_own_goal: true,
        scorer_player_game_id: null,
        assist_player_game_id: null,
      } as any,
      {
        id: "major-1",
        game_id: 1,
        period: 1,
        event_type: "goal",
        game_time: 120,
        clock_should_run: 1,
      } as any
    );

    const updatedGame = useGameStore.getState().game;
    expect(updatedGame?.goalsFor).toBe(1);
    expect(updatedGame?.goalsAgainst).toBe(0);

    // Verify player stats are NOT credited with a goal
    const players = useGamePlayersStore.getState().players;
    expect(players[0].goals).toBe(0);
    expect(players[1].goals).toBe(0);
  });

  it("adds +1 to Opponent goalsAgainst when Our Team scores an own goal into our net (team_season_id = OPP_TEAM_ID)", () => {
    const store = useGameStore.getState();

    // Goal awarded to Opponent (teamTarget = "opp")
    store.addGoalEvent(
      {
        id: "goal-2",
        major_event_id: "major-2",
        team_season_id: OPP_TEAM_ID,
        is_own_goal: true,
        scorer_player_game_id: null,
        assist_player_game_id: null,
      } as any,
      {
        id: "major-2",
        game_id: 1,
        period: 1,
        event_type: "goal",
        game_time: 240,
        clock_should_run: 1,
      } as any
    );

    const updatedGame = useGameStore.getState().game;
    expect(updatedGame?.goalsFor).toBe(0);
    expect(updatedGame?.goalsAgainst).toBe(1);

    // Verify player stats are NOT credited with a goal
    const players = useGamePlayersStore.getState().players;
    expect(players[0].goals).toBe(0);
    expect(players[1].goals).toBe(0);
  });
});
