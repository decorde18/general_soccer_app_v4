import { NextResponse } from "next/server";
import { recordQuickScore, recordDetailedMatchScore } from "@/lib/actions/quickScore-actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, ...payload } = body;

    if (type === "detailed") {
      const result = await recordDetailedMatchScore(payload);
      return NextResponse.json(result);
    } else {
      const result = await recordQuickScore(payload);
      return NextResponse.json(result);
    }
  } catch (err: any) {
    console.error("Error in /api/games/quick-score:", err);
    return NextResponse.json(
      { error: err.message || "Failed to record match score" },
      { status: 500 }
    );
  }
}
