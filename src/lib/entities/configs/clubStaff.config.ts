// config/clubStaff.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const clubStaffConfig: EntityConfig = {
  title: "Club Staff Assignments",
  singular: "Staff Assignment",
  plural: "Club Staff Assignments",

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
        label: "Club Name",
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
          club_admin: "green",
          director: "blue",
          registrar: "amber",
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
        key: "clubName",
        valueKey: "clubId",
        type: "select",
        label: "Club",
        required: true,
        placeholder: "Select Club",
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
          { value: "club_admin", label: "Club Admin" },
          { value: "director", label: "Director" },
          { value: "registrar", label: "Registrar" },
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
