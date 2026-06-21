import { useEffect, useState } from "react";
import type { Club, TeamSeason } from "@/types/nav";

interface NavBarData {
  clubs: Club[];
  teamSeasons: TeamSeason[];
  loading: boolean;
}

// Fetches the clubs and team seasons used to populate the NavBar selectors.
export function useNavBarData(): NavBarData {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [teamSeasons, setTeamSeasons] = useState<TeamSeason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/teams-data");
        if (!res.ok) throw new Error("Failed to fetch teams data");
        const data = await res.json();
        setClubs(data.clubs || []);
        setTeamSeasons(data.teamSeasons || []);
      } catch (error) {
        console.error("Error loading teams data in NavBar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { clubs, teamSeasons, loading };
}