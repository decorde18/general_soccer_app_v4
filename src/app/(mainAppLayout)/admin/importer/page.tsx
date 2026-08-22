import React from "react";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import prisma from "@/lib/prisma";
import BatchImporterClient from "@/components/admin/BatchImporterClient";

export default async function AdminImporterPage() {
  await verifyAdmin();

  // Load seasons
  const seasonsData = await prisma.seasons.findMany({
    orderBy: { start_date: "desc" },
    select: { id: true, season_name: true },
  });

  // Load league node seasons (divisions)
  const nodeSeasonsData = await prisma.league_node_seasons.findMany({
    include: {
      league_nodes: {
        include: {
          leagues: true,
        },
      },
    },
    take: 50,
  });

  const seasons = seasonsData.map((s) => ({
    id: s.id,
    name: s.season_name,
  }));

  const leagueNodes = nodeSeasonsData.map((ns) => ({
    id: ns.id,
    name: `${ns.league_nodes.leagues.name} - ${ns.league_nodes.name}`,
  }));

  // Load team seasons for target team selection
  const teamSeasonsData = await prisma.team_seasons.findMany({
    include: {
      teams: {
        include: {
          clubs: true,
        },
      },
    },
    orderBy: [
      { teams: { clubs: { name: "asc" } } },
      { teams: { team_name: "asc" } },
    ],
  });

  const teamSeasons = teamSeasonsData.map((ts) => ({
    id: ts.id,
    seasonId: ts.season_id,
    clubName: ts.teams.clubs.name,
    teamName: ts.teams.team_name,
    label: `${ts.teams.clubs.name} — ${ts.teams.team_name}`,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BatchImporterClient seasons={seasons} leagueNodes={leagueNodes} teamSeasons={teamSeasons} />
    </main>
  );
}
