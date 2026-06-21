"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Grid, List, Search, Star, User } from "lucide-react";

interface Player {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  jerseyNumber: number | null;
  position: string | null;
  grade: string | null;
  status: string;
  captain: boolean;
  isActive: boolean;
}

interface TeamRosterProps {
  players: Player[];
}

export default function TeamRoster({ players }: TeamRosterProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter roster based on search input
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      const nickname = (player.nickname || "").toLowerCase();
      const pos = (player.position || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      
      return fullName.includes(query) || nickname.includes(query) || pos.includes(query);
    });
  }, [players, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* FILTER & TOGGLE CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border/80 p-4 rounded-2xl shadow-sm">
        
        {/* Search input */}
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text"
            placeholder="Search players by name, nickname, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text placeholder:text-muted/65 transition-all"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2">Layout</span>
          <div className="inline-flex rounded-xl bg-background border border-border/60 p-1">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary text-white" : "text-muted hover:text-text"}`}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-white" : "text-muted hover:text-text"}`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* NO PLAYERS PLACEHOLDER */}
      {filteredPlayers.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center py-16">
          <User size={40} className="mx-auto text-muted/60 mb-3" />
          <p className="text-muted font-medium">No players found matching your search.</p>
        </Card>
      ) : viewMode === "grid" ? (
        
        /* GRID LAYOUT (CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <Card 
              key={player.id} 
              variant="hover" 
              padding="none" 
              className="relative overflow-hidden border-border/80 bg-surface flex flex-col h-full"
            >
              {/* Card top banner accent */}
              <div className="h-2 w-full bg-gradient-to-r from-primary to-accent" />
              
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                
                {/* Header details */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 font-black text-lg">
                    {player.jerseyNumber !== null ? `#${player.jerseyNumber}` : "--"}
                  </div>
                  
                  {/* Captain / Status Badge */}
                  <div className="flex flex-col gap-1 items-end">
                    {player.captain && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full shadow-sm">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        <span>Captain</span>
                      </span>
                    )}
                    {!player.isActive && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted bg-background border border-border px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Name and Position */}
                <div>
                  <h3 className="font-extrabold text-text text-base sm:text-lg leading-snug">
                    {player.firstName} {player.lastName}
                    {player.nickname && (
                      <span className="text-muted text-sm font-normal italic block mt-0.5">
                        "{player.nickname}"
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {player.position && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {player.position}
                      </span>
                    )}
                    {player.grade && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                        Grade {player.grade}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      ) : (
        
        /* TABLE/LIST LAYOUT */
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-surface shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="py-3 px-4 w-16 text-center">Jersey</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Class/Grade</th>
                <th className="py-3 px-4 w-28 text-center">Roles</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr 
                  key={player.id} 
                  className="border-b border-border/60 hover:bg-background/25 last:border-none transition-colors"
                >
                  <td className="py-3.5 px-4 font-black text-primary text-center">
                    {player.jerseyNumber !== null ? `#${player.jerseyNumber}` : "--"}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-text">
                      {player.firstName} {player.lastName}
                      {player.nickname && (
                        <span className="text-muted text-xs font-normal italic ml-1.5">
                          ({player.nickname})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-text/80 font-medium">
                    {player.position || "--"}
                  </td>
                  <td className="py-3.5 px-4 text-sm text-text/80 font-medium">
                    {player.grade ? `Grade ${player.grade}` : "--"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {player.captain && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Star size={10} className="fill-amber-500 text-amber-500" />
                          <span>Captain</span>
                        </span>
                      )}
                      {!player.isActive && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted bg-background border px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                      {!player.captain && player.isActive && (
                        <span className="text-xs text-muted font-medium">Player</span>
                      )}
                    </div>
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
