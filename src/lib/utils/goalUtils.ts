/**
 * Universal Goal Types & Methods Specification and Normalization Utility
 * Shared across Live Match Tracking (MajorEventModal), Game Management (GameManageClient),
 * and Play-by-Play Summary (GameSummaryClient).
 */

export interface GoalMethodOption {
  id: string;
  label: string;
}

export const GOAL_METHOD_OPTIONS: GoalMethodOption[] = [
  { id: "open_play", label: "Open Play" },
  { id: "corner", label: "Corner Kick" },
  { id: "direct_free_kick", label: "Direct Free Kick" },
  { id: "indirect_free_kick", label: "Indirect Free Kick" },
  { id: "penalty_kick", label: "Penalty Kick" },
  { id: "throw_in", label: "Throw-In" },
  { id: "header", label: "Header" },
  { id: "volley", label: "Volley" },
];

/**
 * Safely parses any goal_types DB representation (JSON array string, raw string, array, or null)
 * into a string array of normalized method keys.
 */
export function parseGoalTypes(input: unknown): string[] {
  if (!input) return ["open_play"];
  if (Array.isArray(input)) {
    return input.map((item) => mapLegacyGoalMethod(String(item)));
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return ["open_play"];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => mapLegacyGoalMethod(String(item)));
      }
      return [mapLegacyGoalMethod(String(parsed))];
    } catch {
      return [mapLegacyGoalMethod(trimmed)];
    }
  }
  return ["open_play"];
}

/**
 * Maps legacy shorthand or ad-hoc strings to canonical IDs
 */
function mapLegacyGoalMethod(method: string): string {
  const m = method.toLowerCase();
  if (m === "foot" || m === "standard shot" || m === "standard") return "open_play";
  if (m === "penalty") return "penalty_kick";
  if (m === "free_kick" || m === "free kick") return "direct_free_kick";
  return method;
}

/**
 * Ensures goal_types is always stored as valid JSON array string
 * to satisfy MySQL CHECK (json_valid(`goal_types`)) constraint.
 */
export function normalizeGoalTypesJson(input: unknown): string {
  const types = parseGoalTypes(input);
  return JSON.stringify(types.length > 0 ? types : ["open_play"]);
}

/**
 * Formats goal types array or JSON string into clean human-readable labels
 * (e.g. "Corner Kick, Header" or "Open Play")
 */
export function formatGoalTypesDisplay(goalTypes: unknown, isOwnGoal?: boolean): string {
  if (isOwnGoal) return "Own Goal ⚠️";
  const types = parseGoalTypes(goalTypes);
  return types
    .map((t) => {
      const match = GOAL_METHOD_OPTIONS.find((opt) => opt.id === t);
      if (match) return match.label;
      return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    })
    .join(", ");
}
