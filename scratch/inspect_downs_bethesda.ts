import prisma from '../src/lib/prisma';

async function inspectDownsAndBethesda() {
  const wcsc = await prisma.locations.findUnique({
    where: { id: 30 },
    include: {
      locations_sublocations: {
        include: { _count: { select: { games: true } } }
      }
    }
  });

  console.log(`=== WCSC DOWNS (ID 30) SUBLOCATIONS ===`);
  if (wcsc) {
    for (const sub of wcsc.locations_sublocations) {
      console.log(`Sub ID ${sub.id}: "${sub.name}" (Games: ${sub._count.games})`);
    }
  }

  const bethesdaLocs = await prisma.locations.findMany({
    where: { name: { contains: 'Bethesda' } },
    include: {
      addresses: true,
      locations_sublocations: {
        include: { _count: { select: { games: true } } }
      },
      _count: { select: { games: true } }
    }
  });

  console.log(`\n=== ALL BETHESDA LOCATIONS IN DB (${bethesdaLocs.length}) ===`);
  for (const loc of bethesdaLocs) {
    console.log(`Location ID ${loc.id}: "${loc.name}" (Games: ${loc._count.games})`);
    if (loc.addresses) {
      console.log(`  Address: ${loc.addresses.address_line1}, ${loc.addresses.city}`);
    }
    for (const sub of loc.locations_sublocations) {
      console.log(`  Sub ID ${sub.id}: "${sub.name}" (Games: ${sub._count.games})`);
    }
  }

  await prisma.$disconnect();
}

inspectDownsAndBethesda().catch(console.error);
