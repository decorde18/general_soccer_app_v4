"use server";

import prisma from "@/lib/prisma";
import { requireSession, verifyGameAccess } from "../auth/auth-utils";
import { revalidatePath } from "next/cache";

interface GameSettingsInput {
  periodCount: number;
  periodDuration: number;
  hasOvertime: boolean;
  overtimeDuration: number;
  hasShootout: boolean;
  reentryRule?: string;
}

export async function updateGameSettings(
  gameId: number,
  teamSeasonId: number,
  settings: GameSettingsInput
) {
  // 1. Ensure user is logged in
  await requireSession();

  // 2. Verify user has game access to update match settings
  await verifyGameAccess(gameId, teamSeasonId);

  // Read existing game notes to preserve JSON object
  const existingGame = await prisma.games.findUnique({
    where: { id: gameId },
    select: { notes: true },
  });

  let notesObj: Record<string, any> = {};
  if (existingGame?.notes) {
    try {
      notesObj = JSON.parse(existingGame.notes);
    } catch {
      notesObj = { rawNotes: existingGame.notes };
    }
  }

  if (settings.reentryRule) {
    notesObj.reentryRule = settings.reentryRule;
  }

  // 3. Update the game columns
  await prisma.games.update({
    where: { id: gameId },
    data: {
      default_reg_periods: settings.periodCount,
      period_duration: settings.periodDuration,
      ot_if_tied: settings.hasOvertime,
      ot_duration: settings.overtimeDuration,
      so_if_tied: settings.hasShootout,
      notes: JSON.stringify(notesObj),
    },
  });

  revalidatePath(`/gamestats/${teamSeasonId}/${gameId}`);
  revalidatePath(`/gamestats/${teamSeasonId}/${gameId}/settings`);

  return { success: true };
}
