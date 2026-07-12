import { getClubs, getTeams } from "@/lib/data/queries";
import ClubsDashboardClient from "@/components/admin/ClubsDashboardClient";

export default async function AdminClubsPage() {
  const [clubs, teams] = await Promise.all([
    getClubs(),
    getTeams()
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ClubsDashboardClient
        initialClubs={clubs as any}
        initialTeams={teams as any}
      />
    </div>
  );
}
