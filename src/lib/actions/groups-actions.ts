"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTeamGroups(teamSeasonId: number) {
  return await prisma.team_groups.findMany({
    where: { team_season_id: teamSeasonId },
    include: {
      player_group_assignments: {
        include: {
          people: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              gender: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function upsertTeamGroup(data: {
  id?: number;
  teamSeasonId: number;
  name: string;
  groupType?: string;
  description?: string | null;
  assignedWeeksOrDates?: string | null;
}) {
  let record;
  if (data.id) {
    record = await prisma.team_groups.update({
      where: { id: data.id },
      data: {
        name: data.name,
        group_type: data.groupType || "general",
        description: data.description || null,
        assigned_weeks_or_dates: data.assignedWeeksOrDates || null,
      },
    });
  } else {
    record = await prisma.team_groups.create({
      data: {
        team_season_id: data.teamSeasonId,
        name: data.name,
        group_type: data.groupType || "general",
        description: data.description || null,
        assigned_weeks_or_dates: data.assignedWeeksOrDates || null,
      },
    });
  }

  revalidatePath(`/roster`);
  return record;
}

export async function deleteTeamGroup(id: number, teamSeasonId: number) {
  const res = await prisma.team_groups.delete({
    where: { id },
  });
  revalidatePath(`/roster`);
  return res;
}

export async function assignPlayerToGroup(data: {
  groupId: number;
  playerId: number;
  role?: string;
  teamSeasonId?: number;
}) {
  const existing = await prisma.player_group_assignments.findFirst({
    where: {
      group_id: data.groupId,
      player_id: data.playerId,
    },
  });

  let record;
  if (existing) {
    record = await prisma.player_group_assignments.update({
      where: { id: existing.id },
      data: { role: data.role || "member" },
    });
  } else {
    record = await prisma.player_group_assignments.create({
      data: {
        group_id: data.groupId,
        player_id: data.playerId,
        role: data.role || "member",
      },
    });
  }

  if (data.teamSeasonId) {
    revalidatePath(`/roster`);
  }
  return record;
}

export async function removePlayerFromGroup(groupId: number, playerId: number, teamSeasonId?: number) {
  const res = await prisma.player_group_assignments.deleteMany({
    where: {
      group_id: groupId,
      player_id: playerId,
    },
  });

  if (teamSeasonId) {
    revalidatePath(`/roster`);
  }
  return res;
}

export async function getPlayerPairings(teamSeasonId: number) {
  return await prisma.player_pairings.findMany({
    where: { team_season_id: teamSeasonId },
    include: {
      people_player_pairings_player1_idTopeople: {
        select: { id: true, first_name: true, last_name: true },
      },
      people_player_pairings_player2_idTopeople: {
        select: { id: true, first_name: true, last_name: true },
      },
    },
  });
}

export async function upsertPlayerPairing(data: {
  id?: number;
  teamSeasonId: number;
  pairingType?: string;
  player1Id: number;
  player2Id: number;
  notes?: string | null;
}) {
  let record;
  if (data.id) {
    record = await prisma.player_pairings.update({
      where: { id: data.id },
      data: {
        pairing_type: data.pairingType || "sister",
        player1_id: data.player1Id,
        player2_id: data.player2Id,
        notes: data.notes || null,
      },
    });
  } else {
    record = await prisma.player_pairings.create({
      data: {
        team_season_id: data.teamSeasonId,
        pairing_type: data.pairingType || "sister",
        player1_id: data.player1Id,
        player2_id: data.player2Id,
        notes: data.notes || null,
      },
    });
  }

  revalidatePath(`/roster`);
  return record;
}

export async function deletePlayerPairing(id: number, teamSeasonId: number) {
  const res = await prisma.player_pairings.delete({
    where: { id },
  });
  revalidatePath(`/roster`);
  return res;
}
