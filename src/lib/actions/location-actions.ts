"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "../auth/auth-utils";
import prisma from "@/lib/prisma";
import { locationSchema } from "../validations/schemas"; // Make sure your location schema includes address fields!

export async function createLocation(data: Record<string, string>) {
  await verifyAdmin();

  // Create the address first
  const newAddress = await prisma.addresses.create({
    data: {
      address_line1: data.addressLine1,
      address_line2: data.addressLine2,
      city: data.city,
      state: data.state,
      country: data.country,
      postal_code: data.postalCode,
    },
  });

  // Then create the Location and link it to the address
  const newLocation = await prisma.locations.create({
    data: {
      name: data.name,
      address_id: newAddress.id,
    },
  });

  revalidatePath("/locations");
  return newLocation;
}

export async function updateLocation(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Get existing location to see if it has an address
  const location = await prisma.locations.findUnique({
    where: { id: numId },
  });

  if (!location) throw new Error("Location not found");

  if (location.address_id) {
    // Update existing address
    await prisma.addresses.update({
      where: { id: location.address_id },
      data: {
        address_line1: data.addressLine1,
        address_line2: data.addressLine2,
        city: data.city,
        state: data.state,
        country: data.country,
        postal_code: data.postalCode,
      },
    });
  } else {
    // If no address exists, create one and link it
    const newAddress = await prisma.addresses.create({
      data: {
        address_line1: data.addressLine1,
        address_line2: data.addressLine2,
        city: data.city,
        state: data.state,
        country: data.country,
        postal_code: data.postalCode,
      },
    });
    
    await prisma.locations.update({
      where: { id: numId },
      data: { address_id: newAddress.id },
    });
  }

  // Update location name
  await prisma.locations.update({
    where: { id: numId },
    data: { name: data.name },
  });

  revalidatePath("/locations");
}

export async function deleteLocation(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  const location = await prisma.locations.findUnique({
    where: { id: numId },
  });

  if (!location) return;

  // First, delete the location itself to remove any foreign key constraint issues
  await prisma.locations.delete({
    where: { id: numId },
  });

  // Then cleanly delete its associated address
  if (location.address_id) {
    await prisma.addresses.delete({
      where: { id: location.address_id },
    });
  }

  revalidatePath("/locations");
}
