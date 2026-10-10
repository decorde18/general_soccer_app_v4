const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  // Find all games created today / recent import
  const games = await prisma.games.findMany({
    where: {
      id: { gte: 921 }
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } }, seasons: true }
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } }, seasons: true }
      },
    }
  });

  console.log(`Found ${games.length} games (ID >= 921):`);
  for (const g of games) {
    const h = g.team_seasons_games_home_team_season_idToteam_seasons;
    const a = g.team_seasons_games_away_team_season_idToteam_seasons;
    console.log(`Game ${g.id}: ${h?.teams?.clubs?.name} - ${h?.teams?.team_name} (TS: ${g.home_team_season_id}, TeamID: ${h?.team_id}) vs ${a?.teams?.clubs?.name} - ${a?.teams?.team_name} (TS: ${g.away_team_season_id}, TeamID: ${a?.team_id})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
