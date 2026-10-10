import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const seasons = await prisma.seasons.findMany({
      orderBy: { start_date: "desc" },
      select: { id: true, season_name: true }
    });

    const clubs = await prisma.clubs.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true }
    });

    const clubsMap = new Map(clubs.map((c) => [c.id, c.type]));

    const teamSeasons = await prisma.team_seasons.findMany({
      where: { is_active: true },
      include: {
        teams: {
          select: {
            team_name: true,
            club_id: true,
          }
        },
        seasons: {
          select: {
            season_name: true
          }
        }
      }
    });

    return NextResponse.json({
      seasons,
      clubs,
      teamSeasons: teamSeasons.map((ts) => {
        const clubId = ts.teams.club_id;
        const clubType = clubId ? (clubsMap.get(clubId) || "club") : "club";
        return {
          id: ts.id,
          seasonId: ts.season_id,
          seasonName: ts.seasons.season_name,
          teamName: ts.teams.team_name,
          clubId: clubId,
          teamId: ts.team_id,
          clubType: clubType,
        };
      })
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
