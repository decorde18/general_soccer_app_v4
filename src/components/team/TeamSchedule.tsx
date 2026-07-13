"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Calendar, MapPin, Clock, Trophy, Play, ShieldAlert, SquareChevronRight } from "lucide-react";
import { format } from "date-fns";

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
  locationName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  finalStatus: string | null;
  videoLink?: string | null;
}

interface TeamScheduleProps {
  teamSeasonId: number;
  games: Game[];
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "EEE, MMM d, yyyy");
  } catch (e) {
    return dateStr;
  }
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return "TBD";
  try {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return format(date, "h:mm a");
    }
    return timeStr;
  } catch (e) {
    return timeStr;
  }
}

export default function TeamSchedule({ teamSeasonId, games }: TeamScheduleProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "fixtures" | "results">("all");
  const [venueFilter, setVenueFilter] = useState<"all" | "home" | "away">("all");

  // Sort and filter games
  const processedGames = useMemo(() => {
    let list = [...games];

    // Filter by status (fixtures vs results)
    if (statusFilter === "fixtures") {
      list = list.filter((g) => g.status !== "completed");
    } else if (statusFilter === "results") {
      list = list.filter((g) => g.status === "completed");
    }

    // Filter by Venue (home vs away)
    if (venueFilter === "home") {
      list = list.filter((g) => g.homeTeamSeasonId === teamSeasonId);
    } else if (venueFilter === "away") {
      list = list.filter((g) => g.awayTeamSeasonId === teamSeasonId);
    }

    // Sort: results sorted newest first, fixtures nearest first
    list.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      
      if (a.status === "completed" && b.status === "completed") {
        return dateB - dateA; // Newest results first
      }
      return dateA - dateB; // Nearest upcoming fixtures first
    });

    return list;
  }, [games, statusFilter, venueFilter, teamSeasonId]);

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

        {/* Venue Filter Toggle */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2 hidden sm:inline">Venue</span>
          <div className="inline-flex rounded-xl bg-background border border-border/60 p-1 w-full sm:w-auto">
            {(["all", "home", "away"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setVenueFilter(opt)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  venueFilter === opt ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text"
                }`}
              >
                {opt}
              </button>
            ))}
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
          {processedGames.map((game) => {
            const isHome = game.homeTeamSeasonId === teamSeasonId;
            const isCompleted = game.status === "completed";
            
            // Win/Loss status indicator class
            let cardOutlineClass = "border-border/80 bg-surface/50";
            let resultTag = null;

            let scoreBadgeClass = "bg-background text-muted border border-border";
            let scoreLabel = "Pending";

            if (isCompleted && game.homeScore !== null && game.awayScore !== null) {
              const teamScore = isHome ? game.homeScore : game.awayScore;
              const oppScore = isHome ? game.awayScore : game.homeScore;

              if (teamScore > oppScore) {
                cardOutlineClass = "border-success/30 hover:border-success/60 bg-success/5 shadow-sm";
                scoreBadgeClass = "bg-success text-white border-success/30";
                scoreLabel = "W";
                resultTag = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-success bg-success/15 border border-success/30 px-2.5 py-0.5 rounded shadow-inner">
                    Win
                  </span>
                );
              } else if (teamScore < oppScore) {
                cardOutlineClass = "border-danger/25 hover:border-danger/50 bg-danger/[0.02] shadow-sm";
                scoreBadgeClass = "bg-danger text-white border-danger/30";
                scoreLabel = "L";
                resultTag = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-danger bg-danger/15 border border-danger/30 px-2.5 py-0.5 rounded shadow-inner">
                    Loss
                  </span>
                );
              } else {
                cardOutlineClass = "border-border/80 hover:border-muted/50 bg-surface/50";
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
              <Card 
                key={game.id} 
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
                      {isCompleted && (
                        <>
                          <span>•</span>
                          {resultTag}
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

                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] ${scoreBadgeClass}`}>
                      <Trophy size={11} />
                      <span>{scoreLabel}</span>
                    </div>
                    {game.locationName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted max-w-[155px] truncate" title={game.locationName}>
                        <MapPin size={14} />
                        <span>{game.locationName}</span>
                      </div>
                    )}

                    <Link
                      href={`/gameStats/${teamSeasonId}/${game.id}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent-hover transition-colors"
                    >
                      <SquareChevronRight size={13} />
                      <span>{isCompleted ? "View Game Center" : "Open Match Center"}</span>
                    </Link>

                    {game.videoLink && (
                      <a 
                        href={game.videoLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="mt-1 flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                      >
                        <Play size={12} className="fill-accent stroke-accent" />
                        <span>Watch Highlights</span>
                      </a>
                    )}

                    {isCompleted && game.finalStatus && game.finalStatus !== "regulation" && (
                      <span className="text-[10px] text-muted/75 font-semibold capitalize mt-1.5">
                        ({game.finalStatus.replace("_", " ")})
                      </span>
                    )}

                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
