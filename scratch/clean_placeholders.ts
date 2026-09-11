import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== CLEANING UP PLACEHOLDER ENROLLMENTS IN NODE SEASON 27 ===');

  const placeholderTeamSeasonIds = [141, 142, 143, 144, 134, 145];
  
  const updated = await prisma.team_league_enrollments.updateMany({
    where: {
      league_node_season_id: 27,
      team_season_id: { in: placeholderTeamSeasonIds }
    },
    data: { is_active: false }
  });

  console.log(`Deactivated ${updated.count} placeholder team enrollments.`);

  const activeEnrollments = await prisma.team_league_enrollments.findMany({
    where: { league_node_season_id: 27, is_active: true },
    include: {
      team_seasons: {
        include: { teams: { include: { clubs: true } } }
      }
    }
  });

  console.log(`\n=== EXACT 5 TEAMS ENROLLED IN DIVISION "Female > U12 Girls Premier" (${activeEnrollments.length} teams) ===`);
  for (const e of activeEnrollments) {
    console.log(`- TS #${e.team_season_id}: "${e.team_seasons?.teams?.team_name}" (${e.team_seasons?.teams?.clubs?.name})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
