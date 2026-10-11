import { describe, it, expect, beforeEach } from "vitest";
import useGamePlayerTimeStore from "../gamePlayerTimeStore";
import useGameStore from "../gameStore";
import { Player } from "../gamePlayersStore";
import { inferRulesFromNodeName } from "@/lib/utils/gameRules";

describe("Plus/Minus In-Game Calculations", () => {
  beforeEach(() => {
    useGameStore.setState({
      game: {
        id: 999,
        game_id: 999,
        teamSeasonId: 10,
        home_team_season_id: 10,
        away_team_season_id: 20,
        isHome: true,
        gameEventsGoals: [
          // Goal 1: scored at 500s by our team (team 10)
          {
            id: 1,
            major_event_id: 101,
            team_season_id: 10,
            game_time: 500,
          },
          // Goal 2: scored at 1500s by opponent (team 20)
          {
            id: 2,
            major_event_id: 102,
            team_season_id: 20,
            game_time: 1500,
          },
        ],
        gameEventsMajor: [
          { id: 101, game_time: 500, event_type: "goal" },
          { id: 102, game_time: 1500, event_type: "goal" },
        ],
      } as any,
    });
  });

  it("calculates plus/minus for starters vs subbed players accurately based on on-field presence", () => {
    const timeStore = useGamePlayerTimeStore.getState();

    // Starter who played until 1000s, then subbed OUT
    const starterEarlySubOut: Player = {
      id: "p1",
      playerGameId: "pg1",
      fullName: "Starter Subbed Out Early",
      started: true,
      gameStatus: "starter",
      teamSeasonId: 10,
      ins: [],
      outs: [{ gameTime: 1000, subId: "sub1" }],
    } as any;

    // Bench player who subbed IN at 1000s
    const benchSubbedInLater: Player = {
      id: "p2",
      playerGameId: "pg2",
      fullName: "Non-Starter Subbed In Later",
      started: false,
      gameStatus: "dressed",
      teamSeasonId: 10,
      ins: [{ gameTime: 1000, subId: "sub1" }],
      outs: [],
    } as any;

    // Full 90 minute starter who never subbed out
    const fullMatchStarter: Player = {
      id: "p3",
      playerGameId: "pg3",
      fullName: "Full Match Starter",
      started: true,
      gameStatus: "starter",
      teamSeasonId: 10,
      ins: [],
      outs: [],
    } as any;

    // Unused substitute
    const unusedBench: Player = {
      id: "p4",
      playerGameId: "pg4",
      fullName: "Unused Sub",
      started: false,
      gameStatus: "dressed",
      teamSeasonId: 10,
      ins: [],
      outs: [],
    } as any;

    // At 500s (Goal 1: +1 for our team):
    // - starterEarlySubOut is on field (+1)
    // - benchSubbedInLater is NOT on field (0)
    // - fullMatchStarter is on field (+1)
    // - unusedBench is NOT on field (0)

    // At 1500s (Goal 2: -1 conceded to opponent):
    // - starterEarlySubOut is NOT on field (remains +1)
    // - benchSubbedInLater is on field (-1)
    // - fullMatchStarter is on field (+1 - 1 = 0)
    // - unusedBench is NOT on field (0)

    expect(timeStore.calculatePlusMinus(starterEarlySubOut, 999)).toBe(1);
    expect(timeStore.calculatePlusMinus(benchSubbedInLater, 999)).toBe(-1);
    expect(timeStore.calculatePlusMinus(fullMatchStarter, 999)).toBe(0);
    expect(timeStore.calculatePlusMinus(unusedBench, 999)).toBe(0);
  });

  it("resolves goal game_time from major event if missing directly on goal object", () => {
    const timeStore = useGamePlayerTimeStore.getState();

    // Game where goal object has no direct game_time, only major_event_id
    useGameStore.setState({
      game: {
        id: 888,
        game_id: 888,
        teamSeasonId: 10,
        home_team_season_id: 10,
        away_team_season_id: 20,
        isHome: true,
        gameEventsGoals: [
          {
            id: 10,
            major_event_id: 501,
            team_season_id: 10,
            // no game_time on goal
          },
        ],
        gameEventsMajor: [
          { id: 501, game_time: 1200, event_type: "goal" },
        ],
      } as any,
    });

    const benchPlayerSubbedInAt1000: Player = {
      id: "p2",
      playerGameId: "pg2",
      fullName: "Bench Player",
      started: false,
      gameStatus: "dressed",
      teamSeasonId: 10,
      ins: [{ gameTime: 1000, subId: "sub1" }],
      outs: [],
    } as any;

    expect(timeStore.calculatePlusMinus(benchPlayerSubbedInAt1000, 888)).toBe(1);
  });
});

describe("Auto Pause Clock Defaults", () => {
  it("defaults autoStopClockOnMajorEvent to false for standard rules", () => {
    const defaultInferred = inferRulesFromNodeName("U12 Boys League Division 1");
    expect(defaultInferred.autoStopClockOnMajorEvent).toBeUndefined(); // defaults to false in system settings
  });

  it("infers autoStopClockOnMajorEvent true for NFHS / High School leagues", () => {
    const nfhsInferred = inferRulesFromNodeName("Boys Varsity Soccer NFHS");
    expect(nfhsInferred.autoStopClockOnMajorEvent).toBe(true);
    expect(nfhsInferred.clockRuleProfile).toBe("NFHS");

    const hsInferred = inferRulesFromNodeName("Girls High School Soccer");
    expect(hsInferred.autoStopClockOnMajorEvent).toBe(true);
  });
});
