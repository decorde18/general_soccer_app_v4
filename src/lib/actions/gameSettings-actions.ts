"use server";

import prisma from "@/lib/prisma";
import { requireSession, verifyGameAccess } from "../auth/auth-utils";
import { revalidatePath } from "next/cache";

interface GameSettingsInput {
  playersOnField?: number;
  periodCount: number;
  periodDuration: number;
  hasOvertime: boolean;
  overtimeDuration: number;
  hasShootout: boolean;
  reentryRule?: string;
  autoStopClockOnMajorEvent?: boolean;
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
      if (typeof notesObj === "string") {
        try {
          notesObj = JSON.parse(notesObj);
        } catch {}
      }
    } catch {
      notesObj = { rawNotes: existingGame.notes };
    }
  }

  if (typeof settings.playersOnField === "number") {
    notesObj.playersOnField = settings.playersOnField;
  }
  if (settings.reentryRule) {
    notesObj.reentryRule = settings.reentryRule;
  }
  if (typeof settings.autoStopClockOnMajorEvent === "boolean") {
    notesObj.autoStopClockOnMajorEvent = settings.autoStopClockOnMajorEvent;
  }

  // 3. Update the game columns
  await prisma.games.update({
    where: { id: gameId },
    data: {
      default_reg_periods: Number(settings.periodCount),
      period_duration: Number(settings.periodDuration),
      ot_if_tied: Boolean(settings.hasOvertime),
      ot_duration: Number(settings.overtimeDuration),
      so_if_tied: Boolean(settings.hasShootout),
      notes: JSON.stringify(notesObj),
    },
  });

  revalidatePath(`/gamestats/${teamSeasonId}/${gameId}`);
  revalidatePath(`/gamestats/${teamSeasonId}/${gameId}/settings`);

  return { success: true };
}
