// config/teamEnrollment.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const teamEnrollmentConfig: EntityConfig = {
  title: "Team League Enrollments",
  singular: "Team Enrollment",
  plural: "Team League Enrollments",

  permissions: {
    view: ["ADMIN"],
    create: ["ADMIN"],
    edit: ["ADMIN"],
    delete: ["ADMIN"],
  },

  table: {
    columns: [
      {
        key: "leagueName",
        label: "League",
        type: "text",
        sortable: true,
      },
      {
        key: "leagueNodeName",
        label: "League Node / Division",
        type: "text",
        sortable: true,
      },
      {
        key: "seasonName",
        label: "Season",
        type: "text",
        sortable: true,
      },
      {
        key: "clubName",
        label: "Club",
        type: "text",
        sortable: true,
      },
      {
        key: "teamName",
        label: "Team Name",
        type: "text",
        sortable: true,
      },
      {
        key: "isActive",
        label: "Active",
        type: "boolean",
        sortable: true,
      },
    ],
  },

  form: {
    layout: "grid",
    fields: [
      {
        key: "teamName",
        valueKey: "teamSeasonId",
        type: "select",
        label: "Team Season",
        required: true,
        placeholder: "Select Team Season",
        gridColumn: "span-12",
        options: [],
      },
      {
        key: "seasonName",
        valueKey: "seasonId",
        type: "select",
        label: "Season",
        required: true,
        placeholder: "Select Season",
        gridColumn: "span-12",
        options: [],
      },
      {
        key: "leagueNodeName",
        valueKey: "leagueNodeId",
        type: "select",
        label: "League Node / Division",
        required: true,
        placeholder: "Select League Node",
        gridColumn: "span-12",
        options: [],
      },
      {
        key: "isActive",
        label: "Active",
        type: "toggle",
        required: false,
        gridColumn: "span-12",
      },
    ],
  },
};
