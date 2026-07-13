import {
  handlers,
  getMockSessionForRole,
  applyActiveViewOverride,
} from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

async function GET(req: NextRequest, ctx: any) {
  if (
    process.env.NODE_ENV === "development" &&
    req.nextUrl.pathname === "/api/auth/session"
  ) {
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
  return handlers.GET(req, ctx);
}

async function POST(req: NextRequest, ctx: any) {
  return handlers.POST(req, ctx);
}

export { GET, POST };
