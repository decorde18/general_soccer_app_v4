"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession, verifyAdmin } from "@/lib/auth/auth-utils";

export interface TeamImportRecord {
  clubName: string;
  teamName: string;
  gender: "boys" | "girls" | "coed";
  ageGroupName?: string;
  city?: string;
  state?: string;
}

export interface ScheduleImportRecord {
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM or 10:00 AM
  homeClubName: string;
  homeTeamName: string;
  awayClubName: string;
  awayTeamName: string;
  gender?: "boys" | "girls" | "coed";
  locationName?: string;
  sublocationName?: string;
  gameType?: "league" | "tournament" | "friendly" | "playoff";
  leagueNodeId?: number;
}

/**
 * Helper to normalize strings for comparison
 */
function normalizeStr(str?: string | null): string {
  return (str || "").trim().toLowerCase();
}

function mapGenderToEnum(genderStr?: string): "Men" | "Women" | "Mixed" {
  const g = (genderStr || "").toLowerCase();
  if (g === "girls" || g === "women" || g === "female" || g === "f") return "Women";
  if (g === "coed" || g === "mixed") return "Mixed";
  return "Men";
}

/**
 * Batch import teams and clubs with deduplication
 */
export async function batchImportTeams(
  seasonId: number,
  records: TeamImportRecord[]
) {
  await requireSession();
  await verifyAdmin();

  if (!records || records.length === 0) {
    throw new Error("No team records provided for import.");
  }

  let clubsCreated = 0;
  let teamsCreated = 0;
  let teamSeasonsCreated = 0;

  for (const rec of records) {
    const rawClub = rec.clubName.trim();
    const rawTeam = rec.teamName.trim();
    const genderEnum = mapGenderToEnum(rec.gender);

    if (!rawClub || !rawTeam) continue;

    // 1. Find or create club
    let club = await prisma.clubs.findFirst({
      where: {
        name: { equals: rawClub },
      },
    });

    if (!club) {
      const locStr = [rec.city, rec.state].filter(Boolean).join(", ") || null;
      club = await prisma.clubs.create({
        data: {
          name: rawClub,
          location: locStr,
          type: "club",
        },
      });
      clubsCreated++;
    }

    // 2. Find or create team
    let team = await prisma.teams.findFirst({
      where: {
        club_id: club.id,
        team_name: { equals: rawTeam },
        gender: genderEnum,
      },
    });

    if (!team) {
      team = await prisma.teams.create({
        data: {
          club_id: club.id,
          team_name: rawTeam,
          gender: genderEnum,
        },
      });
      teamsCreated++;
    }

    // 3. Find or create team_season
    let teamSeason = await prisma.team_seasons.findFirst({
      where: {
        team_id: team.id,
        season_id: seasonId,
      },
    });

    if (!teamSeason) {
      await prisma.team_seasons.create({
        data: {
          team_id: team.id,
          season_id: seasonId,
        },
      });
      teamSeasonsCreated++;
    }
  }

  revalidatePath("/admin/clubs");
  revalidatePath("/dashboard");

  return {
    success: true,
    summary: `Import complete. Created ${clubsCreated} new clubs, ${teamsCreated} new teams, and ${teamSeasonsCreated} team-season registrations.`,
  };
}

/**
 * Batch import schedule fixtures with deduplication & auto-resolving teams/venues
 */
export async function batchImportSchedule(
  seasonId: number,
  records: ScheduleImportRecord[]
) {
  await requireSession();
  await verifyAdmin();

  if (!records || records.length === 0) {
    throw new Error("No schedule records provided for import.");
  }

  let gamesCreated = 0;
  let gamesSkipped = 0;

  for (const rec of records) {
    if (!rec.startDate || !rec.homeTeamName || !rec.awayTeamName) continue;

    const genderEnum = mapGenderToEnum(rec.gender);

    // 1. Resolve Home Team & Club
    let homeClub = await prisma.clubs.findFirst({
      where: { name: { equals: rec.homeClubName.trim() } },
    });
    if (!homeClub) {
      homeClub = await prisma.clubs.create({
        data: { name: rec.homeClubName.trim(), type: "club" },
      });
    }

    let homeTeam = await prisma.teams.findFirst({
      where: {
        club_id: homeClub.id,
        team_name: { equals: rec.homeTeamName.trim() },
        gender: genderEnum,
      },
    });
    if (!homeTeam) {
      homeTeam = await prisma.teams.create({
        data: { club_id: homeClub.id, team_name: rec.homeTeamName.trim(), gender: genderEnum },
      });
    }

    let homeTeamSeason = await prisma.team_seasons.findFirst({
      where: { team_id: homeTeam.id, season_id: seasonId },
    });
    if (!homeTeamSeason) {
      homeTeamSeason = await prisma.team_seasons.create({
        data: { team_id: homeTeam.id, season_id: seasonId },
      });
    }

    // 2. Resolve Away Team & Club
    let awayClub = await prisma.clubs.findFirst({
      where: { name: { equals: rec.awayClubName.trim() } },
    });
    if (!awayClub) {
      awayClub = await prisma.clubs.create({
        data: { name: rec.awayClubName.trim(), type: "club" },
      });
    }

    let awayTeam = await prisma.teams.findFirst({
      where: {
        club_id: awayClub.id,
        team_name: { equals: rec.awayTeamName.trim() },
        gender: genderEnum,
      },
    });
    if (!awayTeam) {
      awayTeam = await prisma.teams.create({
        data: { club_id: awayClub.id, team_name: rec.awayTeamName.trim(), gender: genderEnum },
      });
    }

    let awayTeamSeason = await prisma.team_seasons.findFirst({
      where: { team_id: awayTeam.id, season_id: seasonId },
    });
    if (!awayTeamSeason) {
      awayTeamSeason = await prisma.team_seasons.create({
        data: { team_id: awayTeam.id, season_id: seasonId },
      });
    }

    // 3. Resolve Location & Sublocation
    let locationId: number | null = null;
    let sublocationId: number | null = null;

    if (rec.locationName) {
      let location = await prisma.locations.findFirst({
        where: { name: { equals: rec.locationName.trim() } },
      });
      if (!location) {
        location = await prisma.locations.create({
          data: { name: rec.locationName.trim() },
        });
      }
      locationId = location.id;

      if (rec.sublocationName) {
        let subloc = await prisma.locations_sublocations.findFirst({
          where: {
            location_id: location.id,
            name: { equals: rec.sublocationName.trim() },
          },
        });
        if (!subloc) {
          subloc = await prisma.locations_sublocations.create({
            data: { location_id: location.id, name: rec.sublocationName.trim() },
          });
        }
        sublocationId = subloc.id;
      }
    }

    // 4. Format time
    let formattedTime: string | null = null;
    if (rec.startTime) {
      formattedTime = rec.startTime.trim();
    }

    // 5. Check if game already exists (deduplication)
    const existingGame = await prisma.games.findFirst({
      where: {
        season_id: seasonId,
        start_date: new Date(rec.startDate),
        home_team_season_id: homeTeamSeason.id,
        away_team_season_id: awayTeamSeason.id,
      },
    });

    if (existingGame) {
      gamesSkipped++;
      continue;
    }

    // 6. Create game
    const game = await prisma.games.create({
      data: {
        season_id: seasonId,
        home_team_season_id: homeTeamSeason.id,
        away_team_season_id: awayTeamSeason.id,
        start_date: new Date(rec.startDate),
        start_time: formattedTime,
        location_id: locationId,
        sublocation_id: sublocationId,
        game_type: rec.gameType || "league",
        status: "scheduled",
      },
    });

    gamesCreated++;

    // 7. Attach to league node if specified
    if (rec.leagueNodeId) {
      await prisma.game_league_nodes.create({
        data: {
          game_id: game.id,
          league_node_id: rec.leagueNodeId,
          is_primary: true,
        },
      });

      const nodeSeason = await prisma.league_node_seasons.findUnique({
        where: { id: rec.leagueNodeId },
        select: { league_node_id: true },
      });

      if (nodeSeason) {
        await prisma.game_standings_inclusions.create({
          data: {
            game_id: game.id,
            league_node_id: nodeSeason.league_node_id,
            counts_for_standings: rec.gameType !== "friendly",
          },
        });
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/scores");

  return {
    success: true,
    summary: `Schedule import complete. Created ${gamesCreated} new matches (${gamesSkipped} existing matches skipped as duplicates).`,
  };
}
