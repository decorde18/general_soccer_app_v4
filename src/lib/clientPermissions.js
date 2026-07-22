// lib/clientPermissions.js

export const ROLE_PERMISSIONS = {
  system_admin: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: true,
    can_view: true,
  },
  club_admin: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: true,
    can_view: true,
  },
  club_owner: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: true,
    can_view: true,
  },
  head_coach: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: true,
    can_view: true,
  },
  assistant_coach: {
    can_edit: true,
    can_enter_stats: true,
    can_manage_roster: false,
    can_view: true,
  },
  team_admin: {
    can_edit: true,
    can_enter_stats: false,
    can_manage_roster: true,
    can_view: true,
  },
  stats_keeper: {
    can_edit: false,
    can_enter_stats: true,
    can_manage_roster: false,
    can_view: true,
  },
  player: {
    can_edit: false,
    can_enter_stats: false,
    can_manage_roster: false,
    can_view: true,
  },
  parent: {
    can_edit: false,
    can_enter_stats: false,
    can_manage_roster: false,
    can_view: true,
  },
  fan: {
    can_edit: false,
    can_enter_stats: false,
    can_manage_roster: false,
    can_view: true,
  },
};

/**
 * Check if user is system admin
 * Handles various ways the field might be stored
 */
function isSystemAdmin(user) {
  return (
    user?.systemAdmin === true ||
    user?.systemAdmin === 1 ||
    user?.system_admin === true ||
    user?.system_admin === 1
  );
}

/**
 * Get user's access to a specific team (Client-Side)
 * Works with data from userContextStore
 */
export function getTeamAccess(user, myTeams, teamSeasonId) {
  const targetId = parseInt(teamSeasonId);

  // ✅ System admin has full access
  if (isSystemAdmin(user)) {
    return {
      role: "system_admin",
      access_type: "system_admin",
      ...ROLE_PERMISSIONS.system_admin,
    };
  }

  // Find in myTeams (includes both staff and members)
  const teamAccess = myTeams?.find((t) => t.team_season_id === targetId);

  if (!teamAccess) {
    return null;
  }

  const role = teamAccess.role;
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.fan;

  return {
    role,
    access_type: teamAccess.access_type,
    ...permissions,
  };
}

/**
 * Get user's club access
 */
export function getClubAccess(user, myClubs, clubId) {
  // System admin
  if (isSystemAdmin(user)) {
    return { role: "system_admin", is_admin: true };
  }

  const clubAccess = myClubs?.find((c) => c.club_id === parseInt(clubId));

  if (!clubAccess) return null;

  return {
    role: clubAccess.role,
    is_admin: ["club_admin", "club_owner"].includes(clubAccess.role),
  };
}

/**
 * Check if user has club access
 */
export function hasClubAccess(user, myTeams, myClubs, clubId) {
  // System admin
  if (isSystemAdmin(user)) return true;

  // Club admin
  if (myClubs?.some((c) => c.club_id === parseInt(clubId))) {
    return true;
  }

  // Has any team in this club
  if (myTeams?.some((t) => t.club_id === parseInt(clubId))) {
    return true;
  }

  return false;
}

/**
 * Get accessible team filters for API queries
 */
export function getTeamAccessFilters(user, myTeams) {
  // System admin sees everything - no filters
  if (isSystemAdmin(user)) {
    return {}; // No filters = show all
  }

  // Regular users only see their teams
  const teamSeasonIds = myTeams?.map((t) => t.team_season_id) || [];

  if (teamSeasonIds.length === 0) {
    return { id: -1 }; // No teams = return nothing
  }

  return {
    id: teamSeasonIds,
  };
}

export const Permissions = {
  canEditTeam: (access) => access?.can_edit || false,
  canEnterStats: (access) => access?.can_enter_stats || false,
  canManageRoster: (access) => access?.can_manage_roster || false,
  canViewTeam: (access) => access?.can_view || false,
  isSystemAdmin: (user) => isSystemAdmin(user),
};
