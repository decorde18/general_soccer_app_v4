"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
<<<<<<< HEAD
import { ensureLegacyExtrasMigrated } from "@/lib/db/ensureLegacyExtrasMigrated";

export async function getUniformDataForTeamSeason(
  teamSeasonId: number,
  programTeamSeasonIds?: number[]
) {
  const safeTsId = Number(teamSeasonId) || 0;
  if (!safeTsId) {
    return { kits: [], seasonKits: [], assignments: [] };
  }

  await ensureLegacyExtrasMigrated();

  const ts = await prisma.team_seasons.findUnique({
    where: { id: safeTsId },
    include: {
      teams: true,
      seasons: true,
    },
  });

  if (!ts) {
    return { kits: [], seasonKits: [], assignments: [] };
  }

  const clubId = ts.teams.club_id;
  const targetTsIds =
    programTeamSeasonIds && programTeamSeasonIds.length > 0 ? programTeamSeasonIds : [safeTsId];

  const rawKits = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM \`uniform_kits\` WHERE club_id = ? ORDER BY is_active DESC, type ASC, id DESC`,
    clubId
  );

  const kitIds = rawKits.map((k) => Number(k.id));
  let rawJerseys: any[] = [];
  if (kitIds.length > 0) {
    const placeholders = kitIds.map(() => "?").join(",");
    rawJerseys = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM \`uniform_jerseys\` WHERE uniform_kit_id IN (${placeholders}) ORDER BY jersey_number ASC`,
      ...kitIds
    );
  }

  const jerseysByKit = new Map<number, any[]>();
  const kitById = new Map<number, any>();
  const jerseyById = new Map<number, any>();

  for (const k of rawKits) {
    const kid = Number(k.id);
    kitById.set(kid, {
      id: kid,
      club_id: Number(k.club_id),
      type: String(k.type || "Jersey"),
      brand: k.brand || null,
      style: k.style || null,
      color: k.color || null,
      year: k.year || null,
      is_active: Boolean(k.is_active),
    });
  }

  for (const j of rawJerseys) {
    const kid = Number(j.uniform_kit_id);
    const jObj = {
      id: Number(j.id),
      uniform_kit_id: kid,
      jersey_number: Number(j.jersey_number),
      size: j.size || null,
      is_lost: Boolean(j.is_lost),
      notes: j.notes || null,
      uniform_kits: kitById.get(kid) || null,
    };
    jerseyById.set(jObj.id, jObj);
    const list = jerseysByKit.get(kid) || [];
    list.push(jObj);
    jerseysByKit.set(kid, list);
  }

  const kits = rawKits.map((k) => {
    const kid = Number(k.id);
    return {
      ...kitById.get(kid),
      uniform_jerseys: jerseysByKit.get(kid) || [],
    };
  });

  const tsPlaceholders = targetTsIds.map(() => "?").join(",");
  const rawSeasonKits = await prisma.$queryRawUnsafe<any[]>(
    `SELECT usk.*
     FROM \`uniform_season_kits\` usk
     JOIN \`uniform_kits\` uk ON uk.id = usk.uniform_kit_id
     WHERE usk.team_season_id IN (${tsPlaceholders}) OR (usk.season_id = ? AND uk.club_id = ?)`,
    ...targetTsIds,
    ts.season_id,
    clubId
  );

  const seasonKits = rawSeasonKits.map((sk) => ({
    id: Number(sk.id),
    season_id: Number(sk.season_id),
    team_season_id: sk.team_season_id ? Number(sk.team_season_id) : null,
    squad_level: String(sk.squad_level || "Varsity"),
    uniform_kit_id: Number(sk.uniform_kit_id),
    uniform_kits: kitById.get(Number(sk.uniform_kit_id)) || null,
  }));

  const rosters = await prisma.player_teams.findMany({
    where: { team_season_id: { in: targetTsIds } },
    include: { people: true },
  });

  const ptLookup = new Map<number, (typeof rosters)[0]>();
  for (const pt of rosters) {
    ptLookup.set(pt.id, pt);
  }

  const playerTeamIds = rosters.map((pt) => pt.id);
  let rawAssignments: any[] = [];
  if (playerTeamIds.length > 0) {
    const ptPlaceholders = playerTeamIds.map(() => "?").join(",");
    rawAssignments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM \`uniform_player_assignments\` WHERE player_team_id IN (${ptPlaceholders}) ORDER BY id ASC`,
      ...playerTeamIds
    );
  }

  const assignments = rawAssignments.map((a) => {
    const pt = ptLookup.get(Number(a.player_team_id));
    const jersey = jerseyById.get(Number(a.uniform_jersey_id));
    return {
      id: Number(a.id),
      player_team_id: Number(a.player_team_id),
      uniform_jersey_id: Number(a.uniform_jersey_id),
      assignment_type: String(a.assignment_type || "primary"),
      returned: Boolean(a.returned),
      player_teams: pt
        ? {
            id: pt.id,
            person_id: pt.person_id,
            jersey_number: pt.jersey_number,
            people: {
              first_name: pt.people.first_name,
              last_name: pt.people.last_name,
            },
          }
        : null,
      uniform_jerseys: jersey || null,
    };
  });
=======

export async function getUniformDataForTeamSeason(teamSeasonId: number, programTeamSeasonIds?: number[]) {
  const ts = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    include: { teams: true },
  });
  if (!ts) return { kits: [], seasonKits: [], assignments: [] };

  const targetTsIds = programTeamSeasonIds && programTeamSeasonIds.length > 0 ? programTeamSeasonIds : [teamSeasonId];

  const [kits, seasonKits, assignments] = await Promise.all([
    prisma.uniform_kits.findMany({
      where: ts.teams.club_id ? { OR: [{ club_id: ts.teams.club_id }, { club_id: null }] } : {},
      include: {
        uniform_jerseys: {
          orderBy: { jersey_number: "asc" },
        },
      },
      orderBy: [{ is_active: "desc" }, { year: "desc" }, { id: "asc" }],
    }),
    prisma.uniform_season_kits.findMany({
      where: { season_id: ts.season_id },
      include: {
        uniform_kits: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.uniform_player_assignments.findMany({
      where: {
        player_teams: {
          team_season_id: { in: targetTsIds },
        },
      },
      include: {
        player_teams: {
          include: {
            people: true,
            team_seasons: { include: { teams: true } },
          },
        },
        uniform_jerseys: {
          include: {
            uniform_kits: true,
          },
        },
      },
      orderBy: { id: "asc" },
    }),
  ]);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56

  return { kits, seasonKits, assignments };
}

export async function upsertUniformKitAction(data: {
  id?: number;
<<<<<<< HEAD
  clubId: number;
=======
  clubId?: number | null;
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
  type: string;
  brand?: string | null;
  style?: string | null;
  color?: string | null;
<<<<<<< HEAD
  year?: number | string | null;
=======
  year?: number | null;
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
  isActive?: boolean;
  teamSeasonId?: number;
}) {
  try {
<<<<<<< HEAD
    const safeClubId = Number(data.clubId) || 0;
    if (!safeClubId || !data.type.trim()) {
      return { success: false, error: "Club and Kit Type are required." };
    }

    await ensureLegacyExtrasMigrated();

    const yearVal = data.year !== null && data.year !== undefined ? String(data.year) : null;

    if (data.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE \`uniform_kits\` SET \`type\` = ?, \`brand\` = ?, \`style\` = ?, \`color\` = ?, \`year\` = ?, \`is_active\` = ? WHERE \`id\` = ?`,
        data.type.trim(),
        data.brand?.trim() || null,
        data.style?.trim() || null,
        data.color?.trim() || null,
        yearVal,
        data.isActive ?? true ? 1 : 0,
        Number(data.id)
      );
      if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
      return {
        success: true,
        kit: {
          id: Number(data.id),
          club_id: safeClubId,
          type: data.type.trim(),
          brand: data.brand?.trim() || null,
          style: data.style?.trim() || null,
          color: data.color?.trim() || null,
          year: yearVal,
          is_active: data.isActive ?? true,
          uniform_jerseys: [],
        },
      };
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`uniform_kits\` (\`club_id\`, \`type\`, \`brand\`, \`style\`, \`color\`, \`year\`, \`is_active\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        safeClubId,
        data.type.trim(),
        data.brand?.trim() || null,
        data.style?.trim() || null,
        data.color?.trim() || null,
        yearVal,
        data.isActive ?? true ? 1 : 0
      );
      const inserted = await prisma.$queryRawUnsafe<{ id: number }[]>(`SELECT LAST_INSERT_ID() AS id`);
      const newId = Number(inserted[0]?.id || 0);
      if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
      return {
        success: true,
        kit: {
          id: newId,
          club_id: safeClubId,
          type: data.type.trim(),
          brand: data.brand?.trim() || null,
          style: data.style?.trim() || null,
          color: data.color?.trim() || null,
          year: yearVal,
          is_active: data.isActive ?? true,
          uniform_jerseys: [],
        },
      };
    }
  } catch (err: any) {
=======
    const payload = {
      club_id: data.clubId || null,
      type: data.type.trim(),
      brand: data.brand?.trim() || null,
      style: data.style?.trim() || null,
      color: data.color?.trim() || null,
      year: data.year || null,
      is_active: data.isActive ?? true,
    };

    const kit = data.id
      ? await prisma.uniform_kits.update({
          where: { id: data.id },
          data: payload,
          include: { uniform_jerseys: true },
        })
      : await prisma.uniform_kits.create({
          data: payload,
          include: { uniform_jerseys: true },
        });

    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, kit };
  } catch (err: any) {
    console.error("Error saving uniform kit:", err);
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
    return { success: false, error: err.message || "Failed to save uniform kit" };
  }
}

export async function addUniformJerseysBatchAction(data: {
  uniformKitId: number;
  numbers: number[];
  size: string;
  teamSeasonId?: number;
}) {
  try {
<<<<<<< HEAD
    const safeKitId = Number(data.uniformKitId) || 0;
    if (!safeKitId) return { success: false, error: "Uniform Kit is required." };

    await ensureLegacyExtrasMigrated();

    const createdJerseys: any[] = [];
    for (const num of data.numbers) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO \`uniform_jerseys\` (\`uniform_kit_id\`, \`jersey_number\`, \`size\`, \`is_lost\`) VALUES (?, ?, ?, 0)`,
        safeKitId,
        Number(num),
        data.size.trim() || "M"
      );
      const inserted = await prisma.$queryRawUnsafe<{ id: number }[]>(`SELECT LAST_INSERT_ID() AS id`);
      createdJerseys.push({
        id: Number(inserted[0]?.id || 0),
        uniform_kit_id: safeKitId,
        jersey_number: Number(num),
        size: data.size.trim() || "M",
        is_lost: false,
      });
    }

    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, jerseys: createdJerseys };
=======
    const created = [];
    for (const num of data.numbers) {
      const j = await prisma.uniform_jerseys.create({
        data: {
          uniform_kit_id: data.uniformKitId,
          jersey_number: num,
          size: data.size || "M",
          is_lost: false,
        },
      });
      created.push(j);
    }
    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, jerseys: created };
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add jerseys" };
  }
}

<<<<<<< HEAD
export async function toggleJerseyLostAction(
  jerseyId: number,
  isLost: boolean,
  teamSeasonId?: number
) {
  const safeId = Number(jerseyId) || 0;
  if (!safeId) return { success: false };

  await ensureLegacyExtrasMigrated();
  await prisma.$executeRawUnsafe(
    `UPDATE \`uniform_jerseys\` SET \`is_lost\` = ? WHERE \`id\` = ?`,
    isLost ? 1 : 0,
    safeId
  );

  if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
  return { success: true };
=======
export async function toggleJerseyLostAction(jerseyId: number, isLost: boolean, teamSeasonId?: number) {
  try {
    const updated = await prisma.uniform_jerseys.update({
      where: { id: jerseyId },
      data: { is_lost: isLost },
    });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true, jersey: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update jersey status" };
  }
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
}

export async function assignKitToSeasonSquadAction(data: {
  seasonId: number;
<<<<<<< HEAD
  teamSeasonId: number;
  squadLevel: string;
  uniformKitId: number;
}) {
  await ensureLegacyExtrasMigrated();
  await prisma.$executeRawUnsafe(
    `INSERT INTO \`uniform_season_kits\` (\`season_id\`, \`team_season_id\`, \`squad_level\`, \`uniform_kit_id\`) VALUES (?, ?, ?, ?)`,
    Number(data.seasonId),
    Number(data.teamSeasonId),
    data.squadLevel.trim() || "Varsity",
    Number(data.uniformKitId)
  );
  revalidatePath(`/teams/${data.teamSeasonId}`);
  return { success: true };
=======
  teamSeasonId?: number | null;
  squadLevel: string;
  uniformKitId: number;
}) {
  try {
    const record = await prisma.uniform_season_kits.create({
      data: {
        season_id: data.seasonId,
        team_season_id: data.teamSeasonId || null,
        squad_level: data.squadLevel,
        uniform_kit_id: data.uniformKitId,
      },
      include: { uniform_kits: true },
    });
    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, seasonKit: record };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign kit to season" };
  }
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
}

export async function assignJerseyToPlayerAction(data: {
  playerTeamId: number;
  uniformJerseyId: number;
<<<<<<< HEAD
  assignmentType: string;
  teamSeasonId?: number;
}) {
  try {
    const safePtId = Number(data.playerTeamId) || 0;
    const safeJerseyId = Number(data.uniformJerseyId) || 0;
    if (!safePtId || !safeJerseyId) {
      return { success: false, error: "Player and Jersey are required." };
    }

    await ensureLegacyExtrasMigrated();
    await prisma.$executeRawUnsafe(
      `INSERT INTO \`uniform_player_assignments\` (\`player_team_id\`, \`uniform_jersey_id\`, \`assignment_type\`, \`returned\`) VALUES (?, ?, ?, 0)`,
      safePtId,
      safeJerseyId,
      data.assignmentType.trim() || "primary"
    );
    const inserted = await prisma.$queryRawUnsafe<{ id: number }[]>(`SELECT LAST_INSERT_ID() AS id`);
    const newId = Number(inserted[0]?.id || 0);

    const pt = await prisma.player_teams.findUnique({
      where: { id: safePtId },
      include: { people: true },
    });

    const jRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT uj.*, uk.type AS kit_type, uk.brand AS kit_brand, uk.style AS kit_style, uk.color AS kit_color, uk.year AS kit_year
       FROM \`uniform_jerseys\` uj
       LEFT JOIN \`uniform_kits\` uk ON uk.id = uj.uniform_kit_id
       WHERE uj.id = ?`,
      safeJerseyId
    );
    const j = jRows[0];

    const assignment = {
      id: newId,
      player_team_id: safePtId,
      uniform_jersey_id: safeJerseyId,
      assignment_type: data.assignmentType.trim() || "primary",
      returned: false,
      player_teams: pt
        ? {
            id: pt.id,
            person_id: pt.person_id,
            jersey_number: pt.jersey_number,
            people: {
              first_name: pt.people.first_name,
              last_name: pt.people.last_name,
            },
          }
        : null,
      uniform_jerseys: j
        ? {
            id: Number(j.id),
            jersey_number: Number(j.jersey_number),
            size: j.size || null,
            uniform_kits: {
              type: j.kit_type,
              brand: j.kit_brand,
              style: j.kit_style,
              color: j.kit_color,
              year: j.kit_year,
            },
          }
        : null,
    };

    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, assignment };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign uniform" };
  }
}

export async function toggleUniformReturnedAction(
  assignmentId: number,
  returned: boolean,
  teamSeasonId?: number
) {
  const safeId = Number(assignmentId) || 0;
  if (!safeId) return { success: false };

  await ensureLegacyExtrasMigrated();
  await prisma.$executeRawUnsafe(
    `UPDATE \`uniform_player_assignments\` SET \`returned\` = ? WHERE \`id\` = ?`,
    returned ? 1 : 0,
    safeId
  );

  if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
  return { success: true };
}

export async function deleteUniformAssignmentAction(
  assignmentId: number,
  teamSeasonId?: number
) {
  const safeId = Number(assignmentId) || 0;
  if (!safeId) return { success: false };

  await ensureLegacyExtrasMigrated();
  await prisma.$executeRawUnsafe(
    `DELETE FROM \`uniform_player_assignments\` WHERE \`id\` = ?`,
    safeId
  );
  if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
  return { success: true };
=======
  assignmentType: string; // 'primary', 'secondary', 'match', 'gk'
  teamSeasonId?: number;
}) {
  try {
    const record = await prisma.uniform_player_assignments.create({
      data: {
        player_team_id: data.playerTeamId,
        uniform_jersey_id: data.uniformJerseyId,
        assignment_type: data.assignmentType || "primary",
        returned: false,
      },
      include: {
        player_teams: { include: { people: true } },
        uniform_jerseys: { include: { uniform_kits: true } },
      },
    });
    if (data.teamSeasonId) revalidatePath(`/teams/${data.teamSeasonId}`);
    return { success: true, assignment: record };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign jersey to player" };
  }
}

export async function toggleUniformReturnedAction(assignmentId: number, returned: boolean, teamSeasonId?: number) {
  try {
    const updated = await prisma.uniform_player_assignments.update({
      where: { id: assignmentId },
      data: { returned },
    });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true, assignment: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update return status" };
  }
}

export async function deleteUniformAssignmentAction(assignmentId: number, teamSeasonId?: number) {
  try {
    await prisma.uniform_player_assignments.delete({ where: { id: assignmentId } });
    if (teamSeasonId) revalidatePath(`/teams/${teamSeasonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete assignment" };
  }
>>>>>>> 78a62d1d15f79f390743a9c92d1ae7feec4a9e56
}
