import { EntityShell } from "@/components/entities/EntityShell";
import { locationConfig } from "@/lib/entities/configs/location.config";
import { createLocation, updateLocation, deleteLocation } from "@/lib/actions/location-actions";
import { getLocations } from "@/lib/data/queries";

export default async function LocationsPage() {
  const locations = await getLocations();

  const stats = [{ label: "Total Locations", value: locations.length }];

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={locationConfig}
        data={locations as any}
        stats={stats}
        onCreate={createLocation as any}
        onUpdate={updateLocation as any}
        onDelete={deleteLocation as any}
      />
    </div>
  );
}
