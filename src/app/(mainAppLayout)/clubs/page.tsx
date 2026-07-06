import { EntityShell } from "@/components/entities/EntityShell";
import { clubConfig } from "@/lib/entities/configs/club.config";
// import { locationConfig } from "@/lib/entities/configs/location.config";
import { createClub, updateClub, deleteClub } from "@/lib/actions/club-actions";
// import { createLocation } from "@/lib/actions/location-actions";
import { getClubs, getLocations } from "@/lib/data/queries";
import { injectOptions, attachCreatable } from "@/lib/utils/formHelpers";

export default async function ClubsPage() {
  const clubs = await getClubs();
  const locations = await getLocations();

  const stats = [
    { label: "Total", value: clubs.length },
    {
      label: "Club",
      value: clubs.filter((l) => l.type === "club").length,
    },
    {
      label: "High School",
      value: clubs.filter((l) => l.type === "high_school").length,
    },
  ];

  // const handleCreateLocation = async (data: Record<string, string>) => {
  //   "use server";
  //   await createLocation(data);
  //   return { value: String(data.id || data.name), label: data.name };
  // };

  let config = { ...clubConfig };
  // config = injectOptions(
  //   config,
  //   "locationName",
  //   locations.map((gb) => ({ label: gb.name, value: String(gb.id) })),
  // );
  // config = attachCreatable(
  //   config,
  //   "locationName",
  //   locationConfig,
  //   handleCreateLocation,
  // );

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={config}
        data={clubs as any}
        stats={stats}
        onCreate={createClub as any}
        onUpdate={updateClub as any}
        onDelete={deleteClub as any}
      />
    </div>
  );
}
