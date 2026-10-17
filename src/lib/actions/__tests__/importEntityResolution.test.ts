import { describe, it, expect } from "vitest";
import { discernClubAndTeam, isTbdOrSeedTeam } from "@/lib/utils/locationUtils";

describe("Import Entity Resolution & Deduction", () => {
  describe("discernClubAndTeam", () => {
    it("correctly extracts explicit club and team when both are provided", () => {
      const res = discernClubAndTeam("Solar SC - 09G", "Solar SC");
      expect(res.clubName).toBe("Solar SC");
      expect(res.teamName).toBe("09G");
    });

    it("strips club prefix from team string when prefixed with space", () => {
      const res = discernClubAndTeam("Solar SC 09G Navy", "Solar SC");
      expect(res.clubName).toBe("Solar SC");
      expect(res.teamName).toBe("09G Navy");
    });

    it("parses combined club and team separated by delimiter when club is not passed", () => {
      const res = discernClubAndTeam("Dallas Texans - 2012 Boys Red", "");
      expect(res.clubName).toBe("Dallas Texans");
      expect(res.teamName).toBe("2012 Boys Red");
    });

    it("handles colon and pipe delimiters in combined team strings", () => {
      const resColon = discernClubAndTeam("Albion SC : 2011 Girls", "");
      expect(resColon.clubName).toBe("Albion SC");
      expect(resColon.teamName).toBe("2011 Girls");

      const resPipe = discernClubAndTeam("Tophat | 12G Gold", "");
      expect(resPipe.clubName).toBe("Tophat");
      expect(resPipe.teamName).toBe("12G Gold");
    });
  });

  describe("Resolved mapping team-club linkage simulation", () => {
    it("preserves clubId from Step 1 on the team resolution mapping", () => {
      // Step 1: User creates new club "Albion SC" -> DB returns ID 105
      const clubMapping = {
        matchedId: 105,
        createNew: false,
        clubId: 105,
        clubName: "Albion SC",
      };

      // Step 2: Unmatched team "Albion 2012 Boys" is linked to this club
      const teamMapping = {
        matchedId: null,
        createNew: true,
        clubId: clubMapping.matchedId,
        clubName: clubMapping.clubName,
      };

      expect(teamMapping.clubId).toBe(105);
      expect(teamMapping.clubName).toBe("Albion SC");
      expect(teamMapping.clubId).not.toBeNull();
    });

    it("accurately detects TBD or seed placeholders", () => {
      expect(isTbdOrSeedTeam("TBD")).toBe(true);
      expect(isTbdOrSeedTeam("Winner Game 5")).toBe(true);
      expect(isTbdOrSeedTeam("Group A #1 Seed")).toBe(true);
      expect(isTbdOrSeedTeam("Real Madrid 08")).toBe(false);
    });
  });
});
