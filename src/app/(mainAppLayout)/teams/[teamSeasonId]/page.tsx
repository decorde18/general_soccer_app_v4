import React from "react";
import { getTeamSeasonById } from "@/lib/data/queries";
import ToBeCreated from "@/components/ui/ToBeCreated";

interface PageProps {
  params: Promise<{ teamSeasonId: string }>;
}

export default async function TeamPage({ params }: PageProps) {
  const { teamSeasonId } = await params;
  const idNumber = Number(teamSeasonId);
  
  let teamName = `Team #${teamSeasonId}`;
  if (!isNaN(idNumber)) {
    const teamSeason = await getTeamSeasonById(idNumber);
    if (teamSeason) {
      teamName = `${teamSeason.teamName} (${teamSeason.seasonName})`;
    }
  }

  return (
    <ToBeCreated
      title={teamName}
      description={`The schedule, match results, player rosters, and in-depth analytics for ${teamName} are currently under construction. Stay tuned as we build these features!`}
    />
  );
}
