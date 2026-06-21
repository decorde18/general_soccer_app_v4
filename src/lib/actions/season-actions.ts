"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { seasonSchema } from "@/lib/validations/schemas";

export async function createSeason(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsed = seasonSchema.parse(data);

  const newSeason = await prisma.seasons.create({
    data: {
      season_name: parsed.seasonName,
      start_date: new Date(parsed.startDate),
      end_date: new Date(parsed.endDate),
      status: parsed.status,
    },
  });

  revalidatePath("/admin/seasons");
  return newSeason;
}

export async function updateSeason(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Validate server-side with Zod (partial for updates)
  const parsed = seasonSchema.partial().parse(data);

  const updateData: any = {};
  if (parsed.seasonName) updateData.season_name = parsed.seasonName;
  if (parsed.startDate) updateData.start_date = new Date(parsed.startDate);
  if (parsed.endDate) updateData.end_date = new Date(parsed.endDate);
  if (parsed.status) updateData.status = parsed.status;

  await prisma.seasons.update({
    where: { id: numId },
    data: updateData,
  });

  revalidatePath("/admin/seasons");
}

export async function deleteSeason(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.seasons.delete({
    where: { id: numId },
  });

  revalidatePath("/admin/seasons");
}
