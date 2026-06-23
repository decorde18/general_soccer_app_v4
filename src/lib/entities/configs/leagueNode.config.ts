// config/leagueNode.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const leagueNodeConfig: EntityConfig = {
  title: "League Structure Nodes",
  singular: "League Node",
  plural: "League Structure Nodes",

  permissions: {
    view: ["ADMIN"],
    create: ["ADMIN"],
    edit: ["ADMIN"],
    delete: ["ADMIN"],
  },

  table: {
    columns: [
      {
        key: "leagueName",
        label: "League Name",
        type: "text",
        sortable: true,
      },
      {
        key: "name",
        label: "Node Name",
        type: "text",
        sortable: true,
      },
      {
        key: "nodeType",
        label: "Node Type",
        type: "badge",
        sortable: true,
        options: {
          league: "green",
          conference: "blue",
          division: "amber",
          group: "gray",
          region: "blue",
          district: "gray",
          classification: "amber",
          age_group: "green",
          gender: "red",
        },
      },
      {
        key: "level",
        label: "Hierarchy Level",
        type: "number",
        sortable: true,
      },
    ],
  },

  form: {
    layout: "grid",
    fields: [
      {
        key: "leagueName",
        valueKey: "leagueId",
        type: "select",
        label: "League",
        required: true,
        placeholder: "Select League",
        gridColumn: "span-12",
        options: [],
      },
      {
        key: "parentName",
        valueKey: "parentId",
        type: "select",
        label: "Parent Node",
        required: false,
        placeholder: "None (Top Level)",
        gridColumn: "span-12",
        options: [],
      },
      {
        key: "name",
        label: "Node Name",
        type: "text",
        required: true,
        placeholder: "e.g. U15 Boys Premier Division",
        gridColumn: "span-12",
      },
      {
        key: "nodeType",
        type: "select",
        label: "Node Type",
        required: true,
        gridColumn: "span-12",
        options: [
          { value: "league", label: "League" },
          { value: "conference", label: "Conference" },
          { value: "division", label: "Division" },
          { value: "group", label: "Group" },
          { value: "region", label: "Region" },
          { value: "district", label: "District" },
          { value: "classification", label: "Classification" },
          { value: "age_group", label: "Age Group" },
          { value: "gender", label: "Gender" },
        ],
      },
      {
        key: "level",
        label: "Hierarchy Level",
        type: "number",
        required: false,
        placeholder: "e.g. 1 (children are higher)",
        gridColumn: "span-6",
      },
      {
        key: "displayOrder",
        label: "Display Order",
        type: "number",
        required: false,
        placeholder: "e.g. 10 (ascending)",
        gridColumn: "span-6",
      },
    ],
  },
};
