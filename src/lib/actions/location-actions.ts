"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { locationSchema } from "@/lib/validations/schemas"; // Make sure your location schema includes address fields!

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

export interface LocationDetails {
  id: number;
  name: string;
  abbreviation: string | null;
  addressId: number | null;
  formattedAddress: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  googleMapsUrl: string | null;
  sublocations: {
    id: number;
    name: string;
    description: string | null;
    surfaceType: string | null;
  }[];
}

export async function getLocationDetails(locationId: number): Promise<LocationDetails | null> {
  if (!locationId) return null;

  const loc = await prisma.locations.findUnique({
    where: { id: locationId },
    include: {
      addresses: true,
      locations_sublocations: true,
    },
  });

  if (!loc) return null;

  const addr = loc.addresses;
  const addressParts = addr
    ? [addr.address_line1, addr.address_line2, `${addr.city || ""}${addr.city && addr.state ? ", " : ""}${addr.state || ""} ${addr.postal_code || ""}`.trim()].filter(Boolean)
    : [];
  const formattedAddress = addressParts.length > 0 ? addressParts.join(" ") : null;

  const searchQuery = formattedAddress || `${loc.name} soccer complex`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;

  return {
    id: loc.id,
    name: loc.name,
    abbreviation: loc.abbreviation,
    addressId: loc.address_id,
    formattedAddress,
    streetAddress: addr?.address_line1 || null,
    city: addr?.city || null,
    state: addr?.state || null,
    postalCode: addr?.postal_code || null,
    googleMapsUrl,
    sublocations: loc.locations_sublocations.map((sub) => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
      surfaceType: sub.surface_type,
    })),
  };
}
