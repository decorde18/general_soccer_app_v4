"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Trophy, RotateCcw, Filter } from "lucide-react";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface SelectorOption {
  value: string;
  label: string;
}

interface LandingSelectorsProps {
  teamSeasons: SelectorOption[];
  leagues: SelectorOption[];
}

export default function LandingSelectors({
  teamSeasons,
  leagues,
}: LandingSelectorsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentClubType = searchParams.get("clubType") || "";
  const currentTeamSeasonId = searchParams.get("teamSeasonId") || "";
  const currentLeagueId = searchParams.get("leagueId") || "";

  const handleClubTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams();
    if (val) {
      params.set("clubType", val);
    }
    // Changing type resets team and league filters to avoid invalid combinations
    router.push(`/?${params.toString()}`);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams();
    if (currentClubType) {
      params.set("clubType", currentClubType);
    }
    if (val) {
      params.set("teamSeasonId", val);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams();
    if (currentClubType) {
      params.set("clubType", currentClubType);
    }
    if (val) {
      params.set("leagueId", val);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleClear = () => {
    router.push("/");
  };

  const hasFilter = currentClubType || currentTeamSeasonId || currentLeagueId;

  const clubTypeOptions = [
    { value: "club", label: "Club / Travel" },
    { value: "high_school", label: "High School" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mb-10">
      <div className="bg-surface/80 border border-border/80 rounded-2xl p-6 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Explore Schedule & Results
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Club Type Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-text/80 font-medium">
              <Filter size={18} className="text-primary" />
              <span>Category / Type</span>
            </div>
            <Select
              placeholder="All Club Types"
              options={clubTypeOptions}
              value={currentClubType}
              onChange={handleClubTypeChange}
              width="full"
              showPlaceholder={true}
            />
          </div>

          {/* Team Season Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-text/80 font-medium">
              <Users size={18} className="text-primary" />
              <span>Select a Team Season</span>
            </div>
            <Select
              placeholder="Choose a Team..."
              options={teamSeasons}
              value={currentTeamSeasonId}
              onChange={handleTeamChange}
              width="full"
              showPlaceholder={true}
            />
          </div>

          {/* League Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-text/80 font-medium">
              <Trophy size={18} className="text-primary" />
              <span>Select a League</span>
            </div>
            <Select
              placeholder="Choose a League..."
              options={leagues}
              value={currentLeagueId}
              onChange={handleLeagueChange}
              width="full"
              showPlaceholder={true}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasFilter && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex flex-row items-center gap-2 px-4 py-2 border-border/80 hover:bg-primary/5 active:scale-95 text-xs text-text font-bold"
            >
              <RotateCcw size={14} className="text-muted" />
              <span>Reset Filters</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
