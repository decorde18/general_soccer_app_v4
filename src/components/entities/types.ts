export type Role =
  | "ADMIN"
  | "CLUB_ADMIN"
  | "TEAM_ADMIN"
  | "COACH"
  | "PARENT"
  | "PLAYER"
  | "PUBLIC";

export type FieldType = "text" | "date" | "textarea" | "select" | "number";
export type ColumnType = "text" | "date" | "badge" | "number" | "action";

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  gridColumn?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface TableColumn {
  key: string;
  label: string;
  type: ColumnType;
  sortable?: boolean;
  options?: Record<string, "green" | "amber" | "red" | "gray" | "blue">;
  hiddenOnMobile?: boolean;
}

export interface EntityConfig {
  title: string;
  singular: string;
  plural?: string;
  permissions: {
    view: Role[];
    create: Role[];
    edit: Role[];
    delete: Role[];
  };
  table: {
    columns: TableColumn[];
  };
  form: {
    layout?: "grid" | "vertical";
    fields: FormField[];
    validationRules?: Record<string, (val: string) => string | null>;
  };
}
