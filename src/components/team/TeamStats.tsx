"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Search, ShieldAlert, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

interface PlayerSeasonStats {
  id: number;
  playerId: number;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  gamesPlayed: number;
  gamesStarted: number;
  minutesPlayed: number;
}

interface TeamStatsProps {
  stats: PlayerSeasonStats[];
}

type SortKey = "name" | "goals" | "assists" | "points" | "gamesPlayed" | "gamesStarted" | "yellowCards" | "redCards" | "minutesPlayed";
type SortDirection = "asc" | "desc";

export default function TeamStats({ stats }: TeamStatsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Handle column header clicks for sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Toggle direction if already sorting by this key
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Default to descending for numbers, ascending for name
      setSortKey(key);
      setSortDirection(key === "name" ? "asc" : "desc");
    }
  };

  // Process, filter, and sort statistics
  const sortedStats = useMemo(() => {
    let list = stats.map(s => ({
      ...s,
      points: s.goals + s.assists // Standard points calculation: G + A
    }));

    // Apply Search Filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortKey === "name") {
        valA = `${a.lastName} ${a.firstName}`.toLowerCase();
        valB = `${b.lastName} ${b.firstName}`.toLowerCase();
      } else {
        valA = a[sortKey];
        valB = b[sortKey];
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [stats, searchQuery, sortKey, sortDirection]);

  // Sort Indicator Icon helper
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={12} className="ml-1 text-muted opacity-40 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === "asc" ? (
      <ChevronUp size={12} className="ml-1 text-primary" />
    ) : (
      <ChevronDown size={12} className="ml-1 text-primary" />
    );
  };

  return (
    <div className="space-y-6">
      
      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border/80 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text"
            placeholder="Search player stats by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text placeholder:text-muted/65 transition-all"
          />
        </div>
        
        <span className="text-xs text-muted font-bold uppercase tracking-wider self-end sm:self-auto px-1">
          {sortedStats.length} Players Listed
        </span>
      </div>

      {/* STATS BOARD TABLE */}
      {sortedStats.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center py-16">
          <ShieldAlert size={40} className="mx-auto text-muted/60 mb-3" />
          <p className="text-muted font-medium">No stats records found.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-surface shadow-sm">
          <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-0">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[11px] font-bold uppercase tracking-wider text-muted select-none">
                <th 
                  onClick={() => handleSort("name")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-background/80 transition-colors group"
                >
                  <span className="flex items-center">
                    Player Name <SortIcon column="name" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort("goals")}
                  className="py-3.5 px-3 cursor-pointer hover:bg-background/80 transition-colors text-center group w-20"
                >
                  <span className="flex items-center justify-center">
                    Goals <SortIcon column="goals" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort("assists")}
                  className="py-3.5 px-3 cursor-pointer hover:bg-background/80 transition-colors text-center group w-20"
                >
                  <span className="flex items-center justify-center">
                    Assists <SortIcon column="assists" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort("points")}
                  className="py-3.5 px-3 cursor-pointer hover:bg-background/80 transition-colors text-center group w-24"
                >
                  <span className="flex items-center justify-center">
                    Pts (G+A) <SortIcon column="points" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort("gamesPlayed")}
                  className="py-3.5 px-3 cursor-pointer hover:bg-background/80 transition-colors text-center group w-20"
                >
                  <span className="flex items-center justify-center">
                    GP <SortIcon column="gamesPlayed" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort("gamesStarted")}
                  className="py-3.5 px-3 cursor-pointer hover:bg-background/80 transition-colors text-center group w-20 hidden md:table-cell"
                >
                  <span className="flex items-center justify-center">
                    Starts <SortIcon column="gamesStarted" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort("minutesPlayed")}
                  className="py-3.5 px-3 cursor-pointer hover:bg-background/80 transition-colors text-center group w-24 hidden lg:table-cell"
                >
                  <span className="flex items-center justify-center">
                    Mins <SortIcon column="minutesPlayed" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort("yellowCards")}
                  className="py-3.5 px-2 cursor-pointer hover:bg-background/80 transition-colors text-center group w-16 hidden sm:table-cell"
                >
                  <span className="flex items-center justify-center">
                    YC <SortIcon column="yellowCards" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort("redCards")}
                  className="py-3.5 px-2 cursor-pointer hover:bg-background/80 transition-colors text-center group w-16 hidden sm:table-cell"
                >
                  <span className="flex items-center justify-center">
                    RC <SortIcon column="redCards" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((row) => (
                <tr 
                  key={row.id} 
                  className="border-b border-border/60 hover:bg-background/25 last:border-none transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-text">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-extrabold text-primary bg-primary/[0.02]">
                    {row.goals}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-extrabold text-accent bg-accent/[0.02]">
                    {row.assists}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-extrabold text-text bg-background/30">
                    {row.points}
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-text/80 font-semibold">
                    {row.gamesPlayed}
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-muted font-medium hidden md:table-cell">
                    {row.gamesStarted}
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-muted font-medium hidden lg:table-cell">
                    {row.minutesPlayed}
                  </td>
                  <td className="py-3 px-2 text-center hidden sm:table-cell">
                    {row.yellowCards > 0 ? (
                      <span className="inline-block h-5 w-4 rounded bg-yellow-400 font-bold text-xs text-yellow-950 text-center leading-5 shadow-sm">
                        {row.yellowCards}
                      </span>
                    ) : (
                      <span className="text-muted/40 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center hidden sm:table-cell">
                    {row.redCards > 0 ? (
                      <span className="inline-block h-5 w-4 rounded bg-red-600 font-bold text-xs text-white text-center leading-5 shadow-sm">
                        {row.redCards}
                      </span>
                    ) : (
                      <span className="text-muted/40 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
