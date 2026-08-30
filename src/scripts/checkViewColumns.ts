import prisma from "../lib/prisma";

async function main() {
  console.log("=== Checking View Column Names ===");

  const gameViewSample = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    "SELECT * FROM `v_games` LIMIT 1"
  );
  console.log("v_games columns:", Object.keys(gameViewSample[0] || {}));

  const playerGamesViewSample = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    "SELECT * FROM `v_player_games` LIMIT 1"
  );
  console.log("v_player_games columns:", Object.keys(playerGamesViewSample[0] || {}));

  const playersViewSample = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    "SELECT * FROM `v_players` LIMIT 1"
  );
  console.log("v_players columns:", Object.keys(playersViewSample[0] || {}));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
