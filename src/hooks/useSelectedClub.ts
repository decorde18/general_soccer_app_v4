import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { TeamSeason } from "@/types/nav";

// Keeps the selected club in sync with whichever team is shown in the
// current URL (e.g. /teams/42 implies that team's club).
export function useSelectedClub(
  teamSeasons: TeamSeason[],
  loading: boolean
): [string, (id: string) => void] {
  const [selectedClubId, setSelectedClubId] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    if (loading || teamSeasons.length === 0) return;

    const teamMatch = pathname?.match(/\/teams\/(\d+)/);
    if (teamMatch) {
      const currentId = Number(teamMatch[1]);
      const currentTeam = teamSeasons.find((t) => t.id === currentId);
      if (currentTeam) {
        setSelectedClubId(String(currentTeam.clubId));
      }
    }
  }, [pathname, loading, teamSeasons]);

  return [selectedClubId, setSelectedClubId];
}