import React from "react";
import CalendarClient from "@/components/calendar/CalendarClient";
import { getCalendarItemsAction } from "@/lib/actions/calendar-actions";
import { getCurrentSeason, getSeasons } from "@/lib/data/queries";

export const metadata = {
  title: "Program Calendar & Schedule | Soccer App",
  description: "Unified master schedule of games, practices, camps, and team events.",
};

export default async function CalendarPage() {
  const [currentSeason, seasons] = await Promise.all([
    getCurrentSeason(),
    getSeasons(),
  ]);

  const defaultSeason = currentSeason || seasons[0];
  const items = await getCalendarItemsAction({
    seasonId: defaultSeason?.id,
  });

  return (
    <CalendarClient
      initialItems={items}
      seasonName={defaultSeason?.seasonName}
    />
  );
}
