"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/auth-utils";
import { normalizeGender, formatGenderDisplay } from "@/lib/utils/gender";
import { formatDateStandard } from "@/lib/utils/dateTimeUtils";
import { fuzzyFilterPeople } from "@/lib/utils/fuzzySearch";

export interface AdminPersonItem {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: string;
  genderDisplay: string;
  email: string;
  phone: string;
  birthDate: string;
  birthDateRaw: string;
  isActive: boolean;
  teamCount: number;
  rolesList: string;
}

/**
 * Fetch all people for the admin portal with team counts and role summaries
 */
export async function getAdminPeople(): Promise<AdminPersonItem[]> {
  await requireSession();

  const people = await prisma.people.findMany({
    orderBy: [
      { last_name: "asc" },
      { first_name: "asc" },
    ],
    include: {
      player_teams: {
        where: { is_active: true },
        select: { id: true },
      },
      team_staff: {
        where: { is_active: true },
        select: { role: true },
      },
      club_staff: {
        where: { is_active: true },
        select: { role: true },
      },
    },
  });

  return people.map((p) => {
    const roles: string[] = [];
    if (p.player_teams.length > 0) roles.push("Player");
    if (p.team_staff.length > 0) {
      const distinctStaff = Array.from(new Set(p.team_staff.map((s) => s.role)));
      roles.push(...distinctStaff.map((r) => r.replace(/_/g, " ")));
    }
    if (p.club_staff.length > 0) {
      const distinctClub = Array.from(new Set(p.club_staff.map((s) => s.role)));
      roles.push(...distinctClub.map((r) => r.replace(/_/g, " ")));
    }
    if (roles.length === 0) roles.push("Individual");

    const birthDateRaw = p.birth_date ? p.birth_date.toISOString().split("T")[0] : "";
    const birthDateFormatted = p.birth_date ? formatDateStandard(p.birth_date) : "--";

    return {
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      nickname: p.nickname || "",
      gender: p.gender || "MIXED",
      genderDisplay: formatGenderDisplay(p.gender),
      email: p.email || "",
      phone: p.phone || "",
      birthDate: birthDateFormatted,
      birthDateRaw,
      isActive: p.is_active ?? true,
      teamCount: p.player_teams.length,
      rolesList: Array.from(new Set(roles)).join(", "),
    };
  });
}

/**
 * Create a new person
 */
export async function createPerson(data: {
  firstName: string;
  lastName: string;
  nickname?: string | null;
  gender?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  birthDateRaw?: string | null;
  isActive?: boolean;
}) {
  await requireSession();

  if (!data.firstName || !data.firstName.trim()) {
    throw new Error("First name is required.");
  }
  if (!data.lastName || !data.lastName.trim()) {
    throw new Error("Last name is required.");
  }

  const birthDateStr = data.birthDateRaw || data.birthDate;
  let parsedBirthDate: Date | null = null;
  if (birthDateStr && birthDateStr.trim()) {
    const d = new Date(birthDateStr.trim());
    if (!isNaN(d.getTime())) {
      parsedBirthDate = d;
    }
  }

  const person = await prisma.people.create({
    data: {
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      nickname: data.nickname?.trim() || null,
      gender: normalizeGender(data.gender, "MIXED"),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      birth_date: parsedBirthDate,
      is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
    },
  });

  revalidatePath("/admin/people");
  revalidatePath("/dashboard/guest-players");
  return { success: true, person };
}

/**
 * Update an existing person
 */
export async function updatePerson(
  id: number | string,
  data: {
    firstName?: string;
    lastName?: string;
    nickname?: string | null;
    gender?: string | null;
    email?: string | null;
    phone?: string | null;
    birthDate?: string | null;
    birthDateRaw?: string | null;
    isActive?: boolean;
  }
) {
  await requireSession();

  const numId = Number(id);
  if (!numId) throw new Error("Invalid Person ID");

  const birthDateStr = data.birthDateRaw !== undefined ? data.birthDateRaw : data.birthDate;
  let parsedBirthDate: Date | null | undefined = undefined;
  if (birthDateStr !== undefined) {
    if (!birthDateStr || !birthDateStr.trim()) {
      parsedBirthDate = null;
    } else {
      const d = new Date(birthDateStr.trim());
      parsedBirthDate = isNaN(d.getTime()) ? null : d;
    }
  }

  const updated = await prisma.people.update({
    where: { id: numId },
    data: {
      first_name: data.firstName !== undefined ? data.firstName.trim() : undefined,
      last_name: data.lastName !== undefined ? data.lastName.trim() : undefined,
      nickname: data.nickname !== undefined ? (data.nickname?.trim() || null) : undefined,
      gender: data.gender !== undefined ? normalizeGender(data.gender, "MIXED") : undefined,
      email: data.email !== undefined ? (data.email?.trim() || null) : undefined,
      phone: data.phone !== undefined ? (data.phone?.trim() || null) : undefined,
      birth_date: parsedBirthDate,
      is_active: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
    },
  });

  revalidatePath("/admin/people");
  revalidatePath("/dashboard/guest-players");
  return { success: true, person: updated };
}

/**
 * Delete or deactivate person
 */
export async function deletePerson(id: number | string) {
  await requireSession();

  const numId = Number(id);
  if (!numId) throw new Error("Invalid Person ID");

  // Check if they have dependencies
  const [playerTeams, playerGames, teamStaff, clubStaff] = await Promise.all([
    prisma.player_teams.count({ where: { player_id: numId } }),
    prisma.player_games.count({ where: { player_id: numId } }),
    prisma.team_staff.count({ where: { person_id: numId } }),
    prisma.club_staff.count({ where: { person_id: numId } }),
  ]);

  const hasDependencies = playerTeams > 0 || playerGames > 0 || teamStaff > 0 || clubStaff > 0;

  if (hasDependencies) {
    // Soft delete / deactivate to maintain database integrity
    await prisma.people.update({
      where: { id: numId },
      data: { is_active: false },
    });
  } else {
    // Hard delete safely
    await prisma.people.delete({
      where: { id: numId },
    });
  }

  revalidatePath("/admin/people");
  return { success: true };
}

/**
 * Search people using fuzzy logic
 */
export async function searchPeopleFuzzy(
  query: string,
  options?: {
    limit?: number;
    excludeTeamSeasonId?: number;
  }
) {
  await requireSession();
  const q = query.trim();
  if (!q) return [];

  // Exclude current team season roster if requested
  let excludeIds: number[] = [];
  if (options?.excludeTeamSeasonId) {
    const existing = await prisma.player_teams.findMany({
      where: { team_season_id: options.excludeTeamSeasonId, is_active: true },
      select: { player_id: true },
    });
    excludeIds = existing.map((r) => r.player_id);
  }

  const people = await prisma.people.findMany({
    where: {
      is_active: true,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      nickname: true,
      email: true,
      gender: true,
      birth_date: true,
    },
    take: 300,
  });

  const candidates = people.map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    nickname: p.nickname,
    email: p.email,
    gender: p.gender,
    birthDate: p.birth_date ? p.birth_date.toISOString().split("T")[0] : null,
    fullName: `${p.first_name} ${p.last_name}`,
  }));

  const ranked = fuzzyFilterPeople(candidates, q, 0.45);
  return ranked.slice(0, options?.limit || 20);
}
