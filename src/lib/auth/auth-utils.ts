import db from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

export interface UserRoles {
  isAdmin: boolean;
  clubAdmin: boolean;
  teamAdmin: boolean;
  coach: boolean;
  player: boolean;
  parent: boolean;
  coachTeamIds: number[];
  teamAdminTeamIds: number[];
  playerTeamIds: number[];
  parentTeamIds: number[];
  clubAdminTeamIds: number[];
}

interface PersonRow extends RowDataPacket {
  system_admin: number;
}

interface TeamIdRow extends RowDataPacket {
  team_id: number;
}

interface AppSessionUser {
  personId: number;
  id?: string;
  name?: string;
  email?: string;
  roles?: UserRoles;
}

async function getUserRolesFromView(
  id: number,
): Promise<Partial<UserRoles> | null> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT
         system_admin,
         club_admin,
         team_admin,
         coach,
         parent,
         player
       FROM v_users
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0] as Record<string, unknown>;
    return {
      isAdmin: Boolean(row.system_admin),
      clubAdmin: Boolean(row.club_admin),
      teamAdmin: Boolean(row.team_admin),
      coach: Boolean(row.coach),
      player: Boolean(row.player),
      parent: Boolean(row.parent),
    };
  } catch {
    return null;
  }
}

export async function getUserRolesAndTeams(
  personId: number | string,
): Promise<UserRoles> {
  const roles: UserRoles = {
    isAdmin: false,
    clubAdmin: false,
    teamAdmin: false,
    coach: false,
    player: false,
    parent: false,
    coachTeamIds: [],
    teamAdminTeamIds: [],
    playerTeamIds: [],
    parentTeamIds: [],
    clubAdminTeamIds: [],
  };

  try {
    const id = Number(personId);

    const viewRoleFlags = await getUserRolesFromView(id);
    if (viewRoleFlags) {
      roles.isAdmin = viewRoleFlags.isAdmin ?? false;
      roles.clubAdmin = viewRoleFlags.clubAdmin ?? false;
      roles.teamAdmin = viewRoleFlags.teamAdmin ?? false;
      roles.coach = viewRoleFlags.coach ?? false;
      roles.player = viewRoleFlags.player ?? false;
      roles.parent = viewRoleFlags.parent ?? false;
    } else {
      const [peopleRows] = await db.query<PersonRow[]>(
        "SELECT system_admin FROM people WHERE id = ? LIMIT 1",
        [id],
      );
      if (peopleRows.length > 0 && peopleRows[0].system_admin) {
        roles.isAdmin = true;
      }
    }

    const [coachRows] = await db.query<TeamIdRow[]>(
      `SELECT DISTINCT team_id FROM coaches WHERE person_id = ? AND is_active = 1
       UNION
       SELECT DISTINCT ts.team_id FROM team_staff staff
       JOIN team_seasons ts ON staff.team_season_id = ts.id
       WHERE staff.person_id = ? AND staff.role IN ('head_coach', 'assistant_coach') AND staff.is_active = 1`,
      [id, id],
    );
    roles.coachTeamIds = coachRows.map((r) => r.team_id);

    const [teamAdminRows] = await db.query<TeamIdRow[]>(
      `SELECT DISTINCT ts.team_id FROM team_staff staff
       JOIN team_seasons ts ON staff.team_season_id = ts.id
       WHERE staff.person_id = ? AND staff.role IN ('team_admin', 'stats_keeper') AND staff.is_active = 1`,
      [id],
    );
    roles.teamAdminTeamIds = teamAdminRows.map((r) => r.team_id);

    const [playerRows] = await db.query<TeamIdRow[]>(
      `SELECT DISTINCT ts.team_id FROM player_teams pt
       JOIN team_seasons ts ON pt.team_season_id = ts.id
       WHERE pt.player_id = ?`,
      [id],
    );
    roles.playerTeamIds = playerRows.map((r) => r.team_id);

    const [parentRows] = await db.query<TeamIdRow[]>(
      `SELECT DISTINCT ts.team_id FROM player_relationships pr
       JOIN player_teams pt ON pr.player_id = pt.player_id
       JOIN team_seasons ts ON pt.team_season_id = ts.id
       WHERE pr.related_person_id = ? AND pr.relationship IN ('Parent', 'Guardian')`,
      [id],
    );
    roles.parentTeamIds = parentRows.map((r) => r.team_id);

    const [clubAdminRows] = await db.query<TeamIdRow[]>(
      `SELECT DISTINCT t.id AS team_id
       FROM club_staff cs
       JOIN teams t ON cs.club_id = t.club_id
       WHERE cs.person_id = ? AND cs.role = 'club_admin' AND cs.is_active = 1`,
      [id],
    );
    roles.clubAdminTeamIds = clubAdminRows.map((r) => r.team_id);

    roles.coach = roles.coach || roles.coachTeamIds.length > 0;
    roles.teamAdmin = roles.teamAdmin || roles.teamAdminTeamIds.length > 0;
    roles.clubAdmin = roles.clubAdmin || roles.clubAdminTeamIds.length > 0;
    roles.player = roles.player || roles.playerTeamIds.length > 0;
    roles.parent = roles.parent || roles.parentTeamIds.length > 0;
  } catch (error) {
    console.error("Error fetching user roles:", error);
  }

  return roles;
}

// export async function getAppSession() {
//   // Dummy Auth bypass for Development
//   if (
//     process.env.NODE_ENV === "development" &&
//     process.env.DEV_MOCK_AUTH === "true"
//   ) {

//     const mockId = process.env.DEV_MOCK_USER_ID || "1";

//     try {
//       // Load actual user data from DB to make it feel real
//       const [rows] = await db.query<PeopleNameRow[]>(
//         "SELECT first_name, last_name, email FROM people WHERE id = ? LIMIT 1",
//         [mockId],
//       );
//       const roles = await getUserRolesAndTeams(mockId);

//       const user =
//         rows.length > 0
//           ? {
//               personId: Number(mockId),
//               id: mockId,
//               name: `${rows[0].first_name} ${rows[0].last_name}`.trim(),
//               email: rows[0].email,
//             }
//           : {
//               personId: Number(mockId),
//               id: mockId,
//               name: "Mock Dev User",
//               email: "mock@dev.local",
//             };

//       return {
//         user: {
//           ...user,
//           roles,
//         },
//       };
//     } catch (error) {
//       console.error("Error loading mock user data:", error);
//       // Fallback to hardcoded mock if DB fails
//       return {
//         user: {
//           personId: Number(mockId),
//           id: mockId,
//           name: "Mock Dev User",
//           email: "mock@dev.local",
//           roles: {
//             isAdmin: process.env.DEV_MOCK_IS_ADMIN === "true",
//             clubAdmin: false,
//             teamAdmin: false,
//             coach: false,
//             player: false,
//             parent: false,
//             coachTeamIds: process.env.DEV_MOCK_COACH_TEAMS
//               ? process.env.DEV_MOCK_COACH_TEAMS.split(",")
//                   .map(Number)
//                   .filter(Boolean)
//               : [],
//             teamAdminTeamIds: process.env.DEV_MOCK_TEAM_ADMIN_TEAMS
//               ? process.env.DEV_MOCK_TEAM_ADMIN_TEAMS.split(",")
//                   .map(Number)
//                   .filter(Boolean)
//               : [],
//             playerTeamIds: process.env.DEV_MOCK_PLAYER_TEAMS
//               ? process.env.DEV_MOCK_PLAYER_TEAMS.split(",")
//                   .map(Number)
//                   .filter(Boolean)
//               : [],
//             parentTeamIds: process.env.DEV_MOCK_PARENT_TEAMS
//               ? process.env.DEV_MOCK_PARENT_TEAMS.split(",")
//                   .map(Number)
//                   .filter(Boolean)
//               : [],
//             clubAdminTeamIds: process.env.DEV_MOCK_CLUB_ADMIN_TEAMS
//               ? process.env.DEV_MOCK_CLUB_ADMIN_TEAMS.split(",")
//                   .map(Number)
//                   .filter(Boolean)
//               : [],
//           },
//         },
//       };
//     }
//   }

//   // Production/Standard Auth
//   return await auth();
// }

/**
 * Ensures a session exists, or redirects to login.
 * Use this in Server Components.
 */
export async function requireSession() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect("/login");
  }
  return session;
}

export async function verifyAdmin() {
  const session = await getServerAuthSession();
  if (!session?.user?.roles?.isAdmin) {
    throw new Error("Unauthorized: Admin access required.");
  }
}

export async function verifyTeamAccess(teamId: number | string) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Not logged in.");
  }

  const user = session.user as AppSessionUser;
  if (user.roles?.isAdmin) return true;

  const roles = await getUserRolesAndTeams(user.personId);
  const tId = Number(teamId);
  const hasAccess =
    roles.coachTeamIds.includes(tId) ||
    roles.teamAdminTeamIds.includes(tId) ||
    roles.playerTeamIds.includes(tId) ||
    roles.parentTeamIds.includes(tId) ||
    roles.clubAdminTeamIds.includes(tId);

  if (!hasAccess) {
    throw new Error("Forbidden: You do not have access to this team.");
  }

  return true;
}
