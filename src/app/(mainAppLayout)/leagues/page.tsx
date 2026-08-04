import React from "react";
import { getLeagues, getLeagueNodeSeasons } from "@/lib/data/queries";
import LeaguesListClient from "@/components/league/LeaguesListClient";

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  const leaguesWithCounts = await Promise.all(
    leagues.map(async (league) => {
      const nodeSeasons = await getLeagueNodeSeasons(league.id);
      return {
        id: league.id,
        name: league.name,
        abbreviation: league.abbreviation,
        governingBodyName: league.governingBodyName,
        description: league.description,
        isTournament: league.isTournament,
        status: league.status,
        divisionsCount: nodeSeasons.length,
      };
    })
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <LeaguesListClient leagues={leaguesWithCounts} />
    </main>
  );
}

