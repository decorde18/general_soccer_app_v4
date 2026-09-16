import { PrismaClient } from "./src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING ALL GAMES INVOLVING TSC WILLIAMSON TEAMS ===");

  // Find all team_seasons with "Williamson" or "Tennessee Soccer Club"
  const tscTeamSeasons = await prisma.team_seasons.findMany({
    where: {
      teams: {
        team_name: { contains: "Williamson" }
      }
    },
    include: {
      teams: { include: { clubs: true } },
      team_league_enrollments: {
        include: {
          league_node_seasons: {
            include: {
              league_nodes: { include: { leagues: true } }
            }
          }
        }
      }
    }
  });

  console.log(`Found ${tscTeamSeasons.length} Williamson team seasons:`);
  tscTeamSeasons.forEach(ts => {
    console.log(`\nTS ID ${ts.id} | Team ID ${ts.team_id} | Name: "${ts.teams?.clubs?.name} - ${ts.teams?.team_name}"`);
    ts.team_league_enrollments.forEach(e => {
      console.log(`  Enrolled in: League="${e.league_node_seasons?.league_nodes?.leagues?.name}", Division/Node="${e.league_node_seasons?.league_nodes?.name}" (Node Season ID ${e.league_node_season_id})`);
    });
  });

  // Check all games for these Williamson team seasons
  const tsIds = tscTeamSeasons.map(ts => ts.id);
  const games = await prisma.games.findMany({
    where: {
      OR: [
        { home_team_season_id: { in: tsIds } },
        { away_team_season_id: { in: tsIds } },
      ]
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } }
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } }
      },
      game_league_nodes: {
        include: {
          league_node_seasons: {
            include: {
              league_nodes: { include: { leagues: true } }
            }
          }
        }
      }
    },
    orderBy: { start_date: "asc" }
  });

  console.log(`\nFound ${games.length} games for Williamson teams:`);
  games.forEach(g => {
    const homeTS = g.team_seasons_games_home_team_season_idToteam_seasons;
    const awayTS = g.team_seasons_games_away_team_season_idToteam_seasons;
    const node = g.game_league_nodes[0]?.league_node_seasons?.league_nodes;
    console.log(`\nGame ID ${g.id} | Date: ${g.start_date.toISOString().split("T")[0]} | Competition: ${node?.leagues?.name} -> ${node?.name}`);
    console.log(`  HOME: [TS ${g.home_team_season_id}] ${homeTS?.teams?.clubs?.name} ${homeTS?.teams?.team_name}`);
    console.log(`  AWAY: [TS ${g.away_team_season_id}] ${awayTS?.teams?.clubs?.name} ${awayTS?.teams?.team_name}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
