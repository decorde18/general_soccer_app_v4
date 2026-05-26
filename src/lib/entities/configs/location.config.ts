import type { EntityConfig } from "@/components/entities/types";

export const locationConfig: EntityConfig = {
  title: "Locations",
  singular: "Location",
  plural: "Locations",
  permissions: {
    view: ["ADMIN", "TEAM_ADMIN", "COACH", "PLAYER"],
    create: ["ADMIN", "TEAM_ADMIN", "COACH"],
    edit: ["ADMIN", "TEAM_ADMIN", "COACH"],
    delete: ["ADMIN"],
  },
  table: {
    columns: [
      { key: "name", label: "Location Name", type: "text", sortable: true },
      { key: "addressLine1", label: "Address", type: "text", sortable: true },
      { key: "city", label: "City", type: "text", sortable: true },
      { key: "state", label: "State", type: "text" },
    ],
  },
  form: {
    layout: "grid",
    fields: [
      { key: "name", label: "Location Name", type: "text", required: true, gridColumn: "span-12" },
      { key: "addressLine1", label: "Address Line 1", type: "text", required: true, gridColumn: "span-12" },
      { key: "addressLine2", label: "Address Line 2", type: "text", required: false, gridColumn: "span-12" },
      { key: "city", label: "City", type: "text", required: true, gridColumn: "span-6" },
      { key: "state", label: "State", type: "text", required: true, gridColumn: "span-3" },
      { key: "postalCode", label: "Zip", type: "text", required: true, gridColumn: "span-3" },
    ],
  },
};
