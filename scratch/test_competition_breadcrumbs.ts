import prisma from '../src/lib/prisma';

async function testBreadcrumbs() {
  const allNodes = await prisma.league_nodes.findMany({
    include: {
      leagues: true,
      other_league_nodes: true, // children
      league_nodes: true        // parent
    }
  });

  // Filter terminal leaf nodes (no children)
  const leafNodes = allNodes.filter(n => n.other_league_nodes.length === 0);

  const nodeMap = new Map<number, typeof allNodes[0]>();
  allNodes.forEach(n => nodeMap.set(n.id, n));

  function buildBreadcrumbs(nodeId: number): string {
    const parts: string[] = [];
    let curr = nodeMap.get(nodeId);
    while (curr) {
      parts.unshift(curr.name);
      if (curr.parent_node_id) {
        curr = nodeMap.get(curr.parent_node_id);
      } else {
        if (curr.leagues) {
          parts.unshift(curr.leagues.name);
        }
        break;
      }
    }
    // Remove duplicate consecutive segments if node name equals league name
    const uniqueParts: string[] = [];
    for (const p of parts) {
      if (uniqueParts.length === 0 || uniqueParts[uniqueParts.length - 1] !== p) {
        uniqueParts.push(p);
      }
    }
    return uniqueParts.join(' > ');
  }

  console.log(`Total terminal leaf nodes: ${leafNodes.length}`);
  console.log('Sample Breadcrumbs (first 10):');
  leafNodes.slice(0, 10).forEach(n => {
    console.log(`Node ID ${n.id}: "${buildBreadcrumbs(n.id)}"`);
  });

  await prisma.$disconnect();
}

testBreadcrumbs().catch(console.error);
