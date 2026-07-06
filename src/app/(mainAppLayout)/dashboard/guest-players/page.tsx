import React from "react";
import { requireSession } from "@/lib/auth/auth-utils";
import { getClubs, getAgeGroups, getTeams, getTeamSeasons } from "@/lib/data/queries";
import GuestPlayersClient from "@/components/dashboard/GuestPlayersClient";

export default async function GuestPlayersPage() {
  // 1. Authenticate user
  await requireSession();

  // 2. Fetch options lists for player search filters
  const [clubs, ageGroups, teams, teamSeasons] = await Promise.all([
    getClubs(true),        // Active clubs only
    getAgeGroups(),        // All age brackets
    getTeams(true),        // Active teams only
    getTeamSeasons(),      // Available team seasons
  ]);

  // 3. Map clean data options to client component
  const clubsOptions = clubs.map((c) => ({ id: c.id, name: c.name }));
  const ageGroupsOptions = ageGroups.map((ag) => ({ id: ag.id, name: ag.name }));
  const teamsOptions = teams.map((t) => ({ id: t.id, name: t.teamName, clubId: t.clubId }));
  
  const teamSeasonsOptions = teamSeasons.map((ts) => ({
    id: ts.id,
    teamName: ts.teamName,
    clubName: ts.clubName,
    seasonName: ts.seasonName,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <GuestPlayersClient
        clubs={clubsOptions}
        ageGroups={ageGroupsOptions}
        teams={teamsOptions}
        teamSeasons={teamSeasonsOptions}
      />
    </main>
  );
}
