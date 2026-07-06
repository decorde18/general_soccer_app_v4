import { EntityShell } from "@/components/entities/EntityShell";
import { leagueConfig } from "@/lib/entities/configs/league.config";
import { governingBodyConfig } from "@/lib/entities/configs/governingBody.config";
import {
  createLeague,
  updateLeague,
  deleteLeague,
} from "@/lib/actions/league-actions";
import { createGoverningBody } from "@/lib/actions/governingBody-actions";
import { getLeagues, getGoverningBodies } from "@/lib/data/queries";
import { injectOptions, attachCreatable } from "@/lib/utils/formHelpers";

export default async function LeaguesPage() {
  const leagues = await getLeagues();
  const governingBodies = await getGoverningBodies();

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

  const handleCreateGoverningBody = async (data: Record<string, string>) => {
    "use server";
    await createGoverningBody(data);
    return { value: String(data.id || data.name), label: data.name };
  };

  let config = { ...leagueConfig };
  config = injectOptions(
    config, 
    "governingBodyName", 
    governingBodies.map(gb => ({ label: gb.name, value: String(gb.id) }))
  );
  config = attachCreatable(
    config, 
    "governingBodyName", 
    governingBodyConfig, 
    handleCreateGoverningBody
  );

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={config}
        data={leagues as any}
        stats={stats}
        onCreate={createLeague as any}
        onUpdate={updateLeague as any}
        onDelete={deleteLeague as any}
      />
    </div>
  );
}
