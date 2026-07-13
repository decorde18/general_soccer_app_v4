import { getClubs, getTeams } from "@/lib/data/queries";
import ClubsDashboardClient from "@/components/admin/ClubsDashboardClient";

export default async function AdminClubsPage() {
  const [clubs, teams] = await Promise.all([
    getClubs(),
    getTeams()
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ClubsDashboardClient
        initialClubs={clubs as any}
        initialTeams={teams as any}
      />
    </div>
  );
}
