"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession, verifyTeamAccess } from "@/lib/auth/auth-utils";
import { getGuestPlayerOptions, getGames, getExistingGuestPlayers } from "@/lib/data/queries";
import { normalizeGender } from "@/lib/utils/gender";

export async function addGuestPlayersToGames(
  playerIds: number[],
  gameIds: number[],
  teamSeasonId: number
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

  if (playerIds.length === 0 || gameIds.length === 0) {
    throw new Error("Please select at least one player and one game");
  }

  // 3. For each player and each game, upsert a player_games record with is_guest: true
  const existingPlayerGames = await prisma.player_games.findMany({
    where: {
      game_id: { in: gameIds },
      player_id: { in: playerIds }
    },
    select: {
      id: true,
      game_id: true,
      player_id: true
    }
  });

  const existingMap = new Map<string, number>();
  existingPlayerGames.forEach(pg => {
    existingMap.set(`${pg.game_id}_${pg.player_id}`, pg.id);
  });

  const updates: any[] = [];
  const creations: any[] = [];

  for (const gameId of gameIds) {
    for (const playerId of playerIds) {
      const key = `${gameId}_${playerId}`;
      const existingId = existingMap.get(key);
      if (existingId !== undefined) {
        updates.push(
          prisma.player_games.update({
            where: { id: existingId },
            data: { is_guest: true, team_season_id: teamSeasonId }
          })
        );
      } else {
        creations.push(
          prisma.player_games.create({
            data: {
              game_id: gameId,
              player_id: playerId,
              team_season_id: teamSeasonId,
              is_guest: true,
              game_status: "dressed",
              started: false
            }
          })
        );
      }
    }
  }

  // Execute inside a transaction
  await prisma.$transaction([...updates, ...creations]);

  revalidatePath("/dashboard/guest-players");
  return { success: true, count: creations.length + updates.length };
}

export async function removeGuestPlayerFromGame(playerGameId: number, targetTeamSeasonId: number) {
  // 1. Ensure user is logged in
  await requireSession();

  // 2. Verify user has write access to the target team season
  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: targetTeamSeasonId },
    select: { team_id: true }
  });
  if (!teamSeason) {
    throw new Error("Target team season not found");
  }
  await verifyTeamAccess(teamSeason.team_id);

  // 3. Prevent database integrity errors when deleting a guest who already has logged events
  const record = await prisma.player_games.findUnique({
    where: { id: playerGameId },
    include: {
      game_events_discipline: true,
      game_events_goals_game_events_goals_scorer_player_game_idToplayer_games: true,
      game_events_goals_game_events_goals_assist_player_game_idToplayer_games: true,
      game_events_goals_game_events_goals_defending_gk_player_game_idToplayer_games: true,
      game_subs_game_subs_in_player_idToplayer_games: true,
      game_subs_game_subs_out_player_idToplayer_games: true,
    }
  });

  if (!record) {
    throw new Error("Guest record not found");
  }

  const hasEvents =
    record.game_events_discipline.length > 0 ||
    record.game_events_goals_game_events_goals_scorer_player_game_idToplayer_games.length > 0 ||
    record.game_events_goals_game_events_goals_assist_player_game_idToplayer_games.length > 0 ||
    record.game_events_goals_game_events_goals_defending_gk_player_game_idToplayer_games.length > 0 ||
    record.game_subs_game_subs_in_player_idToplayer_games.length > 0 ||
    record.game_subs_game_subs_out_player_idToplayer_games.length > 0;

  if (hasEvents) {
    // If the player has logged events in the game, just toggle is_guest to false to preserve game logs
    await prisma.player_games.update({
      where: { id: playerGameId },
      data: { is_guest: false }
    });
  } else {
    // Otherwise, completely clean the record from the database
    await prisma.player_games.delete({
      where: { id: playerGameId }
    });
  }

  revalidatePath("/dashboard/guest-players");
  return { success: true };
}

export async function getGuestPlayerOptionsAction(filters?: {
  clubId?: number;
  ageGroupId?: number;
  teamId?: number;
  seasonId?: number;
  searchQuery?: string;
  excludeTeamSeasonId?: number;
}) {
  await requireSession();
  return await getGuestPlayerOptions(filters);
}

/**
 * On-the-fly flow: Roster a person to a team for the season (creating the person if needed),
 * and optionally assign them as guest player to specified games.
 */
export async function rosterPersonAndAssignGuestGames(data: {
  targetTeamSeasonId: number;
  gameIds?: number[];
  personId?: number;
  newPerson?: {
    firstName: string;
    lastName: string;
    nickname?: string;
    gender: string;
    birthDate?: string;
    email?: string;
    phone?: string;
  };
  rosterTeamId: number;
  jerseyNumber?: number | null;
}) {
  await requireSession();

  const targetTs = await prisma.team_seasons.findUnique({
    where: { id: data.targetTeamSeasonId },
    select: { team_id: true, season_id: true },
  });
  if (!targetTs) throw new Error("Target team season not found");
  await verifyTeamAccess(targetTs.team_id);

  let finalPersonId = data.personId;
  if (!finalPersonId && data.newPerson) {
    const person = await prisma.people.create({
      data: {
        first_name: data.newPerson.firstName.trim(),
        last_name: data.newPerson.lastName.trim(),
        nickname: data.newPerson.nickname?.trim() || null,
        gender: normalizeGender(data.newPerson.gender, "MIXED"),
        email: data.newPerson.email?.trim() || null,
        phone: data.newPerson.phone?.trim() || null,
        birth_date: data.newPerson.birthDate ? new Date(data.newPerson.birthDate) : null,
        is_active: true,
      },
    });
    finalPersonId = person.id;
  }

  if (!finalPersonId) {
    throw new Error("No person was specified or created.");
  }

  // Ensure team_seasons exists for this team in this season
  let rosterTs = await prisma.team_seasons.findFirst({
    where: { team_id: data.rosterTeamId, season_id: targetTs.season_id },
  });
  if (!rosterTs) {
    rosterTs = await prisma.team_seasons.create({
      data: {
        team_id: data.rosterTeamId,
        season_id: targetTs.season_id,
        is_active: true,
      },
    });
  }

  // Check if player is already rostered on this team_season
  const existingPt = await prisma.player_teams.findFirst({
    where: { team_season_id: rosterTs.id, player_id: finalPersonId },
  });
  if (!existingPt) {
    await prisma.player_teams.create({
      data: {
        team_season_id: rosterTs.id,
        player_id: finalPersonId,
        jersey_number: data.jerseyNumber ?? null,
        is_active: true,
        status: "rostered",
      },
    });
  }

  // If gameIds are provided, assign as guest players
  if (data.gameIds && data.gameIds.length > 0) {
    await addGuestPlayersToGames([finalPersonId], data.gameIds, data.targetTeamSeasonId);
  }

  revalidatePath("/dashboard/guest-players");
  return { success: true, personId: finalPersonId };
}

export async function getGamesAction(filters: {
  teamSeasonId?: number;
  startDate?: string;
  endDate?: string;
}) {
  await requireSession();
  const allGames = await getGames({ teamSeasonId: filters.teamSeasonId });
  const start = filters.startDate ? new Date(filters.startDate) : null;
  const end = filters.endDate ? new Date(filters.endDate) : null;
  return allGames.filter((g) => {
    const gameDate = new Date(g.startDate);
    if (start && gameDate < start) return false;
    if (end && gameDate > end) return false;
    return true;
  });
}

export async function getExistingGuestPlayersAction(gameIds: number[]) {
  await requireSession();
  return await getExistingGuestPlayers(gameIds);
}
