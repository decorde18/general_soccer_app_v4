const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  const team61 = await prisma.teams.findUnique({
    where: { id: 61 },
    include: { clubs: true, team_seasons: true }
  });
  const team1735 = await prisma.teams.findUnique({
    where: { id: 1735 },
    include: { clubs: true, team_seasons: true }
  });

  console.log("Team 61:", JSON.stringify(team61, null, 2));
  console.log("Team 1735:", JSON.stringify(team1735, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
