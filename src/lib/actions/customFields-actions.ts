"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CustomFieldDefinitionInput {
  id?: number;
  teamSeasonId?: number | null;
  clubId?: number | null;
  fieldKey: string;
  label: string;
  fieldType: string; // 'text', 'number', 'boolean', 'select', 'date', 'compound_status_dates', 'fee_payment', 'vote'
  category?: string;
  options?: string | null;
  permissionRole?: string; // 'coach_edit_player_view', 'player_editable', 'coach_private'
  isRequired?: boolean;
  isAnnualRecurring?: boolean;
  displayOrder?: number;
  instructions?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

export async function getCustomFieldDefinitions(teamSeasonId?: number, clubId?: number) {
  const whereOr: any[] = [];
  if (teamSeasonId) whereOr.push({ team_season_id: teamSeasonId });
  if (clubId) whereOr.push({ club_id: clubId });
  whereOr.push({ is_annual_recurring: true });

  return await prisma.custom_field_definitions.findMany({
    where: {
      OR: whereOr,
      is_active: true,
    },
    orderBy: [
      { category: "asc" },
      { display_order: "asc" },
      { created_at: "asc" },
    ],
  });
}

export async function upsertCustomFieldDefinition(input: CustomFieldDefinitionInput) {
  const data: any = {
    team_season_id: input.teamSeasonId || null,
    club_id: input.clubId || null,
    field_key: input.fieldKey || input.label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    label: input.label,
    field_type: input.fieldType,
    category: input.category || "General",
    options: input.options || null,
    permission_role: input.permissionRole || "coach_edit_player_view",
    is_required: input.isRequired ?? false,
    is_annual_recurring: input.isAnnualRecurring ?? false,
    display_order: input.displayOrder ?? 0,
    instructions: input.instructions || null,
    action_url: input.actionUrl || null,
    action_label: input.actionLabel || null,
    is_active: true,
  };

  let record;
  if (input.id) {
    record = await prisma.custom_field_definitions.update({
      where: { id: input.id },
      data,
    });
  } else {
    record = await prisma.custom_field_definitions.create({
      data,
    });
  }

  if (input.teamSeasonId) {
    revalidatePath(`/roster`);
    revalidatePath(`/dashboard`);
  }

  return record;
}

export async function copyAnnualFieldsToSeason(targetTeamSeasonId: number, clubId?: number) {
  // Find all annual recurring fields defined at club or global level
  const recurringFields = await prisma.custom_field_definitions.findMany({
    where: {
      is_annual_recurring: true,
      is_active: true,
      OR: [{ club_id: clubId || null }, { team_season_id: null }],
    },
  });

  const createdList = [];
  for (const field of recurringFields) {
    const existing = await prisma.custom_field_definitions.findFirst({
      where: {
        team_season_id: targetTeamSeasonId,
        field_key: field.field_key,
      },
    });

    if (!existing) {
      const copy = await prisma.custom_field_definitions.create({
        data: {
          team_season_id: targetTeamSeasonId,
          club_id: field.club_id,
          field_key: field.field_key,
          label: field.label,
          field_type: field.field_type,
          category: field.category,
          options: field.options,
          permission_role: field.permission_role,
          is_required: field.is_required,
          is_annual_recurring: true,
          display_order: field.display_order,
          is_active: true,
        },
      });
      createdList.push(copy);
    }
  }

  revalidatePath(`/roster`);
  return createdList;
}

export async function deleteCustomFieldDefinition(id: number, teamSeasonId?: number) {
  const result = await prisma.custom_field_definitions.update({
    where: { id },
    data: { is_active: false },
  });

  if (teamSeasonId) {
    revalidatePath(`/roster`);
    revalidatePath(`/dashboard`);
  }
  return result;
}

export async function getCustomFieldValues(teamSeasonId: number) {
  return await prisma.custom_field_values.findMany({
    where: {
      team_season_id: teamSeasonId,
    },
    include: {
      custom_field_definitions: true,
    },
  });
}

export async function updatePlayerCustomFieldValue(data: {
  definitionId: number;
  playerId: number;
  teamSeasonId?: number | null;
  value: string | null;
  updatedByPersonId?: number;
}) {
  const existing = await prisma.custom_field_values.findFirst({
    where: {
      definition_id: data.definitionId,
      player_id: data.playerId,
    },
  });

  let record;
  if (existing) {
    record = await prisma.custom_field_values.update({
      where: { id: existing.id },
      data: {
        value: data.value,
        team_season_id: data.teamSeasonId ?? existing.team_season_id,
        updated_by_person_id: data.updatedByPersonId ?? null,
      },
    });
  } else {
    record = await prisma.custom_field_values.create({
      data: {
        definition_id: data.definitionId,
        player_id: data.playerId,
        team_season_id: data.teamSeasonId ?? null,
        value: data.value,
        updated_by_person_id: data.updatedByPersonId ?? null,
      },
    });
  }

  if (data.teamSeasonId) {
    revalidatePath(`/roster`);
    revalidatePath(`/dashboard`);
  }
  return record;
}

export async function bulkUpdateCustomFieldValues(
  updates: Array<{
    definitionId: number;
    playerId: number;
    teamSeasonId?: number | null;
    value: string | null;
  }>
) {
  const results = [];
  for (const update of updates) {
    const res = await updatePlayerCustomFieldValue(update);
    results.push(res);
  }
  return results;
}
