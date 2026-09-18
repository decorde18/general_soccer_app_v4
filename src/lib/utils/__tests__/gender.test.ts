import { describe, it, expect } from "vitest";
import { normalizeGender, formatGenderDisplay } from "@/lib/utils/gender";

describe("Gender Normalization & Formatting Standard", () => {
  describe("normalizeGender", () => {
    it("should discern female variations into FEMALE", () => {
      expect(normalizeGender("Girls")).toBe("FEMALE");
      expect(normalizeGender("girl")).toBe("FEMALE");
      expect(normalizeGender("Women")).toBe("FEMALE");
      expect(normalizeGender("woman")).toBe("FEMALE");
      expect(normalizeGender("Female")).toBe("FEMALE");
      expect(normalizeGender("F")).toBe("FEMALE");
      expect(normalizeGender("G")).toBe("FEMALE");
      expect(normalizeGender("u13g")).toBe("FEMALE");
      expect(normalizeGender("g2013")).toBe("FEMALE");
    });

    it("should discern male variations into MALE", () => {
      expect(normalizeGender("Boys")).toBe("MALE");
      expect(normalizeGender("boy")).toBe("MALE");
      expect(normalizeGender("Men")).toBe("MALE");
      expect(normalizeGender("man")).toBe("MALE");
      expect(normalizeGender("Male")).toBe("MALE");
      expect(normalizeGender("M")).toBe("MALE");
      expect(normalizeGender("B")).toBe("MALE");
      expect(normalizeGender("u13b")).toBe("MALE");
      expect(normalizeGender("b2013")).toBe("MALE");
    });

    it("should discern coed/mixed variations into MIXED", () => {
      expect(normalizeGender("Coed")).toBe("MIXED");
      expect(normalizeGender("co-ed")).toBe("MIXED");
      expect(normalizeGender("Mixed")).toBe("MIXED");
      expect(normalizeGender("m/f")).toBe("MIXED");
    });

    it("should use fallback for unknown/null/empty strings", () => {
      expect(normalizeGender(null)).toBe("MIXED");
      expect(normalizeGender(undefined)).toBe("MIXED");
      expect(normalizeGender("")).toBe("MIXED");
      expect(normalizeGender("unknown", "FEMALE")).toBe("FEMALE");
    });
  });

  describe("formatGenderDisplay", () => {
    it("should format normalized values for standard UI display", () => {
      expect(formatGenderDisplay("FEMALE")).toBe("Girls / Women");
      expect(formatGenderDisplay("MALE")).toBe("Boys / Men");
      expect(formatGenderDisplay("MIXED")).toBe("Co-Ed / Mixed");
    });

    it("should handle raw inputs gracefully", () => {
      expect(formatGenderDisplay("girls")).toBe("Girls / Women");
      expect(formatGenderDisplay("boys")).toBe("Boys / Men");
      expect(formatGenderDisplay("coed")).toBe("Co-Ed / Mixed");
    });
  });
});
