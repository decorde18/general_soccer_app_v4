import { getLocations, getsubLocations } from "@/lib/data/queries";
import LocationsDashboardClient from "@/components/admin/LocationsDashboardClient";

export default async function LocationsPage() {
  const [locations, subLocations] = await Promise.all([
    getLocations(),
    getsubLocations()
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <LocationsDashboardClient
        initialLocations={locations as any}
        initialSubLocations={subLocations as any}
      />
    </div>
  );
}
