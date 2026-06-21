"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { leagueSchema } from "@/lib/validations/schemas";

export async function createLeague(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsedData = leagueSchema.parse(data);

  try {
    const newLeague = await prisma.leagues.create({
      data: {
        name: parsedData.name,
        abbreviation: parsedData.abbreviation,
        governing_body_id: parsedData.governingBodyName,
        status: parsedData.status,
        description: parsedData.description,
        is_tournament: parsedData.isTournament,
      },
    });
    
    revalidatePath("/leagues");
    return newLeague;
  } catch (error) {
    console.error("Error creating league:", error);
    throw new Error("Failed to create league");
  }
}

export async function updateLeague(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Partial validation for updates
  const parsedData = leagueSchema.partial().parse(data);

  await prisma.leagues.update({
    where: { id: numId },
    data: {
      name: parsedData.name,
      abbreviation: parsedData.abbreviation,
      governing_body_id: parsedData.governingBodyName !== undefined ? parsedData.governingBodyName : undefined,
      status: parsedData.status,
      description: parsedData.description,
      is_tournament: parsedData.isTournament,
    },
  });

  revalidatePath("/leagues");
}

export async function deleteLeague(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.leagues.delete({
    where: { id: numId },
  });

  revalidatePath("/leagues");
}
