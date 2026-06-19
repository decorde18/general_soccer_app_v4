import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import type { JWT } from "next-auth/jwt";
import type { NextAuthOptions, Session, User } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserRolesAndTeams, UserRoles } from "@/lib/auth/auth-utils";

interface AuthUserRow {
  person_id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  password_hash?: string;
  system_admin?: number;
}

interface CredentialUser extends User {
  personId?: number;
  roles: UserRoles;
}

interface AuthToken extends JWT {
  personId?: number;
  roles?: UserRoles;
}

const defaultRoles: UserRoles = {
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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "user@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const rows = await prisma.$queryRaw<AuthUserRow[]>`
             SELECT
               p.id AS person_id,
               p.first_name,
               p.last_name,
          
               p.email,
               u.password_hash,
               u.system_admin
             FROM users u
             JOIN people p ON u.person_id = p.id
             WHERE p.email = ${credentials.email}
             LIMIT 1
          `;

          if (rows.length > 0) {
            const user = rows[0];
            const hash = user.password_hash || undefined;
            const match = await bcrypt.compare(
              credentials.password,
              hash || "",
            );
            if (match) {
              const personId = user.person_id;
              const roles = await getUserRolesAndTeams(personId);
              return {
                id: personId.toString(),
                personId,
                name:
                  user.name ||
                  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
                email: user.email,
                roles,
              };
            }
          }

          if (
            credentials.email === "admin@example.com" &&
            credentials.password === "password"
          ) {
            return {
              id: "1",
              name: "Admin",
              email: "admin@example.com",
              roles: {
                ...defaultRoles,
                isAdmin: process.env.DEV_MOCK_IS_ADMIN === "true",
              },
            } as CredentialUser;
          }

          return null;
        } catch (error) {
          console.error("authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id ?? token.id;
        token.personId = user.personId ?? token.personId;
        token.roles = user.roles ?? token.roles ?? { ...defaultRoles };
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).personId = token.personId;
        
        let roles = token.roles ?? { ...defaultRoles };
        if (process.env.NODE_ENV === "development") {
          try {
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            const devOverride = cookieStore.get("dev-user-override")?.value;
            if (devOverride) {
              const mock = getMockSessionForRole(devOverride);
              if (mock) {
                roles = mock.user.roles;
              }
            }
          } catch (e) {}
        }

        // Store original roles before applying switched active view
        (session.user as any).originalRoles = { ...roles };

        // Apply active-role-view override if admin or clubAdmin
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const activeView = cookieStore.get("active-role-view")?.value;
          roles = applyActiveViewOverride(roles, activeView);
        } catch (e) {}

        (session.user as any).roles = roles;
      }
      return session;
    },
  },
};

export function applyActiveViewOverride(roles: UserRoles, activeView: string | undefined): UserRoles {
  if (!activeView) return roles;
  
  const defaultRoles: UserRoles = {
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

  const hasAdminOrClubAdmin = roles.isAdmin || roles.clubAdmin;
  if (!hasAdminOrClubAdmin) return roles;

  // Let Admins switch to any view. Let Club Admins switch to any view except Admin.
  if (activeView === "admin" && roles.isAdmin) {
    return {
      ...defaultRoles,
      isAdmin: true,
    };
  }

  // Pre-fill mock team access lists for role views when acting as switched role
  // Using typical IDs present in the DB
  const mockAccessTeams = [1, 2, 12, 13, 14, 15, 16, 17, 18, 19];

  if (activeView === "club_admin") {
    return {
      ...defaultRoles,
      clubAdmin: true,
      clubAdminTeamIds: roles.isAdmin ? mockAccessTeams : roles.clubAdminTeamIds,
    };
  }
  if (activeView === "coach") {
    return {
      ...defaultRoles,
      coach: true,
      coachTeamIds: roles.isAdmin ? mockAccessTeams : roles.coachTeamIds.length > 0 ? roles.coachTeamIds : mockAccessTeams,
    };
  }
  if (activeView === "team_admin") {
    return {
      ...defaultRoles,
      teamAdmin: true,
      teamAdminTeamIds: roles.isAdmin ? mockAccessTeams : roles.teamAdminTeamIds.length > 0 ? roles.teamAdminTeamIds : mockAccessTeams,
    };
  }
  if (activeView === "player") {
    return {
      ...defaultRoles,
      player: true,
      playerTeamIds: roles.isAdmin ? [1] : roles.playerTeamIds.length > 0 ? roles.playerTeamIds : [1],
    };
  }
  if (activeView === "parent") {
    return {
      ...defaultRoles,
      parent: true,
      parentTeamIds: roles.isAdmin ? [1] : roles.parentTeamIds.length > 0 ? roles.parentTeamIds : [1],
    };
  }

  return roles;
}

export function getMockSessionForRole(role: string): any {
  const expires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  
  const defaultRoles: UserRoles = {
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

  switch (role) {
    case "admin":
      return {
        expires,
        user: {
          id: "17",
          personId: 17,
          name: "Dev Admin User",
          email: "admin@dev.local",
          roles: {
            ...defaultRoles,
            isAdmin: true,
          },
        },
      };
    case "club_admin":
      return {
        expires,
        user: {
          id: "9992",
          personId: 9992,
          name: "Dev Club Admin User",
          email: "clubadmin@dev.local",
          roles: {
            ...defaultRoles,
            clubAdmin: true,
            clubAdminTeamIds: [1, 2, 16],
          },
        },
      };
    case "coach":
      return {
        expires,
        user: {
          id: "9993",
          personId: 9993,
          name: "Dev Coach User",
          email: "coach@dev.local",
          roles: {
            ...defaultRoles,
            coach: true,
            coachTeamIds: [1, 2],
          },
        },
      };
    case "player":
      return {
        expires,
        user: {
          id: "11",
          personId: 11,
          name: "Amelia Duff (Dev Player)",
          email: "player@dev.local",
          roles: {
            ...defaultRoles,
            player: true,
            playerTeamIds: [1],
          },
        },
      };
    case "parent":
      return {
        expires,
        user: {
          id: "9995",
          personId: 9995,
          name: "Dev Parent User",
          email: "parent@dev.local",
          roles: {
            ...defaultRoles,
            parent: true,
            parentTeamIds: [1],
          },
        },
      };
    default:
      return null;
  }
}

export async function getServerAuthSession(): Promise<Session | null> {
  if (process.env.NODE_ENV === "development") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const devOverride = cookieStore.get("dev-user-override")?.value;
      if (devOverride) {
        const mock = getMockSessionForRole(devOverride);
        if (mock) {
          const activeView = cookieStore.get("active-role-view")?.value;
          mock.user.originalRoles = { ...mock.user.roles };
          mock.user.roles = applyActiveViewOverride(mock.user.roles, activeView);
          return mock as Session;
        }
      }
    } catch (error) {
      // Ignore
    }
  }

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const activeView = cookieStore.get("active-role-view")?.value;
        const currentRoles = (session.user as any).roles ?? {
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
        (session.user as any).originalRoles = { ...currentRoles };
        (session.user as any).roles = applyActiveViewOverride(currentRoles, activeView);
      } catch (e) {}
    }
    return session;
  } catch (error) {
    console.warn("getServerAuthSession failed:", error);
    return null;
  }
}
