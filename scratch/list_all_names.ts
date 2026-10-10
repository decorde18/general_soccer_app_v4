import prisma from '../src/lib/prisma';

async function listAllNames() {
  const locations = await prisma.locations.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, address_id: true }
  });

  console.log(`=== ALL ${locations.length} LOCATION NAMES IN DB ===`);
  locations.forEach(l => {
    console.log(`ID ${l.id}: "${l.name}"`);
  });

  await prisma.$disconnect();
}

listAllNames().catch(console.error);
