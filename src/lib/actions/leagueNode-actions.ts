"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { leagueNodeSchema } from "@/lib/validations/schemas";

export async function createLeagueNode(data: Record<string, string>) {
  await verifyAdmin();

  const parsed = leagueNodeSchema.parse(data);

  const node = await prisma.league_nodes.create({
    data: {
      league_id: parsed.leagueId,
      parent_id: parsed.parentId,
      name: parsed.name,
      node_type: parsed.nodeType,
      level: parsed.level || 0,
      display_order: parsed.displayOrder || 0,
    },
  });

  revalidatePath("/admin/leagues");
  return node;
}

export async function updateLeagueNode(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  const parsed = leagueNodeSchema.partial().parse(data);

  await prisma.league_nodes.update({
    where: { id: numId },
    data: {
      league_id: parsed.leagueId,
      parent_id: parsed.parentId !== undefined ? parsed.parentId : undefined,
      name: parsed.name,
      node_type: parsed.nodeType,
      level: parsed.level || 0,
      display_order: parsed.displayOrder || 0,
    },
  });

  revalidatePath("/admin/leagues");
}

export async function deleteLeagueNode(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.league_nodes.delete({
    where: { id: numId },
  });

  revalidatePath("/admin/leagues");
}
