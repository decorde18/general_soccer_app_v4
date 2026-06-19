"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Select from "@/components/ui/Select";

interface SeasonOption {
  id: number;
  season_name: string;
}

interface ClubOption {
  id: number;
  name: string;
}

interface TeamSeasonOption {
  id: number;
  seasonId: number;
  seasonName: string;
  teamName: string;
  clubId: number;
}

function TeamSelector({
  type,
  onContextChange,
}: {
  type?: string;
  onContextChange?: (context: { teamSeasonId?: number } | null) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [teamSeasons, setTeamSeasons] = useState<TeamSeasonOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector states
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedTeamSeasonId, setSelectedTeamSeasonId] = useState<string>("");

  // Fetch real data on mount
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
        console.error("Error loading selector options:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Update selected values based on the current URL
  useEffect(() => {
    if (loading || teamSeasons.length === 0) return;

    const teamMatch = pathname?.match(/\/teams\/(\d+)/);
    if (teamMatch) {
      const currentId = Number(teamMatch[1]);
      const currentTeam = teamSeasons.find((t) => t.id === currentId);
      if (currentTeam) {
        setSelectedSeasonId(String(currentTeam.seasonId));
        setSelectedClubId(String(currentTeam.clubId));
        setSelectedTeamSeasonId(String(currentTeam.id));
        return;
      }
    }

    // Reset selected team if we navigate away from a team page
    setSelectedTeamSeasonId("");
  }, [pathname, loading, teamSeasons]);

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSeasonId(val);
    setSelectedClubId(""); // Reset club when season changes
    setSelectedTeamSeasonId(""); // Reset team when season changes
    if (onContextChange) onContextChange(null);
  };

  const handleClubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClubId(val);
    setSelectedTeamSeasonId(""); // Reset team when club changes
    if (onContextChange) onContextChange(null);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTeamSeasonId(val);

    if (val) {
      const tId = Number(val);
      if (onContextChange) {
        onContextChange({ teamSeasonId: tId });
      }
      // Redirect to that team's homepage
      router.push(`/teams/${tId}`);
    } else {
      if (onContextChange) onContextChange(null);
    }
  };

  // Filter team options based on selected Season and/or Club
  const filteredTeams = teamSeasons.filter((ts) => {
    const matchSeason = selectedSeasonId ? ts.seasonId === Number(selectedSeasonId) : true;
    const matchClub = selectedClubId ? ts.clubId === Number(selectedClubId) : true;
    return matchSeason && matchClub;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 animate-pulse">
        <div className="h-9 w-28 bg-border/40 rounded-lg" />
        <div className="h-9 w-28 bg-border/40 rounded-lg" />
        <div className="h-9 w-40 bg-border/40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center justify-center gap-3 w-full max-w-3xl">
      {/* Season Dropdown */}
      <Select
        placeholder="All Seasons"
        options={seasons.map((s) => ({ value: String(s.id), label: s.season_name }))}
        value={selectedSeasonId}
        onChange={handleSeasonChange}
        width="auto"
        className="min-w-[110px] sm:min-w-[130px]"
        showPlaceholder={true}
      />

      {/* Club Dropdown - Only show if season is selected */}
      {selectedSeasonId && (
        <Select
          placeholder="All Clubs"
          options={clubs.map((c) => ({ value: String(c.id), label: c.name }))}
          value={selectedClubId}
          onChange={handleClubChange}
          width="auto"
          className="min-w-[110px] sm:min-w-[140px]"
          showPlaceholder={true}
        />
      )}

      {/* Team Dropdown - Only show if club is selected */}
      {selectedClubId && (
        <Select
          placeholder="Choose Team..."
          options={filteredTeams.map((t) => ({
            value: String(t.id),
            label: `${t.teamName} (${t.seasonName})`,
          }))}
          value={selectedTeamSeasonId}
          onChange={handleTeamChange}
          width="auto"
          className="min-w-[160px] sm:min-w-[200px]"
          showPlaceholder={true}
        />
      )}
    </div>
  );
}

export default TeamSelector;
