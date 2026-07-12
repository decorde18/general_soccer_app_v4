import type { EntityConfig } from "@/components/entities/types";

export const teamConfig: EntityConfig = {
  title: "Teams",
  singular: "Team",
  plural: "Teams",
  permissions: {
    view: ["ADMIN", "TEAM_ADMIN", "COACH", "PLAYER"],
    create: ["ADMIN"],
    edit: ["ADMIN"],
    delete: ["ADMIN"],
  },
  table: {
    columns: [
      { key: "teamName", label: "Team Name", type: "text", sortable: true },
      { key: "clubName", label: "Club", type: "text", sortable: true },
      { key: "gender", label: "Gender", type: "text" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  form: {
    layout: "grid",
    fields: [
      { key: "teamName", label: "Team Name", type: "text", required: true, gridColumn: "span-12", placeholder: "e.g. U13 Girls Premier" },
      { 
        key: "clubName", 
        valueKey: "clubId",
        label: "Club / School Organization", 
        type: "select", 
        required: true, 
        gridColumn: "span-12",
        options: [] // Injected dynamically
      },
      { 
        key: "gender", 
        label: "Gender Division", 
        type: "select", 
        required: true, 
        gridColumn: "span-6",
        options: [
          { value: "Men", label: "Men" },
          { value: "Women", label: "Women" },
          { value: "Mixed", label: "Mixed" },
        ]
      },
      { key: "isActive", label: "Active", type: "toggle", required: false, gridColumn: "span-6" },
    ],
  },
};
