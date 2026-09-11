import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIXING BATTLEGROUND HIERARCHY AND ENROLLMENTS ===');

  // 1. Check League Node hierarchy
  // Node 40 = Female (level 0)
  // Node 41 = U12 Girls Premier (level 1, parent_id: 40)
  // Node 44 = U12F01 (currently level 2, parent_id: 43)
  // Move league_node_season 27 to point directly to Node 41 ("U12 Girls Premier"), or set Node 44's parent to 41.
  
  // Let's update league_node_season 27 to point to node 41 (U12 Girls Premier)
  const updatedLNS = await prisma.league_node_seasons.update({
    where: { id: 27 },
    data: {
      league_node_id: 41
    }
  });
  console.log('Updated league_node_seasons #27 to point to league_node_id 41 (U12 Girls Premier)');

  // Update game_standings_inclusions from node 44 to node 41
  const updatedGSI = await prisma.game_standings_inclusions.updateMany({
    where: { league_node_id: 44 },
    data: { league_node_id: 41 }
  });
  console.log(`Updated ${updatedGSI.count} game_standings_inclusions records to league_node_id 41`);

  // Clean up old unused nodes (42, 43, 44) if they have no other node seasons
  const node44Seasons = await prisma.league_node_seasons.count({ where: { league_node_id: 44 } });
  if (node44Seasons === 0) {
    await prisma.league_nodes.delete({ where: { id: 44 } }).catch(() => {});
    await prisma.league_nodes.delete({ where: { id: 43 } }).catch(() => {});
    await prisma.league_nodes.delete({ where: { id: 42 } }).catch(() => {});
    console.log('Cleaned up orphan nodes 42, 43, 44');
  }

  // 2. Ensure all 5 real team seasons are enrolled in NodeSeason 27
  const targetTeamSeasonIds = [122, 125, 136, 138, 140];

  for (const tsId of targetTeamSeasonIds) {
    const existing = await prisma.team_league_enrollments.findFirst({
      where: {
        league_node_season_id: 27,
        team_season_id: tsId
      }
    });

    if (!existing) {
      const newEnrollment = await prisma.team_league_enrollments.create({
        data: {
          league_node_season_id: 27,
          team_season_id: tsId,
          is_active: true
        }
      });
      console.log(`Created enrollment #${newEnrollment.id} for TeamSeason #${tsId} in NodeSeason #27`);
    } else if (!existing.is_active) {
      await prisma.team_league_enrollments.update({
        where: { id: existing.id },
        data: { is_active: true }
      });
      console.log(`Activated enrollment #${existing.id} for TeamSeason #${tsId} in NodeSeason #27`);
    } else {
      console.log(`TeamSeason #${tsId} already enrolled and active in NodeSeason #27`);
    }
  }

  // 3. Verify final state
  const enrollments = await prisma.team_league_enrollments.findMany({
    where: { league_node_season_id: 27, is_active: true },
    include: {
      team_seasons: {
        include: {
          teams: {
            include: { clubs: true }
          }
        }
      }
    }
  });

  console.log('\n=== FINAL ACTIVE ENROLLMENTS FOR NODE SEASON 27 ("U12 Girls Premier") ===');
  for (const e of enrollments) {
    console.log(`- Enrollment #${e.id}: TeamSeason #${e.team_season_id} - "${e.team_seasons?.teams?.team_name}" (${e.team_seasons?.teams?.clubs?.name})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
