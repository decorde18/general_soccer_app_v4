"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "../auth/auth-utils";
import prisma from "@/lib/prisma";
import { clubSchema } from "../validations/schemas";

export async function createClub(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsedData = clubSchema.parse(data);

  try {
    const newClub = await prisma.clubs.create({
      data: {
        name: parsedData.name,
        abbreviation: parsedData.abbreviation,
        founded_year: parsedData.foundedYear || null,
        location: parsedData.location,
        location_id: parsedData.locationId,
        logo_url: parsedData.logoUrl,
        contact_info: parsedData.contactInfo,
        is_active: parsedData.isActive,
        type: parsedData.type,
      },
    });

    revalidatePath("/clubs");
    return newClub;
  } catch (error) {
    console.error("Error creating club:", error);
    throw new Error("Failed to create club");
  }
}

export async function updateClub(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Partial validation for updates
  const parsedData = clubSchema.partial().parse(data);

  await prisma.clubs.update({
    where: { id: numId },
    data: {
      name: parsedData.name,
      abbreviation: parsedData.abbreviation,
      location_id:
        parsedData.locationId !== undefined ? parsedData.locationId : undefined,
      logo_url: parsedData.logoUrl,
      location: parsedData.location,
      type: parsedData.type,
      founded_year: parsedData.foundedYear || null,
      contact_info: parsedData.contactInfo,
      is_active: parsedData.isActive,
    },
  });

  revalidatePath("/clubs");
}

export async function deleteClub(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.clubs.delete({
    where: { id: numId },
  });

  revalidatePath("/clubs");
}
