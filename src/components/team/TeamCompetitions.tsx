"use client";

import Link from "next/link";
import { ArrowRight, Trophy, Swords } from "lucide-react";

export interface TeamCompetitionSummary {
  leagueId: number;
  leagueName: string;
  leagueNodeId: number;
  leagueNodeName: string;
  leagueNodeSeasonId: number;
  isTournament: boolean;
  record: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
  } | null;
  position: number | null;
}

interface TeamCompetitionsProps {
  competitions: TeamCompetitionSummary[];
}

function CompetitionCard({
  competition,
}: {
  competition: TeamCompetitionSummary;
}) {
  const record = competition.record;
  const positionLabel =
    competition.position !== null && competition.position !== undefined
      ? `#${competition.position}`
      : "—";

  return (
    <Link href={`/leagues/${competition.leagueId}`} className='group block'>
      <div className='rounded-2xl border border-border/70 bg-surface/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary'>
                {competition.isTournament ? (
                  <Swords size={12} />
                ) : (
                  <Trophy size={12} />
                )}
                {competition.isTournament ? "Tournament" : "League"}
              </span>
              <span className='text-xs font-semibold uppercase tracking-[0.2em] text-muted'>
                {competition.leagueNodeName}
              </span>
            </div>
            <h3 className='mt-2 text-base font-semibold text-text'>
              {competition.leagueName}
            </h3>
            <p className='mt-1 text-sm text-muted'>
              {competition.leagueNodeName}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-muted'>
              Position
            </p>
            <p className='text-lg font-bold text-text'>{positionLabel}</p>
          </div>
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-3 text-sm'>
          <span className='rounded-full border border-border/70 bg-background/70 px-3 py-1 font-semibold text-text'>
            {record
              ? `${record.wins}-${record.losses}-${record.draws}`
              : "No record yet"}
          </span>
          <span className='text-sm font-medium text-muted'>
            {record ? `${record.points} pts` : "Standings pending"}
          </span>
        </div>

        <div className='mt-4 flex items-center gap-1 text-sm font-semibold text-primary'>
          View standings
          <ArrowRight
            size={14}
            className='transition-transform group-hover:translate-x-0.5'
          />
        </div>
      </div>
    </Link>
  );
}

export default function TeamCompetitions({
  competitions,
}: TeamCompetitionsProps) {
  const leagues = competitions.filter(
    (competition) => !competition.isTournament,
  );
  const tournaments = competitions.filter(
    (competition) => competition.isTournament,
  );

  const renderSection = (
    title: string,
    items: TeamCompetitionSummary[],
    emptyMessage: string,
  ) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <section className='space-y-3'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg font-semibold text-text'>{title}</h2>
          <span className='rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted'>
            {items.length}
          </span>
        </div>
        {items.length > 0 ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {items.map((competition) => (
              <CompetitionCard
                key={competition.leagueNodeSeasonId}
                competition={competition}
              />
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted'>{emptyMessage}</p>
        )}
      </section>
    );
  };

  return (
    <div className='space-y-8'>
      {renderSection("Leagues", leagues, "No league competitions yet.")}
      {renderSection(
        "Tournaments",
        tournaments,
        "No tournament competitions yet.",
      )}
    </div>
  );
}
