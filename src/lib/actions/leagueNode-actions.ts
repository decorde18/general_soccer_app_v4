"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { leagueNodeSchema } from "@/lib/validations/schemas";

export async function createLeagueNode(data: Record<string, string>) {
  await verifyAdmin();

  const parsed = leagueNodeSchema.parse(data);

  let leagueId = parsed.leagueId;
  let level = 0;

  if (parsed.parentId) {
    const parentNode = await prisma.league_nodes.findUnique({
      where: { id: parsed.parentId },
    });
    if (parentNode) {
      leagueId = parentNode.league_id;
      level = (parentNode.level || 0) + 1;
    }
  }

  if (!leagueId) {
    const firstLeague = await prisma.leagues.findFirst();
    if (!firstLeague) throw new Error("No league exists to attach node to.");
    leagueId = firstLeague.id;
  }

  let displayOrder = parsed.displayOrder || 0;
  if (!displayOrder) {
    const siblingsCount = await prisma.league_nodes.count({
      where: {
        league_id: leagueId,
        parent_id: parsed.parentId || null,
      },
    });
    displayOrder = (siblingsCount + 1) * 10;
  }

  const node = await prisma.league_nodes.create({
    data: {
      league_id: leagueId,
      parent_id: parsed.parentId,
      name: parsed.name,
      node_type: parsed.nodeType,
      level: level,
      display_order: displayOrder,
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

  let level: number | undefined = undefined;
  let targetLeagueId: number | null | undefined = parsed.leagueId;

  if (parsed.parentId !== undefined) {
    if (parsed.parentId) {
      const parentNode = await prisma.league_nodes.findUnique({
        where: { id: parsed.parentId },
      });
      if (parentNode) {
        level = (parentNode.level || 0) + 1;
        targetLeagueId = parentNode.league_id;
      }
    } else {
      level = 0;
    }
  }

  await prisma.league_nodes.update({
    where: { id: numId },
    data: {
      ...(targetLeagueId ? { league_id: targetLeagueId } : {}),
      parent_id: parsed.parentId !== undefined ? parsed.parentId : undefined,
      name: parsed.name,
      node_type: parsed.nodeType,
      ...(level !== undefined ? { level } : {}),
      ...(parsed.displayOrder !== undefined ? { display_order: parsed.displayOrder } : {}),
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
