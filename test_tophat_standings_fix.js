const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== VERIFYING TOPHAT TOURNAMENT STANDINGS FOR TEAM 120 ===");

  const gameIds = [877, 881, 882, 886, 897];
  const games = await prisma.games.findMany({
    where: { id: { in: gameIds } },
    include: {
      game_events_major: { include: { game_events_goals: true } },
      game_league_nodes: true,
      game_standings_inclusions: true
    }
  });

  const nodeIds = [22, 36];

  nodeIds.forEach(targetLnId => {
    console.log(`\n--- STANDINGS FOR NODE ${targetLnId} ---`);

    const validGames = games.filter(g => {
      const isTaggedInNode = g.game_league_nodes?.some(n => n.league_node_id === targetLnId);
      const isInclusionTarget = g.game_standings_inclusions?.some(inc => inc.league_node_id === targetLnId && inc.counts_for_standings !== false);
      return isTaggedInNode || isInclusionTarget;
    });

    console.log(`Node ${targetLnId} has ${validGames.length} valid games:`, validGames.map(g => g.id));

    let wins = 0, losses = 0, draws = 0, gf = 0, ga = 0, gp = 0;

    validGames.forEach(g => {
      let homeGoals = 0, awayGoals = 0;
      g.game_events_major.forEach(m => {
        m.game_events_goals.forEach(goal => {
          if (goal.team_season_id === g.home_team_season_id) homeGoals++;
          if (goal.team_season_id === g.away_team_season_id) awayGoals++;
        });
      });

      const isHome = g.home_team_season_id === 120;
      const teamGoals = isHome ? homeGoals : awayGoals;
      const oppGoals = isHome ? awayGoals : homeGoals;

      gp++;
      gf += teamGoals;
      ga += oppGoals;
      if (teamGoals > oppGoals) wins++;
      else if (teamGoals < oppGoals) losses++;
      else draws++;
    });

    console.log(`Team 120 Record: GP: ${gp} | W: ${wins} | L: ${losses} | D: ${draws} | GF: ${gf} | GA: ${ga} | Pts: ${wins * 3 + draws}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
