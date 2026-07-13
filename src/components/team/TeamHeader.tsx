"use client";

import React from "react";
import { Shield, Trophy } from "lucide-react";

export interface TeamLeagueLink {
  leagueId: number;
  leagueName: string;
  leagueNodeId: number;
  leagueNodeName: string;
  leagueNodeSeasonId: number;
  isTournament?: boolean;
  record?: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
  } | null;
  position?: number | null;
}

interface TeamHeaderProps {
  teamName: string;
  clubName: string;
  seasonName: string;
  ageGroup: string | number | null;
  ageGroupName?: string | null;
  record: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
  } | null;
}

export default function TeamHeader({
  teamName,
  clubName,
  seasonName,
  ageGroup,
  ageGroupName,
  record,
}: TeamHeaderProps) {
  const ageGroupLabel =
    ageGroupName?.trim() || (ageGroup ? String(ageGroup) : null);

  return (
    <div className='relative overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-md'>
      {/* Decorative backdrop gradients */}
      <div className='absolute inset-0 -z-10 bg-linear-to-r from-primary/5 to-accent/5' />
      <div className='absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl' />
      <div className='absolute left-1/3 bottom-0 -z-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl' />

      <div className='p-5 sm:p-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner'>
              <Shield size={28} className='stroke-[1.5]' />
            </div>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary'>
                  {clubName}
                </span>
                {ageGroupLabel && (
                  <span className='rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent'>
                    {ageGroupLabel}
                  </span>
                )}
              </div>
              <h1 className='mt-1 text-xl font-extrabold tracking-tight text-text sm:text-2xl'>
                {teamName}
              </h1>
              <p className='mt-0.5 text-sm font-medium text-muted'>
                {seasonName} Season
              </p>
            </div>
          </div>

          {record && (
            <div className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 shadow-sm'>
              <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent'>
                <Trophy size={18} />
              </div>
              <div>
                <div className='text-[10px] font-bold uppercase tracking-[0.2em] text-muted'>
                  Record (W-L-D)
                </div>
                <div className='flex items-baseline gap-1.5'>
                  <span className='text-base font-bold text-text'>
                    {record.wins}-{record.losses}-{record.draws}
                  </span>
                  <span className='text-xs font-semibold text-muted'>
                    ({record.points} pts)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
