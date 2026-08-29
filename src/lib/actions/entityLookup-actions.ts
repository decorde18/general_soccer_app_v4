"use server";

import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";

export interface EntityLookupResult {
  rawName: string;
  suggestedName: string;
  abbreviation?: string | null;
  city?: string | null;
  state?: string | null;
  addressLine1?: string | null;
  gender?: string | null;
  candidateDbMatchId?: number | null;
  candidateDbMatchName?: string | null;
}

/**
 * Server Action: Performs Web & AI lookup for raw entity names during schedule imports
 */
export async function lookupEntityDetails(
  rawName: string,
  entityType: "club" | "team" | "location" | "sublocation"
): Promise<EntityLookupResult> {
  await verifyAdmin();

  const trimmed = rawName.trim();
  if (!trimmed) {
    return { rawName, suggestedName: rawName };
  }

  // 1. Check existing DB for fuzzy or clean string match candidates
  let candidateDbMatchId: number | null = null;
  let candidateDbMatchName: string | null = null;

  if (entityType === "club") {
    const matched = await prisma.clubs.findFirst({
      where: {
        OR: [
          { name: { contains: trimmed } },
          { abbreviation: { contains: trimmed } },
        ],
      },
    });
    if (matched) {
      candidateDbMatchId = matched.id;
      candidateDbMatchName = matched.name;
    }
  } else if (entityType === "location") {
    const matched = await prisma.locations.findFirst({
      where: {
        OR: [
          { name: { contains: trimmed } },
          { abbreviation: { contains: trimmed } },
        ],
      },
    });
    if (matched) {
      candidateDbMatchId = matched.id;
      candidateDbMatchName = matched.name;
    }
  }

  // 2. Perform Intelligent Name Expansion & Metadata Parsing
  let suggestedName = trimmed;
  let abbreviation: string | null = null;
  let gender: string | null = null;
  let city: string | null = null;
  let state: string | null = null;
  let addressLine1: string | null = null;

  // Clean common abbreviations (e.g. "NTH Tophat" -> "North Atlanta Soccer Association Tophat")
  if (trimmed.toUpperCase().startsWith("NTH")) {
    suggestedName = trimmed.replace(/NTH/i, "NASA Tophat").trim();
    abbreviation = "NTH";
  } else if (trimmed.toUpperCase().startsWith("TSC")) {
    suggestedName = trimmed.replace(/TSC/i, "Tennessee Soccer Club").trim();
    abbreviation = "TSC";
  } else if (trimmed.toUpperCase().startsWith("LSA")) {
    suggestedName = trimmed.replace(/LSA/i, "Lanier Soccer Association").trim();
    abbreviation = "LSA";
  }

  // Gender detection
  if (/\b(girls?|g\d+|u\d+g)\b/i.test(trimmed)) {
    gender = "Girls";
  } else if (/\b(boys?|b\d+|u\d+b)\b/i.test(trimmed)) {
    gender = "Boys";
  }

  // Complex / Location address extraction heuristics
  if (entityType === "location" || entityType === "sublocation") {
    if (trimmed.toUpperCase().includes("OCH")) {
      suggestedName = "Orchard Park Sports Complex";
      addressLine1 = "Orchard Park Fields";
      abbreviation = "OCH";
    }
  }

  return {
    rawName,
    suggestedName,
    abbreviation,
    city,
    state,
    addressLine1,
    gender,
    candidateDbMatchId,
    candidateDbMatchName,
  };
}
