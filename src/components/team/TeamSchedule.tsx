"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Calendar, MapPin, Clock, Trophy, Play, ShieldAlert, SquareChevronRight, Edit3, Plus } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import QuickScoreModal from "@/components/dashboard/QuickScoreModal";
import GameSchedulerModal from "@/components/dashboard/GameSchedulerModal";
import GameEditModal from "@/components/dashboard/GameEditModal";

interface Game {
  id: number;
  seasonId: number;
  seasonName: string;
  homeTeamSeasonId: number;
  homeTeamName: string;
  homeClubName: string;
  awayTeamSeasonId: number;
  awayTeamName: string;
  awayClubName: string;
  status: string;
  gameType: string;
  startDate: string;
  startTime: string | null;
  locationId?: number | null;
  locationName: string | null;
  sublocationId?: number | null;
  sublocationName?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  finalStatus: string | null;
  videoLink?: string | null;
  settings?: {
    playersOnField?: number;
    periodDuration?: number;
  };
}

interface TeamScheduleProps {
  teamSeasonId: number;
  games: Game[];
}

import LocationLink from "@/components/shared/LocationLink";
import { formatDateStandard, formatTimeStandard } from "@/lib/utils/dateTimeUtils";

function formatDate(dateStr: string) {
  return formatDateStandard(dateStr, "full");
}

function isPastGameDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gameDate = new Date(dateStr);
  gameDate.setHours(0, 0, 0, 0);
  return gameDate.getTime() < today.getTime();
}

export default function TeamSchedule({ teamSeasonId, games }: TeamScheduleProps) {
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState<"all" | "fixtures" | "results">("all");
  const [venueFilter, setVenueFilter] = useState<"all" | "home" | "away">("all");
  const [quickScoreGame, setQuickScoreGame] = useState<Game | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [selectedLocationModal, setSelectedLocationModal] = useState<{ id: number | null; name?: string | null; subName?: string | null } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const dividerRef = useRef<HTMLDivElement | null>(null);

  const canManage = Boolean(session?.user);

  // Sort and filter games
  const processedGames = useMemo(() => {
    let list = [...games];

    if (statusFilter === "fixtures") {
      list = list.filter((g) => g.status !== "completed");
    } else if (statusFilter === "results") {
      list = list.filter((g) => g.status === "completed");
    }

    if (venueFilter === "home") {
      list = list.filter((g) => g.homeTeamSeasonId === teamSeasonId);
    } else if (venueFilter === "away") {
      list = list.filter((g) => g.awayTeamSeasonId === teamSeasonId);
    }

    list.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeA - timeB;
    });

    return list;
  }, [games, statusFilter, venueFilter, teamSeasonId]);

  const firstUpcomingIndex = useMemo(() => {
    return processedGames.findIndex((g) => !isPastGameDate(g.startDate));
  }, [processedGames]);

  useEffect(() => {
    if (dividerRef.current) {
      dividerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [processedGames]);

  return (
    <div className="space-y-6">
      
      {/* FILTER BUTTONS & CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border/80 p-4 rounded-2xl shadow-sm">
        
        {/* Status Tab Toggle */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2 hidden sm:inline">Show</span>
          <div className="inline-flex rounded-xl bg-background border border-border/60 p-1 w-full sm:w-auto">
            {(["all", "fixtures", "results"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === opt ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Venue Filter Toggle & Schedule Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {canManage && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all"
            >
              <Plus size={15} />
              <span>Schedule Match</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-muted uppercase tracking-wider mr-1 hidden sm:inline">Venue</span>
            <div className="inline-flex rounded-xl bg-background border border-border/60 p-1 w-full sm:w-auto">
              {(["all", "home", "away"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setVenueFilter(opt)}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    venueFilter === opt ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* GAME LIST CARDS */}
      {processedGames.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center py-16">
          <ShieldAlert size={40} className="mx-auto text-muted/60 mb-3" />
          <p className="text-muted font-medium">No matches found for the selected filters.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {processedGames.map((game, index) => {
            const isHome = game.homeTeamSeasonId === teamSeasonId;
            const isCompleted = game.status === "completed";
            const isPast = isPastGameDate(game.startDate);
            const isFirstUpcoming = index === firstUpcomingIndex && firstUpcomingIndex > 0;
            
            const isInProgress = game.status === "in_progress";
            const isScheduled = game.status === "scheduled" || !game.status;

            let cardOutlineClass = isPast
              ? "border-border/60 bg-surface/30 opacity-65 grayscale-[30%] hover:grayscale-0 hover:opacity-100"
              : "border-border/80 bg-surface/50 opacity-100";
            let resultTag = null;

            let scoreBadgeClass = "bg-background text-muted border border-border";
            let scoreLabel = "Pending";

            if (isInProgress) {
              cardOutlineClass = "border-emerald-500/35 bg-emerald-500/[0.02] border-l-4 border-l-emerald-500 shadow-xs ring-1 ring-emerald-500/10";
              scoreBadgeClass = "bg-emerald-500 text-white border-emerald-500/35 animate-pulse font-extrabold";
              scoreLabel = "LIVE";
              resultTag = (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded shadow-inner animate-pulse">
                  ● Live Match
                </span>
              );
            } else if (isScheduled) {
              cardOutlineClass = "border-border/80 bg-surface/50 border-l-4 border-l-amber-500/60";
              scoreBadgeClass = "bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold";
              scoreLabel = "SCHED";
              resultTag = (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  Scheduled
                </span>
              );
            } else if (isCompleted && game.homeScore !== null && game.awayScore !== null) {
              const teamScore = isHome ? game.homeScore : game.awayScore;
              const oppScore = isHome ? game.awayScore : game.homeScore;

              if (teamScore > oppScore) {
                cardOutlineClass = isPast
                  ? "border-success/25 bg-success/[0.03] opacity-70 grayscale-[20%] hover:grayscale-0 hover:opacity-100 shadow-sm border-l-4 border-l-success"
                  : "border-success/30 hover:border-success/60 bg-success/5 shadow-sm border-l-4 border-l-success";
                scoreBadgeClass = "bg-success text-white border-success/30";
                scoreLabel = "W";
                resultTag = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-success bg-success/15 border border-success/30 px-2.5 py-0.5 rounded shadow-inner">
                    Win
                  </span>
                );
              } else if (teamScore < oppScore) {
                cardOutlineClass = isPast
                  ? "border-danger/20 bg-danger/[0.015] opacity-65 grayscale-[30%] hover:grayscale-0 hover:opacity-100 shadow-sm border-l-4 border-l-danger"
                  : "border-danger/25 hover:border-danger/50 bg-danger/[0.02] shadow-sm border-l-4 border-l-danger";
                scoreBadgeClass = "bg-danger text-white border-danger/30";
                scoreLabel = "L";
                resultTag = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-danger bg-danger/15 border border-danger/30 px-2.5 py-0.5 rounded shadow-inner">
                    Loss
                  </span>
                );
              } else {
                cardOutlineClass = isPast
                  ? "border-border/60 bg-surface/30 opacity-65 grayscale-[30%] hover:grayscale-0 hover:opacity-100 border-l-4 border-l-muted/40"
                  : "border-border/80 hover:border-muted/50 bg-surface/50 border-l-4 border-l-muted/40";
                scoreBadgeClass = "bg-muted/15 text-muted border-border";
                scoreLabel = "D";
                resultTag = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-muted bg-muted/15 border border-border px-2.5 py-0.5 rounded">
                    Draw
                  </span>
                );
              }
            }

            return (
              <React.Fragment key={game.id}>
                {isFirstUpcoming && (
                  <div ref={dividerRef} className="relative py-4 flex items-center justify-center">
                    <div className="w-full border-t-2 border-dashed border-primary/35" />
                  </div>
                )}

                <Card 
                  variant="hover" 
                  padding="md" 
                  className={`transition-all duration-200 ${cardOutlineClass}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    
                    {/* Game Meta & Matchup */}
                    <div className="flex-1 min-w-0 space-y-3.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted font-semibold">
                        <span className="text-primary">{game.seasonName}</span>
                        <span>•</span>
                        <span className="capitalize">{game.gameType} Match</span>
                        <span>•</span>
                        <span className="text-accent">{isHome ? "Home Game" : "Away Game"}</span>
                        {resultTag && (
                          <>
                            <span>•</span>
                            {resultTag}
                          </>
                        )}
                        {isPast && !isCompleted && !isInProgress && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted/70 bg-background/80 border border-border px-2 py-0.5 rounded">
                              Past Match
                            </span>
                          </>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {/* Home Team */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-6 w-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary flex-shrink-0">
                              H
                            </div>
                            <span className={`text-sm sm:text-base truncate ${isCompleted && game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore ? "font-bold text-text" : "font-medium text-text/80"}`}>
                              {game.homeClubName} {game.homeTeamName}
                            </span>
                          </div>
                          {isCompleted && (
                            <span className={`text-sm sm:text-base font-extrabold px-2.5 py-0.5 rounded-md ${game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore ? "bg-primary text-white" : "bg-background text-muted border border-border"}`}>
                              {game.homeScore}
                            </span>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-6 w-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-xs text-accent flex-shrink-0">
                              A
                            </div>
                            <span className={`text-sm sm:text-base truncate ${isCompleted && game.homeScore !== null && game.awayScore !== null && game.awayScore > game.homeScore ? "font-bold text-text" : "font-medium text-text/80"}`}>
                              {game.awayClubName} {game.awayTeamName}
                            </span>
                          </div>
                          {isCompleted && (
                            <span className={`text-sm sm:text-base font-extrabold px-2.5 py-0.5 rounded-md ${game.homeScore !== null && game.awayScore !== null && game.awayScore > game.homeScore ? "bg-primary text-white" : "bg-background text-muted border border-border"}`}>
                              {game.awayScore}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Schedule/Venue Panel */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-border/50 pt-3.5 sm:pt-0 sm:pl-6 gap-2 text-right">
                      
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text bg-background sm:bg-transparent px-2.5 py-1 sm:p-0 rounded border sm:border-0 border-border">
                        <Calendar size={14} className="text-primary" />
                        <span>{formatDate(game.startDate)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                        <Clock size={14} className="text-accent shrink-0" />
                        <span>{formatTimeStandard(game.startTime, (game as any).timezoneLabel) || "Time TBD"}</span>
                      </div>

                      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] ${scoreBadgeClass}`}>
                        <Trophy size={11} />
                        <span>{scoreLabel}</span>
                      </div>
                      <LocationLink
                        locationId={game.locationId}
                        locationName={game.locationName}
                        sublocationName={game.sublocationName}
                        showIcon
                        className="text-xs max-w-[200px]"
                      />

                      <div className="flex items-center gap-2 mt-1">
                        {canManage && (
                          <>
                            <button
                              onClick={() => setEditingGame(game)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-text hover:text-primary bg-background border border-border px-2 py-1 rounded-lg transition-colors"
                              title="Edit Game Details, Cancel, or Delete"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setQuickScoreGame(game)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg transition-colors"
                              title="Quick Score Entry"
                            >
                              <Edit3 size={13} />
                              <span>Quick Score</span>
                            </button>
                          </>
                        )}

                        <Link
                          href={`/gamestats/${teamSeasonId}/${game.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-accent-hover transition-colors"
                        >
                          <SquareChevronRight size={13} />
                          <span>{isCompleted ? "Match Center" : isInProgress ? "Join Tracker (Live)" : "Track Game"}</span>
                        </Link>
                      </div>

                    </div>

                  </div>
                </Card>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* QUICK SCORE MODAL */}
      {quickScoreGame && (
        <QuickScoreModal
          gameId={quickScoreGame.id}
          homeTeamName={`${quickScoreGame.homeClubName} ${quickScoreGame.homeTeamName}`}
          awayTeamName={`${quickScoreGame.awayClubName} ${quickScoreGame.awayTeamName}`}
          currentHomeScore={quickScoreGame.homeScore}
          currentAwayScore={quickScoreGame.awayScore}
          onClose={() => setQuickScoreGame(null)}
        />
      )}

      {/* GAME EDIT MODAL */}
      {editingGame && (
        <GameEditModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
        />
      )}

      {/* GAME SCHEDULER MODAL */}
      {isScheduleModalOpen && (
        <GameSchedulerModal
          defaultHomeTeamSeasonId={teamSeasonId}
          onClose={() => setIsScheduleModalOpen(false)}
        />
      )}
    </div>
  );
}
