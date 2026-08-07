"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  Edit3,
  Plus,
  SquareChevronRight,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import QuickScoreModal from "@/components/dashboard/QuickScoreModal";
import GameSchedulerModal from "@/components/dashboard/GameSchedulerModal";
import { formatDateStandard, formatTimeStandard } from "@/components/ui/DateSelect";

export interface MasterGameRow {
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
  leagueName?: string | null;
  countsForStandings?: boolean;
}

interface MasterScoreEntryClientProps {
  initialGames: MasterGameRow[];
  canManage: boolean;
}

function formatDate(dateStr: string) {
  return formatDateStandard(dateStr);
}

function formatTime(timeStr: string | null) {
  return formatTimeStandard(timeStr);
}

export default function MasterScoreEntryClient({
  initialGames,
  canManage,
}: MasterScoreEntryClientProps) {
  const [games, setGames] = useState<MasterGameRow[]>(initialGames);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [gameTypeFilter, setGameTypeFilter] = useState<string>("all");
  const [standingsFilter, setStandingsFilter] = useState<"all" | "yes" | "no">("all");

  const [quickScoreGame, setQuickScoreGame] = useState<MasterGameRow | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Filtered games
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // 1. Status Filter
      if (statusFilter === "pending" && g.status === "completed") return false;
      if (statusFilter === "completed" && g.status !== "completed") return false;

      // 2. Game Type Filter
      if (gameTypeFilter !== "all" && g.gameType !== gameTypeFilter) return false;

      // 3. Standings Filter
      if (standingsFilter === "yes" && g.countsForStandings === false) return false;
      if (standingsFilter === "no" && g.countsForStandings !== false) return false;

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const home = `${g.homeClubName} ${g.homeTeamName}`.toLowerCase();
        const away = `${g.awayClubName} ${g.awayTeamName}`.toLowerCase();
        const location = (g.locationName || "").toLowerCase();
        const season = (g.seasonName || "").toLowerCase();
        const league = (g.leagueName || "").toLowerCase();

        return (
          home.includes(q) ||
          away.includes(q) ||
          location.includes(q) ||
          season.includes(q) ||
          league.includes(q)
        );
      }

      return true;
    });
  }, [games, searchQuery, statusFilter, gameTypeFilter, standingsFilter]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-md">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Trophy size={14} />
              <span>Score Reporting Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Master Score Reporting & Match Entry
            </h1>
            <p className="text-xs text-muted max-w-2xl">
              Report and update scores for any match across all leagues, tournaments, friendlies, and playoff fixtures. Toggle whether games count for league standings points.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md transition-all self-start sm:self-auto shrink-0"
            >
              <Plus size={16} />
              <span>Schedule Match</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-surface border border-border/80 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
          <Filter size={16} className="text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Filter Matches & Fixtures
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Search Query */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search team, club, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text placeholder:text-muted/65 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text"
            >
              <option value="all">All Match Statuses</option>
              <option value="pending">Pending / Scheduled Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Match Type Filter */}
          <div>
            <select
              value={gameTypeFilter}
              onChange={(e) => setGameTypeFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text capitalize"
            >
              <option value="all">All Match Types</option>
              <option value="league">League Matches</option>
              <option value="tournament">Tournament Matches</option>
              <option value="friendly">Friendlies</option>
              <option value="playoff">Playoffs</option>
            </select>
          </div>

          {/* Standings Filter */}
          <div>
            <select
              value={standingsFilter}
              onChange={(e) => setStandingsFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text"
            >
              <option value="all">All Standings Options</option>
              <option value="yes">Counts for Standings</option>
              <option value="no">Excluded from Standings</option>
            </select>
          </div>
        </div>
      </div>

      {/* GAMES TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-surface shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-background/50 text-[10px] font-bold uppercase tracking-wider text-muted">
              <th className="py-3 px-4">Date / Time</th>
              <th className="py-3 px-4">Matchup (Home vs Away)</th>
              <th className="py-3 px-3 text-center">Type</th>
              <th className="py-3 px-4">Location / Field</th>
              <th className="py-3 px-3 text-center">Score</th>
              <th className="py-3 px-3 text-center">Standings</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGames.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted font-medium">
                  No games found matching your filters.
                </td>
              </tr>
            ) : (
              filteredGames.map((game) => {
                const isCompleted = game.status === "completed";
                return (
                  <tr
                    key={game.id}
                    className="border-b border-border/60 hover:bg-background/25 last:border-none transition-colors"
                  >
                    {/* Date / Time */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-text flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary" />
                        <span>{formatDate(game.startDate)}</span>
                      </div>
                      <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        <span>{formatTime(game.startTime)}</span>
                      </div>
                    </td>

                    {/* Matchup */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">H</span>
                          <span className="font-bold text-text">{game.homeClubName || ""} {game.homeTeamName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.2 rounded">A</span>
                          <span className="font-bold text-text">{game.awayClubName || ""} {game.awayTeamName}</span>
                        </div>
                      </div>
                    </td>

                    {/* Game Type */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-background border border-border px-2 py-0.5 rounded capitalize">
                        {game.gameType}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-muted text-xs">
                      {game.locationName ? (
                        <span className="flex items-center gap-1 max-w-[160px] truncate" title={game.locationName}>
                          <MapPin size={12} className="text-muted/70 shrink-0" />
                          <span>{game.locationName}</span>
                        </span>
                      ) : (
                        <span className="text-muted/50 italic">TBD</span>
                      )}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isCompleted && game.homeScore !== null && game.awayScore !== null ? (
                        <span className="inline-flex items-center gap-1 font-black text-sm text-text bg-background border border-border px-2.5 py-1 rounded-lg">
                          <span>{game.homeScore}</span>
                          <span className="text-muted">-</span>
                          <span>{game.awayScore}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          Scheduled
                        </span>
                      )}
                    </td>

                    {/* Standings Inclusion */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {game.countsForStandings !== false ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          <Check size={10} />
                          <span>Counts</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-muted bg-background border border-border px-2 py-0.5 rounded">
                          <X size={10} />
                          <span>Excluded</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {canManage && (
                          <button
                            onClick={() => setQuickScoreGame(game)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg transition-colors"
                            title="Quick Score Entry"
                          >
                            <Edit3 size={13} />
                            <span>{isCompleted ? "Edit Score" : "Add Score"}</span>
                          </button>
                        )}

                        <Link
                          href={`/gamestats/${game.homeTeamSeasonId}/${game.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-accent-hover transition-colors"
                        >
                          <SquareChevronRight size={13} />
                          <span>Details</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* QUICK SCORE MODAL */}
      {quickScoreGame && (
        <QuickScoreModal
          gameId={quickScoreGame.id}
          homeTeamName={`${quickScoreGame.homeClubName || ""} ${quickScoreGame.homeTeamName}`}
          awayTeamName={`${quickScoreGame.awayClubName || ""} ${quickScoreGame.awayTeamName}`}
          currentHomeScore={quickScoreGame.homeScore}
          currentAwayScore={quickScoreGame.awayScore}
          onClose={() => setQuickScoreGame(null)}
        />
      )}

      {/* GAME SCHEDULER MODAL */}
      {isScheduleModalOpen && (
        <GameSchedulerModal
          onClose={() => setIsScheduleModalOpen(false)}
        />
      )}
    </div>
  );
}
