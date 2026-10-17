import prisma from '../src/lib/prisma';

async function main() {
  const clubs = await prisma.clubs.findMany({
    include: {
      teams: {
        include: {
          team_seasons: {
            include: {
              seasons: true,
              _count: {
                select: {
                  player_teams: true,
                  games_games_home_team_season_idToteam_seasons: true,
                  games_games_away_team_season_idToteam_seasons: true,
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(`Found ${clubs.length} clubs in database:`);
  for (const c of clubs) {
    if (c.teams.length > 0) {
      console.log(`\nClub [${c.id}] "${c.name}" (type: ${c.type}):`);
      for (const t of c.teams) {
        console.log(`  Team [${t.id}] "${t.team_name}" (gender: ${t.gender}):`);
        for (const ts of t.team_seasons) {
          const homeG = ts._count.games_games_home_team_season_idToteam_seasons;
          const awayG = ts._count.games_games_away_team_season_idToteam_seasons;
          console.log(`    TS [${ts.id}] Season: "${ts.seasons.season_name}" | Players: ${ts._count.player_teams} | Games: ${homeG + awayG}`);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
