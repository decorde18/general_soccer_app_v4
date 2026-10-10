import { useEffect, useState } from "react";
import type { Club, TeamSeason, Season } from "@/types/nav";

interface NavBarData {
  seasons: Season[];
  clubs: Club[];
  teamSeasons: TeamSeason[];
  loading: boolean;
}

// Fetches the seasons, clubs and team seasons used to populate the NavBar selectors.
export function useNavBarData(): NavBarData {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [teamSeasons, setTeamSeasons] = useState<TeamSeason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/teams-data");
        if (!res.ok) throw new Error("Failed to fetch teams data");
        const data = await res.json();
        setSeasons(data.seasons || []);
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

  return { seasons, clubs, teamSeasons, loading };
}