import NextAuth from "next-auth";
import { authOptions, getMockSessionForRole, applyActiveViewOverride } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const nextAuthHandler = NextAuth(authOptions as any);

async function handler(req: NextRequest, ctx: any) {
  if (process.env.NODE_ENV === "development" && req.nextUrl.pathname === "/api/auth/session") {
    const devOverride = req.cookies.get("dev-user-override")?.value;
    if (devOverride) {
      const mock = getMockSessionForRole(devOverride);
      if (mock) {
        const activeView = req.cookies.get("active-role-view")?.value;
        mock.user.roles = applyActiveViewOverride(mock.user.roles, activeView);
        return NextResponse.json(mock);
      }
    }
  }
  return nextAuthHandler(req as any, ctx);
}

export { handler as GET, handler as POST };
