import { describe, it, expect } from "vitest";
import {
  GOAL_METHOD_OPTIONS,
  parseGoalTypes,
  normalizeGoalTypesJson,
  formatGoalTypesDisplay,
} from "../goalUtils";

describe("Universal Goal Types & Methods Utilities", () => {
  it("exports the standard 8 goal method options", () => {
    expect(GOAL_METHOD_OPTIONS).toHaveLength(8);
    const ids = GOAL_METHOD_OPTIONS.map((o) => o.id);
    expect(ids).toEqual([
      "open_play",
      "corner",
      "direct_free_kick",
      "indirect_free_kick",
      "penalty_kick",
      "throw_in",
      "header",
      "volley",
    ]);
  });

  it("safely parses JSON array strings and raw legacy strings into array of methods", () => {
    expect(parseGoalTypes('["corner", "header"]')).toEqual(["corner", "header"]);
    expect(parseGoalTypes('["open_play"]')).toEqual(["open_play"]);
    expect(parseGoalTypes("foot")).toEqual(["open_play"]);
    expect(parseGoalTypes("penalty")).toEqual(["penalty_kick"]);
    expect(parseGoalTypes("free_kick")).toEqual(["direct_free_kick"]);
    expect(parseGoalTypes("")).toEqual(["open_play"]);
    expect(parseGoalTypes(null)).toEqual(["open_play"]);
  });

  it("normalizes to valid JSON array string for MySQL json_valid constraint", () => {
    expect(normalizeGoalTypesJson("foot")).toBe('["open_play"]');
    expect(normalizeGoalTypesJson(["corner", "volley"])).toBe('["corner","volley"]');
    expect(normalizeGoalTypesJson(null)).toBe('["open_play"]');
  });

  it("formats goal types for UI presentation", () => {
    expect(formatGoalTypesDisplay('["corner", "header"]', false)).toBe("Corner Kick, Header");
    expect(formatGoalTypesDisplay('["open_play"]', false)).toBe("Open Play");
    expect(formatGoalTypesDisplay(null, true)).toBe("Own Goal ⚠️");
  });
});
