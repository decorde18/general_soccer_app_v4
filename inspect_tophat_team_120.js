const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING TEAM 120 & TOPHAT TOURNAMENT ===");

  // 1. Find team season 120 or team 120
  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: 120 },
    include: { teams: true, seasons: true }
  });

  console.log("\n--- TEAM SEASON 120 ---");
  console.log(teamSeason);

  // 2. Find all games involving team_season_id 120 (or home/away)
  const games = await prisma.games.findMany({
    where: {
      OR: [
        { home_team_season_id: 120 },
        { away_team_season_id: 120 }
      ]
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: { include: { teams: true } },
      team_seasons_games_away_team_season_idToteam_seasons: { include: { teams: true } },
      game_events_major: { where: { event_type: "goal" }, include: { game_events_goals: true } },
      seasons: true
    }
  });

  console.log(`\n--- GAMES FOUND FOR TEAM SEASON 120 (${games.length} games) ---`);
  games.forEach(g => {
    const homeName = g.team_seasons_games_home_team_season_idToteam_seasons?.teams?.name || `TS #${g.home_team_season_id}`;
    const awayName = g.team_seasons_games_away_team_season_idToteam_seasons?.teams?.name || `TS #${g.away_team_season_id}`;
    
    // Count goals
    let homeGoals = 0;
    let awayGoals = 0;
    g.game_events_major.forEach(m => {
      m.game_events_goals.forEach(goal => {
        if (goal.team_season_id === g.home_team_season_id) homeGoals++;
        if (goal.team_season_id === g.away_team_season_id) awayGoals++;
      });
    });

    console.log(`[Game ID ${g.id}] Season: ${g.seasons?.name || g.season_id} | ${homeName} (${g.home_team_season_id}) [${homeGoals}] vs ${awayName} (${g.away_team_season_id}) [${awayGoals}] | Status: ${g.game_status}`);
  });

  // 3. Find any game standings inclusions for team 120
  const standingsInclusions = await prisma.game_standings_inclusions.findMany({
    where: {
      OR: [
        { home_team_season_id: 120 },
        { away_team_season_id: 120 }
      ]
    }
  });

  console.log(`\n--- STANDINGS INCLUSIONS (${standingsInclusions.length}) ---`);
  console.log(standingsInclusions);
}

main().catch(console.error).finally(() => prisma.$disconnect());
