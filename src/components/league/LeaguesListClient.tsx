"use client";

import React, { useState, useMemo } from "react";
import { Trophy, Search, ChevronRight, Shield, Layers } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface LeagueItem {
  id: number;
  name: string;
  abbreviation: string | null;
  governingBodyName: string | null;
  description: string | null;
  isTournament: boolean;
  status: string;
  divisionsCount: number;
}

interface LeaguesListClientProps {
  leagues: LeagueItem[];
}

export default function LeaguesListClient({ leagues }: LeaguesListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "upcoming">("all");

  const filteredLeagues = useMemo(() => {
    return leagues.filter((league) => {
      // 1. Text Search Filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = league.name.toLowerCase().includes(q);
        const matchAbbr = league.abbreviation?.toLowerCase().includes(q) || false;
        const matchGov = league.governingBodyName?.toLowerCase().includes(q) || false;
        if (!matchName && !matchAbbr && !matchGov) return false;
      }

      // 2. Status Filter
      if (selectedStatus !== "all" && league.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [leagues, searchQuery, selectedStatus]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-md p-6 sm:p-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent" />
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
            <Trophy size={36} className="stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text sm:text-3xl tracking-tight">
              Leagues & Competitions
            </h1>
            <p className="text-muted text-sm mt-1 max-w-2xl">
              Explore active soccer leagues, tournaments, and division standings.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border/80 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search leagues or governing bodies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text placeholder:text-muted/65 transition-all"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex rounded-xl bg-background border border-border/60 p-1 w-full sm:w-auto">
          {(["all", "active", "upcoming"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                selectedStatus === status
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              {status === "all" ? "All Statuses" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Leagues Cards Grid */}
      {filteredLeagues.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center py-16 bg-surface/35">
          <Shield size={40} className="mx-auto text-muted/60 mb-3" />
          <p className="text-muted font-medium">No leagues found matching your criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeagues.map((league) => (
            <Card
              key={league.id}
              variant="default"
              padding="lg"
              className="flex flex-col justify-between hover:border-primary/50 transition-all duration-200 group bg-surface/60"
            >
              <div className="space-y-4">
                {/* Badges Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {league.governingBodyName && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
                        {league.governingBodyName}
                      </span>
                    )}
                    {league.abbreviation && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                        {league.abbreviation}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      league.status === "active"
                        ? "bg-success/10 text-success border border-success/20"
                        : league.status === "upcoming"
                        ? "bg-warning/10 text-warning border border-warning/20"
                        : "bg-surface border border-border text-muted"
                    }`}
                  >
                    {league.status}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-text group-hover:text-primary transition-colors flex items-center gap-2">
                    <span>{league.name}</span>
                    {league.isTournament && (
                      <span className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Tournament
                      </span>
                    )}
                  </h3>
                  {league.description && (
                    <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {league.description}
                    </p>
                  )}
                </div>

                {/* Info Pills */}
                <div className="flex items-center gap-4 text-xs text-muted pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers size={14} className="text-primary" />
                    {league.divisionsCount} Active {league.divisionsCount === 1 ? "Division" : "Divisions"}
                  </span>
                </div>
              </div>

              {/* View Standings Action Button */}
              <div className="mt-6 pt-4 border-t border-border/60">
                <Link href={`/leagues/${league.id}`}>
                  <Button
                    variant="primary"
                    className="w-full flex items-center justify-center gap-2 text-xs py-2 group-hover:bg-primary/90 transition-all"
                  >
                    <span>View Standings & Divisions</span>
                    <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
