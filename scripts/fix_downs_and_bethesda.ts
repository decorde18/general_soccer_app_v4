import prisma from '../src/lib/prisma';

export async function fixDownsAndBethesda() {
  console.log('=== STARTING DOWNS & BETHESDA LOCATION & SUBLOCATION CLEANUP ===\n');

  // Helper to ensure sublocation exists under master location
  async function upsertSublocation(locationId: number, name: string, surfaceType: string = 'Grass') {
    let sub = await prisma.locations_sublocations.findFirst({
      where: { location_id: locationId, name: name }
    });
    if (!sub) {
      sub = await prisma.locations_sublocations.create({
        data: {
          location_id: locationId,
          name: name,
          surface_type: surfaceType,
          is_active: true
        }
      });
    }
    return sub;
  }

  // --- PART 1: Downs (Location ID 30) Sublocation Standardization ---
  console.log('--- Part 1: Standardizing Downs Sublocations under Location ID 30 ---');

  // Rules:
  // Fields 1 - 20 => Downs East #N
  // Fields 21 - 27 => Downs West #N

  // 1. Downs East #1
  const de1 = await upsertSublocation(30, 'Downs East #1');
  await prisma.games.updateMany({
    where: { sublocation_id: { in: [56, 48] } },
    data: { sublocation_id: de1.id }
  });
  console.log(`- Downs East #1 (ID ${de1.id}) ready.`);

  // 2. Downs East #7
  const de7 = await upsertSublocation(30, 'Downs East #7');
  await prisma.games.updateMany({
    where: { sublocation_id: { in: [80, 486] } },
    data: { sublocation_id: de7.id }
  });
  console.log(`- Downs East #7 (ID ${de7.id}) ready.`);

  // 3. Downs East #11
  const de11 = await upsertSublocation(30, 'Downs East #11');
  await prisma.games.updateMany({
    where: { sublocation_id: 50 },
    data: { sublocation_id: de11.id }
  });
  console.log(`- Downs East #11 (ID ${de11.id}) ready.`);

  // 4. Downs East #18
  const de18 = await upsertSublocation(30, 'Downs East #18');
  await prisma.games.updateMany({
    where: { sublocation_id: 485 },
    data: { sublocation_id: de18.id }
  });
  console.log(`- Downs East #18 (ID ${de18.id}) ready.`);

  // 5. Downs East #19
  const de19 = await upsertSublocation(30, 'Downs East #19');
  await prisma.games.updateMany({
    where: { sublocation_id: 487 },
    data: { sublocation_id: de19.id }
  });
  console.log(`- Downs East #19 (ID ${de19.id}) ready.`);

  // 6. Downs West #22
  const dw22 = await upsertSublocation(30, 'Downs West #22');
  await prisma.games.updateMany({
    where: { sublocation_id: 54 },
    data: { sublocation_id: dw22.id }
  });
  console.log(`- Downs West #22 (ID ${dw22.id}) ready.`);

  // 7. Downs West #24
  const dw24 = await upsertSublocation(30, 'Downs West #24');
  await prisma.games.updateMany({
    where: { sublocation_id: 49 },
    data: { sublocation_id: dw24.id }
  });
  console.log(`- Downs West #24 (ID ${dw24.id}) ready.`);

  // 8. Downs West #25
  const dw25 = await upsertSublocation(30, 'Downs West #25');
  await prisma.games.updateMany({
    where: { sublocation_id: 51 },
    data: { sublocation_id: dw25.id }
  });
  console.log(`- Downs West #25 (ID ${dw25.id}) ready.`);

  // 9. Downs West #26
  const dw26 = await upsertSublocation(30, 'Downs West #26');
  await prisma.games.updateMany({
    where: { sublocation_id: 53 },
    data: { sublocation_id: dw26.id }
  });
  console.log(`- Downs West #26 (ID ${dw26.id}) ready.`);

  // Clean up old redundant sublocation IDs under Location 30
  const keepSubIds = [de1.id, de7.id, de11.id, de18.id, de19.id, dw22.id, dw24.id, dw25.id, dw26.id, 484]; // 484 is Downs East Main
  const allSub30 = await prisma.locations_sublocations.findMany({ where: { location_id: 30 } });
  const toDeleteSub30 = allSub30.filter(s => !keepSubIds.includes(s.id)).map(s => s.id);
  if (toDeleteSub30.length > 0) {
    await prisma.locations_sublocations.deleteMany({ where: { id: { in: toDeleteSub30 } } });
    console.log(`- Deleted redundant sublocation IDs under WCSC Downs: [${toDeleteSub30.join(', ')}]`);
  }


  // --- PART 2: Bethesda Location & Sublocation Consolidation ---
  console.log('\n--- Part 2: Consolidating Bethesda Locations & Sublocations ---');

  // Master Location ID 36 (Bethesda Recreation Park)
  await prisma.locations.update({
    where: { id: 36 },
    data: { name: 'Bethesda Recreation Park' }
  });
  console.log('- Standardized Location ID 36 to "Bethesda Recreation Park"');

  // Ensure Field #3 and Field #4 sublocations under ID 36
  const bField3 = await upsertSublocation(36, 'Field #3');
  const bField4 = await upsertSublocation(36, 'Field #4');

  // Re-point games from old sublocations
  const bg3 = await prisma.games.updateMany({
    where: { sublocation_id: { in: [76, 488] } },
    data: { location_id: 36, sublocation_id: bField3.id }
  });
  console.log(`- Bethesda Field #3 (ID ${bField3.id}): Re-pointed ${bg3.count} games.`);

  const bg4 = await prisma.games.updateMany({
    where: { sublocation_id: { in: [60, 75, 70] } },
    data: { location_id: 36, sublocation_id: bField4.id }
  });
  console.log(`- Bethesda Field #4 (ID ${bField4.id}): Re-pointed ${bg4.count} games.`);

  // Clean up redundant sublocations under 36 and 42
  const allBethesdaSubs = await prisma.locations_sublocations.findMany({
    where: { OR: [{ location_id: 36 }, { location_id: 42 }] }
  });
  const deleteBethesdaSubs = allBethesdaSubs.filter(s => s.id !== bField3.id && s.id !== bField4.id).map(s => s.id);
  if (deleteBethesdaSubs.length > 0) {
    await prisma.locations_sublocations.deleteMany({ where: { id: { in: deleteBethesdaSubs } } });
    console.log(`- Deleted redundant Bethesda sublocation IDs: [${deleteBethesdaSubs.join(', ')}]`);
  }

  // Delete Location 42 if it exists
  const loc42 = await prisma.locations.findUnique({ where: { id: 42 } });
  if (loc42) {
    await prisma.clubs.updateMany({ where: { location_id: 42 }, data: { location_id: 36 } });
    await prisma.games.updateMany({ where: { location_id: 42 }, data: { location_id: 36 } });
    await prisma.locations.delete({ where: { id: 42 } });
    console.log('- Deleted redundant Location ID 42 ("Bethesda Recreation Park")');
  }

  console.log('\n=== CLEANUP COMPLETE ===');
  await prisma.$disconnect();
}

fixDownsAndBethesda().catch(console.error);
