import prisma from '../src/lib/prisma';

async function scanLocationClusters() {
  const locations = await prisma.locations.findMany({
    include: {
      addresses: true,
      locations_sublocations: {
        include: {
          _count: { select: { games: true } }
        }
      },
      _count: { select: { games: true, events: true } }
    },
    orderBy: { name: 'asc' }
  });

  const clubs = await prisma.clubs.findMany({ select: { id: true, name: true, location_id: true } });
  const clubsByLoc = new Map<number, number>();
  clubs.forEach(c => {
    if (c.location_id) {
      clubsByLoc.set(c.location_id, (clubsByLoc.get(c.location_id) || 0) + 1);
    }
  });

  console.log('=== SUSPECT LOCATIONS (SUB-LOCATION IN NAME OR DUPLICATES) ===\n');

  for (const loc of locations) {
    const isWcsc = loc.name.toLowerCase().includes('wcsc');
    const hasFieldNum = /#|\bfield\b|\bturf\b|\bdowns\b|\beast\b|\bwest\b|\bnorth\b|\bsouth\b|\bpark\b|\bcomplex\b/i.test(loc.name);
    const linkedGames = loc._count.games;
    const linkedClubs = clubsByLoc.get(loc.id) || 0;

    if (isWcsc || hasFieldNum || linkedGames > 0) {
      console.log(`ID ${loc.id}: "${loc.name}" (Games: ${linkedGames}, Clubs: ${linkedClubs})`);
      if (loc.addresses) {
        console.log(`   Address ID ${loc.addresses.id}: ${loc.addresses.address_line1}, ${loc.addresses.city}`);
      }
      for (const sub of loc.locations_sublocations) {
        console.log(`   Sub ID ${sub.id}: "${sub.name}" (Games: ${sub._count.games})`);
      }
      console.log('');
    }
  }

  await prisma.$disconnect();
}

scanLocationClusters().catch(console.error);
