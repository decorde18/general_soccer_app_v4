import { getGameById } from "@/lib/data/queries";
import { loadGameLineup } from "@/lib/actions/gameLineup-actions";

import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    teamSeasonId: string;
    id: string;
  }>;
}

export default async function LineupPage({ params }: PageProps) {
  const { teamSeasonId, id } = await params;
  const gameIdNum = Number(id);
  const teamSeasonIdNum = Number(teamSeasonId);


  return (<>
<div>teamSeasonId:{teamSeasonId}</div>
<div>id:{id}</div>
  </>
  );
}
