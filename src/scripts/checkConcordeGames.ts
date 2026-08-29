import prisma from "../lib/prisma";

async function main() {
  console.log("=== Checking All Leagues, Nodes, Node Seasons, and Games ===");

  const allLeagues = await prisma.leagues.findMany({
    include: {
      league_nodes: {
        include: {
          league_node_seasons: {
            include: {
              game_league_nodes: true,
            },
          },
        },
      },
    },
  });

  console.log(
    "Leagues breakdown:",
    JSON.stringify(
      allLeagues.map((l) => ({
        league_id: l.id,
        league_name: l.name,
        nodes: l.league_nodes.map((ln) => ({
          node_id: ln.id,
          node_name: ln.name,
          node_seasons: ln.league_node_seasons.map((lns) => ({
            lns_id: lns.id,
            season_id: lns.season_id,
            game_count: lns.game_league_nodes.length,
          })),
        })),
      })),
      null,
      2
    )
  );

  // Check all games without game_league_nodes
  const unlinkedGames = await prisma.games.findMany({
    where: {
      game_league_nodes: { none: {} },
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: true },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: true },
      },
    },
  });

  console.log(`Unlinked games count: ${unlinkedGames.length}`);
  if (unlinkedGames.length > 0) {
    console.log(
      "Unlinked games:",
      JSON.stringify(
        unlinkedGames.map((g) => ({
          id: g.id,
          game_type: g.game_type,
          home: g.team_seasons_games_home_team_season_idToteam_seasons?.teams?.team_name,
          away: g.team_seasons_games_away_team_season_idToteam_seasons?.teams?.team_name,
        })),
        null,
        2
      )
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
