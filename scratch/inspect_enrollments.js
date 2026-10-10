const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  const enrollments = await prisma.team_league_enrollments.findMany({
    where: {
      team_season_id: { in: [121, 3473] }
    },
    include: {
      league_node_seasons: {
        include: {
          league_nodes: true
        }
      }
    }
  });

  console.log("Enrollments for 121 and 3473:", JSON.stringify(enrollments, null, 2));

  const standingsInclusions = await prisma.game_standings_inclusions.findMany({
    where: {
      games: {
        id: { gte: 921 }
      }
    },
    include: {
      games: true,
      league_node_seasons: {
        include: { league_nodes: true }
      }
    }
  });

  console.log(`Standings inclusions for recent games: ${standingsInclusions.length}`);
  for (const si of standingsInclusions) {
    console.log(`Game ${si.game_id} in League Node Season ${si.league_node_season_id} (${si.league_node_seasons?.league_nodes?.node_name})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
