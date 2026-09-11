import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFYING BATTLEGROUND LEAGUE STRUCTURE ===');

  const league = await prisma.leagues.findUnique({
    where: { id: 3 },
    include: {
      league_nodes: {
        include: {
          league_node_seasons: {
            include: {
              team_league_enrollments: {
                where: { is_active: true },
                include: {
                  team_seasons: {
                    include: { teams: { include: { clubs: true } } }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(`League: ${league?.name} (ID: ${league?.id})`);
  for (const node of league?.league_nodes || []) {
    console.log(`  Node ID: ${node.id}, Name: ${node.name}, Level: ${node.level}, ParentID: ${node.parent_id}`);
    for (const lns of node.league_node_seasons) {
      console.log(`    NodeSeason ID: ${lns.id}, SeasonID: ${lns.season_id}`);
      console.log(`    Enrolled teams (${lns.team_league_enrollments.length}):`);
      for (const tle of lns.team_league_enrollments) {
        console.log(`      - TS #${tle.team_season_id}: "${tle.team_seasons?.teams?.team_name}" [Club: ${tle.team_seasons?.teams?.clubs?.name}]`);
      }
    }
  }

  console.log('\n=== VERIFYING GAMES FOR NODE SEASON 27 ===');
  const games = await prisma.games.findMany({
    where: {
      game_league_nodes: {
        some: { league_node_season_id: 27 }
      }
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: { include: { teams: true } },
      team_seasons_games_away_team_season_idToteam_seasons: { include: { teams: true } }
    }
  });

  console.log(`Found ${games.length} games linked to NodeSeason #27:`);
  for (const g of games) {
    const home = g.team_seasons_games_home_team_season_idToteam_seasons?.teams?.team_name;
    const away = g.team_seasons_games_away_team_season_idToteam_seasons?.teams?.team_name;
    const dateStr = g.start_date ? g.start_date.toISOString().split('T')[0] : 'N/A';
    const timeStr = g.start_time ? g.start_time.toISOString().split('T')[1].substring(0, 5) : 'N/A';
    console.log(`  Game #${g.id}: ${dateStr} ${timeStr} | ${home} vs ${away} (Type: ${g.game_type})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
