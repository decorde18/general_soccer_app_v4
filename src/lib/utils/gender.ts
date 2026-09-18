export type GenderValue = "MALE" | "FEMALE" | "MIXED";

/**
 * Normalizes any gender input string into standard unified DB values: MALE, FEMALE, or MIXED.
 * Discerns variations like "Boys", "Girls", "Men", "Women", "Coed", "Male", "Female", "Mixed", "M", "F", "B", "G", "u13g", "b2013".
 */
export function normalizeGender(
  input?: string | null,
  fallback: GenderValue = "MIXED"
): GenderValue {
  if (!input || typeof input !== "string") {
    return fallback;
  }

  const str = input.trim().toLowerCase();
  if (!str) return fallback;

  // Exact single-letter or exact term matches first
  if (["f", "g", "female", "women", "woman", "girls", "girl", "w"].includes(str)) {
    return "FEMALE";
  }

  if (["m", "b", "male", "men", "man", "boys", "boy"].includes(str)) {
    return "MALE";
  }

  if (["coed", "co-ed", "mixed", "x", "m/f"].includes(str)) {
    return "MIXED";
  }

  // Substring matches
  if (str.includes("girl") || str.includes("women") || str.includes("female") || str.includes("woman")) {
    return "FEMALE";
  }

  if (str.includes("boy") || str.includes("men") || str.includes("male") || str.includes("man")) {
    return "MALE";
  }

  if (str.includes("coed") || str.includes("co-ed") || str.includes("mixed")) {
    return "MIXED";
  }

  // Pattern detection (e.g. "u13g", "g2013", "14g", "u13b", "b2013", "14b")
  if (/\b(girls?|female|women?|g\d+|u\d+g|\d+g)\b/i.test(str) || /(^|\D)g\d+/i.test(str) || /u\d+g/i.test(str)) {
    return "FEMALE";
  }

  if (/\b(boys?|male|men?|b\d+|u\d+b|\d+b)\b/i.test(str) || /(^|\D)b\d+/i.test(str) || /u\d+b/i.test(str)) {
    return "MALE";
  }

  return fallback;
}

/**
 * Formats a normalized gender value for standard UI display options.
 */
export function formatGenderDisplay(
  gender?: string | null,
  options?: { format?: "full" | "youth" | "adult" | "short" }
): string {
  const normalized = normalizeGender(gender);
  const fmt = options?.format || "full";

  if (fmt === "short") {
    if (normalized === "FEMALE") return "F";
    if (normalized === "MALE") return "M";
    return "X";
  }

  if (fmt === "youth") {
    if (normalized === "FEMALE") return "Girls";
    if (normalized === "MALE") return "Boys";
    return "Coed";
  }

  if (fmt === "adult") {
    if (normalized === "FEMALE") return "Women";
    if (normalized === "MALE") return "Men";
    return "Mixed";
  }

  if (normalized === "FEMALE") return "Girls / Women";
  if (normalized === "MALE") return "Boys / Men";
  return "Co-Ed / Mixed";
}
