"use client";

import React from "react";
import { Shield, Trophy, Users } from "lucide-react";
import Link from "next/link";

export interface TeamLeagueLink {
  leagueId: number;
  leagueName: string;
  leagueNodeId: number;
  leagueNodeName: string;
  leagueNodeSeasonId: number;
}

interface TeamHeaderProps {
  teamName: string;
  clubName: string;
  seasonName: string;
  ageGroup: string | number | null;
  record: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
  } | null;
  rosterCount: number;
  leagueLinks?: TeamLeagueLink[];
}

export default function TeamHeader({
  teamName,
  clubName,
  seasonName,
  ageGroup,
  record,
  rosterCount,
  leagueLinks,
}: TeamHeaderProps) {
  const totalGames = record ? record.wins + record.losses + record.draws : 0;
  const winRate = totalGames > 0 ? Math.round(((record!.wins + 0.5 * record!.draws) / totalGames) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-md">
      {/* Decorative backdrop gradients */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-accent/5" />
      <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute left-1/3 bottom-0 -z-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          
          {/* Brand/Identity Details */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <Shield size={36} className="stroke-[1.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  {clubName}
                </span>
                {ageGroup && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">
                    Age Group: {ageGroup}
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-2xl font-extrabold text-text sm:text-3xl tracking-tight">
                {teamName}
              </h1>
              <p className="text-sm font-medium text-muted mt-0.5">
                {seasonName} Season
              </p>
              {leagueLinks && leagueLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {leagueLinks.map((link) => (
                    <Link
                      key={link.leagueNodeSeasonId}
                      href={`/leagues/${link.leagueId}`}
                      className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1 rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      <Trophy size={12} className="stroke-[2.5]" />
                      <span>{link.leagueName} ({link.leagueNodeName}) Standings</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {/* Record Panel */}
            {record && (
              <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Trophy size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Record (W-L-D)
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-text">
                      {record.wins}-{record.losses}-{record.draws}
                    </span>
                    <span className="text-xs font-semibold text-muted">
                      ({record.points} pts)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Roster Size */}
            <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Squad Size
                </div>
                <div className="text-lg font-bold text-text">
                  {rosterCount} <span className="text-xs font-semibold text-muted">Players</span>
                </div>
              </div>
            </div>

            {/* Win Ratio */}
            {totalGames > 0 && (
              <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <span className="text-sm font-extrabold">{winRate}%</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    Win Ratio
                  </div>
                  <div className="text-lg font-bold text-text">
                    {winRate}% <span className="text-xs font-semibold text-muted">Pct</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
