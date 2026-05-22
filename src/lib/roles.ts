export const Roles = {
  ADMIN: "ADMIN",
  CLUB_ADMIN: "CLUB_ADMIN",
  TEAM_ADMIN: "TEAM_ADMIN",
  COACH: "COACH",
  PLAYER: "PLAYER",
  PARENT: "PARENT",
  PUBLIC: "PUBLIC",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export function hasRole(userRoles: any, role: Role) {
  if (role === Roles.PUBLIC) {
    return true;
  }

  if (!userRoles) return false;

  switch (role) {
    case Roles.ADMIN:
      return !!userRoles.isAdmin;
    case Roles.CLUB_ADMIN:
      return (
        !!userRoles.clubAdmin ||
        (Array.isArray(userRoles.clubAdminTeamIds) &&
          userRoles.clubAdminTeamIds.length > 0)
      );
    case Roles.TEAM_ADMIN:
      return (
        !!userRoles.teamAdmin ||
        (Array.isArray(userRoles.teamAdminTeamIds) &&
          userRoles.teamAdminTeamIds.length > 0)
      );
    case Roles.COACH:
      return (
        !!userRoles.coach ||
        (Array.isArray(userRoles.coachTeamIds) &&
          userRoles.coachTeamIds.length > 0)
      );
    case Roles.PLAYER:
      return (
        !!userRoles.player ||
        (Array.isArray(userRoles.playerTeamIds) &&
          userRoles.playerTeamIds.length > 0)
      );
    case Roles.PARENT:
      return (
        !!userRoles.parent ||
        (Array.isArray(userRoles.parentTeamIds) &&
          userRoles.parentTeamIds.length > 0)
      );
    default:
      return false;
  }
}

export function getEffectiveRoles(userRoles: any): Role[] {
  const effectiveRoles: Role[] = [Roles.PUBLIC];

  if (hasRole(userRoles, Roles.ADMIN)) {
    effectiveRoles.push(Roles.ADMIN);
  }
  if (hasRole(userRoles, Roles.CLUB_ADMIN)) {
    effectiveRoles.push(Roles.CLUB_ADMIN);
  }
  if (hasRole(userRoles, Roles.TEAM_ADMIN)) {
    effectiveRoles.push(Roles.TEAM_ADMIN);
  }
  if (hasRole(userRoles, Roles.COACH)) {
    effectiveRoles.push(Roles.COACH);
  }
  if (hasRole(userRoles, Roles.PLAYER)) {
    effectiveRoles.push(Roles.PLAYER);
  }
  if (hasRole(userRoles, Roles.PARENT)) {
    effectiveRoles.push(Roles.PARENT);
  }

  return [...new Set(effectiveRoles)];
}
