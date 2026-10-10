const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  const tsId = 3473;
  const teamId = 1735;

  const homeGames = await prisma.games.findMany({ where: { home_team_season_id: tsId } });
  const awayGames = await prisma.games.findMany({ where: { away_team_season_id: tsId } });
  const enrollments = await prisma.team_league_enrollments.findMany({ where: { team_season_id: tsId } });
  const playerTeams = await prisma.player_teams.findMany({ where: { team_season_id: tsId } });
  const teamStaff = await prisma.team_staff.findMany({ where: { team_season_id: tsId } });

  console.log(`TS 3473 references:`);
  console.log(`  Home games: ${homeGames.map(g => g.id)}`);
  console.log(`  Away games: ${awayGames.map(g => g.id)}`);
  console.log(`  Enrollments: ${enrollments.map(e => e.id)}`);
  console.log(`  Player teams: ${playerTeams.length}`);
  console.log(`  Team staff: ${teamStaff.length}`);

  const allTsForTeam = await prisma.team_seasons.findMany({ where: { team_id: teamId } });
  console.log(`Team 1735 team_seasons: ${allTsForTeam.map(t => t.id)}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
