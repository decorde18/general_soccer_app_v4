const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing Malia PK for Game 886...");

  // Update Major Event 454 to game_time 1059 (Minute 17)
  const updatedMajor = await prisma.game_events_major.update({
    where: { id: 454 },
    data: {
      game_time: 1059,
      details: "Penalty Kick (SAVED) - Malia Zaghouani",
    }
  });

  // Update Penalty Event 3 to shooter_player_game_id 1222 (Malia Zaghouani)
  const updatedPen = await prisma.game_events_penalties.update({
    where: { id: 3 },
    data: {
      shooter_player_game_id: 1222, // Malia Zaghouani
    }
  });

  // Update Kickoff / PK Stoppage (Major Event 455) time as well to 1065s
  await prisma.game_events_major.update({
    where: { id: 455 },
    data: {
      game_time: 1065,
    }
  });

  console.log("Updated Major Event 454:", updatedMajor);
  console.log("Updated Penalty record 3:", updatedPen);
}

main().catch(console.error).finally(() => prisma.$disconnect());
