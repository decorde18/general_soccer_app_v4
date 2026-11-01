import { ensureLegacyExtrasMigrated } from "../src/lib/db/ensureLegacyExtrasMigrated";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Running legacy extras schema creation and data migration...");
  await ensureLegacyExtrasMigrated();

  const [
    kits,
    jerseys,
    seasonKits,
    assignments,
    leads,
    letters,
    perfTests,
    perfLogs,
    customDefs,
    customVals,
  ] = await Promise.all([
    prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(`SELECT COUNT(*) AS cnt FROM \`uniform_kits\``),
    prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(`SELECT COUNT(*) AS cnt FROM \`uniform_jerseys\``),
    prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(`SELECT COUNT(*) AS cnt FROM \`uniform_season_kits\``),
    prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(`SELECT COUNT(*) AS cnt FROM \`uniform_player_assignments\``),
    prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(`SELECT COUNT(*) AS cnt FROM \`schedule_leads\``),
    prisma.$queryRawUnsafe<{ cnt: number | bigint }[]>(`SELECT COUNT(*) AS cnt FROM \`player_season_letters\``),
    prisma.performance_tests.count(),
    prisma.player_performance_logs.count(),
    prisma.custom_field_definitions.count(),
    prisma.custom_field_values.count(),
  ]);

  console.log(`Migration summary:
  - uniform_kits: ${Number(kits[0]?.cnt || 0)}
  - uniform_jerseys: ${Number(jerseys[0]?.cnt || 0)}
  - uniform_season_kits: ${Number(seasonKits[0]?.cnt || 0)}
  - uniform_player_assignments: ${Number(assignments[0]?.cnt || 0)}
  - schedule_leads: ${Number(leads[0]?.cnt || 0)}
  - player_season_letters: ${Number(letters[0]?.cnt || 0)}
  - performance_tests: ${perfTests}
  - player_performance_logs: ${perfLogs}
  - custom_field_definitions: ${customDefs}
  - custom_field_values: ${customVals}
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
