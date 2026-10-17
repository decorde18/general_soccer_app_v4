"use server";

import prisma from "@/lib/prisma";
import { requireSession, verifyTeamAccess } from "@/lib/auth/auth-utils";
import { revalidatePath } from "next/cache";
import { resolveSubTeams, extractSquadLevel } from "@/lib/data/queries";

export interface LineupPlayer {
  id: number; // player_id (pointing to people.id)
  playerTeamId: number; // player_teams.id
  fullName: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  gameStatus: "goalkeeper" | "starter" | "dressed" | "not_dressed" | "injured" | "suspended" | "unavailable";
  isGuest: boolean;
  squadLevel?: string | null;
}

export async function loadGameLineup(gameId: number, teamSeasonId: number): Promise<LineupPlayer[]> {
  // 1. Resolve sub-teams/squads (strictly scoped to sister squads like Varsity/JV or LM/DC)
  const { programTeamSeasonIds: siblingTeamSeasonIds } = await resolveSubTeams(teamSeasonId);

  // 2. Fetch all active player_teams records across the program pool
  const rosterRecords = await prisma.player_teams.findMany({
    where: {
      team_season_id: { in: siblingTeamSeasonIds },
      is_active: true,
      status: "rostered",
    },
    include: {
      people: true,
      team_seasons: {
        include: {
          teams: true,
        },
      },
    },
  });

  // Group by person ID
  const personRosterMap = new Map<number, {
    primaryRecord?: typeof rosterRecords[0];
    fallbackRecord: typeof rosterRecords[0];
    squadLevels: string[];
  }>();

  for (const pt of rosterRecords) {
    const existing = personRosterMap.get(pt.player_id);
    const teamName = pt.team_seasons?.teams?.team_name || "Team";
    const squadName = extractSquadLevel(teamName);
    if (!existing) {
      personRosterMap.set(pt.player_id, {
        primaryRecord: pt.team_season_id === teamSeasonId ? pt : undefined,
        fallbackRecord: pt,
        squadLevels: [squadName],
      });
    } else {
      if (pt.team_season_id === teamSeasonId) {
        existing.primaryRecord = pt;
      }
      if (!existing.squadLevels.includes(squadName)) {
        existing.squadLevels.push(squadName);
      }
    }
  }

  // 3. Fetch existing player_games records for this match across the program pool OR any guests
  const [playerGames, gameRecord] = await Promise.all([
    prisma.player_games.findMany({
      where: {
        game_id: gameId,
        OR: [
          { team_season_id: { in: siblingTeamSeasonIds } },
          { is_guest: true },
        ],
      },
    }),
    prisma.games.findUnique({
      where: { id: gameId },
      select: { status: true },
    }),
  ]);

  const isCompletedGame = gameRecord?.status === "completed";

  // Create a map of existing player status by player_id
  const playerGamesMap = new Map(
    playerGames.map((pg) => [pg.player_id, { gameStatus: pg.game_status, isGuest: !!pg.is_guest }])
  );

  // Check if this match had confirmed starters recorded historically
  const hasRecordedStarters = playerGames.some(
    (pg) => pg.game_status === "starter" || pg.game_status === "goalkeeper"
  );

  // 4. Merge program roster and player_games
  const mergedPlayers: LineupPlayer[] = [];

  for (const [personId, entry] of personRosterMap.entries()) {
    const isPrimary = Boolean(entry.primaryRecord);
    const chosenRecord = entry.primaryRecord || entry.fallbackRecord;
    const existing = playerGamesMap.get(personId);

    let status: string;
    if (isCompletedGame) {
      if (!hasRecordedStarters) {
        // Completed match with NO starters recorded -> unconfirmed historical match.
        // Do not falsely dress entire rosters. Only honor explicitly non-playing statuses,
        // otherwise default to not_dressed.
        if (existing?.gameStatus === "injured" || existing?.gameStatus === "unavailable" || existing?.gameStatus === "suspended") {
          status = existing.gameStatus;
        } else {
          status = "not_dressed";
        }
      } else {
        // Completed match with confirmed starters -> trust existing status, or default to not_dressed
        status = existing?.gameStatus || "not_dressed";
      }
    } else {
      // Upcoming or live game: primary squad defaults to dressed, secondary squad to not_dressed
      const defaultStatus = isPrimary ? "dressed" : "not_dressed";
      status = existing?.gameStatus || defaultStatus;
    }

    mergedPlayers.push({
      id: personId,
      playerTeamId: chosenRecord.id,
      fullName: `${chosenRecord.people.first_name} ${chosenRecord.people.last_name}`,
      firstName: chosenRecord.people.first_name,
      lastName: chosenRecord.people.last_name,
      jerseyNumber: chosenRecord.jersey_number,
      gameStatus: status as any,
      isGuest: existing?.isGuest ?? false,
      squadLevel: entry.squadLevels.join(" & "),
    });
  }

  // 5. If there are guests in player_games that are NOT in the program pool, include them!
  const poolPersonIds = new Set(personRosterMap.keys());
  const guestPlayerGames = playerGames.filter((pg) => !poolPersonIds.has(pg.player_id) && pg.is_guest);

  if (guestPlayerGames.length > 0) {
    const guestPersonIds = guestPlayerGames.map((pg) => pg.player_id);
    const [guestPeople, guestRosters] = await Promise.all([
      prisma.people.findMany({
        where: { id: { in: guestPersonIds } },
      }),
      prisma.player_teams.findMany({
        where: {
          player_id: { in: guestPersonIds },
          is_active: true,
        },
        select: {
          player_id: true,
          jersey_number: true,
        },
        orderBy: { id: "desc" },
      }),
    ]);

    const guestPeopleMap = new Map(guestPeople.map((p) => [p.id, p]));
    const guestJerseyMap = new Map<number, number | null>();
    guestRosters.forEach((gr) => {
      if (!guestJerseyMap.has(gr.player_id) && gr.jersey_number != null) {
        guestJerseyMap.set(gr.player_id, gr.jersey_number);
      }
    });

    guestPlayerGames.forEach((pg) => {
      const person = guestPeopleMap.get(pg.player_id);
      if (person) {
        mergedPlayers.push({
          id: pg.player_id,
          playerTeamId: 0,
          fullName: `${person.first_name} ${person.last_name}`,
          firstName: person.first_name,
          lastName: person.last_name,
          jerseyNumber: guestJerseyMap.get(pg.player_id) ?? null,
          gameStatus: pg.game_status as any,
          isGuest: true,
          squadLevel: "Guest",
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
  revalidatePath(`/gamestats/${teamSeasonId}/${gameId}`);
  return { success: true };
}

export async function updateLineupPlayerJerseys(
  teamSeasonId: number,
  assignments: { playerId: number; jerseyNumber: number; applyToSeason: boolean }[]
) {
  await requireSession();
  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    select: { team_id: true },
  });
  if (!teamSeason) throw new Error("Team season not found");
  await verifyTeamAccess(teamSeason.team_id);

  const updates = assignments
    .filter((a) => a.applyToSeason && a.jerseyNumber > 0)
    .map((a) =>
      prisma.player_teams.updateMany({
        where: {
          team_season_id: teamSeasonId,
          player_id: a.playerId,
        },
        data: {
          jersey_number: a.jerseyNumber,
        },
      })
    );

  if (updates.length > 0) {
    await prisma.$transaction(updates);
    revalidatePath(`/gamestats/${teamSeasonId}`);
  }

  return { success: true };
}

export async function searchGuestPlayerCandidates(query: string) {
  await requireSession();
  if (!query || query.trim().length < 2) return [];

  const q = query.trim().toLowerCase();
  const people = await prisma.people.findMany({
    where: {
      is_active: true,
      OR: [
        { first_name: { contains: q } },
        { last_name: { contains: q } },
        { nickname: { contains: q } },
        { email: { contains: q } },
      ],
    },
    include: {
      player_teams: {
        where: { is_active: true },
        include: {
          team_seasons: {
            include: {
              teams: {
                include: { clubs: true },
              },
              seasons: true,
            },
          },
        },
        take: 1,
      },
    },
    take: 20,
  });

  return people.map((p) => {
    const pt = p.player_teams[0];
    const team = pt?.team_seasons?.teams;
    const club = team?.clubs;
    return {
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      fullName: `${p.first_name} ${p.last_name}`,
      jerseyNumber: pt?.jersey_number ?? null,
      clubName: club?.name ?? null,
      teamName: team?.team_name ?? null,
      seasonName: pt?.team_seasons?.seasons?.season_name ?? null,
    };
  });
}

export async function addGuestPlayerToLineup(
  gameId: number,
  teamSeasonId: number,
  data: {
    personId: number;
    jerseyNumber?: number | null;
    gameStatus?: "starter" | "goalkeeper" | "dressed" | "not_dressed" | "unavailable";
  }
): Promise<{ success: boolean; player: LineupPlayer }> {
  await requireSession();

  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    select: { team_id: true },
  });
  if (!teamSeason) {
    throw new Error("Target team season not found");
  }
  await verifyTeamAccess(teamSeason.team_id);

  const person = await prisma.people.findUnique({
    where: { id: data.personId },
  });
  if (!person) {
    throw new Error("Selected player not found");
  }

  const gameStatus = data.gameStatus || "dressed";

  // Upsert into player_games for this match
  const existing = await prisma.player_games.findFirst({
    where: {
      game_id: gameId,
      player_id: data.personId,
    },
  });

  if (existing) {
    await prisma.player_games.update({
      where: { id: existing.id },
      data: {
        is_guest: true,
        team_season_id: teamSeasonId,
        game_status: gameStatus,
        started: gameStatus === "starter" || gameStatus === "goalkeeper",
      },
    });
  } else {
    await prisma.player_games.create({
      data: {
        game_id: gameId,
        player_id: data.personId,
        team_season_id: teamSeasonId,
        is_guest: true,
        game_status: gameStatus,
        started: gameStatus === "starter" || gameStatus === "goalkeeper",
      },
    });
  }

  revalidatePath(`/gamestats/${teamSeasonId}/${gameId}/lineup`);

  return {
    success: true,
    player: {
      id: person.id,
      playerTeamId: 0,
      fullName: `${person.first_name} ${person.last_name}`,
      firstName: person.first_name,
      lastName: person.last_name,
      jerseyNumber: data.jerseyNumber ?? null,
      gameStatus: gameStatus as any,
      isGuest: true,
      squadLevel: "Guest",
    },
  };
}
