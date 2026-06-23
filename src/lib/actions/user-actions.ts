"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { userSchema } from "@/lib/validations/schemas";

export async function createUser(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsed = userSchema.parse(data);

  if (!parsed.password) {
    throw new Error("Password is required for new users");
  }

  // Check if user already exists
  let person = await prisma.people.findFirst({
    where: { email: parsed.email },
  });

  if (person) {
    // If the person exists, check if they already have a user login
    const existingUser = await prisma.users.findUnique({
      where: { person_id: person.id },
    });
    if (existingUser) {
      throw new Error("A user account with this email already exists");
    }
  } else {
    // Create new person record first
    person = await prisma.people.create({
      data: {
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        email: parsed.email,
        is_active: true,
      },
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(parsed.password, 10);

  // Create user
  const newUser = await prisma.users.create({
    data: {
      person_id: person.id,
      system_admin: parsed.systemAdmin || false,
      password_hash: passwordHash,
    },
  });

  revalidatePath("/admin");
  return newUser;
}

export async function updateUser(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Validate server-side with Zod
  const parsed = userSchema.partial().parse(data);

  // Get current user record to find person_id
  const currentUser = await prisma.users.findUnique({
    where: { id: numId },
  });
  if (!currentUser) throw new Error("User not found");

  // Update associated person details
  await prisma.people.update({
    where: { id: currentUser.person_id },
    data: {
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      email: parsed.email,
    },
  });

  const updateData: any = {};
  if (parsed.systemAdmin !== undefined) {
    updateData.system_admin = parsed.systemAdmin;
  }
  if (parsed.password) {
    updateData.password_hash = await bcrypt.hash(parsed.password, 10);
  }

  const updatedUser = await prisma.users.update({
    where: { id: numId },
    data: updateData,
  });

  revalidatePath("/admin");
  return updatedUser;
}

export async function deleteUser(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Note: Only delete the login credentials record, preserving the person record.
  // This avoids breaking foreign key dependencies (stats, roster, etc.).
  await prisma.users.delete({
    where: { id: numId },
  });

  revalidatePath("/admin");
}
