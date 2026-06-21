// config/season.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const seasonConfig: EntityConfig = {
  title: "Seasons",
  singular: "Season",
  plural: "Seasons",

  permissions: {
    view: ["ADMIN"],
    create: ["ADMIN"],
    edit: ["ADMIN"],
    delete: ["ADMIN"],
  },

  table: {
    columns: [
      {
        key: "seasonName",
        label: "Season Name",
        type: "text",
        sortable: true,
      },
      {
        key: "startDate",
        label: "Start Date",
        type: "date",
        sortable: true,
      },
      {
        key: "endDate",
        label: "End Date",
        type: "date",
        sortable: true,
      },
      {
        key: "status",
        label: "Status",
        type: "badge",
        sortable: true,
        options: {
          upcoming: "blue",
          active: "green",
          completed: "amber",
          archived: "gray",
        },
      },
    ],
  },

  form: {
    layout: "grid",
    fields: [
      {
        key: "seasonName",
        label: "Season Name",
        type: "text",
        required: true,
        placeholder: "e.g. Fall 2026",
        gridColumn: "span-12",
      },
      {
        key: "startDate",
        label: "Start Date",
        type: "date",
        required: true,
        gridColumn: "span-6",
      },
      {
        key: "endDate",
        label: "End Date",
        type: "date",
        required: true,
        gridColumn: "span-6",
      },
      {
        key: "status",
        type: "select",
        label: "Status",
        required: true,
        gridColumn: "span-12",
        options: [
          { value: "upcoming", label: "Upcoming" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
          { value: "archived", label: "Archived" },
        ],
      },
    ],
  },
};
