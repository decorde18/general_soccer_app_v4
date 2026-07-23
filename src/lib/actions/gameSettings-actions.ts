"use server";

import prisma from "@/lib/prisma";
import { requireSession, verifyTeamAccess } from "../auth/auth-utils";
import { revalidatePath } from "next/cache";

interface GameSettingsInput {
  periodCount: number;
  periodDuration: number;
  hasOvertime: boolean;
  overtimeDuration: number;
  hasShootout: boolean;
}

export async function updateGameSettings(
  gameId: number,
  teamSeasonId: number,
  settings: GameSettingsInput
) {
  // 1. Ensure user is logged in
  await requireSession();

  // 2. Verify user has write access to the target team season
  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    select: { team_id: true }
  });
  if (!teamSeason) {
    throw new Error("Target team season not found");
  }
  await verifyTeamAccess(teamSeason.team_id);

  // 3. Update the game columns
  await prisma.games.update({
    where: { id: gameId },
    data: {
      default_reg_periods: settings.periodCount,
      period_duration: settings.periodDuration,
      ot_if_tied: settings.hasOvertime,
      ot_duration: settings.overtimeDuration,
      so_if_tied: settings.hasShootout,
    },
  });

  revalidatePath(`/gamestats/${teamSeasonId}/${gameId}`);
  revalidatePath(`/gamestats/${teamSeasonId}/${gameId}/settings`);

  return { success: true };
}
