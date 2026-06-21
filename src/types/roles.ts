export interface UserRoles {
  isAdmin?: boolean;
  clubAdmin?: boolean;
  coach?: boolean;
  teamAdmin?: boolean;
  player?: boolean;
  parent?: boolean;
  clubAdminTeamIds?: number[];
  coachTeamIds?: number[];
  teamAdminTeamIds?: number[];
  playerTeamIds?: number[];
  parentTeamIds?: number[];
}