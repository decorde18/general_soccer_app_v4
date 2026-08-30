const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== TEAM ENROLLMENTS FOR TOPHAT GROUPS ===");

  const enrollments = await prisma.league_node_season_teams.findMany({
    where: { league_node_season_id: { in: [22, 23, 24] } },
    include: {
      team_seasons: { include: { teams: true } },
      league_node_seasons: { include: { league_nodes: true } }
    }
  });

  console.log(`Found ${enrollments.length} enrollments:`);
  enrollments.forEach(e => {
    const nodeName = e.league_node_seasons?.league_nodes?.name || e.league_node_season_id;
    const teamName = e.team_seasons?.teams?.team_name || e.team_season_id;
    console.log(`[Node Season ${e.league_node_season_id} - ${nodeName}] TeamSeason #${e.team_season_id}: ${teamName}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
