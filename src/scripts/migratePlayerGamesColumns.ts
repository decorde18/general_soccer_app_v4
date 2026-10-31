import prisma from "../lib/prisma";

async function main() {
  console.log("Checking columns on player_games...");
  try {
    const cols = await prisma.$queryRawUnsafe<any[]>(
      "SHOW COLUMNS FROM `player_games` LIKE 'playing_time_seconds'"
    );
    console.log("playing_time_seconds check:", cols);

    if (cols.length === 0) {
      console.log("Adding playing_time_seconds and plus_minus columns...");
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`player_games\` 
          ADD COLUMN \`playing_time_seconds\` INT NULL DEFAULT 0,
          ADD COLUMN \`plus_minus\` INT NULL DEFAULT 0;
      `);
      console.log("Successfully added columns to player_games table!");
    } else {
      console.log("Columns already exist in database.");
    }
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
