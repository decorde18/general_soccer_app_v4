import type { EntityConfig } from "@/components/entities/types";

export const subLocationConfig: EntityConfig = {
  title: "Sub-Locations",
  singular: "Sub-Location",
  plural: "Sub-Locations",
  permissions: {
    view: ["ADMIN", "TEAM_ADMIN", "COACH", "PLAYER"],
    create: ["ADMIN", "TEAM_ADMIN", "COACH"],
    edit: ["ADMIN", "TEAM_ADMIN", "COACH"],
    delete: ["ADMIN"],
  },
  table: {
    columns: [
      { key: "name", label: "Name", type: "text", sortable: true },
      { key: "locationName", label: "Primary Location", type: "text", sortable: true },
      { key: "surfaceType", label: "Surface", type: "text" },
      { key: "capacity", label: "Capacity", type: "text", hiddenOnMobile: true },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
  },
  form: {
    layout: "grid",
    fields: [
      { key: "name", label: "Sub-Location Name", type: "text", required: true, gridColumn: "span-12", placeholder: "e.g. Field 1" },
      { 
        key: "locationName", 
        valueKey: "locationId",
        label: "Primary Location", 
        type: "select", 
        required: true, 
        gridColumn: "span-12",
        options: [] // Injected in page.tsx
      },
      { 
        key: "surfaceType", 
        label: "Surface Type", 
        type: "select", 
        required: false, 
        gridColumn: "span-6",
        options: [
          { value: "grass", label: "Grass" },
          { value: "turf", label: "Turf" },
          { value: "hybrid", label: "Hybrid" },
          { value: "court", label: "Court" },
          { value: "other", label: "Other" },
        ]
      },
      { key: "capacity", label: "Capacity", type: "text", required: false, gridColumn: "span-6" },
      { key: "description", label: "Description", type: "textarea", required: false, gridColumn: "span-12" },
      { key: "isActive", label: "Active", type: "toggle", required: false, gridColumn: "span-12" },
    ],
  },
};
