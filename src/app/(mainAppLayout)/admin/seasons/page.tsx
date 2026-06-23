import { EntityShell } from "@/components/entities/EntityShell";
import { seasonConfig } from "@/lib/entities/configs/season.config";
import { createSeason, updateSeason, deleteSeason } from "@/lib/actions/season-actions";
import { getSeasons } from "@/lib/data/queries";

export default async function AdminSeasonsPage() {
  const seasons = await getSeasons();

  const stats = [
    { label: "Total Seasons", value: seasons.length },
    {
      label: "Active",
      value: seasons.filter((s) => s.status === "active").length,
    },
    {
      label: "Upcoming",
      value: seasons.filter((s) => s.status === "upcoming").length,
    },
    {
      label: "Completed/Archived",
      value: seasons.filter((s) => s.status === "completed" || s.status === "archived").length,
    },
  ];

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={seasonConfig}
        data={seasons as any}
        stats={stats}
        onCreate={createSeason as any}
        onUpdate={updateSeason as any}
        onDelete={deleteSeason as any}
      />
    </div>
  );
}
