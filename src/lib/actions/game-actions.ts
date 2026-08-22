"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession, verifyTeamAccess } from "@/lib/auth/auth-utils";

export interface CompetitionNodeInput {
  nodeId: number;
  isPrimary: boolean;
  countsForStandings: boolean;
}

export interface CreateGameData {
  seasonId: number;
  homeTeamSeasonId: number;
  awayTeamSeasonId: number;
  startDate: string; // YYYY-MM-DD
  startTime?: string | null; // HH:MM
  timezoneLabel?: string | null;
  locationId?: number | null;
  sublocationId?: number | null;
  gameType?: "league" | "tournament" | "friendly" | "playoff";
  competitionNodes?: CompetitionNodeInput[];
  defaultRegPeriods?: number; // default 2
  periodDuration?: number; // seconds, default 2400 (40 mins)
  otIfTied?: boolean;
  otDuration?: number; // seconds, default 600
  soIfTied?: boolean;
  notes?: string | null;
  allowConflictOverride?: boolean;
}

/**
 * Check if a sublocation or location has an overlapping match scheduled at the given date/time
 */
export async function checkVenueConflict(data: {
  startDate: string;
  startTime?: string | null;
  locationId?: number | null;
  sublocationId?: number | null;
  excludeGameId?: number;
}) {
  if (!data.startDate || (!data.sublocationId && !data.locationId)) {
    return { hasConflict: false };
  }

  const matchDate = new Date(data.startDate);

  const existingGames = await prisma.games.findMany({
    where: {
      id: data.excludeGameId ? { not: data.excludeGameId } : undefined,
      start_date: matchDate,
      OR: [
        data.sublocationId ? { sublocation_id: data.sublocationId } : {},
        data.locationId ? { location_id: data.locationId } : {},
      ],
      status: { not: "cancelled" },
    },
    include: {
      locations: true,
      locations_sublocations: true,
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: true },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: true },
      },
    },
  });

  if (existingGames.length === 0) {
    return { hasConflict: false };
  }

  const conflicts = existingGames.map((g) => {
    const home = g.team_seasons_games_home_team_season_idToteam_seasons?.teams?.team_name || "Home";
    const away = g.team_seasons_games_away_team_season_idToteam_seasons?.teams?.team_name || "Away";
    const venue = g.locations_sublocations?.name
      ? `${g.locations?.name} - ${g.locations_sublocations?.name}`
      : g.locations?.name || "Venue";
    const timeStr = g.start_time ? new Date(g.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD";

    return `${home} vs ${away} @ ${venue} (${timeStr})`;
  });

  return {
    hasConflict: true,
    message: `Warning: Double-booking detected at field/venue on this date: ${conflicts.join("; ")}`,
    conflicts,
  };
}

export async function getOrCreateTbdTeamSeason(seasonId: number) {
  let tbdClub = await prisma.clubs.findFirst({
    where: { name: "TBD" },
  });
  if (!tbdClub) {
    tbdClub = await prisma.clubs.create({
      data: { name: "TBD", abbreviation: "TBD", is_active: true },
    });
  }
  let tbdTeam = await prisma.teams.findFirst({
    where: { club_id: tbdClub.id, team_name: "TBD Opponent" },
  });
  if (!tbdTeam) {
    tbdTeam = await prisma.teams.create({
      data: { club_id: tbdClub.id, team_name: "TBD Opponent", gender: "Mixed", is_active: true },
    });
  }
  let tbdTeamSeason = await prisma.team_seasons.findFirst({
    where: { team_id: tbdTeam.id, season_id: seasonId },
  });
  if (!tbdTeamSeason) {
    tbdTeamSeason = await prisma.team_seasons.create({
      data: { team_id: tbdTeam.id, season_id: seasonId, is_active: true },
    });
  }
  return tbdTeamSeason.id;
}

async function ensureLeagueNodeSeason(rawNodeId: number, seasonId: number): Promise<{ nodeSeasonId: number; leagueNodeId: number } | null> {
  if (!rawNodeId || !seasonId) return null;

  const bySeasonId = await prisma.league_node_seasons.findUnique({
    where: { id: rawNodeId },
  });
  if (bySeasonId) {
    return { nodeSeasonId: bySeasonId.id, leagueNodeId: bySeasonId.league_node_id };
  }

  let nodeSeason = await prisma.league_node_seasons.findFirst({
    where: {
      league_node_id: rawNodeId,
      season_id: seasonId,
    },
  });

  if (!nodeSeason) {
    const leagueNode = await prisma.league_nodes.findUnique({
      where: { id: rawNodeId },
    });
    if (!leagueNode) return null;

    nodeSeason = await prisma.league_node_seasons.create({
      data: {
        league_node_id: rawNodeId,
        season_id: seasonId,
        status: "active",
        is_active: true,
      },
    });
  }

  return { nodeSeasonId: nodeSeason.id, leagueNodeId: nodeSeason.league_node_id };
}

/**
 * Schedule a new match fixture
 */
export async function createGame(data: CreateGameData) {
  await requireSession();

  let resolvedHomeId = data.homeTeamSeasonId;
  let resolvedAwayId = data.awayTeamSeasonId;

  if (resolvedHomeId === -999) {
    resolvedHomeId = await getOrCreateTbdTeamSeason(data.seasonId);
  } else {
    await verifyTeamAccess(resolvedHomeId);
  }

  if (resolvedAwayId === -999) {
    resolvedAwayId = await getOrCreateTbdTeamSeason(data.seasonId);
  } else if (resolvedHomeId !== -999) {
    // Verified home access above if not TBD
  }

  // Check venue conflict warning
  const conflictCheck = await checkVenueConflict({
    startDate: data.startDate,
    startTime: data.startTime,
    locationId: data.locationId,
    sublocationId: data.sublocationId,
  });

  if (conflictCheck.hasConflict && !data.allowConflictOverride) {
    return {
      success: false,
      warning: conflictCheck.message,
      requiresOverride: true,
    };
  }

  const startDateObj = new Date(data.startDate);

  let startTimeObj: Date | null = null;
  if (data.startTime) {
    const [hours, minutes] = data.startTime.split(":").map(Number);
    startTimeObj = new Date(startDateObj);
    startTimeObj.setHours(hours, minutes, 0, 0);
  }

  // 1. Create the game row
  const game = await prisma.games.create({
    data: {
      season_id: data.seasonId,
      home_team_season_id: resolvedHomeId,
      away_team_season_id: resolvedAwayId,
      start_date: startDateObj,
      start_time: startTimeObj,
      timezone_label: data.timezoneLabel ?? "CST",
      location_id: data.locationId ?? null,
      sublocation_id: data.sublocationId ?? null,
      game_type: data.gameType ?? "league",
      default_reg_periods: data.defaultRegPeriods ?? 2,
      period_duration: data.periodDuration ?? 2400,
      ot_if_tied: data.otIfTied ?? false,
      ot_duration: data.otDuration ?? 600,
      so_if_tied: data.soIfTied ?? true,
      notes: data.notes ?? null,
      status: "scheduled",
    },
  });

  // 2. Associate Competition Nodes & Standings Inclusions
  if (data.competitionNodes && data.competitionNodes.length > 0) {
    for (const item of data.competitionNodes) {
      const resolved = await ensureLeagueNodeSeason(item.nodeId, data.seasonId);
      if (resolved) {
        const existingGln = await prisma.game_league_nodes.findFirst({
          where: { game_id: game.id, league_node_id: resolved.nodeSeasonId },
        });
        if (!existingGln) {
          await prisma.game_league_nodes.create({
            data: {
              game_id: game.id,
              league_node_id: resolved.nodeSeasonId,
              is_primary: item.isPrimary ?? true,
            },
          });
        }

        const existingGsi = await prisma.game_standings_inclusions.findFirst({
          where: { game_id: game.id, league_node_id: resolved.leagueNodeId },
        });
        if (!existingGsi) {
          await prisma.game_standings_inclusions.create({
            data: {
              game_id: game.id,
              league_node_id: resolved.leagueNodeId,
              counts_for_standings: item.countsForStandings ?? true,
            },
          });
        }
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/leagues");
  revalidatePath(`/teams/${data.homeTeamSeasonId}`);
  revalidatePath(`/teams/${data.awayTeamSeasonId}`);

  return { success: true, game };
}

/**
 * Update an existing game fixture
 */
export async function updateGame(
  gameId: number,
  data: Partial<CreateGameData> & { status?: any }
) {
  await requireSession();

  const game = await prisma.games.findUnique({ where: { id: gameId } });
  if (!game) throw new Error("Game not found");

  await verifyTeamAccess(game.home_team_season_id);

  const updateData: any = {};

  if (data.startDate) updateData.start_date = new Date(data.startDate);
  if (data.startTime !== undefined) {
    if (data.startTime) {
      const baseDate = data.startDate ? new Date(data.startDate) : game.start_date;
      const [hours, minutes] = data.startTime.split(":").map(Number);
      const t = new Date(baseDate);
      t.setHours(hours, minutes, 0, 0);
      updateData.start_time = t;
    } else {
      updateData.start_time = null;
    }
  }

  if (data.timezoneLabel !== undefined) updateData.timezone_label = data.timezoneLabel;
  if (data.locationId !== undefined) updateData.location_id = data.locationId;
  if (data.sublocationId !== undefined) updateData.sublocation_id = data.sublocationId;
  if (data.gameType) updateData.game_type = data.gameType;
  if (data.defaultRegPeriods !== undefined) updateData.default_reg_periods = data.defaultRegPeriods;
  if (data.periodDuration !== undefined) updateData.period_duration = data.periodDuration;
  if (data.otIfTied !== undefined) updateData.ot_if_tied = Boolean(data.otIfTied);
  if (data.otDuration !== undefined) updateData.ot_duration = Number(data.otDuration);
  if (data.soIfTied !== undefined) updateData.so_if_tied = Boolean(data.soIfTied);
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status) updateData.status = data.status;

  const updated = await prisma.games.update({
    where: { id: gameId },
    data: updateData,
  });

  revalidatePath("/dashboard");
  revalidatePath("/leagues");
  revalidatePath(`/teams/${game.home_team_season_id}`);
  revalidatePath(`/teams/${game.away_team_season_id}`);

  return { success: true, game: updated };
}

/**
 * Fetch active seasons, clubs, teams, competition nodes, age groups, team enrollments, and timezones
 */
export async function getSchedulerOptions() {
  const [seasons, clubs, teamSeasons, leagueNodes, ageGroups, enrollments] = await Promise.all([
    prisma.seasons.findMany({
      orderBy: { start_date: "desc" },
    }),
    prisma.clubs.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    }),
    prisma.team_seasons.findMany({
      where: { is_active: true },
      include: {
        teams: {
          include: {
            clubs: true,
          },
        },
        age_groups: true,
      },
    }),
    prisma.league_nodes.findMany({
      include: {
        leagues: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.age_groups.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.team_league_enrollments.findMany({
      where: { is_active: true },
      include: {
        league_node_seasons: true,
      },
    }),
  ]);

  const teamsList = teamSeasons.map((ts) => {
    const clubId = ts.teams?.club_id || 0;
    const clubName = ts.teams?.clubs?.name || "";
    const teamName = ts.teams?.team_name || "Team";
    const ageGroup = ts.age_groups?.name || "";
    const displayName = [clubName, teamName, ageGroup].filter(Boolean).join(" ");

    return {
      teamSeasonId: ts.id,
      teamId: ts.team_id,
      clubId: clubId,
      clubName: clubName,
      teamName: teamName,
      ageGroup: ageGroup,
      ageGroupId: ts.age_group,
      displayName: displayName || `Team Season #${ts.id}`,
    };
  });

  return {
    seasons: seasons.map((s) => ({
      id: s.id,
      name: s.season_name,
    })),
    clubs: clubs.map((c) => ({
      id: c.id,
      name: c.name,
      abbreviation: c.abbreviation,
      location: c.location,
    })),
    teams: teamsList,
    leagueNodes: leagueNodes.map((node) => ({
      id: node.id,
      leagueId: node.league_id,
      leagueName: node.leagues?.name || "League",
      nodeName: node.name,
      isTournament: node.leagues?.is_tournament || false,
      displayName: `${node.leagues?.name || "League"} — ${node.name}`,
    })),
    enrollments: enrollments.map((e) => ({
      teamSeasonId: e.team_season_id,
      leagueNodeId: e.league_node_seasons.league_node_id,
      seasonId: e.league_node_seasons.season_id,
    })),
    ageGroups: ageGroups.map((ag) => ({
      id: ag.id,
      name: ag.name,
      defaultPeriodDuration: ag.default_period_duration || 2400,
      defaultOtIfTied: ag.default_ot_if_tied || false,
      defaultOtDuration: ag.default_ot_duration || 600,
      defaultSoIfTied: ag.default_so_if_tied || true,
    })),
    timezones: ["EST", "CST", "MST", "PST", "UTC"],
  };
}

/**
 * Fetch available venue complexes and their sublocations
 */
export async function getVenueOptions() {
  const locations = await prisma.locations.findMany({
    include: {
      locations_sublocations: {
        where: { is_active: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    sublocations: loc.locations_sublocations.map((sub) => ({
      id: sub.id,
      name: sub.name,
    })),
  }));
}
