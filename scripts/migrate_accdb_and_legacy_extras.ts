import { ensureLegacyExtrasMigrated } from "../src/lib/db/ensureLegacyExtrasMigrated";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Running legacy extras schema creation and data migration...");
  await ensureLegacyExtrasMigrated();

  const kits = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`uniform_kits\``
  );
  const jerseys = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`uniform_jerseys\``
  );
  const seasonKits = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`uniform_season_kits\``
  );
  const assignments = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`uniform_player_assignments\``
  );
  const leads = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`schedule_leads\``
  );
  const letters = await prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(
    `SELECT COUNT(*) AS cnt FROM \`player_season_letters\``
  );

  console.log(`Migration summary:
  - uniform_kits: ${Number(kits[0]?.cnt || 0)}
  - uniform_jerseys: ${Number(jerseys[0]?.cnt || 0)}
  - uniform_season_kits: ${Number(seasonKits[0]?.cnt || 0)}
  - uniform_player_assignments: ${Number(assignments[0]?.cnt || 0)}
  - schedule_leads: ${Number(leads[0]?.cnt || 0)}
  - player_season_letters: ${Number(letters[0]?.cnt || 0)}
  `);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
