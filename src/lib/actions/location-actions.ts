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

// You will also build updateLocation (updates both tables) and deleteLocation
