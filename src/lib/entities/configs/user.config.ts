// config/user.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const userConfig: EntityConfig = {
  title: "Users",
  singular: "User",
  plural: "Users",

  permissions: {
    view: ["ADMIN"],
    create: ["ADMIN"],
    edit: ["ADMIN"],
    delete: ["ADMIN"],
  },

  table: {
    columns: [
      {
        key: "firstName",
        label: "First Name",
        type: "text",
        sortable: true,
      },
      {
        key: "lastName",
        label: "Last Name",
        type: "text",
        sortable: true,
      },
      {
        key: "email",
        label: "Email",
        type: "text",
        sortable: true,
      },
      {
        key: "systemAdmin",
        label: "System Admin",
        type: "boolean",
        sortable: true,
      },
      {
        key: "rolesList",
        label: "Assigned Roles",
        type: "text",
        sortable: false,
      },
    ],
  },

  form: {
    layout: "grid",
    fields: [
      {
        key: "firstName",
        label: "First Name",
        type: "text",
        required: true,
        placeholder: "e.g. John",
        gridColumn: "span-6",
      },
      {
        key: "lastName",
        label: "Last Name",
        type: "text",
        required: true,
        placeholder: "e.g. Doe",
        gridColumn: "span-6",
      },
      {
        key: "email",
        label: "Email",
        type: "text",
        required: true,
        placeholder: "e.g. john.doe@example.com",
        gridColumn: "span-12",
      },
      {
        key: "password",
        label: "Password",
        type: "text",
        required: false,
        placeholder: "Enter password (leave blank to keep current)",
        gridColumn: "span-12",
      },
      {
        key: "systemAdmin",
        label: "System Admin Access",
        type: "toggle",
        required: false,
        gridColumn: "span-12",
      },
    ],
  },
};
