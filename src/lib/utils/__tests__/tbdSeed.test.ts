import { describe, it, expect } from "vitest";
import { isTbdOrSeedTeam } from "@/lib/utils/locationUtils";

describe("isTbdOrSeedTeam Utility", () => {
  it("should correctly identify seed placeholders and TBD teams", () => {
    expect(isTbdOrSeedTeam("[ Group A #1 Seed ]")).toBe(true);
    expect(isTbdOrSeedTeam("Group A #2 Seed")).toBe(true);
    expect(isTbdOrSeedTeam("Winner of Game 5")).toBe(true);
    expect(isTbdOrSeedTeam("Loser #12")).toBe(true);
    expect(isTbdOrSeedTeam("TBD")).toBe(true);
    expect(isTbdOrSeedTeam("T.B.D.")).toBe(true);
    expect(isTbdOrSeedTeam("TBA")).toBe(true);
    expect(isTbdOrSeedTeam("Bye")).toBe(true);
    expect(isTbdOrSeedTeam("Pool A Winner")).toBe(true);
    expect(isTbdOrSeedTeam("Bracket B #1")).toBe(true);
  });

  it("should return false for actual team names or empty inputs", () => {
    expect(isTbdOrSeedTeam("Tennessee Soccer Club U12")).toBe(false);
    expect(isTbdOrSeedTeam("Nashville SC Premier")).toBe(false);
    expect(isTbdOrSeedTeam("Independence High School")).toBe(false);
    expect(isTbdOrSeedTeam("One Knox Youth Club - U11G Yellow")).toBe(false);
    expect(isTbdOrSeedTeam("Soccer Club of Oak Ridge - SCOR U11 Girls")).toBe(false);
    expect(isTbdOrSeedTeam("")).toBe(false);
    expect(isTbdOrSeedTeam(undefined)).toBe(false);
    expect(isTbdOrSeedTeam("   ")).toBe(false);
  });
});
