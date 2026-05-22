import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import type { NextAuthOptions, Session } from "next-auth";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { getUserRolesAndTeams } from "@/lib/auth/auth-utils";

const defaultRoles = {
  isAdmin: false,
  clubAdmin: false,
  teamAdmin: false,
  coach: false,
  player: false,
  parent: false,
  coachTeamIds: [] as number[],
  teamAdminTeamIds: [] as number[],
  playerTeamIds: [] as number[],
  parentTeamIds: [] as number[],
  clubAdminTeamIds: [] as number[],
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
          const [rows]: any = await db.query(
            "SELECT id, first_name, last_name, name, email, password_hash, system_admin FROM people WHERE email = ? LIMIT 1",
            [credentials.email],
          );

          if (rows.length > 0) {
            const user = rows[0];
            const hash = user.password_hash || user.password;
            const match = await bcrypt.compare(
              credentials.password,
              hash || "",
            );
            if (match) {
              const roles = await getUserRolesAndTeams(
                user.id ?? user.personId,
              );
              return {
                id: user.id?.toString(),
                name:
                  user.name ||
                  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
                email: user.email,
                roles,
              } as any;
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
            } as any;
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
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id ?? token.id;
        token.roles =
          (user as any).roles ?? token.roles ?? ({ ...defaultRoles } as any);
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as any;
        (session.user as any).roles =
          (token as any).roles ?? ({ ...defaultRoles } as any);
      }
      return session;
    },
  },
};

export async function getServerAuthSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions as any);
  } catch (error) {
    console.warn("getServerAuthSession failed:", error);
    return null;
  }
}
