// app/(main)/leagues/page.tsx
import { EntityShell } from "@/components/entities/EntityShell";
import { leagueConfig } from "@/lib/entities/configs/league.config";
import {
  createLeague,
  updateLeague,
  deleteLeague,
} from "@/lib/actions/league-actions";
import { getLeagues } from "@/lib/data/queries";

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  const stats = [
    { label: "Total", value: leagues.length },
    {
      label: "Active",
      value: leagues.filter((l) => l.status === "active").length,
    },
    {
      label: "Upcoming",
      value: leagues.filter((l) => l.status === "upcoming").length,
    },
    {
      label: "Inactive",
      value: leagues.filter((l) => l.status === "inactive").length,
    },
  ];

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={leagueConfig}
        data={leagues}
        stats={stats}
        onCreate={createLeague}
        onUpdate={updateLeague}
        onDelete={deleteLeague}
      />
    </div>
  );
}
