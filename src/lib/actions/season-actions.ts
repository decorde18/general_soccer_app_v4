"use server";

import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import { seasonSchema } from "@/lib/validations/schemas";

export async function createSeason(data: Record<string, any>) {
  await verifyAdmin();

  // Validate server-side with Zod
  const parsed = seasonSchema.parse(data);

  // Determine ageGroupIds
  let targetAgeGroupIds: number[] = [];

  if (Array.isArray(data.ageGroupIds)) {
    targetAgeGroupIds = data.ageGroupIds.map(Number).filter(Boolean);
  } else {
    // If not provided, borrow age groups from the most recent season
    const lastSeason = await prisma.seasons.findFirst({
      orderBy: { start_date: "desc" },
      include: { season_age_groups: true },
    });
    if (lastSeason && lastSeason.season_age_groups.length > 0) {
      targetAgeGroupIds = lastSeason.season_age_groups.map((sag) => sag.age_group_id);
    }
  }

  const newSeason = await prisma.seasons.create({
    data: {
      season_name: parsed.seasonName,
      start_date: new Date(parsed.startDate),
      end_date: new Date(parsed.endDate),
      status: parsed.status,
      season_age_groups: {
        create: targetAgeGroupIds.map((agId) => ({
          age_group_id: agId,
        })),
      },
    },
  });

  revalidatePath("/admin/seasons");
  return newSeason;
}

export async function updateSeason(id: unknown, data: Record<string, any>) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  // Validate server-side with Zod (partial for updates)
  const parsed = seasonSchema.partial().parse(data);

  const updateData: any = {};
  if (parsed.seasonName) updateData.season_name = parsed.seasonName;
  if (parsed.startDate) updateData.start_date = new Date(parsed.startDate);
  if (parsed.endDate) updateData.end_date = new Date(parsed.endDate);
  if (parsed.status) updateData.status = parsed.status;

  await prisma.seasons.update({
    where: { id: numId },
    data: updateData,
  });

  // If ageGroupIds is provided in payload, update season_age_groups
  if (Array.isArray(data.ageGroupIds)) {
    const newAgeGroupIds: number[] = data.ageGroupIds.map(Number).filter(Boolean);

    // Delete current season_age_groups for this season
    await prisma.season_age_groups.deleteMany({
      where: { season_id: numId },
    });

    // Insert new ones
    if (newAgeGroupIds.length > 0) {
      await prisma.season_age_groups.createMany({
        data: newAgeGroupIds.map((agId) => ({
          season_id: numId,
          age_group_id: agId,
        })),
      });
    }
  }

  revalidatePath("/admin/seasons");
}

export async function deleteSeason(id: unknown) {
  await verifyAdmin();
  const numId = Number(id);
  if (!numId) throw new Error("ID required");

  await prisma.seasons.delete({
    where: { id: numId },
  });

  revalidatePath("/admin/seasons");
}

export interface TransitionSeasonPayload {
  completedSeasonId: number;
  upcomingSeasonId?: number | null;
  archiveCompletedTeams?: boolean;
  createNewTeams?: boolean;
}

export async function transitionCompletedSeason(payload: TransitionSeasonPayload) {
  await verifyAdmin();

  const {
    completedSeasonId,
    upcomingSeasonId,
    archiveCompletedTeams = true,
    createNewTeams = true,
  } = payload;

  if (!completedSeasonId) {
    throw new Error("Completed season ID is required.");
  }

  // 1. Mark completed season as completed
  await prisma.seasons.update({
    where: { id: completedSeasonId },
    data: { status: "completed" },
  });

  // 2. If upcomingSeasonId is specified, mark it active & mark all previous active seasons as completed
  if (upcomingSeasonId) {
    await prisma.seasons.updateMany({
      where: { status: "active", id: { not: upcomingSeasonId } },
      data: { status: "completed" },
    });

    await prisma.seasons.update({
      where: { id: upcomingSeasonId },
      data: { status: "active" },
    });
  }

  // 3. Archive team_seasons for the completed season
  if (archiveCompletedTeams) {
    await prisma.team_seasons.updateMany({
      where: { season_id: completedSeasonId },
      data: { is_active: false },
    });
  }

  // 4. Create blank new team_seasons for the upcoming season based on completed season's teams & age groups
  let newTeamsCreatedCount = 0;

  if (createNewTeams && upcomingSeasonId) {
    const completedTeamSeasons = await prisma.team_seasons.findMany({
      where: { season_id: completedSeasonId },
    });

    const existingUpcomingTeamSeasons = await prisma.team_seasons.findMany({
      where: { season_id: upcomingSeasonId },
      select: { team_id: true, age_group: true },
    });

    const existingKeys = new Set(
      existingUpcomingTeamSeasons.map((ts) => `${ts.team_id}-${ts.age_group ?? "none"}`)
    );

    const newTeamSeasonsData: any[] = [];

    for (const cts of completedTeamSeasons) {
      const key = `${cts.team_id}-${cts.age_group ?? "none"}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        newTeamSeasonsData.push({
          team_id: cts.team_id,
          season_id: upcomingSeasonId,
          age_group: cts.age_group,
          is_active: true,
        });
      }
    }

    if (newTeamSeasonsData.length > 0) {
      await prisma.team_seasons.createMany({
        data: newTeamSeasonsData,
      });
      newTeamsCreatedCount = newTeamSeasonsData.length;
    }
  }

  revalidatePath("/admin/seasons");
  revalidatePath("/admin/clubs");
  revalidatePath("/admin/rollover");

  return {
    success: true,
    newTeamsCreatedCount,
    message: `Season transition completed successfully. ${
      newTeamsCreatedCount > 0
        ? `Created ${newTeamsCreatedCount} new blank team(s) for the active season.`
        : ""
    }`,
  };
}
