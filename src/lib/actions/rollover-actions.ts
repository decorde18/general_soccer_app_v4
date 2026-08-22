"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { getTeamRosterForRollover, RolloverPlayer } from "@/lib/data/queries";

export interface RolloverPayload {
  sourceTeamSeasonId?: number;
  sourceTeamSeasonIds?: number[];
  targetTeamSeasonId: number;
  playerPersonIds: number[];
  incrementGrade?: boolean;
  targetStatus?: string;
}

/**
 * Helper to bump grade level by 1
 */
function bumpGrade(currentGrade: string | null): string | null {
  if (!currentGrade) return null;
  const trimmed = currentGrade.trim().toLowerCase();

  if (trimmed === "9" || trimmed === "9th" || trimmed === "freshman") return "10th";
  if (trimmed === "10" || trimmed === "10th" || trimmed === "sophomore") return "11th";
  if (trimmed === "11" || trimmed === "11th" || trimmed === "junior") return "12th";
  if (trimmed === "12" || trimmed === "12th" || trimmed === "senior") return "Graduated";

  // Try regex for numeric grade
  const numMatch = trimmed.match(/^(\d+)(st|nd|rd|th)?$/);
  if (numMatch) {
    const val = parseInt(numMatch[1], 10);
    if (!isNaN(val)) {
      return `${val + 1}th`;
    }
  }

  return currentGrade;
}

export async function rolloverPlayers(payload: RolloverPayload) {
  await verifyAdmin();

  const {
    sourceTeamSeasonId,
    sourceTeamSeasonIds = [],
    targetTeamSeasonId,
    playerPersonIds,
    incrementGrade = true,
    targetStatus = "rostered",
  } = payload;

  const allSourceIds = Array.from(
    new Set([
      ...(sourceTeamSeasonId ? [sourceTeamSeasonId] : []),
      ...sourceTeamSeasonIds,
    ])
  );

  if (allSourceIds.length === 0 || !targetTeamSeasonId) {
    throw new Error("Source and Target Team Seasons are required.");
  }

  if (allSourceIds.includes(targetTeamSeasonId)) {
    throw new Error("Target Team Season cannot be one of the Source Team Seasons.");
  }

  if (!playerPersonIds || playerPersonIds.length === 0) {
    throw new Error("No players selected for rollover.");
  }

  // 1. Get existing players in target team season to prevent duplicates
  const existingTargetEnrollments = await prisma.player_teams.findMany({
    where: {
      team_season_id: targetTeamSeasonId,
      player_id: { in: playerPersonIds },
    },
    select: { player_id: true },
  });

  const existingPersonIds = new Set(existingTargetEnrollments.map((e) => e.player_id));
  const newPersonIds = playerPersonIds.filter((id) => !existingPersonIds.has(id));

  if (newPersonIds.length === 0) {
    return {
      success: true,
      count: 0,
      skipped: playerPersonIds.length,
      message: "All selected players are already enrolled in the target team season.",
    };
  }

  // 2. Query source player_teams records for these players across all selected source team seasons
  const sourcePlayerRecords = await prisma.player_teams.findMany({
    where: {
      team_season_id: { in: allSourceIds },
      player_id: { in: newPersonIds },
    },
    orderBy: { joined_date: "desc" },
  });

  // Deduplicate source records by player_id
  const uniqueSourceRecsMap = new Map<number, any>();
  sourcePlayerRecords.forEach((rec) => {
    if (!uniqueSourceRecsMap.has(rec.player_id)) {
      uniqueSourceRecsMap.set(rec.player_id, rec);
    }
  });

  // 3. Create new player_teams rows for target team season
  const newRecordsData = Array.from(uniqueSourceRecsMap.values()).map((sourceRec) => {
    const newGrade = incrementGrade ? bumpGrade(sourceRec.grade) : sourceRec.grade;

    return {
      player_id: sourceRec.player_id,
      team_season_id: targetTeamSeasonId,
      jersey_number: sourceRec.jersey_number,
      alt_jersey_number: sourceRec.alt_jersey_number,
      gk_number: sourceRec.gk_number,
      position: sourceRec.position,
      grade: newGrade,
      status: (targetStatus as any) || "rostered",
      is_active: true,
      joined_date: new Date(),
    };
  });

  if (newRecordsData.length > 0) {
    await prisma.player_teams.createMany({
      data: newRecordsData,
    });
  }

  revalidatePath("/admin/rollover");
  revalidatePath("/admin/clubs");
  revalidatePath(`/teams/${targetTeamSeasonId}`);

  return {
    success: true,
    count: newRecordsData.length,
    skipped: existingPersonIds.size,
    message: `Successfully rolled over ${newRecordsData.length} player(s) to the target team season.`,
  };
}

/**
 * Server action wrapper to fetch roster players for a team season
 */
export async function getTeamRosterAction(teamSeasonId: number): Promise<RolloverPlayer[]> {
  await verifyAdmin();
  if (!teamSeasonId) return [];
  return getTeamRosterForRollover(teamSeasonId);
}
