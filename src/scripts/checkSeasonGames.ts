import prisma from "../lib/prisma";

async function main() {
  const activeSeasons = await prisma.seasons.findMany({ where: { status: "active" } });
  console.log("Active Seasons:", activeSeasons.map(s => ({ id: s.id, name: s.season_name, status: s.status })));

  for (const s of activeSeasons) {
    const games = await prisma.games.findMany({
      where: { season_id: s.id },
      select: { id: true, status: true, start_date: true }
    });
    
    const byStatus = games.reduce((acc: Record<string, number>, g) => {
      const status = g.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log(`\nSeason ID: ${s.id} (${s.season_name}) - Total games: ${games.length}`);
    console.log("Games by status:", byStatus);

    const completedGames = games.filter(g => g.status === "completed");
    console.log(`Completed games count: ${completedGames.length}`);

    // Check player_games for these completed games
    if (completedGames.length > 0) {
      const completedGameIds = completedGames.map(g => g.id);
      const pgRows = await prisma.player_games.findMany({
        where: { game_id: { in: completedGameIds } },
        select: {
          id: true,
          game_id: true,
          playing_time_seconds: true,
          plus_minus: true,
        }
      });

      const withNonZeroMins = pgRows.filter(p => (p.playing_time_seconds ?? 0) > 0);
      const withNonZeroPM = pgRows.filter(p => (p.plus_minus ?? 0) !== 0);

      console.log(`Total player_games in completed matches: ${pgRows.length}`);
      console.log(`player_games with playing_time_seconds > 0: ${withNonZeroMins.length}`);
      console.log(`player_games with plus_minus != 0: ${withNonZeroPM.length}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
