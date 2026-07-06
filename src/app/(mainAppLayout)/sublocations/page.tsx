import { EntityShell } from "@/components/entities/EntityShell";
import { subLocationConfig } from "@/lib/entities/configs/subLocation.config";
import { createSubLocation, updateSubLocation, deleteSubLocation } from "@/lib/actions/sublocation-actions";
import { getsubLocations, getLocations } from "@/lib/data/queries";
import { injectOptions } from "@/lib/utils/formHelpers";

export default async function SubLocationsPage() {
  const subLocations = await getsubLocations();
  const locations = await getLocations();

  const stats = [{ label: "Total Sub-Locations", value: subLocations.length }];

  let config = { ...subLocationConfig };
  config = injectOptions(
    config,
    "locationName",
    locations.map((loc) => ({ label: loc.name, value: String(loc.id) }))
  );

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={config}
        data={subLocations as any}
        stats={stats}
        onCreate={createSubLocation as any}
        onUpdate={updateSubLocation as any}
        onDelete={deleteSubLocation as any}
      />
    </div>
  );
}
