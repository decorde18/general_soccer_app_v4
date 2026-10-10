"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPlayerUnavailability(teamSeasonId?: number, playerId?: number) {
  const where: any = {};
  if (teamSeasonId) where.team_season_id = teamSeasonId;
  if (playerId) where.player_id = playerId;

  return await prisma.player_unavailability.findMany({
    where,
    include: {
      people: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      events: {
        select: {
          id: true,
          title: true,
          start_datetime: true,
          end_datetime: true,
        },
      },
    },
    orderBy: [
      { start_date: "asc" },
    ],
  });
}

export async function upsertPlayerUnavailability(data: {
  id?: number;
  playerId: number;
  teamSeasonId?: number | null;
  eventId?: number | null;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string | null;
  status?: string;
}) {
  const startDateObj = typeof data.startDate === "string" ? new Date(data.startDate) : data.startDate;
  const endDateObj = typeof data.endDate === "string" ? new Date(data.endDate) : data.endDate;

  let record;
  if (data.id) {
    record = await prisma.player_unavailability.update({
      where: { id: data.id },
      data: {
        player_id: data.playerId,
        team_season_id: data.teamSeasonId || null,
        event_id: data.eventId || null,
        start_date: startDateObj,
        end_date: endDateObj,
        reason: data.reason || null,
        status: data.status || "pending",
      },
    });
  } else {
    record = await prisma.player_unavailability.create({
      data: {
        player_id: data.playerId,
        team_season_id: data.teamSeasonId || null,
        event_id: data.eventId || null,
        start_date: startDateObj,
        end_date: endDateObj,
        reason: data.reason || null,
        status: data.status || "pending",
      },
    });
  }

  if (data.teamSeasonId) {
    revalidatePath(`/roster`);
    revalidatePath(`/schedule`);
  }
  return record;
}

export async function deletePlayerUnavailability(id: number, teamSeasonId?: number) {
  const res = await prisma.player_unavailability.delete({
    where: { id },
  });

  if (teamSeasonId) {
    revalidatePath(`/roster`);
    revalidatePath(`/schedule`);
  }
  return res;
}

// ----------------------------------------------------
// Event Attendance & Roll Call Integration
// ----------------------------------------------------

export async function getEventAttendance(eventId: number, teamSeasonId?: number) {
  const attendanceRecords = await prisma.event_attendance.findMany({
    where: { event_id: eventId },
    include: {
      people: {
        select: { id: true, first_name: true, last_name: true },
      },
      player_unavailability: true,
    },
  });

  const eventObj = await prisma.events.findUnique({
    where: { id: eventId },
  });

  if (!eventObj || !teamSeasonId) return attendanceRecords;

  const eventDate = new Date(eventObj.start_datetime);
  const unavailabilities = await prisma.player_unavailability.findMany({
    where: {
      team_season_id: teamSeasonId,
      status: "approved",
      start_date: { lte: eventDate },
      end_date: { gte: eventDate },
    },
  });

  const attendanceMap = new Map(attendanceRecords.map((r) => [r.player_id, r]));

  for (const unavail of unavailabilities) {
    if (!attendanceMap.has(unavail.player_id)) {
      const autoAtt = await prisma.event_attendance.create({
        data: {
          event_id: eventId,
          player_id: unavail.player_id,
          unavailability_id: unavail.id,
          status: "absent_excused",
          notes: unavail.reason ? `Excused: ${unavail.reason}` : "Excused Absence",
        },
        include: {
          people: { select: { id: true, first_name: true, last_name: true } },
          player_unavailability: true,
        },
      });
      attendanceRecords.push(autoAtt);
    }
  }

  return attendanceRecords;
}

export async function markEventAttendance(data: {
  eventId: number;
  playerId: number;
  status: string; // 'present', 'absent_excused', 'absent_unexcused', 'late', 'injured'
  unavailabilityId?: number | null;
  notes?: string | null;
  teamSeasonId?: number;
}) {
  const existing = await prisma.event_attendance.findFirst({
    where: {
      event_id: data.eventId,
      player_id: data.playerId,
    },
  });

  let record;
  if (existing) {
    record = await prisma.event_attendance.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        unavailability_id: data.unavailabilityId ?? existing.unavailability_id,
        notes: data.notes ?? existing.notes,
        check_in_time: data.status === "present" || data.status === "late" ? new Date() : null,
      },
    });
  } else {
    record = await prisma.event_attendance.create({
      data: {
        event_id: data.eventId,
        player_id: data.playerId,
        status: data.status,
        unavailability_id: data.unavailabilityId || null,
        notes: data.notes || null,
        check_in_time: data.status === "present" || data.status === "late" ? new Date() : null,
      },
    });
  }

  if (data.teamSeasonId) {
    revalidatePath(`/schedule`);
    revalidatePath(`/roster`);
  }
  return record;
}

export async function bulkMarkEventAttendance(
  eventId: number,
  records: Array<{ playerId: number; status: string; notes?: string }>,
  teamSeasonId?: number
) {
  const results = [];
  for (const item of records) {
    const res = await markEventAttendance({
      eventId,
      playerId: item.playerId,
      status: item.status,
      notes: item.notes,
      teamSeasonId,
    });
    results.push(res);
  }
  return results;
}
