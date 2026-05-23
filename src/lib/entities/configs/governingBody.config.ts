// config/governingBodies.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const governingBodyConfig: EntityConfig = {
  title: "Governing Bodies",
  singular: "Governing Body",
  plural: "Governing Bodies",

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
        label: "Governing Body Name",
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
        key: "website",
        label: "Website",
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
        label: "Governing Body Name",
        type: "text",
        required: true,
        placeholder: "e.g. USSF",
        gridColumn: "span-2",
      },
      {
        key: "abbreviation",
        label: "Abbreviation",
        type: "text",
        required: false,
        placeholder: "e.g. PL",
        gridColumn: "span-1",
      },
      {
        key: "website",
        label: "Website",
        type: "text",
        required: false,
        placeholder: "e.g. https://ussf.org",
        gridColumn: "span-1",
      },
    ],
  },
};
