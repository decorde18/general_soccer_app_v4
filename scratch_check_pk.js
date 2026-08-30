const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING PK & SHOTS FOR MALIA IN GAME 886 ===");

  // Find Malia's player_game_id in game 886
  const maliaPg = await prisma.player_games.findFirst({
    where: {
      game_id: 886,
      people: { first_name: "Malia" }
    },
    include: { people: true }
  });

  console.log("Malia player_game record:", maliaPg);

  // All penalty events for game 886
  const penalties = await prisma.game_events_penalties.findMany({
    where: { major_event_id: { in: (await prisma.game_events_major.findMany({ where: { game_id: 886 } })).map(m => m.id) } },
    include: {
      game_events_major: true,
      player_games_game_events_penalties_shooter_player_game_idToplayer_games: { include: { people: true } }
    }
  });

  console.log("\nPenalties in Game 886:", JSON.stringify(penalties, null, 2));

  // Shots in Period 1 around minute 17 (1059s)
  const shots17 = await prisma.game_events_player_actions.findMany({
    where: { game_id: 886, period: 1, game_time: 1059 },
    include: { player_games: { include: { people: true } } }
  });

  console.log("\nShots at 1059s (Minute 17):", JSON.stringify(shots17, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
