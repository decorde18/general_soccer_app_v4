import AdminSeasonsClient from "@/components/admin/AdminSeasonsClient";
import { getSeasons, getAgeGroups } from "@/lib/data/queries";

export default async function AdminSeasonsPage() {
  const [seasons, allAgeGroups] = await Promise.all([
    getSeasons(),
    getAgeGroups(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminSeasonsClient
        initialSeasons={seasons}
        allAgeGroups={allAgeGroups}
      />
    </div>
  );
}
