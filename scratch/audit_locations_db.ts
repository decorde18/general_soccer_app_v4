import prisma from '../src/lib/prisma';

async function auditLocations() {
  const locations = await prisma.locations.findMany({
    include: {
      addresses: true,
      locations_sublocations: true,
      _count: {
        select: {
          games: true,
          events: true,
          locations_sublocations: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  const clubCountByLocation = new Map<number, number>();
  const clubs = await prisma.clubs.findMany({ select: { id: true, location_id: true } });
  clubs.forEach(c => {
    if (c.location_id) {
      clubCountByLocation.set(c.location_id, (clubCountByLocation.get(c.location_id) || 0) + 1);
    }
  });

  console.log(`Total locations in DB: ${locations.length}\n`);

  for (const loc of locations) {
    const clubCnt = clubCountByLocation.get(loc.id) || 0;
    console.log(`[ID ${loc.id}] "${loc.name}" (Abbr: ${loc.abbreviation || 'N/A'}) - Address ID: ${loc.address_id || 'None'}`);
    console.log(`  Linked counts: Games=${loc._count.games}, Events=${loc._count.events}, Clubs=${clubCnt}`);
    if (loc.locations_sublocations.length > 0) {
      console.log('  Sublocations:');
      for (const sub of loc.locations_sublocations) {
        console.log(`    - [Sub ID ${sub.id}] "${sub.name}" (Surface: ${sub.surface_type || 'N/A'})`);
      }
    } else {
      console.log('  Sublocations: NONE');
    }
    console.log('');
  }

  await prisma.$disconnect();
}

auditLocations().catch(console.error);
