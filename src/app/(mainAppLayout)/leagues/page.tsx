// app/(main)/leagues/page.tsx
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

    return { value: data.id, label: data.name };
  };

  const config = { ...leagueConfig };
  config.form = {
    ...config.form,
    fields: config.form.fields.map((f) => {
      if (f.key === "governingBodyName") {
        return {
          ...f,
          options: governingBodies.map((gb) => ({
            label: gb.name,
            value: gb.id,
          })),
          creatableConfig: governingBodyConfig,
          onCreatableSubmit: handleCreateGoverningBody,
        };
      }
      return f;
    }),
  };

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={config}
        data={leagues}
        stats={stats}
        onCreate={createLeague}
        onUpdate={updateLeague}
        onDelete={deleteLeague}
      />
    </div>
  );
}
