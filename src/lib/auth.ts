import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import type { NextAuthOptions, Session } from "next-auth";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

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
            "SELECT * FROM people WHERE email = ? LIMIT 1",
            [credentials.email],
          );

          if (rows.length > 0) {
            const user = rows[0];
            // Prefer hashed password field `password_hash` in DB
            const hash = user.password_hash || user.password;
            const match = await bcrypt.compare(
              credentials.password,
              hash || "",
            );
            if (match) {
              return {
                id: user.id?.toString(),
                name: user.name,
                email: user.email,
                roles: user.roles || { isAdmin: false },
              } as any;
            }
          }

          // Dev fallback
          if (
            credentials.email === "admin@example.com" &&
            credentials.password === "password"
          ) {
            return {
              id: "1",
              name: "Admin",
              email: "admin@example.com",
              roles: { isAdmin: true },
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id ?? token.id;
        token.roles = (user as any).roles ?? token.roles ?? { isAdmin: false };
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as any;
        (session.user as any).roles = (token as any).roles ?? {
          isAdmin: false,
        };
      }
      return session;
    },
  },
};

export async function getServerAuthSession(): Promise<Session | null> {
  return await getServerSession(authOptions as any);
}
