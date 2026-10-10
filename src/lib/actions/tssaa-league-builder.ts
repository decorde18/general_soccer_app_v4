"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface TSSAASetupResult {
  governingBodyId: number;
  leagueId: number;
  createdNodeCount: number;
}

/**
 * Creates or updates the complete TSSAA (Tennessee Secondary School Athletic Association)
 * Governing Body, League, and Node Hierarchy:
 * Division (Division I / II) -> Gender (Girls / Boys) -> Class (Class AAA, AA, A) -> Region -> District -> Sub-District.
 */
export async function seedTSSAALeagueHierarchy(): Promise<TSSAASetupResult> {
  // 1. Create or find TSSAA Governing Body
  let governingBody = await prisma.governing_bodies.findFirst({
    where: {
      OR: [
        { name: { contains: "TSSAA" } },
        { abbreviation: "TSSAA" },
      ],
    },
  });

  if (!governingBody) {
    governingBody = await prisma.governing_bodies.create({
      data: {
        name: "Tennessee Secondary School Athletic Association",
        abbreviation: "TSSAA",
        website: "https://tssaa.org",
      },
    });
  }

  // 2. Create or find TSSAA High School Soccer League with High School Match Rules (40 min halves, no OT by default)
  let tssaaLeague = await prisma.leagues.findFirst({
    where: {
      governing_body_id: governingBody.id,
      name: { contains: "High School Soccer" },
    },
  });

  if (!tssaaLeague) {
    tssaaLeague = await prisma.leagues.create({
      data: {
        name: "TSSAA High School Soccer",
        abbreviation: "TSSAA",
        governing_body_id: governingBody.id,
        status: "active",
        is_active: true,
        description: "Official TSSAA High School Soccer Competition (Division I & Division II)",
        is_tournament: false,
        period_duration: 40, // 40 minute halves
        reg_periods: 2,
        ot_if_tied: false, // Default: NO overtime for regular season games
        ot_duration: 10,
        so_if_tied: true,
        match_rules: JSON.stringify({
          playersOnField: 11,
          periodCount: 2,
          periodDuration: 2400, // 40 mins in seconds
          hasOvertime: false,
          overtimePeriods: 2,
          overtimeDuration: 600,
          hasShootout: true,
          clockDirection: "up",
          reentryRule: "unlimited",
        }),
      },
    });
  }

  let nodeCounter = 0;

  // Helper to upsert a node
  async function upsertNode(
    name: string,
    nodeType: "division" | "gender" | "classification" | "region" | "district" | "custom" | "tournament",
    level: number,
    parentId: number | null,
    displayOrder: number = 0
  ) {
    const existing = await prisma.league_nodes.findFirst({
      where: {
        league_id: tssaaLeague!.id,
        name,
        parent_id: parentId,
      },
    });

    if (existing) return existing;

    nodeCounter++;
    return await prisma.league_nodes.create({
      data: {
        league_id: tssaaLeague!.id,
        parent_id: parentId,
        name,
        node_type: nodeType,
        level,
        display_order: displayOrder,
      },
    });
  }

  // Define Divisions
  const divisions = [
    {
      name: "Division I (Public)",
      classes: [
        {
          name: "Class AAA",
          regions: [
            {
              name: "Region 6",
              districts: [
                { name: "District 11-AAA", subDistricts: ["Sub-District A", "Sub-District B"] },
                { name: "District 12-AAA", subDistricts: [] },
              ],
            },
            {
              name: "Region 5",
              districts: [
                { name: "District 9-AAA", subDistricts: [] },
                { name: "District 10-AAA", subDistricts: [] },
              ],
            },
          ],
        },
        {
          name: "Class AA",
          regions: [
            {
              name: "Region 6",
              districts: [{ name: "District 11-AA", subDistricts: [] }],
            },
          ],
        },
        {
          name: "Class A",
          regions: [
            {
              name: "Region 6",
              districts: [{ name: "District 11-A", subDistricts: [] }],
            },
          ],
        },
      ],
    },
    {
      name: "Division II (Private)",
      classes: [
        {
          name: "Class AA",
          regions: [
            {
              name: "Middle Region",
              districts: [{ name: "District 1-D2AA", subDistricts: [] }],
            },
          ],
        },
        {
          name: "Class A",
          regions: [
            {
              name: "Middle Region",
              districts: [{ name: "District 1-D2A", subDistricts: [] }],
            },
          ],
        },
      ],
    },
  ];

  const genders = [
    { name: "Girls Soccer (Fall)", type: "gender" as const },
    { name: "Boys Soccer (Spring)", type: "gender" as const },
  ];

  // Build the Node Tree: Division -> Gender -> Class -> Region -> District -> Sub-District & Postseason
  for (let dIdx = 0; dIdx < divisions.length; dIdx++) {
    const divConfig = divisions[dIdx];
    const divNode = await upsertNode(divConfig.name, "division", 0, null, dIdx);

    for (let gIdx = 0; gIdx < genders.length; gIdx++) {
      const gConfig = genders[gIdx];
      const genderNode = await upsertNode(gConfig.name, "gender", 1, divNode.id, gIdx);

      for (let cIdx = 0; cIdx < divConfig.classes.length; cIdx++) {
        const classConfig = divConfig.classes[cIdx];
        const classNode = await upsertNode(classConfig.name, "classification", 2, genderNode.id, cIdx);

        // Add Postseason State Championship Node under Class
        await upsertNode(`${classConfig.name} State Tournament`, "tournament", 3, classNode.id, 99);

        for (let rIdx = 0; rIdx < classConfig.regions.length; rIdx++) {
          const regConfig = classConfig.regions[rIdx];
          const regionNode = await upsertNode(regConfig.name, "region", 3, classNode.id, rIdx);

          for (let distIdx = 0; distIdx < regConfig.districts.length; distIdx++) {
            const distConfig = regConfig.districts[distIdx];
            const distNode = await upsertNode(distConfig.name, "district", 4, regionNode.id, distIdx);

            for (let subIdx = 0; subIdx < distConfig.subDistricts.length; subIdx++) {
              const subName = distConfig.subDistricts[subIdx];
              await upsertNode(subName, "custom", 5, distNode.id, subIdx);
            }
          }
        }
      }
    }
  }

  try {
    revalidatePath("/admin/leagues");
    revalidatePath("/leagues");
  } catch (e) {
    // Ignore revalidatePath errors when running as standalone CLI script
  }

  return {
    governingBodyId: governingBody.id,
    leagueId: tssaaLeague.id,
    createdNodeCount: nodeCounter,
  };
}
