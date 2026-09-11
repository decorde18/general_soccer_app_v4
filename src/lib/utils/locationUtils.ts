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

    return { venueName: loc, sublocationName: undefined };
  }

  // If only sub is provided
  if (!loc && sub) {
    return discernVenueAndField(sub, undefined);
  }

  return { venueName: "", sublocationName: undefined };
}
