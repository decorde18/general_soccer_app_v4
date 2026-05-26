// config/club.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const clubConfig: EntityConfig = {
  title: "Clubs",
  singular: "Club",
  plural: "Clubs",

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
        label: "Club Name",
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
        key: "location",
        label: "Location",
        type: "text",
        sortable: true,
        hiddenOnMobile: true,
      },
      {
        key: "contactInfo",
        label: "Contact Info",
        type: "text",
        sortable: false,
        hiddenOnMobile: true,
      },
      {
        key: "isActive",
        label: "Active",
        type: "boolean",
        sortable: true,
        hiddenOnMobile: true,
      },
      {
        key: "type",
        label: "Type",
        type: "badge",
        sortable: true,
        options: {
          club: "green",
          high_school: "blue",
        },
      },
    ],
  },

  form: {
    layout: "grid",
    fields: [
      {
        key: "name",
        label: "Club Name",
        type: "text",
        required: true,
        placeholder: "e.g. LA Galaxy",
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
        key: "foundedYear",
        label: "Founded Year",
        type: "number",
        required: false,
        placeholder: "e.g. 1996",
        gridColumn: "span-4",
      },
      {
        key: "location",
        label: "Location",
        type: "text",
        required: false,
        placeholder: "City, State",
        gridColumn: "span-12",
      },
      {
        key: "locationName",
        valueKey: "locationId",
        type: "select",
        label: "Location",
        required: false,
        placeholder: "Select or add location",
        gridColumn: "span-8",
        creatable: true,
        options: [],
      },
      {
        key: "logoUrl",
        label: "Logo Url",
        type: "text",
        required: false,
        placeholder: "logo url...",
        gridColumn: "span-12",
      },
      {
        key: "contactInfo",
        label: "Website",
        type: "text",
        required: false,
        placeholder: "Club website url",
        gridColumn: "span-12",
      },
      {
        key: "isActive",
        label: "Active",
        type: "toggle",
        required: false,
        gridColumn: "span-12",
      },
      {
        key: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "club", label: "Club" },
          { value: "high_school", label: "High School" },
        ],
        gridColumn: "span-4",
      },
    ],
  },
};
