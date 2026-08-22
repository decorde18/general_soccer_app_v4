import PlayerRolloverClient from "@/components/admin/PlayerRolloverClient";
import { getTeamSeasonsForRollover } from "@/lib/data/queries";

export default async function AdminRolloverPage() {
  const teamSeasons = await getTeamSeasonsForRollover();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PlayerRolloverClient teamSeasons={teamSeasons} />
    </div>
  );
}
