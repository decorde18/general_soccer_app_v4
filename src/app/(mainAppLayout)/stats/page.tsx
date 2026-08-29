import React from "react";
import StatsCenterClient from "@/components/stats/StatsCenterClient";
import {
  getComprehensivePlayerStats,
  getComprehensiveTeamStats,
  getSeasons,
  getLeagues,
  getTeamSeasons,
  getClubs,
  getCurrentSeason,
} from "@/lib/data/queries";

export const metadata = {
  title: "Stats Center | Soccer App",
  description: "Player and team statistics, minutes played, and +/- metrics.",
};

export default async function StatsPage() {
  const [seasons, leagues, teamSeasons, clubs, currentSeason] = await Promise.all([
    getSeasons(),
    getLeagues(),
    getTeamSeasons(),
    getClubs(),
    getCurrentSeason(),
  ]);

  const defaultSeason = currentSeason || seasons[0];
  const defaultSeasonId = defaultSeason?.id;

  const [playerStats, teamStats] = await Promise.all([
    getComprehensivePlayerStats({ scope: "season", seasonId: defaultSeasonId }),
    getComprehensiveTeamStats({ scope: "season", seasonId: defaultSeasonId }),
  ]);

  const seasonOptions = seasons.map((s) => ({ id: s.id, name: s.seasonName }));
  const leagueOptions = leagues.map((l) => ({ id: l.id, name: l.name }));
  const clubOptions = clubs.map((c) => ({ id: c.id, name: c.name }));
  const teamOptions = teamSeasons.map((ts) => ({
    id: ts.id,
    name: ts.teamName,
    clubId: ts.clubId,
    clubName: ts.clubName,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <StatsCenterClient
        initialPlayerStats={playerStats || []}
        initialTeamStats={teamStats || []}
        seasons={seasonOptions}
        leagues={leagueOptions}
        clubs={clubOptions}
        teams={teamOptions}
        defaultSeasonId={defaultSeasonId}
      />
    </div>
  );
}
