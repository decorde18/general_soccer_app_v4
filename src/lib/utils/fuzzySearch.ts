/**
 * Fuzzy Search Utilities for Person and Player Lookups
 */

export interface FuzzyPersonCandidate {
  id: number;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  email?: string | null;
  fullName?: string | null;
  [key: string]: any;
}

/**
 * Standard Levenshtein Distance calculation
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row optimization
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const c1 = s1.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const c2 = s2.charCodeAt(j - 1);
      const cost = c1 === c2 ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,      // insertion
        prevRow[j] + 1,          // deletion
        prevRow[j - 1] + cost    // substitution
      );
    }
    for (let j = 0; j <= n; j++) {
      prevRow[j] = currRow[j];
    }
  }

  return prevRow[n];
}

/**
 * String similarity ratio (0 to 1) based on Levenshtein distance
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Score how well a person candidate matches a search query.
 * Returns a score between 0 and 1 (1 = perfect match).
 */
export function scorePersonQuery(
  person: {
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    email?: string | null;
    fullName?: string | null;
  },
  rawQuery: string
): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 0;

  const fn = (person.firstName || "").trim().toLowerCase();
  const ln = (person.lastName || "").trim().toLowerCase();
  const nn = (person.nickname || "").trim().toLowerCase();
  const email = (person.email || "").trim().toLowerCase();
  const full = (person.fullName || `${fn} ${ln}`).trim().toLowerCase();
  const reverseFull = `${ln} ${fn}`.trim().toLowerCase();

  // 1. Exact matches (Score: 1.0)
  if (full === query || reverseFull === query) return 1.0;
  if (fn === query || ln === query || nn === query) return 0.98;

  // 2. Query prefixes name (Score: 0.9 - 0.95)
  if (full.startsWith(query) || reverseFull.startsWith(query)) {
    return 0.92 + 0.05 * (query.length / full.length);
  }
  if (fn.startsWith(query) || ln.startsWith(query) || (nn && nn.startsWith(query))) {
    return 0.90;
  }

  // 3. Substring containment (Score: 0.8 - 0.85)
  if (full.includes(query) || (nn && nn.includes(query))) {
    return 0.85;
  }
  if (email && email.includes(query)) {
    return 0.80;
  }

  // 4. Tokenized Multi-word Match (e.g. "Alex Mor" or "Mor Alex")
  const queryTokens = query.split(/\s+/).filter(Boolean);
  if (queryTokens.length > 1) {
    const allTokensMatch = queryTokens.every((token) => {
      return (
        fn.startsWith(token) ||
        ln.startsWith(token) ||
        (nn && nn.startsWith(token)) ||
        full.includes(token) ||
        (token.length >= 3 && (stringSimilarity(token, fn) >= 0.75 || stringSimilarity(token, ln) >= 0.75))
      );
    });

    if (allTokensMatch) {
      return 0.88;
    }
  }

  // 5. Fuzzy Distance / Typo Tolerance
  // Check similarity against first name, last name, nickname, or full name
  const targets = [fn, ln, nn, full].filter(Boolean);
  let bestSim = 0;

  for (const t of targets) {
    // If query is short (< 3 chars), do not do aggressive typo matching
    if (query.length < 3) continue;

    // Check direct similarity
    const sim = stringSimilarity(query, t);
    if (sim > bestSim) bestSim = sim;

    // Check if query is very close to a word within target
    const words = t.split(/\s+/);
    for (const w of words) {
      if (w.length >= 3) {
        const wSim = stringSimilarity(query, w);
        if (wSim > bestSim) bestSim = wSim;
      }
    }
  }

  // Scale similarity: if best similarity >= 0.7 (roughly 1 typo in 4+ char word)
  if (bestSim >= 0.7) {
    return 0.5 + (bestSim - 0.7) * 1.5; // Maps 0.7 -> 0.5, 0.9 -> 0.8
  }

  return 0;
}

/**
 * Filter and rank candidates using fuzzy score
 */
export function fuzzyFilterPeople<T extends FuzzyPersonCandidate>(
  candidates: T[],
  query: string,
  threshold: number = 0.45
): (T & { _score: number })[] {
  const q = query.trim();
  if (!q) {
    return candidates.map((c) => ({ ...c, _score: 1 }));
  }

  const scored: (T & { _score: number })[] = [];

  for (const candidate of candidates) {
    const score = scorePersonQuery(
      {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        nickname: candidate.nickname,
        email: candidate.email,
        fullName: candidate.fullName,
      },
      q
    );

    if (score >= threshold) {
      scored.push({
        ...candidate,
        _score: score,
      });
    }
  }

  // Sort descending by score, tiebreaker on lastName, firstName
  scored.sort((a, b) => {
    if (b._score !== a._score) {
      return b._score - a._score;
    }
    const lastDiff = (a.lastName || "").localeCompare(b.lastName || "");
    if (lastDiff !== 0) return lastDiff;
    return (a.firstName || "").localeCompare(b.firstName || "");
  });

  return scored;
}
