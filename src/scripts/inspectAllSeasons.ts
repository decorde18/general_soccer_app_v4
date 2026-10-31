import prisma from "../lib/prisma";

async function main() {
  const seasons = await prisma.seasons.findMany({
    orderBy: { start_date: "desc" },
  });

  console.log(`Total seasons found: ${seasons.length}`);

  for (const s of seasons) {
    const completedGamesCount = await prisma.games.count({
      where: { season_id: s.id, status: "completed" },
    });

    const pgCount = await prisma.player_games.count({
      where: {
        games: { season_id: s.id, status: "completed" },
      },
    });

    const unfinalizedPgCount = await prisma.player_games.count({
      where: {
        games: { season_id: s.id, status: "completed" },
        playing_time_seconds: null,
      },
    });

    const zeroTimePgCount = await prisma.player_games.count({
      where: {
        games: { season_id: s.id, status: "completed" },
        playing_time_seconds: 0,
      },
    });

    const withTimePgCount = await prisma.player_games.count({
      where: {
        games: { season_id: s.id, status: "completed" },
        playing_time_seconds: { gt: 0 },
      },
    });

    if (completedGamesCount > 0 || pgCount > 0) {
      console.log(
        `Season ID: ${s.id.toString().padEnd(3)} | Name: ${s.season_name.padEnd(20)} | Status: ${s.status.padEnd(8)} | Completed Games: ${completedGamesCount.toString().padStart(4)} | Total PG: ${pgCount.toString().padStart(5)} | PG > 0s: ${withTimePgCount.toString().padStart(4)} | PG = 0s: ${zeroTimePgCount.toString().padStart(4)} | PG = NULL: ${unfinalizedPgCount.toString().padStart(4)}`
      );
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
