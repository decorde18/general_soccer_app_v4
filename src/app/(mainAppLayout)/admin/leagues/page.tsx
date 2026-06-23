import React from "react";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import LeaguesStructureClient from "@/components/admin/LeaguesStructureClient";
import {
  getLeagues,
  getLeagueNodes,
  getTeamSeasons,
  getSeasons,
  getTeamLeagueEnrollments,
} from "@/lib/data/queries";

export default async function AdminLeaguesPage() {
  await verifyAdmin();

  const [leagues, leagueNodes, teamSeasons, seasons, teamEnrollments] =
    await Promise.all([
      getLeagues(),
      getLeagueNodes(),
      getTeamSeasons(),
      getSeasons(),
      getTeamLeagueEnrollments(),
    ]);

  const leaguesData = leagues.map((l) => ({
    label: l.name,
    value: String(l.id),
  }));

  const leagueNodesOptionsData = leagueNodes.map((n) => ({
    label: `${n.leagueName} - ${n.name}`,
    value: String(n.id),
  }));

  const teamSeasonsData = teamSeasons.map((ts) => ({
    label: `${ts.clubName} - ${ts.teamName} (${ts.seasonName})`,
    value: String(ts.id),
  }));

  const seasonsData = seasons.map((s) => ({
    label: s.seasonName,
    value: String(s.id),
  }));

  const activeSeason = seasons.find((s) => s.status === "active") || seasons[0];
  const defaultSeasonId = activeSeason ? String(activeSeason.id) : "";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <LeaguesStructureClient
        leaguesData={leaguesData}
        leagueNodesOptionsData={leagueNodesOptionsData}
        teamSeasonsData={teamSeasonsData}
        seasonsData={seasonsData}
        leagueNodesRecords={leagueNodes}
        teamEnrollmentsRecords={teamEnrollments}
        defaultSeasonId={defaultSeasonId}
      />
    </div>
  );
}
