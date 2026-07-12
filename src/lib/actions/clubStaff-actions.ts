"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { z } from "zod";

const clubStaffSchema = z.object({
  clubId: z.coerce.number(),
  personId: z.coerce.number(),
  role: z.enum(["club_admin", "director", "registrar"]),
  isActive: z.string().optional().transform((v) => v === "true"),
});

export async function createClubStaff(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsed = clubStaffSchema.parse(data);

  // Check if role assignment already exists for this person in the club
  const existing = await prisma.club_staff.findFirst({
    where: {
      club_id: parsed.clubId,
      person_id: parsed.personId,
      role: parsed.role,
    },
  });

  if (existing) {
    throw new Error("This person is already assigned to this role in this club.");
  }

  const staff = await prisma.club_staff.create({
    data: {
      club_id: parsed.clubId,
      person_id: parsed.personId,
      role: parsed.role,
      is_active: parsed.isActive,
    },
  });

  revalidatePath("/admin/club-staff");
  return staff;
}

export async function updateClubStaff(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Validate server-side with Zod (partial for updates)
  const parsed = clubStaffSchema.partial().parse(data);

  await prisma.club_staff.update({
    where: { id: numId },
    data: {
      club_id: parsed.clubId,
      person_id: parsed.personId,
      role: parsed.role,
      is_active: parsed.isActive,
    },
  });

  revalidatePath("/admin/club-staff");
}

export async function deleteClubStaff(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.club_staff.delete({
    where: { id: numId },
  });

  revalidatePath("/admin/club-staff");
}
