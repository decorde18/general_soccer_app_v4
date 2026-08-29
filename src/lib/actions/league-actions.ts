"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { getTeamSeasonRecords } from "@/lib/data/queries";
import { leagueSchema } from "@/lib/validations/schemas";

export async function createLeague(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsedData = leagueSchema.parse(data);

  try {
    const newLeague = await prisma.leagues.create({
      data: {
        name: parsedData.name,
        abbreviation: parsedData.abbreviation,
        governing_body_id: parsedData.governingBodyName,
        status: parsedData.status,
        description: parsedData.description,
        is_tournament: parsedData.isTournament,
        match_rules: parsedData.matchRules,
      },
    });
    
    revalidatePath("/leagues");
    return newLeague;
  } catch (error) {
    console.error("Error creating league:", error);
    throw new Error("Failed to create league");
  }
}

export async function updateLeague(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Partial validation for updates
  const parsedData = leagueSchema.partial().parse(data);

  await prisma.leagues.update({
    where: { id: numId },
    data: {
      name: parsedData.name,
      abbreviation: parsedData.abbreviation,
      governing_body_id: parsedData.governingBodyName !== undefined ? parsedData.governingBodyName : undefined,
      status: parsedData.status,
      description: parsedData.description,
      is_tournament: parsedData.isTournament,
      match_rules: parsedData.matchRules,
    },
  });

  revalidatePath("/leagues");
}

export async function deleteLeague(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.leagues.delete({
    where: { id: numId },
  });

  revalidatePath("/leagues");
}

/**
 * Server action to reorganize league node trees so Gender is above Age Group above Division/Group
 */
export async function reorganizeLeagueNodeHierarchy(leagueId?: number) {
  await verifyAdmin();

  const whereClause = leagueId ? { league_id: leagueId } : {};
  const nodes = await prisma.league_nodes.findMany({
    where: whereClause,
    orderBy: { level: "asc" },
  });

  // Re-parent nodes to enforce Gender (level 0) -> Age Group (level 1) -> Division/Group (level 2)
  for (const node of nodes) {
    if (node.node_type === "gender") {
      await prisma.league_nodes.update({
        where: { id: node.id },
        data: { parent_id: null, level: 0 },
      });
    } else if (node.node_type === "age_group" && node.parent_id) {
      const parent = nodes.find((n) => n.id === node.parent_id);
      if (parent && parent.node_type !== "gender") {
        // Find or create gender parent node
        const genderName = node.name.toLowerCase().includes("girl") || node.name.toLowerCase().includes("female")
          ? "Girls"
          : node.name.toLowerCase().includes("boy") || node.name.toLowerCase().includes("male")
          ? "Boys"
          : "Coed";

        let genderNode = nodes.find((n) => n.league_id === node.league_id && n.node_type === "gender" && n.name === genderName);
        if (!genderNode) {
          genderNode = await prisma.league_nodes.create({
            data: {
              league_id: node.league_id,
              name: genderName,
              node_type: "gender",
              level: 0,
            },
          });
        }
        await prisma.league_nodes.update({
          where: { id: node.id },
          data: { parent_id: genderNode.id, level: 1 },
        });
      }
    }
  }

  revalidatePath("/leagues");
  revalidatePath("/admin/leagues");
  return { success: true, count: nodes.length };
}

/**
 * Server Action: Quick create league/tournament inline from importer with match rules
 */
export async function createInlineLeague(name: string, isTournament: boolean = false, matchRules?: string) {
  await verifyAdmin();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("League name required");

  const existing = await prisma.leagues.findFirst({
    where: { name: { equals: trimmed } },
  });
  if (existing) {
    return { id: existing.id, name: existing.name, isTournament: existing.is_tournament ?? false };
  }

  const created = await prisma.leagues.create({
    data: {
      name: trimmed,
      is_tournament: isTournament,
      match_rules: matchRules || null,
      status: "active",
    },
  });

  revalidatePath("/admin/importer");
  revalidatePath("/leagues");
  return { id: created.id, name: created.name, isTournament: created.is_tournament ?? false };
}

/**
 * Server Action: Carryover team enrollments from previous season to target season
 */
export async function carryoverLeagueTeamsFromPreviousSeason(leagueId: number, fromSeasonId: number, toSeasonId: number) {
  await verifyAdmin();

  // Find all node seasons in previous season for this league
  const prevNodeSeasons = await prisma.league_node_seasons.findMany({
    where: {
      season_id: fromSeasonId,
      league_nodes: { league_id: leagueId },
    },
    include: {
      team_league_enrollments: true,
      league_nodes: true,
    },
  });

  let totalCarriedOver = 0;

  for (const prevNs of prevNodeSeasons) {
    // Find or create target node season in toSeasonId
    let targetNs = await prisma.league_node_seasons.findFirst({
      where: {
        league_node_id: prevNs.league_node_id,
        season_id: toSeasonId,
      },
    });

    if (!targetNs) {
      targetNs = await prisma.league_node_seasons.create({
        data: {
          league_node_id: prevNs.league_node_id,
          season_id: toSeasonId,
          is_active: true,
        },
      });
    }

    for (const enroll of prevNs.team_league_enrollments) {
      const existingEnroll = await prisma.team_league_enrollments.findFirst({
        where: {
          team_season_id: enroll.team_season_id,
          league_node_season_id: targetNs.id,
        },
      });
      if (!existingEnroll) {
        await prisma.team_league_enrollments.create({
          data: {
            team_season_id: enroll.team_season_id,
            league_node_season_id: targetNs.id,
            is_active: true,
          },
        });
        totalCarriedOver++;
      }
    }
  }

  revalidatePath("/admin/importer");
  revalidatePath("/leagues");
  return { success: true, totalCarriedOver };
}

/**
 * Server Action: Quick create league node (division) inline from importer
 */
export async function createInlineLeagueNode(leagueId: number, name: string, seasonId?: number) {
  await verifyAdmin();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Division node name required");

  let node = await prisma.league_nodes.findFirst({
    where: {
      league_id: leagueId,
      name: { equals: trimmed },
    },
  });

  if (!node) {
    node = await prisma.league_nodes.create({
      data: {
        league_id: leagueId,
        name: trimmed,
        node_type: "division",
        level: 2,
      },
    });
  }

  // Create node season record if seasonId provided
  let nodeSeasonId = node.id;
  if (seasonId) {
    let nodeSeason = await prisma.league_node_seasons.findFirst({
      where: {
        league_node_id: node.id,
        season_id: seasonId,
      },
    });
    if (!nodeSeason) {
      nodeSeason = await prisma.league_node_seasons.create({
        data: {
          league_node_id: node.id,
          season_id: seasonId,
          is_active: true,
        },
      });
    }
    nodeSeasonId = nodeSeason.id;
  }

  revalidatePath("/admin/importer");
  revalidatePath("/leagues");
  return { id: nodeSeasonId, name: `${trimmed}` };
}

/**
 * Server Action: Parse a raw division string into a distinct 4-level hierarchy:
 * Gender (Level 0) -> Age Group (Level 1) -> Division (Level 2) -> Group (Level 3)
 */
export async function resolveOrCreateDivisionHierarchy(
  rawDivisionStr: string,
  leagueId: number,
  seasonId: number
) {
  await verifyAdmin();

  const trimmed = rawDivisionStr.trim();
  if (!trimmed || !leagueId) throw new Error("Raw division string and leagueId required");

  // 1. Gender Extraction
  let genderName = "Coed";
  if (/\b(girls?|female|g\d+|u\d+g)\b/i.test(trimmed)) {
    genderName = "Girls";
  } else if (/\b(boys?|male|b\d+|u\d+b)\b/i.test(trimmed)) {
    genderName = "Boys";
  }

  // 2. Age Group Extraction (e.g. "Under 13", "U13", "13U")
  let ageName = "U13";
  const ageMatch = trimmed.match(/\b(under\s*\d+|\d+u|u-?\d+)\b/i);
  if (ageMatch) {
    const num = ageMatch[0].match(/\d+/)?.[0];
    if (num) ageName = `Under ${num}`;
  }

  // 3. Group Extraction (e.g. "Group A", "Bracket B")
  let groupName: string | null = null;
  const groupMatch = trimmed.match(/\b(group\s+[a-z0-9]+|bracket\s+[a-z0-9]+)\b/i);
  if (groupMatch) {
    groupName = groupMatch[0].trim();
  }

  // 4. Division Name Extraction (remainder of string after removing gender, age, group)
  let divisionName = trimmed
    .replace(/\b(girls?|boys?|female|male|coed|g\d+|b\d+)\b/gi, "")
    .replace(/\b(under\s*\d+|\d+u|u-?\d+)\b/gi, "")
    .replace(/\b(group\s+[a-z0-9]+|bracket\s+[a-z0-9]+)\b/gi, "")
    .trim();

  if (!divisionName) {
    divisionName = "Division 1";
  }

  // --- BUILD / MATCH ENFORCED SEQUENTIAL HIERARCHY ---

  // Level 0: Gender Node
  let genderNode = await prisma.league_nodes.findFirst({
    where: { league_id: leagueId, node_type: "gender", name: genderName, parent_id: null },
  });
  if (!genderNode) {
    genderNode = await prisma.league_nodes.create({
      data: { league_id: leagueId, name: genderName, node_type: "gender", level: 0 },
    });
  }

  // Level 1: Age Group Node (child of Gender Node)
  let ageNode = await prisma.league_nodes.findFirst({
    where: { league_id: leagueId, node_type: "age_group", name: ageName, parent_id: genderNode.id },
  });
  if (!ageNode) {
    ageNode = await prisma.league_nodes.create({
      data: { league_id: leagueId, name: ageName, node_type: "age_group", level: 1, parent_id: genderNode.id },
    });
  }

  // Level 2: Division Node (child of Age Group Node)
  let divisionNode = await prisma.league_nodes.findFirst({
    where: { league_id: leagueId, node_type: "division", name: divisionName, parent_id: ageNode.id },
  });
  if (!divisionNode) {
    divisionNode = await prisma.league_nodes.create({
      data: { league_id: leagueId, name: divisionName, node_type: "division", level: 2, parent_id: ageNode.id },
    });
  }

  // Level 3: Group Node (child of Division Node, if present)
  let targetNode = divisionNode;
  if (groupName) {
    let groupNode = await prisma.league_nodes.findFirst({
      where: { league_id: leagueId, node_type: "group", name: groupName, parent_id: divisionNode.id },
    });
    if (!groupNode) {
      groupNode = await prisma.league_nodes.create({
        data: { league_id: leagueId, name: groupName, node_type: "group", level: 3, parent_id: divisionNode.id },
      });
    }
    targetNode = groupNode;
  }

  // Ensure League Node Season Record
  let nodeSeason = await prisma.league_node_seasons.findFirst({
    where: { league_node_id: targetNode.id, season_id: seasonId },
  });
  if (!nodeSeason) {
    nodeSeason = await prisma.league_node_seasons.create({
      data: { league_node_id: targetNode.id, season_id: seasonId, is_active: true },
    });
  }

  return {
    leagueNodeId: targetNode.id,
    nodeSeasonId: nodeSeason.id,
  };
}

/**
 * Server Action: Get all schedule games associated with a league or tournament
 */
export async function getLeagueGames(leagueId: number, seasonId?: number) {
  const games = await prisma.games.findMany({
    where: {
      ...(seasonId ? { season_id: seasonId } : {}),
      OR: [
        {
          game_league_nodes: {
            some: {
              league_node_seasons: {
                league_nodes: { league_id: leagueId },
              },
            },
          },
        },
        {
          game_standings_inclusions: {
            some: {
              league_nodes: { league_id: leagueId },
            },
          },
        },
      ],
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: {
          teams: { include: { clubs: true } },
        },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: {
          teams: { include: { clubs: true } },
        },
      },
      locations: true,
      locations_sublocations: true,
      game_league_nodes: {
        include: {
          league_node_seasons: {
            include: { league_nodes: true },
          },
        },
      },
    },
    orderBy: [{ start_date: "asc" }, { start_time: "asc" }],
  });

  return games.map((g) => {
    const homeTeam = g.team_seasons_games_home_team_season_idToteam_seasons;
    const awayTeam = g.team_seasons_games_away_team_season_idToteam_seasons;
    const nodeName = g.game_league_nodes[0]?.league_node_seasons?.league_nodes?.name || "General";

    return {
      id: g.id,
      startDate: g.start_date ? `${g.start_date.getUTCFullYear()}-${(g.start_date.getUTCMonth() + 1).toString().padStart(2, "0")}-${g.start_date.getUTCDate().toString().padStart(2, "0")}` : "",
      startTime: g.start_time ? `${g.start_time.getUTCHours().toString().padStart(2, "0")}:${g.start_time.getUTCMinutes().toString().padStart(2, "0")}` : null,
      homeClubName: homeTeam?.teams?.clubs?.name || "",
      homeTeamName: homeTeam?.teams?.team_name || "TBD",
      awayClubName: awayTeam?.teams?.clubs?.name || "",
      awayTeamName: awayTeam?.teams?.team_name || "TBD",
      homeTeamSeasonId: g.home_team_season_id,
      awayTeamSeasonId: g.away_team_season_id,
      locationId: g.location_id,
      locationName: g.locations?.name || "",
      sublocationName: g.locations_sublocations?.name || "",
      gameType: g.game_type,
      status: g.status,
      divisionNodeName: nodeName,
    };
  });
}

/**
 * Server Action: Resolve knockout / playoff placeholder team matches based on group standings
 */
export async function resolveKnockoutPlaceholders(leagueId: number, seasonId?: number) {
  await verifyAdmin();

  // Find all group nodes for this league
  const groupNodes = await prisma.league_nodes.findMany({
    where: {
      league_id: leagueId,
      OR: [
        { node_type: "group" },
        { name: { contains: "Group" } },
      ],
    },
    include: {
      league_node_seasons: {
        include: {
          team_league_enrollments: {
            include: {
              team_seasons: {
                include: { teams: true },
              },
            },
          },
        },
      },
    },
  });

  if (groupNodes.length === 0) {
    return { success: false, message: "No group nodes found for this league." };
  }

  // Build ranking map for each group
  // e.g. "Group A" -> [1st_team_season_id, 2nd_team_season_id, ...]
  const groupRankings: Record<string, number[]> = {};

  for (const node of groupNodes) {
    const lns = seasonId 
      ? node.league_node_seasons.find((s) => s.season_id === seasonId)
      : node.league_node_seasons[0];

    if (!lns) continue;

    // Get standings for this group node season
    const standings = await getTeamSeasonRecords(lns.id);
    
    // Sort by points DESC, GD DESC, GF DESC
    const sorted = [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    });

    groupRankings[node.name.trim().toUpperCase()] = sorted.map((s) => s.teamSeasonId);
  }

  // Find all games for this league that have placeholder teams
  const allLeagueGames = await prisma.games.findMany({
    where: {
      OR: [
        { season_id: seasonId },
        { game_league_nodes: { some: { league_node_seasons: { league_nodes: { league_id: leagueId } } } } },
      ],
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: true },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: true },
      },
    },
  });

  let resolvedCount = 0;

  for (const game of allLeagueGames) {
    const homeTeamName = game.team_seasons_games_home_team_season_idToteam_seasons?.teams?.team_name || "";
    const awayTeamName = game.team_seasons_games_away_team_season_idToteam_seasons?.teams?.team_name || "";

    let newHomeId = game.home_team_season_id;
    let newAwayId = game.away_team_season_id;

    // Helper to resolve placeholder string
    const findAdvancingTeam = (name: string): number | null => {
      const clean = name.trim().toUpperCase();
      // Match patterns like "GROUP A #1", "1ST GROUP A", "GROUP B #1", "GROUP A WINNER"
      for (const [groupKey, teamIds] of Object.entries(groupRankings)) {
        if (clean.includes(groupKey)) {
          if (clean.includes("#1") || clean.includes("1ST") || clean.includes("WINNER")) {
            return teamIds[0] || null;
          }
          if (clean.includes("#2") || clean.includes("2ND") || clean.includes("RUNNER")) {
            return teamIds[1] || null;
          }
          if (clean.includes("#3") || clean.includes("3RD")) {
            return teamIds[2] || null;
          }
        }
      }
      return null;
    };

    const resolvedHome = findAdvancingTeam(homeTeamName);
    if (resolvedHome && resolvedHome !== game.home_team_season_id) {
      newHomeId = resolvedHome;
    }

    const resolvedAway = findAdvancingTeam(awayTeamName);
    if (resolvedAway && resolvedAway !== game.away_team_season_id) {
      newAwayId = resolvedAway;
    }

    if (newHomeId !== game.home_team_season_id || newAwayId !== game.away_team_season_id) {
      await prisma.games.update({
        where: { id: game.id },
        data: {
          home_team_season_id: newHomeId,
          away_team_season_id: newAwayId,
        },
      });
      resolvedCount++;
    }
  }

  revalidatePath(`/leagues/${leagueId}`);
  revalidatePath("/admin/leagues");
  return { success: true, resolvedCount, message: `Successfully updated ${resolvedCount} knockout match slots!` };
}
