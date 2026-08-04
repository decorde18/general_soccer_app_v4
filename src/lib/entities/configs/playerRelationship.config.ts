import type { EntityConfig } from "@/components/entities/types";

export const playerRelationshipConfig: EntityConfig = {
  title: "Parent-Player Links",
  singular: "Parent-Player Link",
  plural: "Parent-Player Links",

  permissions: {
    view: ["ADMIN"],
    create: ["ADMIN"],
    edit: ["ADMIN"],
    delete: ["ADMIN"],
  },

  table: {
    columns: [
      {
        key: "id",
        label: "ID",
        type: "text",
        sortable: true,
      },
      {
        key: "playerName",
        label: "Child Player",
        type: "text",
        sortable: true,
      },
      {
        key: "parentName",
        label: "Parent / Guardian",
        type: "text",
        sortable: true,
      },
      {
        key: "relationship",
        label: "Relationship",
        type: "text",
        sortable: true,
      },
    ],
  },

  form: {
    layout: "grid",
    fields: [
      {
        key: "player_id",
        label: "Child Player",
        type: "select",
        required: true,
        options: [],
        gridColumn: "span-6",
      },
      {
        key: "related_person_id",
        label: "Parent / Guardian",
        type: "select",
        required: true,
        options: [],
        gridColumn: "span-6",
      },
      {
        key: "relationship",
        label: "Relationship",
        type: "select",
        required: true,
        options: [
          { label: "Parent", value: "Parent" },
          { label: "Guardian", value: "Guardian" },
        ],
        gridColumn: "span-12",
      },
    ],
  },
};
