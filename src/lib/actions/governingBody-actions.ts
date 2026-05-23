"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "../auth/auth-utils";

export async function createGoverningBody(data: Record<string, string>) {
  await verifyAdmin();
  // Validate server-side (never trust the client)
  if (!data.name || data.name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }

  // --- MySQL DB logic ---
  // try {
  //     const [result] = await pool.query(
  //         `INSERT INTO governingBodies (name, season, startDate, status, description) VALUES (?, ?, ?, ?, ?)`,
  //         [data.name, data.season || null, data.startDate || null, data.status || 'active', data.description || null]
  //     );
  //     // const insertId = (result as any).insertId;
  // } catch (error) {
  //     console.error("Error creating governingBody:", error);
  //     throw new Error("Failed to create governingBody");
  // }

  revalidatePath("/governingBodies");
  console.log("createGoverningBody called with:", data);
}

export async function updateGoverningBody(
  id: unknown,
  data: Record<string, string>,
) {
  await verifyAdmin();
  if (!id) throw new Error("ID required");

  // --- MySQL DB logic ---
  // const updates = [];
  // const values = [];
  // if (data.name) { updates.push('name = ?'); values.push(data.name); }
  // if (data.status) { updates.push('status = ?'); values.push(data.status); }
  // if (data.startDate) { updates.push('startDate = ?'); values.push(data.startDate); }
  // if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  // values.push(id);

  // if (updates.length > 0) {
  //     const sql = `UPDATE governingBodies SET ${updates.join(', ')} WHERE id = ?`;
  //     await pool.query(sql, values);
  // }

  revalidatePath("/governingBodies");
  console.log("updateGoverningBody called:", id, data);
}

export async function deleteGoverningBody(id: unknown) {
  await verifyAdmin();
  if (!id) throw new Error("ID required");

  // --- MySQL DB logic ---
  // await pool.query(`DELETE FROM governingBodies WHERE id = ?`, [id]);

  revalidatePath("/governingBodies");
  console.log("deleteGoverningBody called:", id);
}
