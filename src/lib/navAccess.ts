
import { TeamSeason, Club, ViewOption } from "@/types/nav";
import { UserRoles } from "@/types/roles";


// Pure helpers for figuring out which clubs/teams a user can see in the nav,
// based on their active role. No React here, so these are easy to unit test.

export function getAccessibleTeams(
  activeRoles: UserRoles | undefined,
  teamSeasons: TeamSeason[]
): TeamSeason[] {
  if (!activeRoles) return [];

  if (activeRoles.isAdmin) {
    return teamSeasons;
  }

  let allowedTeamSeasonIds: number[] = [];
  if (activeRoles.clubAdmin) {
    allowedTeamSeasonIds = activeRoles.clubAdminTeamIds || [];
  } else if (activeRoles.coach) {
    allowedTeamSeasonIds = activeRoles.coachTeamIds || [];
  } else if (activeRoles.teamAdmin) {
    allowedTeamSeasonIds = activeRoles.teamAdminTeamIds || [];
  } else if (activeRoles.player) {
    allowedTeamSeasonIds = activeRoles.playerTeamIds || [];
  } else if (activeRoles.parent) {
    allowedTeamSeasonIds = activeRoles.parentTeamIds || [];
  }

  return teamSeasons.filter((ts) => allowedTeamSeasonIds.includes(ts.id));
}

export function getAccessibleClubs(accessibleTeams: TeamSeason[], clubs: Club[]): Club[] {
  const accessibleClubIds = Array.from(new Set(accessibleTeams.map((ts) => ts.clubId)));
  return clubs.filter((c) => accessibleClubIds.includes(c.id));
}

export function getActiveViewOptions(isAdmin?: boolean): ViewOption[] {
  const base: ViewOption[] = [
    { value: "club_admin", label: "Club Admin View" },
    { value: "coach", label: "Coach View" },
    { value: "team_admin", label: "Team Admin View" },
    { value: "player", label: "Player View" },
    { value: "parent", label: "Parent View" },
  ];
  return isAdmin ? [{ value: "admin", label: "Admin View" }, ...base] : base;
}

export function getCurrentActiveViewValue(
  activeView: string,
  activeRoles: UserRoles | undefined
): string {
  if (activeView) return activeView;
  if (activeRoles?.isAdmin) return "admin";
  if (activeRoles?.clubAdmin) return "club_admin";
  if (activeRoles?.coach) return "coach";
  if (activeRoles?.teamAdmin) return "team_admin";
  if (activeRoles?.player) return "player";
  if (activeRoles?.parent) return "parent";
  return "";
}