export interface TeamDisplayInput {
  team_name?: string | null;
  teamName?: string | null;
  gender?: string | null;
  club?: {
    name?: string | null;
    abbreviation?: string | null;
  } | null;
  clubs?: {
    name?: string | null;
    abbreviation?: string | null;
  } | null;
  club_name?: string | null;
  clubName?: string | null;
  club_abbreviation?: string | null;
  clubAbbreviation?: string | null;
  age_group?: {
    name?: string | null;
  } | string | null;
  age_groups?: {
    name?: string | null;
  } | null;
}

export type TeamNameFormat = "long" | "short" | "teamOnly";

/**
 * Derive a smart club abbreviation if missing.
 */
export function deriveClubAbbreviation(name: string): string {
  if (!name || !name.trim()) return "";
  const trimmed = name.trim();

  const knownOverrides: Record<string, string> = {
    "Tennessee Soccer Club": "TSC",
    "Tennessee United Soccer Club": "TUSC",
    "Concorde Fire": "CF",
    "Top Hat": "NTH",
    "NASA Tophat": "NTH",
    "United Futbal Academy": "UFA",
    "United Futbol Academy": "UFA",
    "North Alabama Soccer Club": "NASC",
    "North Georgia Soccer Academy": "NGSA",
    "Southern Soccer Academy Swarm FC": "SSA",
    "South Carolina Surf SC": "SCS",
    "Carolina Elite Soccer Academy": "CESA",
    "Charlotte SA": "CSA",
    "Clover Elite Football Club": "CEFC",
    "Kirkwood United": "KU",
    "McMinn United Football Club": "MUFC",
    "Music City FC": "MCFC",
    "NCFC Youth": "NCFC",
    "Neuse River Futbol Alliance": "NRFA",
    "Signal Mountain": "SMSC",
    "Charlotte Metro FC": "CMFC",
    "Elevation FC": "EFC",
    "Fury FC": "FFC",
  };

  if (knownOverrides[trimmed]) return knownOverrides[trimmed];

  const words = trimmed
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => !["the", "and", "of", "&"].includes(w.toLowerCase()));

  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0].toUpperCase()).join("");
}

/**
 * Custom React hook for team name formatting.
 */
export function useTeamName(
  input?: TeamDisplayInput | null,
  format: TeamNameFormat = "short"
): string {
  return formatTeamName(input, format);
}

/**
 * Utility to construct consistent, standardized team display names.
 * Standardizes Short (Abbrev + TeamName) vs Long (Full Club Name + TeamName).
 */
export function formatTeamName(
  input?: TeamDisplayInput | null,
  format: TeamNameFormat = "short"
): string {
  if (!input) return "Unknown Team";

  const clubObj = input.club || input.clubs;
  const clubName = (clubObj?.name || input.club_name || input.clubName || "").trim();
  let clubAbbrev = (clubObj?.abbreviation || input.club_abbreviation || input.clubAbbreviation || "").trim();

  if (!clubAbbrev && clubName) {
    clubAbbrev = deriveClubAbbreviation(clubName);
  }

  const rawTeamName = (input.team_name || input.teamName || "").trim();
  const ageGroupObj = typeof input.age_group === "object" ? input.age_group : input.age_groups;
  const ageGroupName = typeof input.age_group === "string" ? input.age_group : ageGroupObj?.name?.trim() ?? "";

  if (format === "teamOnly") {
    const nameParts = [rawTeamName, ageGroupName].filter(Boolean);
    return nameParts.join(" ") || "Unknown Team";
  }

  if (format === "short") {
    const prefix = clubAbbrev || clubName;

    if (!prefix) {
      const nameParts = [rawTeamName, ageGroupName].filter(Boolean);
      return nameParts.join(" ") || "Unknown Team";
    }

    let cleanTeamName = rawTeamName;
    if (clubName && cleanTeamName.toLowerCase().startsWith(clubName.toLowerCase())) {
      cleanTeamName = cleanTeamName.slice(clubName.length).trim();
    } else if (clubAbbrev && cleanTeamName.toLowerCase().startsWith(clubAbbrev.toLowerCase())) {
      cleanTeamName = cleanTeamName.slice(clubAbbrev.length).trim();
    }

    const nameParts = [prefix, cleanTeamName, ageGroupName].filter(Boolean);
    return nameParts.join(" ") || "Unknown Team";
  }

  // Long format
  if (clubName) {
    let cleanTeamName = rawTeamName;

    if (cleanTeamName.toLowerCase().startsWith(clubName.toLowerCase())) {
      cleanTeamName = cleanTeamName.slice(clubName.length).trim();
    } else if (clubAbbrev && cleanTeamName.toLowerCase().startsWith(clubAbbrev.toLowerCase())) {
      cleanTeamName = cleanTeamName.slice(clubAbbrev.length).trim();
    }

    const full = [clubName, cleanTeamName].filter(Boolean).join(" ");
    return ageGroupName ? `${full} (${ageGroupName})` : full;
  }

  const nameParts = [rawTeamName, ageGroupName].filter(Boolean);
  return nameParts.join(" ") || "Unknown Team";
}
