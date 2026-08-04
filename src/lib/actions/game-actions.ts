"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession, verifyTeamAccess } from "@/lib/auth/auth-utils";

export interface CreateGameData {
  seasonId: number;
  homeTeamSeasonId: number;
  awayTeamSeasonId: number;
  startDate: string; // YYYY-MM-DD
  startTime?: string | null; // HH:MM
  locationId?: number | null;
  sublocationId?: number | null;
  gameType?: "league" | "tournament" | "friendly" | "playoff";
  periodDuration?: number; // seconds, default 2400 (40 mins)
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

/**
 * Schedule a new match fixture
 */
export async function createGame(data: CreateGameData) {
  await requireSession();
  await verifyTeamAccess(data.homeTeamSeasonId);

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

  const game = await prisma.games.create({
    data: {
      season_id: data.seasonId,
      home_team_season_id: data.homeTeamSeasonId,
      away_team_season_id: data.awayTeamSeasonId,
      start_date: startDateObj,
      start_time: startTimeObj,
      location_id: data.locationId ?? null,
      sublocation_id: data.sublocationId ?? null,
      game_type: data.gameType ?? "league",
      period_duration: data.periodDuration ?? 2400,
      notes: data.notes ?? null,
      status: "scheduled",
    },
  });

  revalidatePath("/dashboard");
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

  if (data.locationId !== undefined) updateData.location_id = data.locationId;
  if (data.sublocationId !== undefined) updateData.sublocation_id = data.sublocationId;
  if (data.gameType) updateData.game_type = data.gameType;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status) updateData.status = data.status;

  const updated = await prisma.games.update({
    where: { id: gameId },
    data: updateData,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/teams/${game.home_team_season_id}`);
  revalidatePath(`/teams/${game.away_team_season_id}`);

  return { success: true, game: updated };
}

/**
 * Fetch active seasons and teams for scheduling modals
 */
export async function getSchedulerOptions() {
  const [seasons, teamSeasons] = await Promise.all([
    prisma.seasons.findMany({
      orderBy: { start_date: "desc" },
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
  ]);

  return {
    seasons: seasons.map((s) => ({
      id: s.id,
      name: s.season_name,
    })),
    teams: teamSeasons.map((ts) => {
      const clubName = ts.teams?.clubs?.name || "";
      const teamName = ts.teams?.team_name || "Team";
      const ageGroup = ts.age_groups?.name || "";
      const displayName = [clubName, teamName, ageGroup].filter(Boolean).join(" ");
      return {
        teamSeasonId: ts.id,
        displayName: displayName || `Team Season #${ts.id}`,
      };
    }),
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
