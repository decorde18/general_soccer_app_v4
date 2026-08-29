"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/auth-utils";
import { teams_gender } from "@/generated/client";

/**
 * Create a new Club inline
 */
export async function createInlineClub(data: {
  name: string;
  abbreviation?: string;
  location?: string;
}) {
  await requireSession();

  if (!data.name || !data.name.trim()) {
    throw new Error("Club name is required.");
  }

  const club = await prisma.clubs.create({
    data: {
      name: data.name.trim(),
      abbreviation: data.abbreviation?.trim() || null,
      location: data.location?.trim() || null,
      is_active: true,
    },
  });

  revalidatePath("/admin/clubs");
  return { success: true, club };
}

/**
 * Create a new Team and auto-enroll into a season inline
 */
export async function createInlineTeam(data: {
  clubId: number;
  teamName: string;
  gender: teams_gender;
  ageGroupId?: number | null;
  seasonId?: number;
}) {
  await requireSession();

  if (!data.teamName || !data.teamName.trim()) {
    throw new Error("Team name is required.");
  }
  if (!data.clubId) {
    throw new Error("Club selection is required.");
  }

  // 1. Create team
  const team = await prisma.teams.create({
    data: {
      club_id: data.clubId,
      team_name: data.teamName.trim(),
      gender: data.gender || "Mixed",
      is_active: true,
    },
  });

  let teamSeason = null;

  // 2. If seasonId provided, auto-create team_seasons entry
  if (data.seasonId) {
    teamSeason = await prisma.team_seasons.create({
      data: {
        team_id: team.id,
        season_id: data.seasonId,
        age_group: data.ageGroupId || null,
        is_active: true,
      },
      include: {
        teams: {
          include: {
            clubs: true,
          },
        },
        age_groups: true,
      },
    });
  }

  revalidatePath("/admin/clubs");
  revalidatePath("/dashboard");

  return { success: true, team, teamSeason };
}

/**
 * Create a new League or Tournament inline, including a default root league node
 */
export async function createInlineLeague(data: {
  name: string;
  abbreviation?: string;
  isTournament?: boolean;
  seasonId?: number;
}) {
  await requireSession();

  if (!data.name || !data.name.trim()) {
    throw new Error("League/Tournament name is required.");
  }

  const league = await prisma.leagues.create({
    data: {
      name: data.name.trim(),
      abbreviation: data.abbreviation?.trim() || null,
      is_tournament: Boolean(data.isTournament),
      status: "active",
      is_active: true,
    },
  });

  // Create default root league node
  const node = await prisma.league_nodes.create({
    data: {
      league_id: league.id,
      name: `${league.name} (General)`,
      node_type: data.isTournament ? "tournament" : "division",
      level: 0,
      display_order: 0,
    },
  });

  // If seasonId provided, create league_node_seasons
  let nodeSeason = null;
  if (data.seasonId) {
    nodeSeason = await prisma.league_node_seasons.create({
      data: {
        league_node_id: node.id,
        season_id: data.seasonId,
        status: "active",
        is_active: true,
      },
    });
  }

  revalidatePath("/leagues");
  revalidatePath("/admin/leagues");

  return { success: true, league, node, nodeSeason };
}

/**
 * Create a new Venue Location Complex inline
 */
export async function createInlineLocation(data: {
  name: string;
  abbreviation?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}) {
  await requireSession();

  if (!data.name || !data.name.trim()) {
    throw new Error("Location name is required.");
  }

  let addressId: number | null = null;

  if (data.addressLine1 || data.city || data.state || data.postalCode) {
    const address = await prisma.addresses.create({
      data: {
        address_line1: data.addressLine1?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        postal_code: data.postalCode?.trim() || null,
        country: "USA",
      },
    });
    addressId = address.id;
  }

  const location = await prisma.locations.create({
    data: {
      name: data.name.trim(),
      abbreviation: data.abbreviation?.trim() || null,
      address_id: addressId,
    },
  });

  revalidatePath("/locations");
  return { success: true, location };
}

/**
 * Create a new Sublocation (Field / Pitch) inline
 */
export async function createInlineSublocation(data: {
  locationId: number;
  name: string;
  surfaceType?: string;
}) {
  await requireSession();

  if (!data.locationId) {
    throw new Error("Location complex selection is required.");
  }
  if (!data.name || !data.name.trim()) {
    throw new Error("Field name is required.");
  }

  const sublocation = await prisma.locations_sublocations.create({
    data: {
      location_id: data.locationId,
      name: data.name.trim(),
      surface_type: data.surfaceType?.trim() || null,
      is_active: true,
    },
  });

  revalidatePath("/locations");
  return { success: true, sublocation };
}

/**
 * Enroll a team_season into an existing league_node for a given season inline
 */
export async function enrollTeamInLeagueNode(data: {
  teamSeasonId: number;
  leagueNodeId: number;
  seasonId: number;
}) {
  await requireSession();

  if (!data.teamSeasonId || !data.leagueNodeId || !data.seasonId) {
    throw new Error("Team, Competition Node, and Season are required.");
  }

  // 1. Find or create league_node_seasons
  let nodeSeason = await prisma.league_node_seasons.findFirst({
    where: {
      league_node_id: data.leagueNodeId,
      season_id: data.seasonId,
    },
  });

  if (!nodeSeason) {
    nodeSeason = await prisma.league_node_seasons.create({
      data: {
        league_node_id: data.leagueNodeId,
        season_id: data.seasonId,
        status: "active",
        is_active: true,
      },
    });
  }

  // 2. Find or create team_league_enrollments
  let enrollment = await prisma.team_league_enrollments.findFirst({
    where: {
      team_season_id: data.teamSeasonId,
      league_node_season_id: nodeSeason.id,
    },
  });

  if (!enrollment) {
    enrollment = await prisma.team_league_enrollments.create({
      data: {
        team_season_id: data.teamSeasonId,
        league_node_season_id: nodeSeason.id,
        is_active: true,
      },
    });
  }

  revalidatePath("/leagues");
  return { success: true, enrollment, nodeSeason };
}

