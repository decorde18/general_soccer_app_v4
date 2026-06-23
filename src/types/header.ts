export interface HeaderUser {
  name?: string;
  roles?: {
    isAdmin?: boolean;
  };
  first_name?: string;
  last_name?: string;
}