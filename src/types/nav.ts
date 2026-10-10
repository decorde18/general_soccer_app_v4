import type { UserRoles } from "@/types/roles";

export interface NavUser {
  roles?: UserRoles;
  originalRoles?: UserRoles;
}

export interface Club {
  id: number;
  name: string;
  type?: string | null;
}

export interface TeamSeason {
  id: number;
  clubId: number;
  teamName: string;
  teamId: number;
  seasonId?: number;
  seasonName?: string;
  clubType?: string | null;
}

export interface ViewOption {
  value: string;
  label: string;
}