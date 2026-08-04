"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";

export async function createPlayerRelationship(data: Record<string, any>) {
  await verifyAdmin();

  const playerId = Number(data.player_id);
  const relatedPersonId = Number(data.related_person_id);
  const relationship = (data.relationship || "Parent") as "Parent" | "Guardian";

  if (!playerId || !relatedPersonId) {
    throw new Error("Child Player and Parent/Guardian are required");
  }

  const rel = await prisma.player_relationships.create({
    data: {
      player_id: playerId,
      related_person_id: relatedPersonId,
      relationship,
    },
  });

  revalidatePath("/admin/player-relationships");
  revalidatePath("/dashboard");
  return rel;
}

export async function updatePlayerRelationship(id: unknown, data: Record<string, any>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  const updateData: any = {};
  if (data.player_id) updateData.player_id = Number(data.player_id);
  if (data.related_person_id) updateData.related_person_id = Number(data.related_person_id);
  if (data.relationship) updateData.relationship = data.relationship;

  await prisma.player_relationships.update({
    where: { id: numId },
    data: updateData,
  });

  revalidatePath("/admin/player-relationships");
  revalidatePath("/dashboard");
}

export async function deletePlayerRelationship(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.player_relationships.delete({
    where: { id: numId },
  });

  revalidatePath("/admin/player-relationships");
  revalidatePath("/dashboard");
}
