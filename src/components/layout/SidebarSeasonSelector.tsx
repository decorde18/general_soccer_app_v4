"use client";

import React from "react";
import { Calendar } from "lucide-react";
import Select from "@/components/ui/Select";
import type { Season } from "@/types/nav";

interface SidebarSeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export default function SidebarSeasonSelector({
  seasons,
  selectedSeasonId,
  onChange,
  className = "",
}: SidebarSeasonSelectorProps) {
  if (seasons.length === 0) return null;

  if (seasons.length === 1) {
    return (
      <div className={`p-4 border-b border-border space-y-1.5 ${className}`}>
        <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
          Current Season
        </span>
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface/50">
          <Calendar size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-text truncate">{seasons[0].season_name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border-b border-border ${className}`}>
      <Select
        label="Current Season"
        value={selectedSeasonId}
        onChange={onChange}
        options={[
          { value: "", label: "All Seasons" },
          ...seasons.map((season) => ({ value: String(season.id), label: season.season_name })),
        ]}
        width="full"
        showPlaceholder={false}
      />
    </div>
  );
}
