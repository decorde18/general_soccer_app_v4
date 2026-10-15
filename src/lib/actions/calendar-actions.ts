"use server";

import prisma from "@/lib/prisma";
import { getGames } from "@/lib/data/queries";
import { formatTimeStandard, formatDateStandard } from "@/lib/utils/dateTimeUtils";

export interface UnifiedCalendarItem {
  id: string; // e.g. "game-101" or "event-12"
  sourceType: "game" | "event";
  sourceId: number;
  title: string;
  startDatetime: string; // ISO string
  endDatetime?: string | null;
  dateStr: string; // "YYYY-MM-DD"
  timeDisplay: string; // e.g. "7:00 PM" or "All Day"
  category: "game" | "practice" | "meeting" | "team_event" | "camp" | "other";
  categoryLabel: string;
  teamSeasonId?: number | null;
  teamName?: string;
  opponentName?: string;
  isHome?: boolean;
  scoreDisplay?: string | null;
  status?: string;
  locationId?: number | null;
  locationName?: string | null;
  sublocationName?: string | null;
  description?: string | null;
  gameType?: string | null;
}

export async function getCalendarItemsAction(options?: {
  seasonId?: number;
  teamSeasonId?: number;
}): Promise<UnifiedCalendarItem[]> {
  try {
    const { seasonId, teamSeasonId } = options || {};

    // 1. Fetch Games via centralized getGames query
    const games = await getGames({
      seasonId,
      teamSeasonId,
    });

    // 2. Fetch Team & Program Events
    const eventWhere: any = {};
    if (teamSeasonId) {
      eventWhere.team_season_id = teamSeasonId;
    }

    const events = await prisma.events.findMany({
      where: eventWhere,
      include: {
        event_types: true,
        locations: true,
        team_seasons: {
          include: { teams: true },
        },
      },
      orderBy: { start_datetime: "asc" },
      take: 250,
    });

    const items: UnifiedCalendarItem[] = [];

    // Map Games
    for (const g of games) {
      const isHome = teamSeasonId ? g.homeTeamSeasonId === teamSeasonId : true;
      const targetTeamName = teamSeasonId
        ? isHome
          ? g.homeTeamName
          : g.awayTeamName
        : g.homeTeamName;
      const opponentName = teamSeasonId
        ? isHome
          ? g.awayTeamName
          : g.homeTeamName
        : g.awayTeamName;

      const title = teamSeasonId
        ? `${isHome ? "vs" : "@"} ${opponentName}`
        : `${g.homeTeamName} vs ${g.awayTeamName}`;

      const dateObj = g.startTime ? new Date(g.startTime) : new Date();
      const dateStr = dateObj.toISOString().slice(0, 10);
      const timeDisplay = formatTimeStandard(g.startTime);

      let scoreDisplay: string | null = null;
      if (g.homeScore !== null && g.awayScore !== null && (g.status === "completed" || g.status === "in_progress")) {
        scoreDisplay = `${g.homeScore} - ${g.awayScore}`;
      }

      items.push({
        id: `game-${g.id}`,
        sourceType: "game",
        sourceId: g.id,
        title,
        startDatetime: dateObj.toISOString(),
        dateStr,
        timeDisplay,
        category: "game",
        categoryLabel: "Match",
        teamSeasonId: g.homeTeamSeasonId,
        teamName: targetTeamName,
        opponentName,
        isHome,
        scoreDisplay,
        status: g.status,
        locationId: g.locationId,
        locationName: g.locationName,
        sublocationName: g.sublocationName,
        gameType: g.gameType,
      });
    }

    // Map Events
    for (const ev of events) {
      const dateObj = new Date(ev.start_datetime);
      const dateStr = dateObj.toISOString().slice(0, 10);
      const timeDisplay = ev.is_all_day ? "All Day" : formatTimeStandard(ev.start_datetime);

      let category: UnifiedCalendarItem["category"] = "team_event";
      const catName = (ev.event_types?.name || "").toLowerCase();
      if (catName.includes("practice") || catName.includes("training")) {
        category = "practice";
      } else if (catName.includes("meeting")) {
        category = "meeting";
      } else if (catName.includes("camp") || catName.includes("clinic")) {
        category = "camp";
      } else if (catName.includes("match") || catName.includes("game")) {
        category = "game";
      }

      items.push({
        id: `event-${ev.id}`,
        sourceType: "event",
        sourceId: ev.id,
        title: ev.title,
        startDatetime: dateObj.toISOString(),
        endDatetime: ev.end_datetime ? new Date(ev.end_datetime).toISOString() : null,
        dateStr,
        timeDisplay,
        category,
        categoryLabel: ev.event_types?.name || "Event",
        teamSeasonId: ev.team_season_id,
        teamName: ev.team_seasons?.teams?.team_name || "Club Event",
        locationId: ev.location_id,
        locationName: ev.locations?.name || null,
        description: ev.description,
      });
    }

    // Sort chronologically
    items.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());
    return items;
  } catch (err: any) {
    console.error("Error fetching calendar items:", err);
    return [];
  }
}
