import type { UserRoles } from "@/types/roles";

export interface NavUser {
  roles?: UserRoles;
  originalRoles?: UserRoles;
}

export interface Club {
  id: number;
  name: string;
}

export interface TeamSeason {
  id: number;
  clubId: number;
  teamName: string;
  teamId: number;
}

export interface ViewOption {
  value: string;
  label: string;
}