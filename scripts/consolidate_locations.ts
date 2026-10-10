import prisma from '../src/lib/prisma';

export async function consolidateLocations() {
  console.log('=== STARTING LOCATION CONSOLIDATION & SUBLOCATION CLEANUP ===\n');

  // Helper to ensure sublocation exists under master location
  async function getOrCreateSublocation(masterLocId: number, name: string, surfaceType?: string) {
    let sub = await prisma.locations_sublocations.findFirst({
      where: {
        location_id: masterLocId,
        name: { equals: name }
      }
    });

    if (!sub) {
      sub = await prisma.locations_sublocations.create({
        data: {
          location_id: masterLocId,
          name: name,
          surface_type: surfaceType || 'Grass',
          is_active: true
        }
      });
    }
    return sub;
  }

  // Helper to merge source location into master location
  async function mergeLocations(
    sourceLocIds: number[],
    masterLocId: number,
    masterName: string,
    sublocationDefaultNameMap?: Record<number, string>
  ) {
    console.log(`Merging [${sourceLocIds.join(', ')}] into Master Location [ID ${masterLocId}] "${masterName}"...`);

    // 1. Update master location name
    await prisma.locations.update({
      where: { id: masterLocId },
      data: { name: masterName }
    });

    for (const srcId of sourceLocIds) {
      if (srcId === masterLocId) continue;

      const srcLoc = await prisma.locations.findUnique({
        where: { id: srcId },
        include: { locations_sublocations: true, addresses: true }
      });

      if (!srcLoc) continue;

      // Copy address to master location if master has no address
      if (srcLoc.address_id) {
        const masterLoc = await prisma.locations.findUnique({ where: { id: masterLocId } });
        if (masterLoc && !masterLoc.address_id) {
          await prisma.locations.update({
            where: { id: masterLocId },
            data: { address_id: srcLoc.address_id }
          });
        }
      }

      // Re-point clubs
      const updatedClubs = await prisma.clubs.updateMany({
        where: { location_id: srcId },
        data: { location_id: masterLocId }
      });
      console.log(`  - Re-pointed ${updatedClubs.count} clubs from location ${srcId} to ${masterLocId}`);

      // Process sublocations of srcLoc
      for (const srcSub of srcLoc.locations_sublocations) {
        let targetSubName = srcSub.name;

        // If the source location itself had a field descriptor (e.g. "WCSC Downs East #18")
        if (sublocationDefaultNameMap && sublocationDefaultNameMap[srcId]) {
          targetSubName = sublocationDefaultNameMap[srcId];
        } else if (targetSubName === 'Main Field' && srcLoc.name.match(/#|\bfield\b|\beast\b|\bwest\b|\bturf\b/i)) {
          // Extract specific field name from location name if sublocation is generic
          targetSubName = srcLoc.name;
        }

        const masterSub = await getOrCreateSublocation(masterLocId, targetSubName, srcSub.surface_type || undefined);

        // Re-point games linked to srcSub
        const updatedGamesSub = await prisma.games.updateMany({
          where: { sublocation_id: srcSub.id },
          data: { location_id: masterLocId, sublocation_id: masterSub.id }
        });
        console.log(`    * Re-pointed ${updatedGamesSub.count} games from sublocation ${srcSub.id} to ${masterSub.id}`);
      }

      // Re-point games linked directly to srcLoc (without sublocation or with remaining sublocations)
      const directGames = await prisma.games.findMany({
        where: { location_id: srcId }
      });

      for (const g of directGames) {
        let subName = 'Main Field';
        if (sublocationDefaultNameMap && sublocationDefaultNameMap[srcId]) {
          subName = sublocationDefaultNameMap[srcId];
        } else if (srcLoc.name.match(/#|\bfield\b|\beast\b|\bwest\b|\bturf\b/i)) {
          subName = srcLoc.name;
        }
        const masterSub = await getOrCreateSublocation(masterLocId, subName);

        await prisma.games.update({
          where: { id: g.id },
          data: {
            location_id: masterLocId,
            sublocation_id: g.sublocation_id ? g.sublocation_id : masterSub.id
          }
        });
      }

      // Delete sublocations of srcLoc
      await prisma.locations_sublocations.deleteMany({
        where: { location_id: srcId }
      });

      // Delete srcLoc
      await prisma.locations.delete({
        where: { id: srcId }
      });
      console.log(`  - Deleted redundant location [ID ${srcId}] "${srcLoc.name}"`);
    }
  }

  // --- Cluster 1: WCSC (Downs Blvd) / WCSC Downs / WCSC Downs East #7, #18, #19 ---
  await mergeLocations(
    [47, 44, 45, 46],
    30,
    'Williamson County Soccer Complex (WCSC Downs)',
    {
      44: 'Downs East #18',
      45: 'Downs East #7',
      46: 'Downs East #19',
      47: 'Downs East Main'
    }
  );

  // --- Cluster 2: Bethesda Park / Bethesda #3 / Bethesda #4 ---
  await mergeLocations(
    [43],
    42,
    'Bethesda Recreation Park',
    {
      42: 'Field #4',
      43: 'Field #3'
    }
  );

  // --- Cluster 3: Kate Campbell Park / Kate Campbell Park #1 ---
  await mergeLocations(
    [61],
    56,
    'Kate Campbell Park',
    {
      61: 'Field #1'
    }
  );

  // --- Cluster 4: Major Bob Leonard Park / MBLP (Watt Rd) ---
  await mergeLocations(
    [16],
    14,
    'Major Bob Leonard Park',
    {
      16: 'Field #3'
    }
  );

  // --- Cluster 5: Richard Siegel Soccer Complex / Siegel Soccer Complex ---
  await mergeLocations(
    [52],
    24,
    'Richard Siegel Soccer Complex'
  );

  // --- Cluster 6: Ridley Sports Complex / Ridley Park ---
  await mergeLocations(
    [64],
    25,
    'Ridley Sports Complex'
  );

  // --- Cluster 7: Pope John Paul II Preparatory School ---
  await mergeLocations(
    [322],
    22,
    'Pope Saint John Paul II Preparatory School'
  );

  // --- Cluster 8: Merrimack Soccer Complex ---
  await prisma.locations.update({
    where: { id: 17 },
    data: { name: 'Merrimack Soccer Complex' }
  });

  console.log('\n=== LOCATION CONSOLIDATION COMPLETE ===');
  await prisma.$disconnect();
}

consolidateLocations().catch(console.error);
