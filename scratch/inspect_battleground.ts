import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== GAME LEAGUE NODES ALL COLUMNS ===');
  const rawGLN: any[] = await prisma.$queryRaw`
    SELECT * FROM game_league_nodes WHERE game_id >= 898 AND game_id <= 905
  `;
  console.log(rawGLN);

  console.log('\n=== GAME STANDINGS INCLUSIONS ALL COLUMNS ===');
  const rawGSI: any[] = await prisma.$queryRaw`
    SELECT * FROM game_standings_inclusions WHERE game_id >= 898 AND game_id <= 905
  `;
  console.log(rawGSI);

  console.log('\n=== LEAGUE NODES FOR LEAGUE 3 ===');
  const rawNodes: any[] = await prisma.$queryRaw`
    SELECT * FROM league_nodes WHERE league_id = 3
  `;
  console.log(rawNodes);

  console.log('\n=== LEAGUE NODE SEASONS FOR LEAGUE 3 ===');
  const rawNodeSeasons: any[] = await prisma.$queryRaw`
    SELECT lns.*, ln.name as node_name, ln.parent_id
    FROM league_node_seasons lns
    JOIN league_nodes ln ON lns.league_node_id = ln.id
    WHERE ln.league_id = 3
  `;
  console.log(rawNodeSeasons);

  console.log('\n=== TEAM LEAGUE ENROLLMENTS FOR NODE SEASON 27 ===');
  const rawEnrollments: any[] = await prisma.$queryRaw`
    SELECT tle.*, t.team_name as team_name, t.club_id
    FROM team_league_enrollments tle
    LEFT JOIN team_seasons ts ON tle.team_season_id = ts.id
    LEFT JOIN teams t ON ts.team_id = t.id
    WHERE tle.league_node_season_id = 27
  `;
  console.log(rawEnrollments);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
