"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "../auth/auth-utils";
import pool from "../db";

export async function createLeague(data: Record<string, string>) {
  await verifyAdmin();
  // Validate server-side (never trust the client)
  if (!data.name || data.name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }

  // --- MySQL DB logic ---
  try {
    const [result] = await pool.query(
      `INSERT INTO leagues (name, abbreviation, governing_body_id, status, description, is_tournament) VALUES (?, ?, ?, ?, ?,?)`,
      [
        data.name,
        data.abbreviation || null,
        data.governing_body_id || null,
        data.status || "active",
        data.description || null,
        data.is_tournament || 0,
      ],
    );
    // const insertId = (result as any).insertId;
  } catch (error) {
    console.error("Error creating league:", error);
    throw new Error("Failed to create league");
  }

  revalidatePath("/leagues");
  // console.log("createLeague called with:", data);
}

export async function updateLeague(id: unknown, data: Record<string, string>) {
  await verifyAdmin();
  if (!id) throw new Error("ID required");

  // --- MySQL DB logic ---
  const updates = [];
  const values = [];
  if (data.name) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.status) {
    updates.push("status = ?");
    values.push(data.status);
  }
  if (data.abbreviation !== undefined) {
    updates.push("abbreviation = ?");
    values.push(data.abbreviation);
  }
  if (data.governingBodyName !== undefined) {
    updates.push("governing_body_id = ?");
    values.push(data.governingBodyName);
  }

  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }

  if (data.isTournament) {
    updates.push("is_tournament = ?");
    values.push(data.isTournament === "true" ? 1 : 0);
  }

  values.push(id);

  if (updates.length > 0) {
    const sql = `UPDATE leagues SET ${updates.join(", ")} WHERE id = ?`;
    await pool.query(sql, values);
  }

  revalidatePath("/leagues");
  // console.log("updateLeague called:", id, data);
}

export async function deleteLeague(id: unknown) {
  await verifyAdmin();
  if (!id) throw new Error("ID required");

  // --- MySQL DB logic ---
  await pool.query(`DELETE FROM leagues WHERE id = ?`, [id]);

  revalidatePath("/leagues");
  // console.log("deleteLeague called:", id);
}
