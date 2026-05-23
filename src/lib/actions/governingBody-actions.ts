"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "../auth/auth-utils";
import pool from "../db";

export async function createGoverningBody(data: Record<string, string>) {
  await verifyAdmin();

  // Validate server-side (never trust the client)
  if (!data.name || data.name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }

  // --- MySQL DB logic ---
  try {
    const [result] = await pool.query(
      `INSERT INTO governing_bodies (name, abbreviation, website) VALUES (?, ?, ?)`,
      [data.name, data.abbreviation || null, data.website || null],
    );
  } catch (error) {
    console.error("Error creating governingBody:", error);
    throw new Error("Failed to create governingBody");
  }

  revalidatePath("/governing-bodies");
  // console.log("createGoverningBody called:", data);
}

export async function updateGoverningBody(
  id: unknown,
  data: Record<string, string>,
) {
  await verifyAdmin();
  if (!id) throw new Error("ID required");

  // --- MySQL DB logic ---
  const updates = [];
  const values = [];
  if (data.name) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.abbreviation !== undefined) {
    updates.push("abbreviation = ?");
    values.push(data.abbreviation);
  }
  if (data.website !== undefined) {
    updates.push("website = ?");
    values.push(data.website);
  }

  values.push(id);

  if (updates.length > 0) {
    const sql = `UPDATE governing_bodies SET ${updates.join(", ")} WHERE id = ?`;
    await pool.query(sql, values);
  }

  revalidatePath("/governing-bodies");
  // console.log("updateGoverningBody called:", id, data);
}

export async function deleteGoverningBody(id: unknown) {
  await verifyAdmin();
  if (!id) throw new Error("ID required");

  // --- MySQL DB logic ---
  await pool.query(`DELETE FROM governing_bodies WHERE id = ?`, [id]);

  revalidatePath("/governing-bodies");
  // console.log("deleteGoverningBody called:", id);
}
