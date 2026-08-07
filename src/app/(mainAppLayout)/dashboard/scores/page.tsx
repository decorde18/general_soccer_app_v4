import React from "react";
import { requireSession } from "@/lib/auth/auth-utils";
import { getGames } from "@/lib/data/queries";
import prisma from "@/lib/prisma";
import MasterScoreEntryClient, { MasterGameRow } from "@/components/dashboard/MasterScoreEntryClient";

export default async function MasterScoresPage() {
  const session = await requireSession();
  const user = session.user as any;

  const canManage = Boolean(
    user.roles.isAdmin ||
      user.roles.clubAdmin ||
      user.roles.teamAdmin ||
      user.roles.coach
  );

  // Load all games
  const games = await getGames();

  // Load standings inclusions map
  const standingsInclusions = await prisma.game_standings_inclusions.findMany({
    select: {
      game_id: true,
      counts_for_standings: true,
    },
  });

  const inclusionsMap = new Map<number, boolean>();
  standingsInclusions.forEach((inc) => {
    // If any node inclusion is false, treat as false for global view
    if (inc.counts_for_standings === false) {
      inclusionsMap.set(inc.game_id, false);
    } else if (!inclusionsMap.has(inc.game_id)) {
      inclusionsMap.set(inc.game_id, true);
    }
  });

  const formattedGames: MasterGameRow[] = games.map((g) => ({
    id: g.id,
    seasonId: g.seasonId,
    seasonName: g.seasonName,
    homeTeamSeasonId: g.homeTeamSeasonId,
    homeTeamName: g.homeTeamName,
    homeClubName: g.homeClubName,
    awayTeamSeasonId: g.awayTeamSeasonId,
    awayTeamName: g.awayTeamName,
    awayClubName: g.awayClubName,
    status: g.status,
    gameType: g.gameType,
    startDate: g.startDate,
    startTime: g.startTime,
    locationName: g.locationName,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    finalStatus: g.finalStatus,
    countsForStandings: inclusionsMap.get(g.id) !== false,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <MasterScoreEntryClient
        initialGames={formattedGames}
        canManage={canManage}
      />
    </main>
  );
}
