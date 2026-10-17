"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession, verifyTeamAccess } from "@/lib/auth/auth-utils";
import { fuzzyFilterPeople } from "@/lib/utils/fuzzySearch";
import { normalizeGender } from "@/lib/utils/gender";
import { z } from "zod";

const rosterPlayerSchema = z.object({
  teamSeasonId: z.coerce.number(),
  personId: z.coerce.number(),
  jerseyNumber: z.coerce.number().optional().nullable(),
  position: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  captain: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

/**
 * Add a person to a team roster (player_teams)
 */
export async function addPlayerToRoster(data: {
  teamSeasonId: number;
  personId: number;
  jerseyNumber?: number | null;
  position?: string | null;
  grade?: string | null;
  captain?: boolean;
}) {
  await requireSession();

  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: data.teamSeasonId },
    select: { team_id: true },
  });
  if (!teamSeason) throw new Error("Team Season not found");

  await verifyTeamAccess(teamSeason.team_id);

  const existing = await prisma.player_teams.findFirst({
    where: {
      team_season_id: data.teamSeasonId,
      player_id: data.personId,
    },
  });

  if (existing) {
    // If exists, reactivate/update
    const updated = await prisma.player_teams.update({
      where: { id: existing.id },
      data: {
        is_active: true,
        jersey_number: data.jerseyNumber !== undefined ? data.jerseyNumber : existing.jersey_number,
        position: data.position !== undefined ? data.position : existing.position,
        grade: data.grade !== undefined ? data.grade : existing.grade,
        captain: data.captain !== undefined ? data.captain : existing.captain,
      },
    });
    revalidatePath(`/teams/${data.teamSeasonId}`);
    revalidatePath(`/dashboard`);
    return updated;
  }

  const created = await prisma.player_teams.create({
    data: {
      team_season_id: data.teamSeasonId,
      player_id: data.personId,
      jersey_number: data.jerseyNumber ?? null,
      position: data.position ?? null,
      grade: data.grade ?? null,
      captain: data.captain ?? false,
      is_active: true,
    },
  });

  revalidatePath(`/teams/${data.teamSeasonId}`);
  revalidatePath(`/dashboard`);
  return created;
}

/**
 * Update an existing player_teams record
 */
export async function updateRosterPlayer(
  playerTeamId: number,
  data: {
    jerseyNumber?: number | null;
    position?: string | null;
    grade?: string | null;
    captain?: boolean;
    isActive?: boolean;
    status?: string | null;
  }
) {
  await requireSession();

  const pt = await prisma.player_teams.findUnique({
    where: { id: playerTeamId },
    include: { team_seasons: true },
  });
  if (!pt) throw new Error("Roster player record not found");

  await verifyTeamAccess(pt.team_seasons.team_id);

  const updated = await prisma.player_teams.update({
    where: { id: playerTeamId },
    data: {
      jersey_number: data.jerseyNumber !== undefined ? data.jerseyNumber : pt.jersey_number,
      position: data.position !== undefined ? data.position : pt.position,
      grade: data.grade !== undefined ? data.grade : pt.grade,
      captain: data.captain !== undefined ? data.captain : pt.captain,
      is_active: data.isActive !== undefined ? data.isActive : pt.is_active,
      status: data.status !== undefined ? (data.status as any) : pt.status,
    },
  });

  revalidatePath(`/teams/${pt.team_season_id}`);
  revalidatePath(`/dashboard`);
  return updated;
}

/**
 * Remove a player from a team roster
 */
export async function removePlayerFromRoster(playerTeamId: number) {
  await requireSession();

  const pt = await prisma.player_teams.findUnique({
    where: { id: playerTeamId },
    include: { team_seasons: true },
  });
  if (!pt) throw new Error("Roster player record not found");

  await verifyTeamAccess(pt.team_seasons.team_id);

  await prisma.player_teams.delete({
    where: { id: playerTeamId },
  });

  revalidatePath(`/teams/${pt.team_season_id}`);
  revalidatePath(`/dashboard`);
}

/**
 * Assign staff member to team_staff
 */
export async function assignTeamStaff(data: {
  teamSeasonId: number;
  personId: number;
  role: "head_coach" | "assistant_coach" | "team_admin" | "stats_keeper";
}) {
  await requireSession();

  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: data.teamSeasonId },
    select: { team_id: true },
  });
  if (!teamSeason) throw new Error("Team Season not found");

  await verifyTeamAccess(teamSeason.team_id);

  const existing = await prisma.team_staff.findFirst({
    where: {
      team_season_id: data.teamSeasonId,
      person_id: data.personId,
      role: data.role,
    },
  });

  if (existing) {
    const updated = await prisma.team_staff.update({
      where: { id: existing.id },
      data: { is_active: true },
    });
    revalidatePath(`/teams/${data.teamSeasonId}`);
    revalidatePath(`/dashboard`);
    return updated;
  }

  const created = await prisma.team_staff.create({
    data: {
      team_season_id: data.teamSeasonId,
      person_id: data.personId,
      role: data.role,
      is_active: true,
    },
  });

  revalidatePath(`/teams/${data.teamSeasonId}`);
  revalidatePath(`/dashboard`);
  return created;
}

/**
 * Remove staff member from team_staff
 */
export async function removeTeamStaff(staffId: number) {
  await requireSession();

  const staff = await prisma.team_staff.findUnique({
    where: { id: staffId },
    include: { team_seasons: true },
  });
  if (!staff) throw new Error("Staff record not found");

  await verifyTeamAccess(staff.team_seasons.team_id);

  await prisma.team_staff.delete({
    where: { id: staffId },
  });

  revalidatePath(`/teams/${staff.team_season_id}`);
  revalidatePath(`/dashboard`);
}

/**
 * Search people directory for roster adding modal using fuzzy logic
 */
export async function searchPeople(query: string, teamSeasonId?: number) {
  await requireSession();
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();

  // Exclude players already on this team's roster
  let excludeIds: number[] = [];
  if (teamSeasonId) {
    const existing = await prisma.player_teams.findMany({
      where: { team_season_id: teamSeasonId, is_active: true },
      select: { player_id: true },
    });
    excludeIds = existing.map((p) => p.player_id);
  }

  // Pre-filter with broad tokens in DB
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const orConditions: any[] = [];
  for (const t of tokens) {
    orConditions.push(
      { first_name: { contains: t } },
      { last_name: { contains: t } },
      { nickname: { contains: t } },
      { email: { contains: t } }
    );
    if (t.length >= 2) {
      orConditions.push(
        { first_name: { startsWith: t.slice(0, 2) } },
        { last_name: { startsWith: t.slice(0, 2) } }
      );
    }
  }

  const people = await prisma.people.findMany({
    where: {
      is_active: true,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      ...(orConditions.length > 0 ? { OR: orConditions } : {}),
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      nickname: true,
      email: true,
      gender: true,
    },
    take: 150,
  });

  const candidates = people.map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    nickname: p.nickname,
    email: p.email,
    gender: p.gender,
    fullName: `${p.first_name} ${p.last_name}`,
  }));

  const ranked = fuzzyFilterPeople(candidates, q, 0.4);

  return ranked.slice(0, 20).map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    nickname: p.nickname,
    email: p.email,
  }));
}

/**
 * Create a new person and immediately add them to a team roster
 */
export async function createPersonAndAddToRoster(data: {
  teamSeasonId: number;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  gender: string;
  birthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  jerseyNumber?: number | null;
  position?: string | null;
  grade?: string | null;
  captain?: boolean;
}) {
  await requireSession();

  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: data.teamSeasonId },
    select: { team_id: true },
  });
  if (!teamSeason) throw new Error("Team Season not found");

  await verifyTeamAccess(teamSeason.team_id);

  if (!data.firstName || !data.firstName.trim()) {
    throw new Error("First name is required");
  }
  if (!data.lastName || !data.lastName.trim()) {
    throw new Error("Last name is required");
  }

  const person = await prisma.people.create({
    data: {
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      nickname: data.nickname?.trim() || null,
      gender: normalizeGender(data.gender, "MIXED"),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      birth_date: data.birthDate ? new Date(data.birthDate) : null,
      is_active: true,
    },
  });

  const playerTeam = await prisma.player_teams.create({
    data: {
      team_season_id: data.teamSeasonId,
      player_id: person.id,
      jersey_number: data.jerseyNumber ?? null,
      position: data.position ?? null,
      grade: data.grade ?? null,
      captain: data.captain ?? false,
      is_active: true,
      status: "rostered",
    },
  });

  revalidatePath(`/teams/${data.teamSeasonId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    person: {
      id: person.id,
      firstName: person.first_name,
      lastName: person.last_name,
      nickname: person.nickname,
      email: person.email,
    },
    playerTeam,
  };
}
