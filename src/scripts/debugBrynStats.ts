import prisma from "../lib/prisma";

async function main() {
  console.log("=== Debugging Player Stats for Bryn ===");

  const bryn = await prisma.people.findFirst({
    where: {
      OR: [
        { first_name: { contains: "Bryn" } },
        { last_name: { contains: "Bryn" } },
      ],
    },
    include: {
      player_games: {
        include: {
          games: {
            include: {
              seasons: true,
              game_subs: true,
            },
          },
          team_seasons: {
            include: { teams: true },
          },
        },
      },
    },
  });

  if (!bryn) {
    console.log("No player found with name Bryn.");
    return;
  }

  console.log(`Found player: ${bryn.first_name} ${bryn.last_name} (ID ${bryn.id})`);
  console.log(`Total player_games rows: ${bryn.player_games.length}`);

  bryn.player_games.forEach((pg) => {
    const game = pg.games;
    console.log({
      playerGameId: pg.id,
      gameId: pg.game_id,
      gameStatus: game?.status,
      gameType: game?.game_type,
      startDate: game?.start_date,
      started: pg.started,
      gameStatusInPg: pg.game_status,
      teamSeasonId: pg.team_season_id,
      teamName: pg.team_seasons?.teams?.team_name,
      subsCount: game?.game_subs?.length || 0,
    });
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
