const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  const games = await prisma.games.findMany({
    where: { id: { gte: 921 } },
    select: {
      id: true,
      start_date: true,
      start_time: true,
      notes: true,
    }
  });

  for (const g of games) {
    console.log(`Game ${g.id}: start_date=${g.start_date?.toISOString?.()} | start_time=${g.start_time?.toISOString?.()}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
