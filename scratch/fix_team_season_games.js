const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Migrating TS 3473 to TS 121...");

  // 1. Update games
  const updatedHome = await prisma.games.updateMany({
    where: { home_team_season_id: 3473 },
    data: { home_team_season_id: 121 }
  });
  console.log(`Updated home games: ${updatedHome.count}`);

  const updatedAway = await prisma.games.updateMany({
    where: { away_team_season_id: 3473 },
    data: { away_team_season_id: 121 }
  });
  console.log(`Updated away games: ${updatedAway.count}`);

  // 2. Update or merge enrollment
  const existing121Enrollment = await prisma.team_league_enrollments.findFirst({
    where: {
      team_season_id: 121,
      league_node_season_id: 32 // U11/U12 Girls Yellow
    }
  });

  if (existing121Enrollment) {
    // If TS 121 already has enrollment in 32, delete 252
    await prisma.team_league_enrollments.delete({ where: { id: 252 } });
    console.log("Deleted duplicate enrollment 252 (121 already enrolled in node 32)");
  } else {
    // Update enrollment 252 to point to 121
    await prisma.team_league_enrollments.update({
      where: { id: 252 },
      data: { team_season_id: 121 }
    });
    console.log("Updated enrollment 252 to team_season_id: 121");
  }

  // 3. Delete duplicate team_season 3473
  await prisma.team_seasons.delete({
    where: { id: 3473 }
  });
  console.log("Deleted team_season 3473");

  // 4. Delete duplicate team 1735
  await prisma.teams.delete({
    where: { id: 1735 }
  });
  console.log("Deleted team 1735");

  // 5. Verify games on TS 121
  const games121 = await prisma.games.findMany({
    where: {
      OR: [
        { home_team_season_id: 121 },
        { away_team_season_id: 121 }
      ]
    },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: { include: { teams: true } },
      team_seasons_games_away_team_season_idToteam_seasons: { include: { teams: true } },
    }
  });

  console.log(`\nVerified: Total games for TS 121 now: ${games121.length}`);
  for (const g of games121) {
    const h = g.team_seasons_games_home_team_season_idToteam_seasons;
    const a = g.team_seasons_games_away_team_season_idToteam_seasons;
    console.log(`  Game ID ${g.id}: ${h?.teams?.team_name} vs ${a?.teams?.team_name} (Type: ${g.game_type})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
