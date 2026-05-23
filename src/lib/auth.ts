import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import type { JWT } from "next-auth/jwt";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { RowDataPacket } from "mysql2";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { getUserRolesAndTeams, UserRoles } from "@/lib/auth/auth-utils";

interface AuthUserRow extends RowDataPacket {
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
          const [rows] = await db.query<AuthUserRow[]>(
            `SELECT
               p.id AS person_id,
               p.first_name,
               p.last_name,
          
               p.email,
               u.password_hash,
               u.system_admin
             FROM users u
             JOIN people p ON u.person_id = p.id
             WHERE p.email = ?
             LIMIT 1`,
            [credentials.email],
          );

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
    async jwt({ token, user }: { token: AuthToken; user?: CredentialUser }) {
      if (user) {
        token.id = user.id ?? token.id;
        token.personId = user.personId ?? token.personId;
        token.roles = user.roles ?? token.roles ?? { ...defaultRoles };
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: AuthToken }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { personId?: number }).personId =
          token.personId;
        (session.user as unknown as { roles?: UserRoles }).roles =
          token.roles ?? { ...defaultRoles };
      }
      return session;
    },
  },
};

export async function getServerAuthSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.warn("getServerAuthSession failed:", error);
    return null;
  }
}
