"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { addressSchema } from "@/lib/validations/schemas";

export async function createAddress(data: Record<string, string>) {
    await verifyAdmin();

    // Validate server-side with Zod
    const parsedData = addressSchema.parse(data);

    try {
        const newBody = await prisma.addresses.create({
            data: {
                address_line1: parsedData.addressLine1,
                address_line2: parsedData.addressLine2,
                city: parsedData.city,
                state: parsedData.state,
                country: parsedData.country,
                postal_code: parsedData.postalCode,
            },
        });

        revalidatePath("/addresses");
        return newBody; // Return the created object so nested configs get the ID!
    } catch (error) {
        console.error("Error creating address:", error);
        throw new Error("Failed to create address");
    }
}

export async function updateAddress(
    id: unknown,
    data: Record<string, string>,
) {
    await verifyAdmin();
    const numId = Number(id);
    if (!numId) throw new Error("ID required");

    // Partial validation for updates
    const parsedData = addressSchema.partial().parse(data);

    await prisma.addresses.update({
        where: { id: numId },
        data: parsedData,
    });

    revalidatePath("/addresses");
}

export async function deleteAddress(id: unknown) {
    await verifyAdmin();
    const numId = Number(id);
    if (!numId) throw new Error("ID required");

    await prisma.addresses.delete({
        where: { id: numId },
    });

    revalidatePath("/addresses");
}
