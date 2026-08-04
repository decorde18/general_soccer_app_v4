export interface TeamDisplayInput {
  team_name?: string | null;
  gender?: string | null;
  club?: {
    name?: string | null;
    abbreviation?: string | null;
  } | null;
  clubs?: {
    name?: string | null;
    abbreviation?: string | null;
  } | null;
  age_group?: {
    name?: string | null;
  } | string | null;
  age_groups?: {
    name?: string | null;
  } | null;
}

export type TeamNameFormat = "long" | "short" | "teamOnly";

/**
 * Utility to construct consistent, standardized team display names.
 * Standardizes Club Name + Team Name (+ Gender / Age Group if applicable).
 */
export function formatTeamName(
  input?: TeamDisplayInput | null,
  format: TeamNameFormat = "long"
): string {
  if (!input) return "Unknown Team";

  const clubObj = input.club || input.clubs;
  const clubName = clubObj?.name?.trim() ?? "";
  const clubAbbrev = clubObj?.abbreviation?.trim() ?? clubName;

  const teamName = input.team_name?.trim() ?? "";

  const ageGroupObj = typeof input.age_group === "object" ? input.age_group : input.age_groups;
  const ageGroupName = typeof input.age_group === "string" ? input.age_group : ageGroupObj?.name?.trim() ?? "";

  if (format === "short") {
    const prefix = clubAbbrev || clubName;
    const nameParts = [prefix, teamName, ageGroupName].filter(Boolean);
    return nameParts.join(" ") || "Unknown Team";
  }

  if (format === "teamOnly") {
    const nameParts = [teamName, ageGroupName].filter(Boolean);
    return nameParts.join(" ") || "Unknown Team";
  }

  // Long format default
  if (clubName) {
    if (teamName.toLowerCase().startsWith(clubName.toLowerCase())) {
      return ageGroupName ? `${teamName} (${ageGroupName})` : teamName;
    }
    const full = `${clubName} ${teamName}`.trim();
    return ageGroupName ? `${full} (${ageGroupName})` : full;
  }

  const nameParts = [teamName, ageGroupName].filter(Boolean);
  return nameParts.join(" ") || "Unknown Team";
}
