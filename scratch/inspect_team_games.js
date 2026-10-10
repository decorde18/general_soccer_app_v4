const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  const recentGames = await prisma.games.findMany({
    orderBy: { id: "desc" },
    take: 20,
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: true, seasons: true }
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: true, seasons: true }
      },
      game_league_nodes: {
        include: {
          league_node_seasons: {
            include: { league_nodes: true }
          }
        }
      }
    }
  });

  console.log(`Found ${recentGames.length} recent games:`);
  for (const g of recentGames) {
    const home = g.team_seasons_games_home_team_season_idToteam_seasons;
    const away = g.team_seasons_games_away_team_season_idToteam_seasons;
    console.log(`\nGame ID: ${g.id}, Date: ${g.start_time}, Status: ${g.status}, Type: ${g.game_type}`);
    console.log(`  Home: TS ID ${g.home_team_season_id} - ${home?.teams?.team_name} (Season: ${home?.seasons?.season_name}, S_ID: ${home?.season_id})`);
    console.log(`  Away: TS ID ${g.away_team_season_id} - ${away?.teams?.team_name} (Season: ${away?.seasons?.season_name}, S_ID: ${away?.season_id})`);
    console.log(`  Notes: ${g.notes}`);
    for (const gln of g.game_league_nodes) {
      console.log(`  LeagueNode: ${gln.league_node_seasons?.league_nodes?.node_name} (ID: ${gln.league_node_season_id})`);
    }
  }

  const tsList = await prisma.team_seasons.findMany({
    where: {
      teams: {
        team_name: {
          contains: "Williamson Girls Elite"
        }
      }
    },
    include: {
      teams: true,
      seasons: true
    }
  });

  console.log("\nMatching team_seasons for Williamson Girls Elite:");
  for (const ts of tsList) {
    console.log(`TS ID: ${ts.id}, Team ID: ${ts.team_id}, Team Name: ${ts.teams.team_name}, Season: ${ts.seasons.season_name} (Season ID: ${ts.season_id}), is_active: ${ts.is_active}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
