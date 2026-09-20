import { describe, it, expect } from "vitest";
import { checkPlayerSubEligibility, calculateSubWindowsUsed } from "../subRules";
import { Player } from "@/stores/gamePlayersStore";
import { GameSettings } from "@/types/game";

function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 101,
    playerGameId: 501,
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe",
    nickname: null,
    jerseyNumber: 10,
    position: "MID",
    teamId: 1,
    teamSeasonId: 1,
    homeAway: "home",
    gameStatus: "dressed",
    fieldStatus: "onBench",
    started: false,
    isGuest: false,
    ins: [],
    outs: [],
    subStatus: null,
    ...overrides,
  } as Player;
}

const baseSettings: GameSettings = {
  playersOnField: 11,
  periodCount: 2,
  periodDuration: 2400,
  hasOvertime: false,
  overtimePeriods: 2,
  overtimeDuration: 600,
  hasShootout: true,
  clockDirection: "up",
  reentryRule: "unlimited",
};

describe("checkPlayerSubEligibility", () => {
  it("allows initial entry for any dressed bench player", () => {
    const player = createMockPlayer({ outs: [] });
    const res = checkPlayerSubEligibility(player, { ...baseSettings, reentryRule: "no_reentry" }, 1);
    expect(res.isEligible).toBe(true);
    expect(res.isInitialEntry).toBe(true);
  });

  it("blocks re-entry under no_reentry once player subbed out", () => {
    const player = createMockPlayer({
      outs: [{ gameTime: 1200, subId: 1, gkSub: false, period: 1 }],
    });
    const res = checkPlayerSubEligibility(player, { ...baseSettings, reentryRule: "no_reentry" }, 1);
    expect(res.isEligible).toBe(false);
    expect(res.reason).toContain("No Re-Entry Allowed");
  });

  it("blocks same-period re-entry under one_per_half", () => {
    const player = createMockPlayer({
      outs: [{ gameTime: 1200, subId: 1, gkSub: false, period: 1 }],
    });

    // In Period 1 after subbing out in Period 1
    const p1 = checkPlayerSubEligibility(player, { ...baseSettings, reentryRule: "one_per_half" }, 1);
    expect(p1.isEligible).toBe(false);

    // In Period 2, player is eligible again for their initial entry of Period 2
    const p2 = checkPlayerSubEligibility(player, { ...baseSettings, reentryRule: "one_per_half" }, 2);
    expect(p2.isEligible).toBe(true);
  });

  it("handles NCAA college rules correctly", () => {
    const settings: GameSettings = { ...baseSettings, reentryRule: "ncaa_college" };

    const playerWithP1Out = createMockPlayer({
      outs: [{ gameTime: 1000, subId: 1, gkSub: false, period: 1 }],
    });

    // Blocked in Period 1
    expect(checkPlayerSubEligibility(playerWithP1Out, settings, 1).isEligible).toBe(false);

    // Allowed 1 re-entry in Period 2
    expect(checkPlayerSubEligibility(playerWithP1Out, settings, 2).isEligible).toBe(true);

    // Blocked in Period 2 after subbing out a 2nd time in Period 2
    const playerSubbedTwiceInP2 = createMockPlayer({
      outs: [
        { gameTime: 1000, subId: 1, gkSub: false, period: 1 },
        { gameTime: 2500, subId: 2, gkSub: false, period: 2 },
        { gameTime: 3000, subId: 3, gkSub: false, period: 2 },
      ],
    });
    expect(checkPlayerSubEligibility(playerSubbedTwiceInP2, settings, 2).isEligible).toBe(false);
  });

  it("permits referee exception override for ineligible players", () => {
    const player = createMockPlayer({
      id: 101,
      outs: [{ gameTime: 1200, subId: 1, gkSub: false, period: 1 }],
    });
    const overrides = new Set<string | number>([101]);

    const res = checkPlayerSubEligibility(player, { ...baseSettings, reentryRule: "no_reentry" }, 1, overrides);
    expect(res.isEligible).toBe(true);
  });

  it("correctly groups multiple subs at the same stoppage timestamp into 1 sub window", () => {
    const mockSubs = [
      { period: 1, sub_time: 600 },
      { period: 1, sub_time: 600 }, // same window
      { period: 1, sub_time: 1200 }, // window 2
      { period: 2, sub_time: 0 }, // halftime (excluded)
      { period: 2, sub_time: 1800 }, // window 3
    ];

    expect(calculateSubWindowsUsed(mockSubs)).toBe(3);
    expect(calculateSubWindowsUsed(mockSubs, 1)).toBe(2);
    expect(calculateSubWindowsUsed(mockSubs, 2)).toBe(1);
  });

  it("enforces maxSubWindowsPerGame and maxSubWindowsPerHalf limits", () => {
    const player = createMockPlayer({ outs: [] });
    const mockSubsP1 = [
      { period: 1, sub_time: 300 },
      { period: 1, sub_time: 600 },
    ];

    // Max 2 windows per half: 2 used in period 1 -> blocked for a 3rd window in period 1
    const halfRes = checkPlayerSubEligibility(
      player,
      { ...baseSettings, maxSubWindowsPerHalf: 2 },
      1,
      new Set(),
      mockSubsP1
    );
    expect(halfRes.isEligible).toBe(false);
    expect(halfRes.reason).toContain("Max Sub Windows Reached for Half");

    // Max 3 windows per game: 3 total used across P1 and P2 -> blocked in P2
    const mockSubsTotal = [
      { period: 1, sub_time: 300 },
      { period: 1, sub_time: 600 },
      { period: 2, sub_time: 1500 },
    ];
    const gameRes = checkPlayerSubEligibility(
      player,
      { ...baseSettings, maxSubWindowsPerGame: 3 },
      2,
      new Set(),
      mockSubsTotal
    );
    expect(gameRes.isEligible).toBe(false);
    expect(gameRes.reason).toContain("Max Sub Windows Reached for Game");
  });
});
