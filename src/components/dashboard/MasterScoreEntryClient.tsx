"use client";

import React, { useState, useMemo, useTransition } from "react";
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
  Zap,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import QuickScoreModal from "@/components/dashboard/QuickScoreModal";
import GameSchedulerModal from "@/components/dashboard/GameSchedulerModal";
import { formatDateStandard, formatTimeStandard } from "@/components/ui/DateSelect";
import { recordQuickScore } from "@/lib/actions/quickScore-actions";
import { toast } from "sonner";

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

  // Season & Specific Tournament Filters
  const seasonOptions = useMemo(() => {
    const map = new Map<number, string>();
    games.forEach((g) => {
      if (g.seasonId && g.seasonName) map.set(g.seasonId, g.seasonName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [games]);

  const defaultSeasonId = useMemo(() => {
    return seasonOptions.length > 0 ? String(seasonOptions[0].id) : "all";
  }, [seasonOptions]);

  const [seasonFilter, setSeasonFilter] = useState<string>(defaultSeasonId);

  const leagueOptions = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      if (g.leagueName) set.add(g.leagueName);
    });
    return Array.from(set).sort();
  }, [games]);

  const [leagueFilter, setLeagueFilter] = useState<string>("all");

  // Inline Batch Edit State
  const [isBatchEditMode, setIsBatchEditMode] = useState(false);
  const [batchScores, setBatchScores] = useState<Record<number, { home: string | number; away: string | number }>>({});
  const [isSavingBatch, startBatchTransition] = useTransition();

  const [quickScoreGame, setQuickScoreGame] = useState<MasterGameRow | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Filtered games
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // 1. Season Filter (Default to current season)
      if (seasonFilter !== "all" && String(g.seasonId) !== seasonFilter) return false;

      // 2. Tournament / League Filter
      if (leagueFilter !== "all" && g.leagueName !== leagueFilter) return false;

      // 3. Status Filter
      if (statusFilter === "pending" && g.status === "completed") return false;
      if (statusFilter === "completed" && g.status !== "completed") return false;

      // 4. Game Type Filter
      if (gameTypeFilter !== "all" && g.gameType !== gameTypeFilter) return false;

      // 5. Standings Filter
      if (standingsFilter === "yes" && g.countsForStandings === false) return false;
      if (standingsFilter === "no" && g.countsForStandings !== false) return false;

      // 6. Search Filter
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
  }, [games, seasonFilter, leagueFilter, statusFilter, gameTypeFilter, standingsFilter, searchQuery]);

  // Update batch score input values
  const handleBatchInputChange = (gameId: number, field: "home" | "away", val: string) => {
    setBatchScores((prev) => {
      const current = prev[gameId] || {
        home: games.find((g) => g.id === gameId)?.homeScore ?? "",
        away: games.find((g) => g.id === gameId)?.awayScore ?? "",
      };
      return {
        ...prev,
        [gameId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  // Save all batch scores
  const handleSaveAllBatchScores = async () => {
    const updatesToProcess = Object.entries(batchScores).filter(([_, s]) => s.home !== "" && s.away !== "");
    if (updatesToProcess.length === 0) {
      toast.error("No valid scores entered to save.");
      return;
    }

    startBatchTransition(async () => {
      try {
        let savedCount = 0;
        const updatedGamesList = [...games];

        for (const [gameIdStr, scoreObj] of updatesToProcess) {
          const gameId = Number(gameIdStr);
          const homeScoreNum = Number(scoreObj.home);
          const awayScoreNum = Number(scoreObj.away);

          const targetGame = games.find((g) => g.id === gameId);
          const countsForStandings = targetGame?.countsForStandings ?? true;

          const res = await recordQuickScore({
            gameId,
            homeScore: homeScoreNum,
            awayScore: awayScoreNum,
            countsForStandings,
          });

          if (res.success) {
            savedCount++;
            const idx = updatedGamesList.findIndex((g) => g.id === gameId);
            if (idx !== -1) {
              updatedGamesList[idx] = {
                ...updatedGamesList[idx],
                homeScore: homeScoreNum,
                awayScore: awayScoreNum,
                status: "completed",
              };
            }
          }
        }

        setGames(updatedGamesList);
        setBatchScores({});
        setIsBatchEditMode(false);
        toast.success(`Successfully recorded scores for ${savedCount} matches!`);
      } catch (err: any) {
        toast.error("Error saving batch scores: " + err.message);
      }
    });
  };

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

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {canManage && (
              <>
                <button
                  onClick={() => setIsBatchEditMode(!isBatchEditMode)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                    isBatchEditMode
                      ? "bg-amber-500 text-white border-amber-500 shadow-md"
                      : "bg-surface border-border text-text hover:border-primary/50"
                  }`}
                  title="Toggle clean batch score entry mode for all filtered games"
                >
                  <Zap size={15} />
                  <span>{isBatchEditMode ? "Exit Batch Mode" : "⚡ Batch Quick Edit Scores"}</span>
                </button>

                {isBatchEditMode && (
                  <button
                    onClick={handleSaveAllBatchScores}
                    disabled={isSavingBatch}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Save size={15} />
                    <span>{isSavingBatch ? "Saving..." : "Save All Scores"}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Schedule Match</span>
                </button>
              </>
            )}
          </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-center">
          {/* Season Filter (Default Current Season) */}
          <div>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text font-bold"
            >
              <option value="all">All Seasons</option>
              {seasonOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tournament / Specific League Filter */}
          <div>
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text font-bold"
            >
              <option value="all">All Tournaments & Leagues</option>
              {leagueOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
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

          {/* Search Query */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search team or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text placeholder:text-muted/65 transition-all"
            />
          </div>
        </div>
      </div>

      {/* BATCH EDIT MODE BANNER */}
      {isBatchEditMode && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
            <Zap size={16} />
            <span>Batch Score Entry Mode Active: Enter scores directly in table rows below, then click "Save All Scores".</span>
          </div>
          <button
            onClick={handleSaveAllBatchScores}
            disabled={isSavingBatch}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            {isSavingBatch ? "Saving Scores..." : "Save All Scores"}
          </button>
        </div>
      )}

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
                const batchVal = batchScores[game.id];

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

                    {/* Score (Normal vs Batch Input) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isBatchEditMode ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            placeholder="H"
                            value={batchVal ? batchVal.home : (game.homeScore ?? "")}
                            onChange={(e) => handleBatchInputChange(game.id, "home", e.target.value)}
                            className="w-12 text-center font-bold text-xs py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-muted">-</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="A"
                            value={batchVal ? batchVal.away : (game.awayScore ?? "")}
                            onChange={(e) => handleBatchInputChange(game.id, "away", e.target.value)}
                            className="w-12 text-center font-bold text-xs py-1 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      ) : isCompleted && game.homeScore !== null && game.awayScore !== null ? (
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
          onSuccess={() => {
            // Re-fetch / refresh games state locally when modal saves
            setGames((prev) =>
              prev.map((g) =>
                g.id === quickScoreGame.id
                  ? { ...g, status: "completed" }
                  : g
              )
            );
          }}
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
