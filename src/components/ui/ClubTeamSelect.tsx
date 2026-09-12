"use client";

import React, { useMemo, useEffect, useState } from "react";
import Select from "@/components/ui/Select";
import { Building2, Shield } from "lucide-react";

export interface TeamOptionItem {
  id: string | number;
  teamName: string;
  clubId?: string | number;
  clubName?: string;
  seasonId?: string | number;
  seasonName?: string;
  label?: string;
  [key: string]: any;
}

export interface ClubTeamSelectProps {
  /** Array of available team season options */
  teamSeasons: TeamOptionItem[];
  /** Currently selected team ID / value */
  value?: string | number;
  /** Callback when team selection changes. Returns (teamId, selectedTeamItem) */
  onChange: (teamId: string, selectedTeam?: TeamOptionItem | null) => void;
  /** Optional callback when club selection changes */
  onClubChange?: (clubId: string) => void;
  /** Disabled state for the entire selector */
  disabled?: boolean;
  /** Custom placeholder for Club dropdown */
  clubPlaceholder?: string;
  /** Custom placeholder for Team dropdown */
  teamPlaceholder?: string;
  /** Layout direction: 'horizontal' (2 columns side-by-side) or 'vertical' (stacked) */
  layout?: "horizontal" | "vertical";
  /** Whether to render visual section headers / labels above inputs */
  showLabels?: boolean;
  /** Custom label for Club dropdown */
  clubLabel?: string;
  /** Custom label for Team dropdown */
  teamLabel?: string;
  /** Optional container class name */
  className?: string;
  /** Optional size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Helper to derive a consistent string key for a team's club
 */

function getClubKey(item: TeamOptionItem): string {
  if (item.clubId !== undefined && item.clubId !== null && item.clubId !== "") {
    return String(item.clubId);
  }
  if (item.clubName) {
    return item.clubName.trim();
  }
  if (item.label) {
    const parts = item.label.split(" - ");
    if (parts.length > 1 && parts[0].trim()) {
      return parts[0].trim();
    }
  }
  return "Unknown Club";
}

/**
 * Helper to derive a clean display name for a team's club
 */
function getClubDisplayName(item: TeamOptionItem): string {
  if (item.clubName) {
    return item.clubName.trim();
  }
  if (item.label) {
    const parts = item.label.split(" - ");
    if (parts.length > 1 && parts[0].trim()) {
      return parts[0].trim();
    }
  }
  return "Unknown Club";
}

/**
 * ClubTeamSelect
 * A two-tier cascading selector that requires selecting the Club first, then the Team.
 */
export default function ClubTeamSelect({
  teamSeasons = [],
  value = "",
  onChange,
  onClubChange,
  disabled = false,
  clubPlaceholder = "Select Club...",
  teamPlaceholder = "Select Team...",
  layout = "horizontal",
  showLabels = true,
  clubLabel = "Select Club",
  teamLabel = "Select Team",
  className = "",
  size = "md",
}: ClubTeamSelectProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>("");

  // Sync internal selectedClubId if value prop is provided from outside
  useEffect(() => {
    if (value !== undefined && value !== null && String(value) !== "") {
      const matchedTeam = teamSeasons.find(
        (ts) => String(ts.id) === String(value),
      );
      if (matchedTeam) {
        const clubKey = getClubKey(matchedTeam);
        setSelectedClubId(clubKey);
      }
    } else {
      // If value is cleared, keep selectedClubId as is unless teamSeasons changes completely
    }
  }, [value, teamSeasons]);

  // Extract unique available clubs
  const clubOptions = useMemo(() => {
    const clubMap = new Map<string, string>();
    teamSeasons.forEach((ts) => {
      const key = getClubKey(ts);
      const name = getClubDisplayName(ts);
      if (!clubMap.has(key)) {
        clubMap.set(key, name);
      }
    });

    return Array.from(clubMap.entries())
      .map(([val, name]) => ({
        value: val,
        label: name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teamSeasons]);

  // Filter available teams by currently selected club
  const teamOptions = useMemo(() => {
    if (!selectedClubId) return [];

    return teamSeasons
      .filter((ts) => getClubKey(ts) === selectedClubId)
      .map((ts) => {
        let displayTeamName = ts.teamName;
        if (!displayTeamName && ts.label) {
          const parts = ts.label.split(" - ");
          displayTeamName = parts.length > 1 ? parts.slice(1).join(" - ") : ts.label;
        }
        return {
          value: String(ts.id),
          label: displayTeamName || `Team #${ts.id}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teamSeasons, selectedClubId]);

  // Handle club dropdown change
  const handleClubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClubId = e.target.value;
    setSelectedClubId(newClubId);
    if (onClubChange) onClubChange(newClubId);

    // If current selected team does not belong to new club, clear selected team
    if (value !== undefined && value !== null && String(value) !== "") {
      const currentTeam = teamSeasons.find(
        (ts) => String(ts.id) === String(value),
      );
      if (currentTeam && getClubKey(currentTeam) !== newClubId) {
        onChange("", null);
      }
    }
  };

  // Handle team dropdown change
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = e.target.value;
    const selectedTeam =
      teamSeasons.find((ts) => String(ts.id) === String(newTeamId)) || null;
    onChange(newTeamId, selectedTeam);
  };

  const isTeamDisabled =
    disabled || !selectedClubId || teamOptions.length === 0;

  const containerLayoutClass =
    layout === "horizontal"
      ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
      : "space-y-3";

  return (
    <div className={`w-full ${containerLayoutClass} ${className}`}>
      {/* 1. Club Selector */}
      <div className="space-y-1">
        {showLabels && (
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>{clubLabel}</span>
          </label>
        )}
        <Select
          value={selectedClubId}
          onChange={handleClubChange}
          placeholder={
            clubOptions.length > 0 ? clubPlaceholder : "No clubs available"
          }
          options={clubOptions}
          disabled={disabled || clubOptions.length === 0}
          showPlaceholder={true}
          size={size}
          className="w-full"
        />
      </div>

      {/* 2. Team Selector */}
      <div className="space-y-1">
        {showLabels && (
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{teamLabel}</span>
          </label>
        )}
        <Select
          value={String(value || "")}
          onChange={handleTeamChange}
          placeholder={
            !selectedClubId
              ? "Select a club first..."
              : teamOptions.length > 0
                ? teamPlaceholder
                : "No teams for this club"
          }
          options={teamOptions}
          disabled={isTeamDisabled}
          showPlaceholder={true}
          size={size}
          className="w-full"
        />
      </div>
    </div>
  );
}
