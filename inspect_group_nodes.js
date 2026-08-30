const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING GROUP NODES FOR NAVY DIVISION ===");

  // 1. Navy Division node 36 & its children 37 (Group A), 38 (Group B)
  const navyNode = await prisma.league_nodes.findUnique({
    where: { id: 36 },
    include: {
      other_league_nodes: true, // child nodes
      league_node_seasons: true
    }
  });

  console.log("\n--- NAVY DIVISION NODE ---");
  console.log("Navy Division Node:", { id: navyNode.id, name: navyNode.name });
  console.log("Child Nodes (Groups):", navyNode.other_league_nodes.map(c => ({ id: c.id, name: c.name, parent_id: c.parent_id })));

  // 2. Inspect node seasons for 36, 37, 38
  const nodeSeasons = await prisma.league_node_seasons.findMany({
    where: { league_node_id: { in: [36, 37, 38] } },
    include: { league_nodes: true }
  });

  console.log("\n--- LEAGUE NODE SEASONS ---");
  nodeSeasons.forEach(ns => {
    console.log(`Node Season ID ${ns.id} -> Node ID ${ns.league_node_id} (${ns.league_nodes?.name})`);
  });

  // 3. Inspect game_league_nodes and game_standings_inclusions for 36, 37, 38
  const glns = await prisma.game_league_nodes.findMany({
    where: { game_id: { in: [881, 882, 886, 897] } }
  });

  console.log("\n--- GAME LEAGUE NODES FOR TOPHAT GAMES ---");
  console.log(glns);

  const gsis = await prisma.game_standings_inclusions.findMany({
    where: { game_id: { in: [881, 882, 886, 897] } }
  });

  console.log("\n--- GAME STANDINGS INCLUSIONS FOR TOPHAT GAMES ---");
  console.log(gsis);
}

main().catch(console.error).finally(() => prisma.$disconnect());
