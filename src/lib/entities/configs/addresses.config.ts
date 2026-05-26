// config/addresses.config.ts
import type { EntityConfig } from "@/components/entities/types";

export const addressConfig: EntityConfig = {
    title: "`Addresses`",
    singular: "Address",
    plural: "Addresses",

    permissions: {
        view: ["ADMIN", "TEAM_ADMIN", "COACH", "PLAYER"],
        create: ["ADMIN", "TEAM_ADMIN", "COACH"],
        edit: ["ADMIN", "TEAM_ADMIN", "COACH"],
        delete: ["ADMIN"],
    },

    table: {
        columns: [
            {
                key: "addressLine1",
                label: "Address Line 1",
                type: "text",
                sortable: true,
            },
            {
                key: "addressLine2",
                label: "Address Line 2",
                type: "text",
                sortable: true,
            },
            {
                key: "city",
                label: "City",
                type: "text",
                sortable: true,
                hiddenOnMobile: true,
            },
            {
                key: "state",
                label: "State",
                type: "text",
                sortable: false,
                hiddenOnMobile: true,
            },
            {
                key: "country",
                label: "Country",
                type: "text",
                sortable: false,
                hiddenOnMobile: true,
            },
            {
                key: "postalCode",
                label: "Postal Code",
                type: "text",
                sortable: false,
                hiddenOnMobile: true,
            },
        ],
    },

    form: {
        layout: "grid",
        fields: [
            {
                key: "addressLine1",
                label: "Address Line 1",
                type: "text",
                required: true,
                placeholder: "e.g. 121 Somewhere St",
                gridColumn: "span-12",
            },
            {
                key: "addressLine2",
                label: "Address Line 2",
                type: "text",
                required: false,
                placeholder: "e.g. suite 1",
                gridColumn: "span-12",
            },
            {
                key: "city",
                label: "City",
                type: "text",
                required: true,
                placeholder: "e.g. City",
                gridColumn: "span-8",
            },
            {
                key: "state",
                label: "State",
                type: "text",
                required: true,
                placeholder: "e.g. State",
                gridColumn: "span-4",
            },
            {
                key: "country",
                label: "Country",
                type: "text",
                required: true,
                placeholder: "e.g. Country",
                gridColumn: "span-8",
            },
            {
                key: "postalCode",
                label: "Postal Code",
                type: "text",
                required: true,
                placeholder: "e.g. Postal Code",
                gridColumn: "span-4",
            },

        ],
    },
};
