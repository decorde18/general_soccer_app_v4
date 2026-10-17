import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { TeamSeason } from "@/types/nav";

// Keeps the selected club in sync with whichever team is shown in the
// current URL (e.g. /teams/42 implies that team's club).
export function useSelectedClub(
  teamSeasons: TeamSeason[],
  loading: boolean
): [string, (id: string) => void] {
  const [selectedClubId, setSelectedClubIdState] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("soccer_sidepanel_club_id");
      if (saved) {
        setSelectedClubIdState(saved);
      }
    }
  }, []);

  const setSelectedClubId = (id: string) => {
    setSelectedClubIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("soccer_sidepanel_club_id", id);
      } else {
        localStorage.removeItem("soccer_sidepanel_club_id");
      }
    }
  };

  useEffect(() => {
    if (loading || teamSeasons.length === 0) return;

    const teamMatch = pathname?.match(/\/teams\/(\d+)/);
    if (teamMatch) {
      const currentId = Number(teamMatch[1]);
      const currentTeam = teamSeasons.find((t) => t.id === currentId);
      if (currentTeam) {
        const cId = String(currentTeam.clubId);
        setSelectedClubIdState(cId);
        if (typeof window !== "undefined") {
          localStorage.setItem("soccer_sidepanel_club_id", cId);
        }
      }
    }
  }, [pathname, loading, teamSeasons]);

  return [selectedClubId, setSelectedClubId];
}