"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ScheduleLeadEnriched {
  id: number;
  seasonId: number;
  seasonName: string;
  teamSeasonId: number | null;
  opponentClubId: number;
  opponentClubName: string;
  opponentAbbreviation: string | null;
  likelihood: string;
  status: string;
  preferredHomeAway: string | null;
  preferredDate: string | null;
  notes: string | null;
  seriesHistory: {
    wins: number;
    losses: number;
    draws: number;
    lastGameDate: string | null;
    lastVenueWasHome: boolean | null;
    recommendedVenue: "Home" | "Away" | "Either";
  };
}

export async function getScheduleLeadsForTeamSeason(teamSeasonId: number) {
  const ts = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    include: {
      seasons: true,
      teams: { include: { clubs: true } },
    },
  });
  if (!ts) return [];

  const leads = await prisma.schedule_leads.findMany({
    where: { season_id: ts.season_id },
    include: {
      seasons: true,
      opponent_club: true,
    },
    orderBy: [{ id: "asc" }],
  });

  // Also load all historical games for our club to compute head-to-head series history & home/away rotation
  const ourClubId = ts.teams.club_id;
  const historicalGames = await prisma.games.findMany({
    where: {
      status: "completed",
      OR: [
        { team_seasons_games_home_team_season_idToteam_seasons: { teams: { club_id: ourClubId } } },
        { team_seasons_games_away_team_season_idToteam_seasons: { teams: { club_id: ourClubId } } },
      ],
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: true },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: true },
      },
      game_events_major: {
        include: { game_events_goals: true },
      },
    },
    orderBy: { start_date: "desc" },
  });

  return leads.map((lead): ScheduleLeadEnriched => {
    const oppClubId = lead.opponent_club_id;
    const vsGames = historicalGames.filter((g) => {
      const hClub = g.team_seasons_games_home_team_season_idToteam_seasons?.teams?.club_id;
      const aClub = g.team_seasons_games_away_team_season_idToteam_seasons?.teams?.club_id;
      return (hClub === ourClubId && aClub === oppClubId) || (aClub === ourClubId && hClub === oppClubId);
    });

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let lastGameDate: string | null = null;
    let lastVenueWasHome: boolean | null = null;

    vsGames.forEach((g, idx) => {
      const isHome = g.team_seasons_games_home_team_season_idToteam_seasons?.teams?.club_id === ourClubId;
      let homeScore = 0;
      let awayScore = 0;
      g.game_events_major?.forEach((m) => {
        m.game_events_goals?.forEach((goal) => {
          if (goal.team_season_id === g.home_team_season_id) homeScore++;
          else awayScore++;
        });
      });

      const ourScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;

      if (ourScore > oppScore) wins++;
      else if (ourScore < oppScore) losses++;
      else draws++;

      if (idx === 0) {
        lastGameDate = g.start_date ? g.start_date.toISOString().split("T")[0] : null;
        lastVenueWasHome = isHome;
      }
    });

    const recommendedVenue: "Home" | "Away" | "Either" =
      lastVenueWasHome === true ? "Away" : lastVenueWasHome === false ? "Home" : "Either";

    return {
      id: lead.id,
      seasonId: lead.season_id,
      seasonName: lead.seasons.season_name,
      teamSeasonId: lead.team_season_id,
      opponentClubId: lead.opponent_club_id,
      opponentClubName: lead.opponent_club.name,
      opponentAbbreviation: lead.opponent_club.abbreviation ?? null,
      likelihood: lead.likelihood,
      status: lead.status,
      preferredHomeAway: lead.preferred_home_away ?? recommendedVenue,
      preferredDate: lead.preferred_date ? lead.preferred_date.toISOString().split("T")[0] : null,
      notes: lead.notes ?? null,
      seriesHistory: {
        wins,
        losses,
        draws,
        lastGameDate,
        lastVenueWasHome,
        recommendedVenue,
      },
    };
  });
}

export async function upsertScheduleLeadAction(data: {
  id?: number;
  seasonId: number;
  teamSeasonId?: number | null;
  opponentClubId: number;
  likelihood: string;
  status: string;
  preferredHomeAway?: string | null;
  preferredDate?: string | null;
  notes?: string | null;
}) {
  try {
    const payload = {
      season_id: data.seasonId,
      team_season_id: data.teamSeasonId || null,
      opponent_club_id: data.opponentClubId,
      likelihood: data.likelihood || "likely",
      status: data.status || "no contact",
      preferred_home_away: data.preferredHomeAway || null,
      preferred_date: data.preferredDate ? new Date(data.preferredDate) : null,
      notes: data.notes?.trim() || null,
    };

    const record = data.id
      ? await prisma.schedule_leads.update({
          where: { id: data.id },
          data: payload,
        })
      : await prisma.schedule_leads.create({
          data: payload,
        });

    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, lead: record };
  } catch (err: any) {
    console.error("Failed to save schedule lead:", err);
    return { success: false, error: err.message || "Failed to save schedule lead" };
  }
}

export async function deleteScheduleLeadAction(id: number, teamSeasonId?: number) {
  try {
    await prisma.schedule_leads.delete({ where: { id } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete schedule lead" };
  }
}
