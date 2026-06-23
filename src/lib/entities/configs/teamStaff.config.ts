// config/teamStaff.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const teamStaffConfig: EntityConfig = {
  title: "Team Staff Assignments",
  singular: "Staff Assignment",
  plural: "Team Staff Assignments",

  permissions: {
    view: ["ADMIN"],
    create: ["ADMIN"],
    edit: ["ADMIN"],
    delete: ["ADMIN"],
  },

  table: {
    columns: [
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
        key: "seasonName",
        label: "Season",
        type: "text",
        sortable: true,
      },
      {
        key: "personName",
        label: "Person Name",
        type: "text",
        sortable: true,
      },
      {
        key: "role",
        label: "Role",
        type: "badge",
        sortable: true,
        options: {
          head_coach: "green",
          assistant_coach: "blue",
          team_admin: "amber",
          stats_keeper: "gray",
        },
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
        key: "teamName", // displayed field label/key mapping
        valueKey: "teamSeasonId", // DB key to submit
        type: "select",
        label: "Team Season",
        required: true,
        placeholder: "Select Team Season",
        gridColumn: "span-12",
        options: [],
      },
      {
        key: "personName",
        valueKey: "personId",
        type: "select",
        label: "Person",
        required: true,
        placeholder: "Select Person",
        gridColumn: "span-12",
        options: [],
      },
      {
        key: "role",
        type: "select",
        label: "Role",
        required: true,
        gridColumn: "span-12",
        options: [
          { value: "head_coach", label: "Head Coach" },
          { value: "assistant_coach", label: "Assistant Coach" },
          { value: "team_admin", label: "Team Admin" },
          { value: "stats_keeper", label: "Stats Keeper" },
        ],
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
