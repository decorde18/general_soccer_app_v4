"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { teamSchema } from "@/lib/validations/schemas";

export async function createTeam(data: Record<string, string>) {
  await verifyAdmin();
  const parsed = teamSchema.parse(data);

  try {
    const newTeam = await prisma.teams.create({
      data: {
        team_name: parsed.teamName,
        club_id: parsed.clubId,
        gender: parsed.gender,
        is_active: parsed.isActive ?? true,
      },
    });

    revalidatePath("/admin/clubs");
    return newTeam;
  } catch (error) {
    console.error("Error creating team:", error);
    throw new Error("Failed to create team");
  }
}

export async function updateTeam(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  const parsed = teamSchema.partial().parse(data);

  await prisma.teams.update({
    where: { id: numId },
    data: {
      team_name: parsed.teamName,
      club_id: parsed.clubId ?? undefined,
      gender: parsed.gender,
      is_active: parsed.isActive,
    },
  });

  revalidatePath("/admin/clubs");
}

export async function deleteTeam(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.teams.delete({
    where: { id: numId },
  });

  revalidatePath("/admin/clubs");
}
