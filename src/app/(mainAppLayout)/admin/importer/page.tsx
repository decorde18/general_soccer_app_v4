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

  // Load league node seasons (divisions) with full hierarchy breadcrumb paths
  const [nodeSeasonsData, allLeagueNodes] = await Promise.all([
    prisma.league_node_seasons.findMany({
      include: {
        league_nodes: {
          include: {
            leagues: true,
          },
        },
      },
    }),
    prisma.league_nodes.findMany({
      include: { leagues: true },
    }),
  ]);

  const nodeMap = new Map(allLeagueNodes.map((n) => [n.id, n]));

  function getBreadcrumbPath(node: any): string {
    const parts = [node.name];
    let curr = node;
    while (curr.parent_id && nodeMap.has(curr.parent_id)) {
      curr = nodeMap.get(curr.parent_id)!;
      parts.unshift(curr.name);
    }
    return parts.join(" > ");
  }

  const seasons = seasonsData.map((s) => ({
    id: s.id,
    name: s.season_name,
  }));

  const leagueNodes = nodeSeasonsData.map((ns) => {
    const node = ns.league_nodes;
    const breadcrumbs = getBreadcrumbPath(node);
    return {
      id: ns.id,
      leagueNodeId: node.id,
      parentId: node.parent_id,
      leagueId: node.league_id,
      name: `${node.leagues.name} > ${breadcrumbs}`,
      nodeName: node.name,
      level: node.level,
    };
  });

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

  // Load leagues/tournaments
  const leaguesData = await prisma.leagues.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, is_tournament: true },
  });

  const leagues = leaguesData.map((l) => ({
    id: l.id,
    name: l.name,
    isTournament: l.is_tournament ?? false,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BatchImporterClient seasons={seasons} leagues={leagues} leagueNodes={leagueNodes} teamSeasons={teamSeasons} />
    </main>
  );
}
