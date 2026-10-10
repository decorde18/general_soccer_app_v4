import prisma from '../src/lib/prisma';

async function verifyForeignKeys() {
  const gamesCount = await prisma.games.count({ where: { location_id: { not: null } } });
  const gamesSubCount = await prisma.games.count({ where: { sublocation_id: { not: null } } });
  const clubsCount = await prisma.clubs.count({ where: { location_id: { not: null } } });
  const eventsCount = await prisma.events.count({ where: { location_id: { not: null } } });

  console.log(`=== FOREIGN KEY SUMMARY ===`);
  console.log(`Games with location_id: ${gamesCount}`);
  console.log(`Games with sublocation_id: ${gamesSubCount}`);
  console.log(`Clubs with location_id: ${clubsCount}`);
  console.log(`Events with location_id: ${eventsCount}`);

  await prisma.$disconnect();
}

verifyForeignKeys().catch(console.error);
