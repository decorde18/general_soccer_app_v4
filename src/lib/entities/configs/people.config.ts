import type { EntityConfig } from "@/components/entities/types";

export const peopleConfig: EntityConfig = {
  title: "People Directory",
  singular: "Person",
  plural: "People",

  permissions: {
    view: ["ADMIN", "CLUB_ADMIN", "TEAM_ADMIN", "COACH"],
    create: ["ADMIN", "CLUB_ADMIN"],
    edit: ["ADMIN", "CLUB_ADMIN"],
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
        key: "nickname",
        label: "Nickname",
        type: "text",
        sortable: true,
        hiddenOnMobile: true,
      },
      {
        key: "genderDisplay",
        label: "Gender",
        type: "text",
        sortable: true,
      },
      {
        key: "birthDate",
        label: "Birth Date",
        type: "text",
        sortable: true,
        hiddenOnMobile: true,
      },
      {
        key: "email",
        label: "Email",
        type: "text",
        sortable: true,
      },
      {
        key: "phone",
        label: "Phone",
        type: "text",
        sortable: false,
        hiddenOnMobile: true,
      },
      {
        key: "rolesList",
        label: "Roles",
        type: "text",
        sortable: false,
        hiddenOnMobile: true,
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
        key: "firstName",
        label: "First Name",
        type: "text",
        required: true,
        placeholder: "e.g. Alex",
        gridColumn: "span-6",
      },
      {
        key: "lastName",
        label: "Last Name",
        type: "text",
        required: true,
        placeholder: "e.g. Morgan",
        gridColumn: "span-6",
      },
      {
        key: "nickname",
        label: "Nickname / Preferred Name",
        type: "text",
        placeholder: "e.g. Ali",
        gridColumn: "span-6",
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        required: true,
        gridColumn: "span-6",
        options: [
          { value: "FEMALE", label: "Female (Girls / Women)" },
          { value: "MALE", label: "Male (Boys / Men)" },
          { value: "MIXED", label: "Mixed / Co-Ed" },
        ],
      },
      {
        key: "birthDateRaw",
        label: "Birth Date",
        type: "date",
        gridColumn: "span-6",
      },
      {
        key: "phone",
        label: "Phone Number",
        type: "text",
        placeholder: "e.g. (555) 123-4567",
        gridColumn: "span-6",
      },
      {
        key: "email",
        label: "Email Address",
        type: "text",
        placeholder: "e.g. player@example.com",
        gridColumn: "span-12",
      },
      {
        key: "isActive",
        label: "Active Status",
        type: "toggle",
        gridColumn: "span-12",
      },
    ],
  },
};
