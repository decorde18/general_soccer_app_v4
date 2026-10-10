import { seedTSSAALeagueHierarchy } from "../src/lib/actions/tssaa-league-builder";

async function main() {
  console.log("Seeding TSSAA Governing Body & Node Tree Hierarchy...");
  const res = await seedTSSAALeagueHierarchy();
  console.log("TSSAA Seeding Complete!", res);
}

main().catch((err) => {
  console.error("Seeding Error:", err);
  process.exit(1);
});
