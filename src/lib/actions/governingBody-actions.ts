"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "../auth/auth-utils";
import prisma from "@/lib/prisma";
import { governingBodySchema } from "../validations/schemas";

export async function createGoverningBody(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsedData = governingBodySchema.parse(data);

  try {
    const newBody = await prisma.governing_bodies.create({
      data: {
        name: parsedData.name,
        abbreviation: parsedData.abbreviation,
        website: parsedData.website,
      },
    });
    
    revalidatePath("/governing-bodies");
    return newBody; // Return the created object so nested configs get the ID!
  } catch (error) {
    console.error("Error creating governingBody:", error);
    throw new Error("Failed to create governingBody");
  }
}

export async function updateGoverningBody(
  id: unknown,
  data: Record<string, string>,
) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Partial validation for updates
  const parsedData = governingBodySchema.partial().parse(data);

  await prisma.governing_bodies.update({
    where: { id: numId },
    data: parsedData,
  });

  revalidatePath("/governing-bodies");
}

export async function deleteGoverningBody(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.governing_bodies.delete({
    where: { id: numId },
  });

  revalidatePath("/governing-bodies");
}
