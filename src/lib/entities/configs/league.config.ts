// config/league.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const leagueConfig: EntityConfig = {
  title: "Leagues",
  singular: "League",
  plural: "Leagues",

  permissions: {
    view: ["ADMIN", "TEAM_ADMIN", "COACH", "PLAYER"],
    create: ["ADMIN", "TEAM_ADMIN", "COACH"],
    edit: ["ADMIN", "TEAM_ADMIN", "COACH"],
    delete: ["ADMIN"],
  },

  table: {
    columns: [
      {
        key: "name",
        label: "League Name",
        type: "text",
        sortable: true,
      },
      {
        key: "abbreviation",
        label: "Abbreviation",
        type: "text",
        sortable: true,
        hiddenOnMobile: true,
      },
      {
        key: "governingBodyName",
        label: "Governing Body",
        type: "text",
        sortable: true,
        hiddenOnMobile: true,
      },
      {
        key: "status",
        label: "Status",
        type: "badge",
        sortable: true,
        options: {
          active: "green",
          upcoming: "blue",
          inactive: "gray",
        },
      },
      {
        key: "isTournament",
        label: "Tournament",
        type: "text",
        sortable: true,
        hiddenOnMobile: true,
      },
    ],
  },

  form: {
    layout: "grid",
    fields: [
      {
        key: "name",
        label: "League Name",
        type: "text",
        required: true,
        placeholder: "e.g. Premier League",
        gridColumn: "span-12",
      },
      {
        key: "abbreviation",
        label: "Abbreviation",
        type: "text",
        required: false,
        placeholder: "e.g. PL",
        gridColumn: "span-4",
      },
      {
        key: "governingBodyName",
        label: "Governing Body",
        type: "select",
        required: false,
        placeholder: "Select or add governing body",
        gridColumn: "span-8",
        creatable: true,
        options: [], // Options will be populated in page.tsx
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "active", label: "Active" },
          { value: "upcoming", label: "Upcoming" },
          { value: "inactive", label: "Inactive" },
        ],
        gridColumn: "span-4",
      },
      {
        key: "isTournament",
        label: "Tournament",
        type: "toggle",
        required: false,
        gridColumn: "span-12",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        required: false,
        placeholder: "League details and notes...",
        gridColumn: "span-12",
      },
    ],
  },
};
