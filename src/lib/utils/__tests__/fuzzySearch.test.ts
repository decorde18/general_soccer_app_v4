import { describe, it, expect } from "vitest";
import {
  levenshteinDistance,
  stringSimilarity,
  scorePersonQuery,
  fuzzyFilterPeople,
} from "../fuzzySearch";

describe("fuzzySearch utils", () => {
  it("calculates levenshtein distance correctly", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    expect(levenshteinDistance("smith", "smith")).toBe(0);
    expect(levenshteinDistance("smith", "smyth")).toBe(1);
    expect(levenshteinDistance("alex", "alxe")).toBe(2);
  });

  it("calculates string similarity ratio", () => {
    expect(stringSimilarity("alex", "alex")).toBe(1);
    expect(stringSimilarity("smith", "smyth")).toBeGreaterThan(0.75);
    expect(stringSimilarity("ronaldo", "messi")).toBeLessThan(0.3);
  });

  it("scores exact matches highest", () => {
    const person = { firstName: "Sophia", lastName: "Smith", nickname: "Soph", email: "sophia@example.com" };
    expect(scorePersonQuery(person, "Sophia Smith")).toBe(1.0);
    expect(scorePersonQuery(person, "Smith Sophia")).toBe(1.0);
    expect(scorePersonQuery(person, "Sophia")).toBeGreaterThanOrEqual(0.95);
    expect(scorePersonQuery(person, "Soph")).toBeGreaterThanOrEqual(0.95);
  });

  it("handles reversed and multi-token queries", () => {
    const person = { firstName: "Alex", lastName: "Morgan", nickname: null, email: "alex@uswnt.com" };
    expect(scorePersonQuery(person, "Morgan Alex")).toBe(1.0);
    expect(scorePersonQuery(person, "alex mor")).toBeGreaterThanOrEqual(0.85);
  });

  it("handles typos with distance scoring", () => {
    const person = { firstName: "Cristiano", lastName: "Ronaldo", nickname: "CR7", email: null };
    // "Christiano" has 1 char difference
    const typoScore = scorePersonQuery(person, "Christiano");
    expect(typoScore).toBeGreaterThanOrEqual(0.5);

    // "Mbape" vs "Mbappe"
    const mbappe = { firstName: "Kylian", lastName: "Mbappe", nickname: null, email: null };
    expect(scorePersonQuery(mbappe, "Mbape")).toBeGreaterThanOrEqual(0.5);
  });

  it("fuzzyFilterPeople ranks higher matching scores first", () => {
    const list = [
      { id: 1, firstName: "John", lastName: "Smith", nickname: null, email: "js@test.com" },
      { id: 2, firstName: "Jon", lastName: "Smyth", nickname: null, email: "jon@test.com" },
      { id: 3, firstName: "Alice", lastName: "Johnson", nickname: null, email: "alice@test.com" },
      { id: 4, firstName: "Samantha", lastName: "Smith", nickname: "Sam", email: "sam@test.com" },
    ];

    // Searching for exact "John Smith"
    const results = fuzzyFilterPeople(list, "John Smith");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe(1);

    // Searching with typo "Jon Smith"
    const typoResults = fuzzyFilterPeople(list, "Jon Smth");
    expect(typoResults.length).toBeGreaterThan(0);
    expect(typoResults.map((r) => r.id)).toContain(1);
    expect(typoResults.map((r) => r.id)).toContain(2);
  });
});
