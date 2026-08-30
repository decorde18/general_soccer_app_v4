const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING ALL GAMES FOR TEAM 120 ===");

  const gameIds = [877, 881, 882, 886, 897];

  const games = await prisma.games.findMany({
    where: { id: { in: gameIds } },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: { include: { teams: true } },
      team_seasons_games_away_team_season_idToteam_seasons: { include: { teams: true } },
      game_events_major: { include: { game_events_goals: true } },
      game_league_nodes: true,
      game_standings_inclusions: true,
      locations: true
    }
  });

  for (const g of games) {
    const homeName = g.team_seasons_games_home_team_season_idToteam_seasons?.teams?.name;
    const awayName = g.team_seasons_games_away_team_season_idToteam_seasons?.teams?.name;

    console.log(`\n========================================`);
    console.log(`Game ID: ${g.id}`);
    console.log(`Match: ${homeName} (TS #${g.home_team_season_id}) vs ${awayName} (TS #${g.away_team_season_id})`);
    console.log(`Date: ${g.game_date}`);
    console.log(`Status: ${g.game_status}`);
    console.log(`Location: ${g.locations?.name || g.location_id}`);

    // League Nodes / Tournament Link
    console.log("League Nodes:", g.game_league_nodes.map(n => ({ id: n.node_id })));
    console.log("Standings Inclusions:", g.game_standings_inclusions.map(s => ({ node_id: s.node_id, status: s.inclusion_status })));

    // Goals breakdown
    console.log("Major Goals Events:");
    g.game_events_major.forEach(m => {
      console.log(`  [Major ID ${m.id}] type=${m.event_type}, period=${m.period}, time=${m.game_time}s, details=${m.details}`);
      m.game_events_goals.forEach(goal => {
        console.log(`    -> Goal ID ${goal.id}: team_season_id=${goal.team_season_id}, scorer=${goal.scorer_player_game_id}, assist=${goal.assist_player_game_id}`);
      });
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
