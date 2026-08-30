const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== LEAGUE NODES & SEASONS ===");
  const nodes = await prisma.league_nodes.findMany();
  console.log("League Nodes:", nodes);

  const nodeSeasons = await prisma.league_node_seasons.findMany();
  console.log("League Node Seasons:", nodeSeasons);

  const glns = await prisma.game_league_nodes.findMany({
    where: { game_id: { in: [877, 881, 882, 886, 897] } }
  });
  console.log("Game League Nodes for Games 877, 881, 882, 886, 897:", glns);

  const gsis = await prisma.game_standings_inclusions.findMany({
    where: { game_id: { in: [877, 881, 882, 886, 897] } }
  });
  console.log("Game Standings Inclusions for Games 877, 881, 882, 886, 897:", gsis);
}

main().catch(console.error).finally(() => prisma.$disconnect());
