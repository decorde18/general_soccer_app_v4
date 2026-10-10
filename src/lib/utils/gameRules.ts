import type { GameSettings, TiebreakerMode } from "@/types/game";

/**
 * Universal System Default Match Settings.
 * Notice: Regulation matches end in a tie by default ("none").
 * Matches DO NOT go to PK shootouts unless explicitly configured by a tournament, league, or node.
 */
export const SYSTEM_DEFAULT_GAME_SETTINGS: GameSettings = {
  playersOnField: 11,
  periodCount: 2,
  periodDuration: 2400, // 40 minutes per half
  hasOvertime: false,
  overtimePeriods: 2,
  overtimeDuration: 600, // 10 minutes per OT period
  goldenGoal: false,
  tiebreakerMode: "none", // Tie by default
  hasShootout: false, // No shootout by default
  clockDirection: "up",
  reentryRule: "unlimited",
  autoStopClockOnMajorEvent: false,
  clockRuleProfile: "USSF",
};

/**
 * Safely parse match rules JSON string or object into Partial<GameSettings>.
 */
export function safeParseMatchRules(raw: unknown): Partial<GameSettings> | null {
  if (!raw) return null;
  if (typeof raw === "object") {
    return raw as Partial<GameSettings>;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") {
        return JSON.parse(parsed);
      }
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Merge an override onto a base set of settings, preserving tiebreaker coherence.
 */
export function mergeGameSettings(
  base: GameSettings,
  overrides?: Partial<GameSettings> | null
): GameSettings {
  if (!overrides) return { ...base };

  const merged: GameSettings = {
    ...base,
    ...overrides,
  };

  // Coherence normalization for tiebreakers:
  if (overrides.tiebreakerMode !== undefined) {
    if (overrides.tiebreakerMode === "none") {
      merged.hasOvertime = false;
      merged.hasShootout = false;
    } else if (overrides.tiebreakerMode === "pk_only") {
      merged.hasOvertime = false;
      merged.hasShootout = true;
    } else if (overrides.tiebreakerMode === "overtime_then_pk") {
      merged.hasOvertime = true;
      merged.hasShootout = overrides.hasShootout !== undefined ? overrides.hasShootout : true;
    }
  } else if (overrides.hasShootout !== undefined || overrides.hasOvertime !== undefined) {
    const hasOt = merged.hasOvertime;
    const hasSo = merged.hasShootout;
    merged.tiebreakerMode = hasOt
      ? "overtime_then_pk"
      : hasSo
      ? "pk_only"
      : "none";
  }

  return merged;
}

/**
 * Infer age-group / format specific sensible defaults from node/division name.
 * e.g. U11 / U12 defaults to 9v9, 30 min halves; U9/U10 to 7v7, 25 min halves.
 */
export function inferRulesFromNodeName(name?: string): Partial<GameSettings> {
  if (!name) return {};
  const lower = name.toLowerCase();

  const inferred: Partial<GameSettings> = {};

  if (
    lower.includes("u9") ||
    lower.includes("u10") ||
    lower.includes("7v7") ||
    lower.includes("7 v 7")
  ) {
    inferred.playersOnField = 7;
    inferred.periodDuration = 1500; // 25 mins
  } else if (
    lower.includes("u11") ||
    lower.includes("u12") ||
    lower.includes("9v9") ||
    lower.includes("9 v 9")
  ) {
    inferred.playersOnField = 9;
    inferred.periodDuration = 1800; // 30 mins
  } else if (lower.includes("u13") || lower.includes("u14")) {
    inferred.playersOnField = 11;
    inferred.periodDuration = 2100; // 35 mins
  } else if (lower.includes("u15") || lower.includes("u16")) {
    inferred.playersOnField = 11;
    inferred.periodDuration = 2400; // 40 mins
  } else if (lower.includes("u17") || lower.includes("u18") || lower.includes("u19")) {
    inferred.playersOnField = 11;
    inferred.periodDuration = 2700; // 45 mins
  }

  // Knockout/tournament node naming hints (e.g. "Shootout", "Playoff", "Finals")
  if (lower.includes("shootout") || lower.includes("pk")) {
    inferred.hasShootout = true;
    inferred.tiebreakerMode = "pk_only";
  }

  return inferred;
}

export interface HierarchyNodeLike {
  id: number;
  name?: string;
  parentId?: number | null;
  leagueId?: number;
  matchRules?: string | null;
}

export interface HierarchyLeagueLike {
  id: number;
  name?: string;
  matchRules?: string | null;
  reg_periods?: number | null;
  period_duration?: number | null;
  ot_if_tied?: boolean | null;
  ot_duration?: number | null;
  so_if_tied?: boolean | null;
}

/**
 * Resolves effective game settings by traversing:
 * System Defaults -> League -> Ancestor Nodes -> Target Node
 */
export function resolveHierarchyGameSettings({
  nodeId,
  allNodes = [],
  leagueId,
  allLeagues = [],
}: {
  nodeId?: number | null;
  allNodes?: HierarchyNodeLike[];
  leagueId?: number | null;
  allLeagues?: HierarchyLeagueLike[];
}): {
  resolvedRules: GameSettings;
  inheritedFrom: { id: number; name: string; type: "node" | "league" | "system" };
  hasCustomOverrides: boolean;
  customNodeOverrides: Partial<GameSettings> | null;
} {
  let resolved: GameSettings = { ...SYSTEM_DEFAULT_GAME_SETTINGS };
  let inheritedFrom: { id: number; name: string; type: "node" | "league" | "system" } = {
    id: 0,
    name: "System Standard",
    type: "system",
  };

  const targetNode = nodeId ? allNodes.find((n) => n.id === nodeId) : null;
  const targetLeagueId = leagueId || targetNode?.leagueId || null;
  const targetLeague = targetLeagueId ? allLeagues.find((l) => l.id === targetLeagueId) : null;

  // 1. League Level
  if (targetLeague) {
    const leagueRules = safeParseMatchRules(targetLeague.matchRules);
    if (leagueRules) {
      resolved = mergeGameSettings(resolved, leagueRules);
      inheritedFrom = {
        id: targetLeague.id,
        name: targetLeague.name || "League",
        type: "league",
      };
    } else {
      // Legacy column fallbacks
      const colOverrides: Partial<GameSettings> = {};
      if (targetLeague.reg_periods) colOverrides.periodCount = targetLeague.reg_periods;
      if (targetLeague.period_duration) colOverrides.periodDuration = targetLeague.period_duration * 60;
      if (targetLeague.ot_if_tied !== null && targetLeague.ot_if_tied !== undefined) {
        colOverrides.hasOvertime = Boolean(targetLeague.ot_if_tied);
      }
      if (targetLeague.ot_duration) colOverrides.overtimeDuration = targetLeague.ot_duration * 60;
      if (targetLeague.so_if_tied !== null && targetLeague.so_if_tied !== undefined) {
        colOverrides.hasShootout = Boolean(targetLeague.so_if_tied);
      }
      if (Object.keys(colOverrides).length > 0) {
        resolved = mergeGameSettings(resolved, colOverrides);
        inheritedFrom = {
          id: targetLeague.id,
          name: targetLeague.name || "League",
          type: "league",
        };
      }
    }
  }

  // 2. Ancestor Nodes Path (from root node down to parent of targetNode)
  if (targetNode) {
    const ancestors: HierarchyNodeLike[] = [];
    let currParentId = targetNode.parentId;
    while (currParentId) {
      const parentNode = allNodes.find((n) => n.id === currParentId);
      if (!parentNode || ancestors.some((a) => a.id === parentNode.id)) break; // cycle protection
      ancestors.unshift(parentNode);
      currParentId = parentNode.parentId;
    }

    for (const ancestor of ancestors) {
      const ancestorRules = safeParseMatchRules(ancestor.matchRules);
      if (ancestorRules && Object.keys(ancestorRules).length > 0) {
        resolved = mergeGameSettings(resolved, ancestorRules);
        inheritedFrom = {
          id: ancestor.id,
          name: ancestor.name || `Node #${ancestor.id}`,
          type: "node",
        };
      }
    }

    // 3. Target Node Overrides
    const nodeRules = safeParseMatchRules(targetNode.matchRules);
    const hasCustomOverrides = Boolean(nodeRules && Object.keys(nodeRules).length > 0);

    if (hasCustomOverrides && nodeRules) {
      resolved = mergeGameSettings(resolved, nodeRules);
      return {
        resolvedRules: resolved,
        inheritedFrom: {
          id: targetNode.id,
          name: targetNode.name || `Node #${targetNode.id}`,
          type: "node",
        },
        hasCustomOverrides: true,
        customNodeOverrides: nodeRules,
      };
    }

    return {
      resolvedRules: resolved,
      inheritedFrom,
      hasCustomOverrides: false,
      customNodeOverrides: null,
    };
  }

  return {
    resolvedRules: resolved,
    inheritedFrom,
    hasCustomOverrides: false,
    customNodeOverrides: null,
  };
}
