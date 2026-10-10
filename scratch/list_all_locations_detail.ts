import prisma from '../src/lib/prisma';

async function listAllLocations() {
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
  const clubsByLoc = new Map<number, string[]>();
  clubs.forEach(c => {
    if (c.location_id) {
      const arr = clubsByLoc.get(c.location_id) || [];
      arr.push(c.name);
      clubsByLoc.set(c.location_id, arr);
    }
  });

  console.log(`=== ALL ${locations.length} LOCATIONS IN DATABASE ===\n`);

  for (const loc of locations) {
    const linkedClubs = clubsByLoc.get(loc.id) || [];
    console.log(`ID ${loc.id}: "${loc.name}"`);
    console.log(`  Address: ${loc.addresses ? `${loc.addresses.address_line1}, ${loc.addresses.city}, ${loc.addresses.state}` : 'None'}`);
    console.log(`  Games: ${loc._count.games}, Events: ${loc._count.events}, Clubs: ${linkedClubs.length} (${linkedClubs.join(', ')})`);
    console.log('  Sublocations:');
    for (const sub of loc.locations_sublocations) {
      console.log(`    - Sub ID ${sub.id}: "${sub.name}" (Games: ${sub._count.games})`);
    }
    console.log('---');
  }

  await prisma.$disconnect();
}

listAllLocations().catch(console.error);
