"use server";

import prisma from "@/lib/prisma";
import { requireSession, verifyTeamAccess } from "@/lib/auth/auth-utils";
import { revalidatePath } from "next/cache";

export interface LineupPlayer {
  id: number; // player_id (pointing to people.id)
  playerTeamId: number; // player_teams.id
  fullName: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  gameStatus: "goalkeeper" | "starter" | "dressed" | "not_dressed" | "injured" | "suspended" | "unavailable";
  isGuest: boolean;
}

export async function loadGameLineup(gameId: number, teamSeasonId: number): Promise<LineupPlayer[]> {
  // 1. Fetch team season roster (active player_teams records with people)
  const roster = await prisma.player_teams.findMany({
    where: {
      team_season_id: teamSeasonId,
      is_active: true,
    },
    include: {
      people: true,
    },
  });

  // 2. Fetch existing player_games records for this match and team season
  const playerGames = await prisma.player_games.findMany({
    where: {
      game_id: gameId,
      team_season_id: teamSeasonId,
    },
  });

  // Create a map of existing player status by player_id
  const playerGamesMap = new Map(
    playerGames.map((pg) => [pg.player_id, { gameStatus: pg.game_status, isGuest: !!pg.is_guest }])
  );

  // 3. Merge roster and player_games
  const mergedPlayers: LineupPlayer[] = roster.map((pt) => {
    const existing = playerGamesMap.get(pt.player_id);
    return {
      id: pt.player_id,
      playerTeamId: pt.id,
      fullName: `${pt.people.first_name} ${pt.people.last_name}`,
      firstName: pt.people.first_name,
      lastName: pt.people.last_name,
      jerseyNumber: pt.jersey_number,
      gameStatus: (existing?.gameStatus as any) || "dressed", // default to dressed (bench)
      isGuest: existing?.isGuest ?? false,
    };
  });

  // If there are guests in player_games that are NOT in the regular roster, include them!
  const rosterPlayerIds = new Set(roster.map((pt) => pt.player_id));
  const guestPlayerGames = playerGames.filter((pg) => !rosterPlayerIds.has(pg.player_id));

  if (guestPlayerGames.length > 0) {
    const guestPeople = await prisma.people.findMany({
      where: {
        id: { in: guestPlayerGames.map((pg) => pg.player_id) },
      },
      include: {
        player_teams: {
          where: {
            team_season_id: teamSeasonId,
          },
          select: {
            jersey_number: true,
          },
        },
      },
    });

    const guestPeopleMap = new Map(guestPeople.map((p) => [p.id, p]));

    guestPlayerGames.forEach((pg) => {
      const person = guestPeopleMap.get(pg.player_id);
      if (person) {
        const jerseyNum = person.player_teams?.[0]?.jersey_number ?? null;
        mergedPlayers.push({
          id: pg.player_id,
          playerTeamId: 0,
          fullName: `${person.first_name} ${person.last_name}`,
          firstName: person.first_name,
          lastName: person.last_name,
          jerseyNumber: jerseyNum,
          gameStatus: pg.game_status as any,
          isGuest: true,
        });
      }
    });
  }

  return mergedPlayers;
}

export async function saveGameLineup(
  gameId: number,
  teamSeasonId: number,
  playerStatuses: { id: number; gameStatus: string; isGuest: boolean }[]
) {
  // 1. Ensure user is logged in
  await requireSession();

  // 2. Verify user has write access to the target team season
  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    select: { team_id: true }
  });
  if (!teamSeason) {
    throw new Error("Target team season not found");
  }
  await verifyTeamAccess(teamSeason.team_id);

  // 3. Load existing player_games for this match to separate updates from creations
  const existing = await prisma.player_games.findMany({
    where: {
      game_id: gameId,
      player_id: { in: playerStatuses.map(p => p.id) },
    },
    select: {
      id: true,
      player_id: true,
    }
  });

  const existingMap = new Map(existing.map((e) => [e.player_id, e.id]));

  const operations = playerStatuses.map((p) => {
    const isStarter = p.gameStatus === "starter" || p.gameStatus === "goalkeeper";
    const existingId = existingMap.get(p.id);

    if (existingId) {
      return prisma.player_games.update({
        where: { id: existingId },
        data: {
          game_status: p.gameStatus as any,
          started: isStarter,
        },
      });
    } else {
      return prisma.player_games.create({
        data: {
          game_id: gameId,
          player_id: p.id,
          team_season_id: teamSeasonId,
          game_status: p.gameStatus as any,
          started: isStarter,
          is_guest: p.isGuest,
        },
      });
    }
  });

  // Execute transaction
  await prisma.$transaction(operations);

  // Revalidate cache paths
  revalidatePath(`/gameStats/${teamSeasonId}/${gameId}`);
  return { success: true };
}
