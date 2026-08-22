import { describe, it, expect } from "vitest";

function bumpGrade(currentGrade: string | null): string | null {
  if (!currentGrade) return null;
  const trimmed = currentGrade.trim().toLowerCase();

  if (trimmed === "9" || trimmed === "9th" || trimmed === "freshman") return "10th";
  if (trimmed === "10" || trimmed === "10th" || trimmed === "sophomore") return "11th";
  if (trimmed === "11" || trimmed === "11th" || trimmed === "junior") return "12th";
  if (trimmed === "12" || trimmed === "12th" || trimmed === "senior") return "Graduated";

  const numMatch = trimmed.match(/^(\d+)(st|nd|rd|th)?$/);
  if (numMatch) {
    const val = parseInt(numMatch[1], 10);
    if (!isNaN(val)) {
      return `${val + 1}th`;
    }
  }

  return currentGrade;
}

describe("Player Rollover Grade Bump Helper", () => {
  it("correctly bumps 9th grade to 10th grade", () => {
    expect(bumpGrade("9th")).toBe("10th");
    expect(bumpGrade("9")).toBe("10th");
    expect(bumpGrade("freshman")).toBe("10th");
  });

  it("correctly bumps 10th grade to 11th grade", () => {
    expect(bumpGrade("10th")).toBe("11th");
    expect(bumpGrade("sophomore")).toBe("11th");
  });

  it("correctly bumps 11th grade to 12th grade", () => {
    expect(bumpGrade("11th")).toBe("12th");
    expect(bumpGrade("junior")).toBe("12th");
  });

  it("correctly bumps 12th grade to Graduated", () => {
    expect(bumpGrade("12th")).toBe("Graduated");
    expect(bumpGrade("senior")).toBe("Graduated");
  });

  it("returns null when current grade is null", () => {
    expect(bumpGrade(null)).toBeNull();
  });
});
