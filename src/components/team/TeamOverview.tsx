"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Calendar, MapPin, Clock, Trophy, Mail, Users, ArrowRight, User } from "lucide-react";
import { format } from "date-fns";

// Reusable interface mappings from our data queries
interface Game {
  id: number;
  homeTeamSeasonId: number;
  homeTeamName: string;
  homeClubName: string;
  awayTeamSeasonId: number;
  awayTeamName: string;
  awayClubName: string;
  status: string;
  startDate: string;
  startTime: string | null;
  locationName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  finalStatus: string | null;
}

interface PlayerSeasonStats {
  id: number;
  playerId: number;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
  gamesPlayed: number;
}

interface TeamStaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

interface TeamOverviewProps {
  teamSeasonId: number;
  record: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
  } | null;
  nextMatch: Game | null;
  recentResults: Game[];
  stats: PlayerSeasonStats[];
  staff: TeamStaffMember[];
  onViewTab: (tab: string) => void;
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
    // If it is stored as "18:00:00" style time, safely process or display as is
    return timeStr;
  } catch (e) {
    return timeStr;
  }
}

export default function TeamOverview({
  teamSeasonId,
  record,
  nextMatch,
  recentResults,
  stats,
  staff,
  onViewTab,
}: TeamOverviewProps) {
  const totalGames = record ? record.wins + record.losses + record.draws : 0;
  const winningPct = totalGames > 0 ? (record!.wins + record!.draws / 2) / totalGames : 0;
  
  // Sort stats to find top scorers and assist leaders
  const topScorers = [...stats]
    .filter(s => s.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  const topAssisters = [...stats]
    .filter(s => s.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals);

  const mainScorer = topScorers[0] || null;
  const mainAssister = topAssisters[0] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT & CENTER COLUMN: MATCH ACTIVITY & TEAM STAFF */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Next Match Spotlight */}
        <div>
          <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <span>Next Match</span>
          </h3>
          {nextMatch ? (
            <Card variant="default" padding="lg" className="border-primary/30 bg-surface shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    <span className="text-primary">Upcoming Match</span>
                    <span>•</span>
                    <span>{nextMatch.status.replace("_", " ")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Home Team */}
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary flex-shrink-0">H</div>
                      <span className="font-bold text-text text-base sm:text-lg">
                        {nextMatch.homeClubName} {nextMatch.homeTeamName}
                      </span>
                    </div>
                    {/* Away Team */}
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-xs text-accent flex-shrink-0">A</div>
                      <span className="font-bold text-text text-base sm:text-lg">
                        {nextMatch.awayClubName} {nextMatch.awayTeamName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-center border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6 gap-2 text-left md:text-right min-w-[200px]">
                  <div className="flex items-center md:justify-end gap-1.5 text-sm font-bold text-text">
                    <Calendar size={16} className="text-primary" />
                    <span>{formatDate(nextMatch.startDate)}</span>
                  </div>
                  <div className="flex items-center md:justify-end gap-1.5 text-xs text-muted font-medium">
                    <Clock size={14} />
                    <span>{formatTime(nextMatch.startTime)}</span>
                  </div>
                  {nextMatch.locationName && (
                    <div className="flex items-center md:justify-end gap-1.5 text-xs text-muted max-w-[220px] truncate" title={nextMatch.locationName}>
                      <MapPin size={14} />
                      <span>{nextMatch.locationName}</span>
                    </div>
                  )}
                </div>

              </div>
            </Card>
          ) : (
            <Card variant="outlined" padding="lg" className="text-center py-8">
              <p className="text-muted font-medium">No upcoming matches scheduled.</p>
            </Card>
          )}
        </div>

        {/* Recent Form and Results */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
              <Trophy size={18} className="text-accent" />
              <span>Recent Form</span>
            </h3>
            <button 
              onClick={() => onViewTab("schedule")}
              className="text-xs font-bold text-primary hover:text-accent-hover flex items-center gap-1 transition-colors"
            >
              <span>View Full Schedule</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentResults.length === 0 ? (
            <Card variant="outlined" padding="lg" className="text-center py-8">
              <p className="text-muted font-medium">No recent matches played.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentResults.map((game) => {
                const isHome = game.homeTeamSeasonId === teamSeasonId;
                const teamScore = isHome ? game.homeScore : game.awayScore;
                const oppScore = isHome ? game.awayScore : game.homeScore;
                
                let outcomeLabel = "D";
                let outcomeColor = "bg-muted text-white";
                
                if (teamScore !== null && oppScore !== null) {
                  if (teamScore > oppScore) {
                    outcomeLabel = "W";
                    outcomeColor = "bg-success text-white shadow-sm shadow-success/20";
                  } else if (teamScore < oppScore) {
                    outcomeLabel = "L";
                    outcomeColor = "bg-danger text-white shadow-sm shadow-danger/20";
                  }
                }

                return (
                  <Card key={game.id} variant="hover" padding="sm" className="border-border/80 bg-surface/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${outcomeColor}`}>
                          {outcomeLabel}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-muted block mb-0.5">{formatDate(game.startDate)}</span>
                          <span className="font-semibold text-text text-sm block truncate">
                            {isHome ? "vs " + game.awayClubName + " " + game.awayTeamName : "@ " + game.homeClubName + " " + game.homeTeamName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-base font-extrabold text-text block">
                            {game.homeScore} - {game.awayScore}
                          </span>
                          {game.finalStatus && game.finalStatus !== "regulation" && (
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">
                              ({game.finalStatus})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Staff List */}
        <div>
          <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <span>Coaching & Support Staff</span>
          </h3>
          {staff.length === 0 ? (
            <Card variant="outlined" padding="lg" className="text-center py-8">
              <p className="text-muted font-medium">No staff members listed for this season.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {staff.map((member) => (
                <Card key={member.id} variant="default" padding="md" className="flex items-center justify-between border-border/80 shadow-sm hover:border-primary/30 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <User size={20} className="stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text text-sm">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="text-xs text-muted capitalize font-medium">{member.role.toLowerCase().replace("_", " ")}</p>
                    </div>
                  </div>
                  {member.email && (
                    <a 
                      href={`mailto:${member.email}`} 
                      className="h-8 w-8 rounded-lg bg-surface hover:bg-primary/10 border border-border hover:border-primary/20 text-muted hover:text-primary flex items-center justify-center transition-all duration-200"
                      title={`Email ${member.firstName}`}
                    >
                      <Mail size={15} />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: SEASON BREAKDOWN & LEADERS */}
      <div className="space-y-8">
        
        {/* Season Statistics / Record visual */}
        <div>
          <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-accent" />
            <span>Season Record</span>
          </h3>
          <Card variant="default" padding="lg" className="border-border bg-surface shadow-sm">
            {record ? (
              <div className="space-y-6">
                
                {/* Visual Ratio Bar */}
                {totalGames > 0 ? (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-muted mb-2">
                      <span>WINNING PERCENTAGE</span>
                      <span className="text-success">{Math.round(winningPct * 100)}%</span>
                    </div>
                    
                    {/* Compound Progress Bar */}
                    <div className="h-3 w-full rounded-full bg-border overflow-hidden flex">
                      <div 
                        style={{ width: `${winningPct * 100}%` }} 
                        className="h-full bg-success"
                        title={`Wins: ${record.wins}`}
                      />
                      <div 
                        style={{ width: `${(record.draws / totalGames) * 100}%` }} 
                        className="h-full bg-muted/50"
                        title={`Draws: ${record.draws}`}
                      />
                      <div 
                        style={{ width: `${(record.losses / totalGames) * 100}%` }} 
                        className="h-full bg-danger"
                        title={`Losses: ${record.losses}`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-muted font-bold mt-2.5 px-0.5">
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-success inline-block" /> {record.wins} Wins</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-muted/50 inline-block" /> {record.draws} Draws</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-danger inline-block" /> {record.losses} Losses</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted">No matches played yet to calculate percentages.</p>
                )}

                <div className="border-t border-border/60 pt-4 grid grid-cols-2 gap-4 text-center">
                  <div className="bg-background/40 border border-border/40 p-3 rounded-xl">
                    <span className="text-xs font-bold text-muted block uppercase tracking-wider">Matches</span>
                    <span className="text-2xl font-extrabold text-text mt-1 block">{totalGames}</span>
                  </div>
                  <div className="bg-background/40 border border-border/40 p-3 rounded-xl">
                    <span className="text-xs font-bold text-muted block uppercase tracking-wider">Points</span>
                    <span className="text-2xl font-extrabold text-text mt-1 block">{record.points}</span>
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-muted text-center py-4">No records found for this team season.</p>
            )}
          </Card>
        </div>

        {/* Team Leaderboards */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <span>Team Leaders</span>
            </h3>
            <button 
              onClick={() => onViewTab("stats")}
              className="text-xs font-bold text-primary hover:text-accent-hover flex items-center gap-1 transition-colors"
            >
              <span>Full Stats</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <Card variant="default" padding="lg" className="border-border bg-surface shadow-sm space-y-6">
            
            {/* Top Scorer Card */}
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2.5">Goal Leader</span>
              {mainScorer ? (
                <div className="flex items-center justify-between bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/20 p-3 rounded-xl transition-all duration-200">
                  <div>
                    <h4 className="font-bold text-text text-sm sm:text-base">
                      {mainScorer.firstName} {mainScorer.lastName}
                    </h4>
                    <span className="text-xs text-muted block mt-0.5">{mainScorer.gamesPlayed} Matches Played</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-primary block">
                      {mainScorer.goals}
                    </span>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Goals</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted italic bg-background/50 p-3 rounded-xl border border-border/40 text-center">No goals recorded yet.</p>
              )}
            </div>

            {/* Top Assist Card */}
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2.5">Assist Leader</span>
              {mainAssister ? (
                <div className="flex items-center justify-between bg-accent/5 hover:bg-accent/10 border border-accent/10 hover:border-accent/20 p-3 rounded-xl transition-all duration-200">
                  <div>
                    <h4 className="font-bold text-text text-sm sm:text-base">
                      {mainAssister.firstName} {mainAssister.lastName}
                    </h4>
                    <span className="text-xs text-muted block mt-0.5">{mainAssister.gamesPlayed} Matches Played</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-accent block">
                      {mainAssister.assists}
                    </span>
                    <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Assists</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted italic bg-background/50 p-3 rounded-xl border border-border/40 text-center">No assists recorded yet.</p>
              )}
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
}
