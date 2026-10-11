import { describe, it, expect } from "vitest";

function splitHierarchyPath(path: string): string[] {
  return path
    .split(/\s*(?:>|\s\/\s)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inferNodeType(
  segName: string,
  level: number
): "tournament" | "gender" | "age_group" | "division" | "group" {
  const segLower = segName.toLowerCase();
  if (/^(girls?|boys?|female|male|coed|men|women)$/i.test(segLower)) {
    return "gender";
  } else if (/\b(under\s*\d+|\d+u|u-?\d+|\d+\/\d+)\b/i.test(segLower) || /^u\d+/i.test(segLower)) {
    return "age_group";
  } else if (/\b(group|bracket)\b/i.test(segLower)) {
    return "group";
  } else if (level === 0) {
    return "tournament";
  } else if (level === 1) {
    return "gender";
  } else {
    return "division";
  }
}

describe("League Node Hierarchy Path Parsing", () => {
  it("correctly splits hierarchical strings with '>' delimiter", () => {
    const segments = splitHierarchyPath("Girls > U11/U12 Girls Yellow");
    expect(segments).toEqual(["Girls", "U11/U12 Girls Yellow"]);
  });

  it("does not split slashes inside age group identifiers like U11/U12", () => {
    const segments = splitHierarchyPath("U11/U12 Girls Yellow");
    expect(segments).toEqual(["U11/U12 Girls Yellow"]);
  });

  it("splits slashes when formatted with whitespace like 'Girls / U12'", () => {
    const segments = splitHierarchyPath("Girls / U12 Division 1");
    expect(segments).toEqual(["Girls", "U12 Division 1"]);
  });

  it("infers node types accurately based on segment keywords and levels", () => {
    expect(inferNodeType("Girls", 1)).toBe("gender");
    expect(inferNodeType("Boys", 1)).toBe("gender");
    expect(inferNodeType("U11/U12 Girls Yellow", 2)).toBe("age_group");
    expect(inferNodeType("Group A", 3)).toBe("group");
    expect(inferNodeType("Championship Bracket", 3)).toBe("group");
    expect(inferNodeType("Premier Flight", 2)).toBe("division");
  });

  it("prioritizes terminal leaf subnodes over root/parent tournament container nodes", () => {
    const mockEnrollments = [
      {
        league_node_seasons: {
          league_node_id: 107,
          league_nodes: {
            name: "One Knox Collective Cup (Tournament)",
            level: 0,
            other_league_nodes: [{ id: 108 }], // has children
          },
        },
      },
      {
        league_node_seasons: {
          league_node_id: 109,
          league_nodes: {
            name: "U11/U12 Girls Yellow",
            level: 2,
            other_league_nodes: [], // terminal leaf
          },
        },
      },
    ];

    const sorted = [...mockEnrollments].sort((a, b) => {
      const aIsLeaf = a.league_node_seasons.league_nodes.other_league_nodes.length === 0 ? 1 : 0;
      const bIsLeaf = b.league_node_seasons.league_nodes.other_league_nodes.length === 0 ? 1 : 0;
      if (aIsLeaf !== bIsLeaf) return bIsLeaf - aIsLeaf;
      return (b.league_node_seasons.league_nodes.level ?? 0) - (a.league_node_seasons.league_nodes.level ?? 0);
    });

    expect(sorted[0].league_node_seasons.league_node_id).toBe(109);
    expect(sorted[0].league_node_seasons.league_nodes.name).toBe("U11/U12 Girls Yellow");
  });
});
