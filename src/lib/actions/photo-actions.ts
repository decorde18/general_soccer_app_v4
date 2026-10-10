"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTeamRosterPhotos(teamSeasonId: number) {
  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id: teamSeasonId },
    select: { require_photo_review: true },
  });

  const playerTeams = await prisma.player_teams.findMany({
    where: {
      team_season_id: teamSeasonId,
      is_active: true,
    },
    include: {
      people: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          photo_url: true,
          photo_status: true,
          photo_rejection_reason: true,
        },
      },
    },
    orderBy: [
      { jersey_number: "asc" },
      { people: { last_name: "asc" } },
    ],
  });

  const roster = playerTeams.map((pt) => ({
    playerTeamId: pt.id,
    personId: pt.people.id,
    firstName: pt.people.first_name,
    lastName: pt.people.last_name,
    jerseyNumber: pt.jersey_number,
    photoUrl: pt.people.photo_url,
    photoStatus: pt.people.photo_status || "not_uploaded",
    photoRejectionReason: pt.people.photo_rejection_reason,
  }));

  return {
    requirePhotoReview: teamSeason?.require_photo_review ?? true,
    roster,
  };
}

export async function uploadPlayerPhoto(
  personId: number,
  photoUrl: string,
  teamSeasonId?: number
) {
  let requireReview = true;
  if (teamSeasonId) {
    const ts = await prisma.team_seasons.findUnique({
      where: { id: teamSeasonId },
      select: { require_photo_review: true },
    });
    if (ts) requireReview = ts.require_photo_review ?? true;
  }

  const newStatus = requireReview ? "pending_review" : "approved";

  await prisma.people.update({
    where: { id: personId },
    data: {
      photo_url: photoUrl,
      photo_status: newStatus,
      photo_rejection_reason: null,
    },
  });

  // Sync photo requirement checklist if exists
  if (teamSeasonId) {
    const photoDef = await prisma.custom_field_definitions.findFirst({
      where: {
        team_season_id: teamSeasonId,
        field_type: "photo_upload",
        is_active: true,
      },
    });

    if (photoDef) {
      await prisma.custom_field_values.upsert({
        where: {
          definition_id_player_id: {
            definition_id: photoDef.id,
            player_id: personId,
          },
        },
        create: {
          definition_id: photoDef.id,
          player_id: personId,
          team_season_id: teamSeasonId,
          value: newStatus === "approved" ? "Completed" : "Pending Review",
        },
        update: {
          value: newStatus === "approved" ? "Completed" : "Pending Review",
        },
      });
    }

    revalidatePath(`/teams/${teamSeasonId}`);
  }

  return { success: true, photoStatus: newStatus };
}

export async function approvePlayerPhoto(personId: number, teamSeasonId?: number) {
  await prisma.people.update({
    where: { id: personId },
    data: {
      photo_status: "approved",
      photo_rejection_reason: null,
    },
  });

  if (teamSeasonId) {
    const photoDef = await prisma.custom_field_definitions.findFirst({
      where: {
        team_season_id: teamSeasonId,
        field_type: "photo_upload",
        is_active: true,
      },
    });

    if (photoDef) {
      await prisma.custom_field_values.upsert({
        where: {
          definition_id_player_id: {
            definition_id: photoDef.id,
            player_id: personId,
          },
        },
        create: {
          definition_id: photoDef.id,
          player_id: personId,
          team_season_id: teamSeasonId,
          value: "Completed",
        },
        update: {
          value: "Completed",
        },
      });
    }

    revalidatePath(`/teams/${teamSeasonId}`);
  }

  return { success: true };
}

export async function rejectPlayerPhoto(
  personId: number,
  reason: string,
  teamSeasonId?: number
) {
  await prisma.people.update({
    where: { id: personId },
    data: {
      photo_status: "rejected",
      photo_rejection_reason: reason,
    },
  });

  if (teamSeasonId) {
    const photoDef = await prisma.custom_field_definitions.findFirst({
      where: {
        team_season_id: teamSeasonId,
        field_type: "photo_upload",
        is_active: true,
      },
    });

    if (photoDef) {
      await prisma.custom_field_values.upsert({
        where: {
          definition_id_player_id: {
            definition_id: photoDef.id,
            player_id: personId,
          },
        },
        create: {
          definition_id: photoDef.id,
          player_id: personId,
          team_season_id: teamSeasonId,
          value: `Rejected: ${reason}`,
        },
        update: {
          value: `Rejected: ${reason}`,
        },
      });
    }

    revalidatePath(`/teams/${teamSeasonId}`);
  }

  return { success: true };
}

export async function updateTeamPhotoReviewSetting(
  teamSeasonId: number,
  requirePhotoReview: boolean
) {
  await prisma.team_seasons.update({
    where: { id: teamSeasonId },
    data: { require_photo_review: requirePhotoReview },
  });

  revalidatePath(`/teams/${teamSeasonId}`);
  return { success: true };
}
