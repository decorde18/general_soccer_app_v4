"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { z } from "zod";

const teamStaffSchema = z.object({
  teamSeasonId: z.coerce.number(),
  personId: z.coerce.number(),
  role: z.enum(["head_coach", "assistant_coach", "team_admin", "stats_keeper"]),
  isActive: z.string().optional().transform((v) => v === "true"),
});

export async function createTeamStaff(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsed = teamStaffSchema.parse(data);

  // Check if role assignment already exists for this person on this team season
  const existing = await prisma.team_staff.findFirst({
    where: {
      team_season_id: parsed.teamSeasonId,
      person_id: parsed.personId,
      role: parsed.role,
    },
  });

  if (existing) {
    throw new Error("This person is already assigned to this role for this team season.");
  }

  const staff = await prisma.team_staff.create({
    data: {
      team_season_id: parsed.teamSeasonId,
      person_id: parsed.personId,
      role: parsed.role,
      is_active: parsed.isActive,
    },
  });

  revalidatePath("/admin/club-staff");
  return staff;
}

export async function updateTeamStaff(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Validate server-side with Zod (partial for updates)
  const parsed = teamStaffSchema.partial().parse(data);

  await prisma.team_staff.update({
    where: { id: numId },
    data: {
      team_season_id: parsed.teamSeasonId,
      person_id: parsed.personId,
      role: parsed.role,
      is_active: parsed.isActive,
    },
  });

  revalidatePath("/admin/club-staff");
}

export async function deleteTeamStaff(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.team_staff.delete({
    where: { id: numId },
  });

  revalidatePath("/admin/club-staff");
}
