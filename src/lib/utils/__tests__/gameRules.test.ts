import { describe, it, expect } from "vitest";
import {
  SYSTEM_DEFAULT_GAME_SETTINGS,
  safeParseMatchRules,
  mergeGameSettings,
  inferRulesFromNodeName,
  resolveHierarchyGameSettings,
} from "../gameRules";

describe("Game Rules & Hierarchy Inheritance Standard", () => {
  it("defaults to regular tie without PK shootout by default", () => {
    expect(SYSTEM_DEFAULT_GAME_SETTINGS.hasShootout).toBe(false);
    expect(SYSTEM_DEFAULT_GAME_SETTINGS.hasOvertime).toBe(false);
    expect(SYSTEM_DEFAULT_GAME_SETTINGS.tiebreakerMode).toBe("none");
    expect(SYSTEM_DEFAULT_GAME_SETTINGS.playersOnField).toBe(11);
    expect(SYSTEM_DEFAULT_GAME_SETTINGS.periodCount).toBe(2);
    expect(SYSTEM_DEFAULT_GAME_SETTINGS.periodDuration).toBe(2400); // 40 mins
  });

  it("safely parses stringified or object match rules", () => {
    expect(safeParseMatchRules(null)).toBeNull();
    expect(safeParseMatchRules(undefined)).toBeNull();
    expect(safeParseMatchRules("")).toBeNull();

    const parsedFromStr = safeParseMatchRules('{"playersOnField":9,"periodDuration":1800}');
    expect(parsedFromStr?.playersOnField).toBe(9);
    expect(parsedFromStr?.periodDuration).toBe(1800);

    const parsedFromObj = safeParseMatchRules({ playersOnField: 7 });
    expect(parsedFromObj?.playersOnField).toBe(7);
  });

  it("merges game settings and maintains tiebreaker coherence", () => {
    const base = { ...SYSTEM_DEFAULT_GAME_SETTINGS };
    
    // Switch to pk_only
    const pkOnly = mergeGameSettings(base, { tiebreakerMode: "pk_only" });
    expect(pkOnly.tiebreakerMode).toBe("pk_only");
    expect(pkOnly.hasShootout).toBe(true);
    expect(pkOnly.hasOvertime).toBe(false);

    // Switch to overtime_then_pk
    const otPk = mergeGameSettings(base, { tiebreakerMode: "overtime_then_pk" });
    expect(otPk.tiebreakerMode).toBe("overtime_then_pk");
    expect(otPk.hasShootout).toBe(true);
    expect(otPk.hasOvertime).toBe(true);

    // Switch back to none (tie)
    const none = mergeGameSettings(otPk, { tiebreakerMode: "none" });
    expect(none.tiebreakerMode).toBe("none");
    expect(none.hasShootout).toBe(false);
    expect(none.hasOvertime).toBe(false);
  });

  it("infers format and duration based on node/age-group names", () => {
    const u11 = inferRulesFromNodeName("U11 Boys Premier");
    expect(u11.playersOnField).toBe(9);
    expect(u11.periodDuration).toBe(1800);

    const u12 = inferRulesFromNodeName("2014 Girls U12 Elite");
    expect(u12.playersOnField).toBe(9);
    expect(u12.periodDuration).toBe(1800);

    const u10 = inferRulesFromNodeName("U10 Division 1");
    expect(u10.playersOnField).toBe(7);
    expect(u10.periodDuration).toBe(1500);

    const u13 = inferRulesFromNodeName("U13 Boys");
    expect(u13.playersOnField).toBe(11);
    expect(u13.periodDuration).toBe(2100);

    const shootoutNode = inferRulesFromNodeName("District 7 Tournament Shootout Stage");
    expect(shootoutNode.hasShootout).toBe(true);
    expect(shootoutNode.tiebreakerMode).toBe("pk_only");
  });

  it("correctly resolves multi-level hierarchy inheritance (League -> Parent Node -> Sub-node)", () => {
    // League: TSSAA with NFHS rules (11v11, 40 min halves, tie by default)
    const leagues = [
      {
        id: 1,
        name: "TSSAA High School Soccer",
        matchRules: JSON.stringify({
          playersOnField: 11,
          periodDuration: 2400, // 40m
          clockRuleProfile: "NFHS",
          tiebreakerMode: "none",
          hasShootout: false,
        }),
      },
      {
        id: 2,
        name: "Collective Cup Tournament",
        matchRules: JSON.stringify({
          playersOnField: 11,
          periodDuration: 2100, // 35m
          tiebreakerMode: "none",
          hasShootout: false,
        }),
      },
    ];

    const nodes = [
      // TSSAA Regular Season District (inherits TSSAA rules directly)
      {
        id: 10,
        name: "District 7-AAA Regular Season",
        leagueId: 1,
        parentId: null,
        matchRules: null,
      },
      // TSSAA District Tournament (overrides tiebreaker to overtime + shootout)
      {
        id: 11,
        name: "District 7-AAA Tournament Playoff",
        leagueId: 1,
        parentId: null,
        matchRules: JSON.stringify({
          tiebreakerMode: "overtime_then_pk",
          hasOvertime: true,
          hasShootout: true,
        }),
      },
      // Collective Cup: U11/U12 Sub-node (overrides to 9v9, 30m halves)
      {
        id: 20,
        name: "U11/U12 Girls Division",
        leagueId: 2,
        parentId: null,
        matchRules: JSON.stringify({
          playersOnField: 9,
          periodDuration: 1800, // 30m
        }),
      },
      // Collective Cup: U11/U12 Gold Bracket (child node of 20, inherits 9v9, overrides shootout for finals)
      {
        id: 21,
        name: "U11/U12 Gold Bracket Finals",
        leagueId: 2,
        parentId: 20,
        matchRules: JSON.stringify({
          tiebreakerMode: "pk_only",
          hasShootout: true,
        }),
      },
    ];

    // 1. Regular Season District (Node 10): Inherits TSSAA (11v11, 40m, tie)
    const res10 = resolveHierarchyGameSettings({
      nodeId: 10,
      allNodes: nodes,
      leagueId: 1,
      allLeagues: leagues,
    });
    expect(res10.resolvedRules.playersOnField).toBe(11);
    expect(res10.resolvedRules.periodDuration).toBe(2400);
    expect(res10.resolvedRules.tiebreakerMode).toBe("none");
    expect(res10.resolvedRules.hasShootout).toBe(false);
    expect(res10.hasCustomOverrides).toBe(false);
    expect(res10.inheritedFrom.name).toBe("TSSAA High School Soccer");

    // 2. District Tournament (Node 11): Keeps TSSAA 11v11 and 40m, but has custom shootout override
    const res11 = resolveHierarchyGameSettings({
      nodeId: 11,
      allNodes: nodes,
      leagueId: 1,
      allLeagues: leagues,
    });
    expect(res11.resolvedRules.playersOnField).toBe(11);
    expect(res11.resolvedRules.periodDuration).toBe(2400);
    expect(res11.resolvedRules.tiebreakerMode).toBe("overtime_then_pk");
    expect(res11.resolvedRules.hasShootout).toBe(true);
    expect(res11.hasCustomOverrides).toBe(true);

    // 3. Collective Cup U11/U12 (Node 20): Overrides to 9v9, 30m halves, ends in draw
    const res20 = resolveHierarchyGameSettings({
      nodeId: 20,
      allNodes: nodes,
      leagueId: 2,
      allLeagues: leagues,
    });
    expect(res20.resolvedRules.playersOnField).toBe(9);
    expect(res20.resolvedRules.periodDuration).toBe(1800);
    expect(res20.resolvedRules.tiebreakerMode).toBe("none");
    expect(res20.resolvedRules.hasShootout).toBe(false);
    expect(res20.hasCustomOverrides).toBe(true);

    // 4. Collective Cup U11/U12 Gold Bracket (Node 21): Inherits 9v9 & 30m from Node 20, overrides to PK shootout
    const res21 = resolveHierarchyGameSettings({
      nodeId: 21,
      allNodes: nodes,
      leagueId: 2,
      allLeagues: leagues,
    });
    expect(res21.resolvedRules.playersOnField).toBe(9); // Inherited from Node 20
    expect(res21.resolvedRules.periodDuration).toBe(1800); // Inherited from Node 20
    expect(res21.resolvedRules.tiebreakerMode).toBe("pk_only"); // Overridden on Node 21
    expect(res21.resolvedRules.hasShootout).toBe(true);
    expect(res21.hasCustomOverrides).toBe(true);
  });
});
