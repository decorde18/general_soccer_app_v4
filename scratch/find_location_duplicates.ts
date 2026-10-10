import prisma from '../src/lib/prisma';

async function findDuplicateAndFieldLocations() {
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
  const clubCountMap = new Map<number, number>();
  clubs.forEach(c => {
    if (c.location_id) {
      clubCountMap.set(c.location_id, (clubCountMap.get(c.location_id) || 0) + 1);
    }
  });

  console.log('=== ALL LOCATIONS CONTAINING FIELD NUMBERS OR SUB-LOCATION DESCRIPTORS ===\n');

  const fieldPattern = /#|\bfield\b|\bturf\b|\bdowns\b|\beast\b|\bwest\b|\bnorth\b|\bsouth\b/i;

  for (const loc of locations) {
    if (fieldPattern.test(loc.name)) {
      console.log(`[ID ${loc.id}] "${loc.name}" | Address: ${loc.addresses ? loc.addresses.address_line1 : 'None'} | Games: ${loc._count.games}, Clubs: ${clubCountMap.get(loc.id) || 0}`);
      for (const sub of loc.locations_sublocations) {
        console.log(`    Sublocation ID ${sub.id}: "${sub.name}" (${sub._count.games} games)`);
      }
      console.log('');
    }
  }

  // Address duplicates
  console.log('=== LOCATIONS SHARING THE SAME ADDRESS OR SIMILAR NAMES ===\n');
  const addressGroups = new Map<number, typeof locations>();
  locations.forEach(loc => {
    if (loc.address_id) {
      const arr = addressGroups.get(loc.address_id) || [];
      arr.push(loc);
      addressGroups.set(loc.address_id, arr);
    }
  });

  for (const [addrId, group] of addressGroups.entries()) {
    if (group.length > 1) {
      console.log(`Address ID ${addrId} (${group[0].addresses?.address_line1}, ${group[0].addresses?.city}):`);
      group.forEach(loc => console.log(`   - [ID ${loc.id}] "${loc.name}" (Games: ${loc._count.games}, Clubs: ${clubCountMap.get(loc.id) || 0})`));
      console.log('');
    }
  }

  await prisma.$disconnect();
}

findDuplicateAndFieldLocations().catch(console.error);
