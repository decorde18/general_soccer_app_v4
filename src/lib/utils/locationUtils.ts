/**
 * Utility to discern venue (location) and sublocation (field/pitch)
 * from combined or separate location & sublocation string inputs.
 */

export interface DiscernedLocation {
  venueName: string;
  sublocationName?: string;
}

export function discernVenueAndField(rawLoc?: string, rawSub?: string): DiscernedLocation {
  const loc = (rawLoc || "").trim();
  const sub = (rawSub || "").trim();

  // If both venue and sublocation are provided
  if (loc && sub) {
    // Check if venue string itself contains embedded field suffix (e.g. loc="Piedmont Park - Field 1", sub="Field 1")
    const match = loc.match(/^(.+?)\s*[\-–:\,]\s*(Field.*|Pitch.*|Turf.*|Court.*|Diamond.*|#.*|\d+.*)$/i);
    if (match) {
      return { venueName: match[1].trim(), sublocationName: sub };
    }
    return { venueName: loc, sublocationName: sub };
  }

  // If only loc is provided, check if it contains a combined venue + field
  if (loc && !sub) {
    // 1) Delimited with dash, colon, comma: "Piedmont Park - Field 1", "GSA: Pitch 3", "OC Hubert, #2"
    const delimMatch = loc.match(/^(.+?)\s*[\-–:\,]\s*(Field.*|Pitch.*|Turf.*|Court.*|Diamond.*|#.*|\d+.*)$/i);
    if (delimMatch) {
      return { venueName: delimMatch[1].trim(), sublocationName: delimMatch[2].trim() };
    }

    // 2) Embedded words: "Piedmont Park Field 1" or "GSA Complex Pitch A"
    const wordMatch = loc.match(/^(.+?)\s+(Field\s*\S+|Pitch\s*\S+|Turf\s*\S+|Court\s*\S+|Diamond\s*\S+|#\S+)$/i);
    if (wordMatch) {
      return { venueName: wordMatch[1].trim(), sublocationName: wordMatch[2].trim() };
    }

    // 3) Complex / Facility / Park keywords: "Sansom Sports Complex Hackney Hackney B" -> "Sansom Sports Complex", "Hackney B"
    const complexMatch = loc.match(/^(.+?\s*(?:Sports Complex|Soccer Complex|Complex|Park|Facility|Center|Centre|Stadium))\s+(.+)$/i);
    if (complexMatch) {
      const vName = complexMatch[1].trim();
      let fName = complexMatch[2].trim();
      fName = fName.replace(/\b(\w+)\s+\1\b/gi, "$1");
      return { venueName: vName, sublocationName: fName };
    }

    return { venueName: loc, sublocationName: undefined };
  }

  // If only sub is provided
  if (!loc && sub) {
    return discernVenueAndField(sub, undefined);
  }

  return { venueName: "", sublocationName: undefined };
}

export interface DiscernedClubAndTeam {
  clubName: string;
  teamName: string;
}

/**
 * Utility to discern club name and team name from combined or separate string inputs.
 */
export function discernClubAndTeam(rawTeam?: string, rawClub?: string): DiscernedClubAndTeam {
  const teamStr = (rawTeam || "").trim();
  const clubStr = (rawClub || "").trim();

  // 1. If club is provided explicitly
  if (clubStr) {
    if (teamStr.toLowerCase().startsWith(clubStr.toLowerCase() + " - ")) {
      const cleanTeam = teamStr.slice(clubStr.length + 3).trim();
      return { clubName: clubStr, teamName: cleanTeam || teamStr };
    }
    if (teamStr.toLowerCase().startsWith(clubStr.toLowerCase() + " : ")) {
      const cleanTeam = teamStr.slice(clubStr.length + 3).trim();
      return { clubName: clubStr, teamName: cleanTeam || teamStr };
    }
    if (teamStr.toLowerCase().startsWith(clubStr.toLowerCase() + " ")) {
      const cleanTeam = teamStr.slice(clubStr.length + 1).trim();
      return { clubName: clubStr, teamName: cleanTeam || teamStr };
    }
    return { clubName: clubStr, teamName: teamStr || clubStr };
  }

  // 2. If no club provided, check if team string contains a delimiter (e.g. "Club Name - Team Name")
  if (teamStr) {
    const match = teamStr.match(/^(.+?)\s*[\-–:|]\s*(.+)$/);
    if (match) {
      const maybeClub = match[1].trim();
      const maybeTeam = match[2].trim();
      if (maybeClub && maybeTeam) {
        return { clubName: maybeClub, teamName: maybeTeam };
      }
    }
    return { clubName: teamStr, teamName: teamStr };
  }

  return { clubName: "", teamName: "" };
}

/**
 * Utility to check if a team string represents a TBD placeholder or playoff seed
 */
export function isTbdOrSeedTeam(teamName?: string): boolean {
  if (!teamName || !teamName.trim()) return false;
  const t = teamName.toLowerCase().trim();
  if (
    t === "tbd" ||
    t === "t.b.d." ||
    t === "tba" ||
    t === "-" ||
    t === "byes" ||
    t === "bye" ||
    t.includes("seed") ||
    t.includes("[") ||
    t.includes("]") ||
    t.includes("winner of") ||
    t.includes("loser of") ||
    t.includes("winner #") ||
    t.includes("loser #") ||
    t.includes("winner game") ||
    t.includes("loser game") ||
    /group\s+[a-z]\s*(#\d+|\d+|winner|runner|seed)/i.test(t) ||
    /pool\s+[a-z]\s*(#\d+|\d+|winner|runner|seed)/i.test(t) ||
    /bracket\s+[a-z]?\s*(#\d+|\d+|winner|runner|seed)/i.test(t)
  ) {
    return true;
  }
  return false;
}
