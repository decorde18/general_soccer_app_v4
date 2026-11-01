"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPerformanceTests(
  teamSeasonId?: number,
  programTeamSeasonIds?: number[]
) {
  const ids =
    programTeamSeasonIds && programTeamSeasonIds.length > 0
      ? programTeamSeasonIds
      : teamSeasonId
      ? [teamSeasonId]
      : [];

  return await prisma.performance_tests.findMany({
    where: ids.length > 0 ? { team_season_id: { in: ids } } : {},
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function upsertPerformanceTest(data: {
  id?: number;
  teamSeasonId?: number | null;
  name: string;
  unit: string;
  higherIsBetter?: boolean;
  description?: string | null;
}) {
  let record;
  if (data.id) {
    record = await prisma.performance_tests.update({
      where: { id: data.id },
      data: {
        name: data.name,
        unit: data.unit,
        higher_is_better: data.higherIsBetter ?? true,
        description: data.description || null,
        team_season_id: data.teamSeasonId || null,
      },
    });
  } else {
    record = await prisma.performance_tests.create({
      data: {
        name: data.name,
        unit: data.unit,
        higher_is_better: data.higherIsBetter ?? true,
        description: data.description || null,
        team_season_id: data.teamSeasonId || null,
      },
    });
  }

  if (data.teamSeasonId) {
    revalidatePath(`/roster`);
  }
  return record;
}

export async function deletePerformanceTest(id: number, teamSeasonId?: number) {
  const result = await prisma.performance_tests.delete({
    where: { id },
  });
  if (teamSeasonId) {
    revalidatePath(`/roster`);
  }
  return result;
}

export async function getPlayerPerformanceLogs(
  teamSeasonId: number,
  testId?: number,
  playerId?: number,
  programTeamSeasonIds?: number[]
) {
  const ids =
    programTeamSeasonIds && programTeamSeasonIds.length > 0
      ? programTeamSeasonIds
      : teamSeasonId
      ? [teamSeasonId]
      : [];

  const where: any = {};
  if (testId) where.test_id = testId;
  if (playerId) where.player_id = playerId;

  if (ids.length > 0) {
    where.performance_tests = {
      team_season_id: { in: ids },
    };
  }

  const seasonLogs = await prisma.player_performance_logs.findMany({
    where,
    include: {
      performance_tests: true,
      people: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: [
      { test_date: "desc" },
      { created_at: "desc" },
    ],
  });

  if (seasonLogs.length > 0 || testId || playerId || ids.length === 0) {
    return seasonLogs;
  }

  // Fallback: if this specific season has no direct logs recorded yet,
  // check if rostered players in this season have career fitness logs from adjacent seasons.
  const rostered = await prisma.player_teams.findMany({
    where: {
      team_season_id: { in: ids },
      status: "rostered",
      is_active: true,
    },
    select: { player_id: true },
  });

  const rosteredPlayerIds = Array.from(new Set(rostered.map((r) => r.player_id)));
  if (rosteredPlayerIds.length === 0) {
    return [];
  }

  return await prisma.player_performance_logs.findMany({
    where: {
      player_id: { in: rosteredPlayerIds },
    },
    include: {
      performance_tests: true,
      people: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: [
      { test_date: "desc" },
      { created_at: "desc" },
    ],
  });
}

export async function recordPlayerPerformanceLog(data: {
  id?: number;
  testId: number;
  playerId: number;
  testDate: string | Date;
  scoreNumeric?: number | null;
  scoreDisplay: string;
  entrySource?: string; // 'coach_practice', 'player_home', 'self_reported'
  durationSeconds?: number | null;
  frequencyReps?: number | null;
  intervalDetails?: string | null;
  verificationStatus?: string; // 'verified', 'pending_coach_review', 'flagged'
  notes?: string | null;
  recordedByPersonId?: number;
  teamSeasonId?: number;
}) {
  const testDateObj = typeof data.testDate === "string" ? new Date(data.testDate) : data.testDate;

  let record;
  if (data.id) {
    record = await prisma.player_performance_logs.update({
      where: { id: data.id },
      data: {
        test_id: data.testId,
        player_id: data.playerId,
        test_date: testDateObj,
        score_numeric: data.scoreNumeric ?? null,
        score_display: data.scoreDisplay,
        entry_source: data.entrySource || "coach_practice",
        duration_seconds: data.durationSeconds ?? null,
        frequency_reps: data.frequencyReps ?? null,
        interval_details: data.intervalDetails || null,
        verification_status: data.verificationStatus || "verified",
        notes: data.notes || null,
        recorded_by_person_id: data.recordedByPersonId || null,
      },
    });
  } else {
    record = await prisma.player_performance_logs.create({
      data: {
        test_id: data.testId,
        player_id: data.playerId,
        test_date: testDateObj,
        score_numeric: data.scoreNumeric ?? null,
        score_display: data.scoreDisplay,
        entry_source: data.entrySource || "coach_practice",
        duration_seconds: data.durationSeconds ?? null,
        frequency_reps: data.frequencyReps ?? null,
        interval_details: data.intervalDetails || null,
        verification_status: data.verificationStatus || "verified",
        notes: data.notes || null,
        recorded_by_person_id: data.recordedByPersonId || null,
      },
    });
  }

  if (data.teamSeasonId) {
    revalidatePath(`/roster`);
  }
  return record;
}

export async function deletePerformanceLog(id: number, teamSeasonId?: number) {
  const res = await prisma.player_performance_logs.delete({
    where: { id },
  });
  if (teamSeasonId) {
    revalidatePath(`/roster`);
  }
  return res;
}
