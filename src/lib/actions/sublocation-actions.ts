"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "../auth/auth-utils";
import prisma from "@/lib/prisma";
import { subLocationSchema } from "../validations/schemas";

export async function createSubLocation(data: Record<string, string>) {
  await verifyAdmin();

  const parsedData = subLocationSchema.parse(data);

  if (!parsedData.locationId) {
    throw new Error("Location ID is required");
  }

  const newSubLocation = await prisma.locations_sublocations.create({
    data: {
      name: parsedData.name,
      location_id: parsedData.locationId,
      capacity: parsedData.capacity,
      description: parsedData.description,
      surface_type: parsedData.surfaceType,
      is_active: parsedData.isActive ?? true,
    },
  });

  revalidatePath("/sublocations");
  return newSubLocation;
}

export async function updateSubLocation(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  const parsedData = subLocationSchema.partial().parse(data);

  await prisma.locations_sublocations.update({
    where: { id: numId },
    data: {
      name: parsedData.name,
      location_id: parsedData.locationId ?? undefined,
      capacity: parsedData.capacity,
      description: parsedData.description,
      surface_type: parsedData.surfaceType,
      is_active: parsedData.isActive,
    },
  });

  revalidatePath("/sublocations");
}

export async function deleteSubLocation(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.locations_sublocations.delete({
    where: { id: numId },
  });

  revalidatePath("/sublocations");
}
