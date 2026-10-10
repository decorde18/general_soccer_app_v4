const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  const teamNames = [
    "U11G Yellow",
    "SCOR U11 Girls",
    "U12G Pre N1",
    "CESA WNC U12G",
    "WHSC U11 Girls"
  ];

  for (const name of teamNames) {
    const existing = await prisma.teams.findMany({
      where: {
        team_name: { contains: name }
      },
      include: { clubs: true, team_seasons: true }
    });
    console.log(`\nMatches for "${name}":`);
    for (const t of existing) {
      console.log(`  Team ID ${t.id}, Club: ${t.clubs?.name} (ID: ${t.club_id}), Name: ${t.team_name}, Gender: ${t.gender}, TS: ${t.team_seasons.map(ts => ts.id)}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
