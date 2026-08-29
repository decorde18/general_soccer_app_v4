"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Trophy, Calendar, Shield, Clock, MapPin, Search, Filter, Plus, Edit3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import QuickScoreModal from "@/components/dashboard/QuickScoreModal";
import GameSchedulerModal from "@/components/dashboard/GameSchedulerModal";
import TournamentScheduleView from "@/components/league/TournamentScheduleView";

interface StandingsRow {
  teamSeasonId: number;
  teamName: string;
  clubName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface Game {
  id: number;
  startDate: string;
  startTime: string | null;
  status: string;
  gameType: string;
  homeTeamName: string;
  homeClubName: string;
  awayTeamName: string;
  awayClubName: string;
  homeScore: number | null;
  awayScore: number | null;
  locationName: string | null;
}

interface DivisionData {
  id: number;
  leagueNodeName: string;
  seasonName: string;
  standings: StandingsRow[];
  games: Game[];
}

interface LeaguePageClientProps {
  leagueId?: number;
  leagueName: string;
  governingBodyName: string | null;
  abbreviation: string | null;
  description: string | null;
  divisions: DivisionData[];
  tournamentGames?: any[];
}

export default function LeaguePageClient({
  leagueId,
  leagueName,
  governingBodyName,
  abbreviation,
  description,
  divisions,
  tournamentGames = [],
}: LeaguePageClientProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<"standings" | "schedule">("standings");
  const [quickScoreGame, setQuickScoreGame] = useState<Game | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const canManage = Boolean(session?.user);

  // Read initial states from URL query parameters
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [selectedGender, setSelectedGender] = useState<"all" | "boys" | "girls">(() => {
    const gender = searchParams.get("gender");
    if (gender === "boys" || gender === "girls") return gender;
    return "all";
  });
  const [selectedAge, setSelectedAge] = useState(() => searchParams.get("age") || "all");

  // Keep state and URL query params in sync without infinite loops
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    const currentGender = searchParams.get("gender") || "all";
    const currentAge = searchParams.get("age") || "all";

    if (
      currentQ === searchQuery &&
      currentGender === selectedGender &&
      currentAge === selectedAge
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }

    if (selectedGender !== "all") {
      params.set("gender", selectedGender);
    } else {
      params.delete("gender");
    }

    if (selectedAge !== "all") {
      params.set("age", selectedAge);
    } else {
      params.delete("age");
    }

    const query = params.toString();
    const dest = query ? `${pathname}?${query}` : pathname;
    router.replace(dest, { scroll: false });
  }, [searchQuery, selectedGender, selectedAge, pathname, router, searchParams]);

  // Dynamically extract unique age groups from active division names
  const availableAges = useMemo(() => {
    const ages = new Set<string>();
    divisions.forEach((d) => {
      const name = d.leagueNodeName.toLowerCase();
      const match = name.match(/\b(u\d+|\d+u)\b/);
      if (match) {
        ages.add(match[1].toUpperCase());
      }
    });
    return Array.from(ages).sort();
  }, [divisions]);

  // Filter divisions list based on search and filters
  const filteredDivisions = useMemo(() => {
    return divisions.filter((d) => {
      const name = d.leagueNodeName.toLowerCase();
      
      if (searchQuery && !name.includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (selectedGender === "girls" && !name.includes("girl") && !name.includes("female")) {
        return false;
      }
      if (selectedGender === "boys" && !name.includes("boy") && !name.includes("male") && !name.includes("coed")) {
        if (name.includes("girl")) return false;
      }

      if (selectedAge !== "all") {
        const queryAge = selectedAge.toLowerCase();
        if (!name.includes(queryAge)) {
          return false;
        }
      }

      return true;
    });
  }, [divisions, searchQuery, selectedGender, selectedAge]);

  return (
    <div className="space-y-8">
      {/* League Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-md">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner flex-shrink-0">
              <Trophy size={36} className="stroke-[1.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {governingBodyName && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted bg-surface border border-border px-2.5 py-0.5 rounded-full">
                    {governingBodyName}
                  </span>
                )}
                {abbreviation && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">
                    {abbreviation}
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-2xl font-extrabold text-text sm:text-3xl tracking-tight">
                {leagueName}
              </h1>
              {description && (
                <p className="text-muted text-sm mt-1 max-w-2xl">{description}</p>
              )}
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md transition-all self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Schedule Match</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW SELECTION TAB BAR */}
      <div className="flex border-b border-border/80 text-sm font-bold gap-6">
        <button
          onClick={() => setActiveTab("standings")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "standings"
              ? "border-primary text-primary font-black"
              : "border-transparent text-muted hover:text-text"
          }`}
        >
          <Trophy size={18} />
          <span>Division Standings ({divisions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "schedule"
              ? "border-primary text-primary font-black"
              : "border-transparent text-muted hover:text-text"
          }`}
        >
          <Calendar size={18} />
          <span>Full Tournament Schedule ({tournamentGames.length} Matches)</span>
        </button>
      </div>

      {activeTab === "schedule" ? (
        <TournamentScheduleView leagueId={leagueId} leagueName={leagueName} games={tournamentGames} />
      ) : (
        <div className="space-y-8">
          {/* FILTER & DRILL DOWN CONTROLS */}
          <div className="bg-surface border border-border/80 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
              <Filter size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Filter Standings & Divisions
              </h3>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Text Search */}
          <div className="md:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search divisions (e.g. U13 Girls)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text placeholder:text-muted/65 transition-all"
            />
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex rounded-xl bg-background border border-border/60 p-1">
            {(["all", "boys", "girls"] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedGender === gender ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text"
                }`}
              >
                {gender === "all" ? "All Genders" : gender}
              </button>
            ))}
          </div>

          {/* Age group filter selector */}
          <select
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text transition-all"
          >
            <option value="all">All Age Groups</option>
            {availableAges.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Divisions Standings Sections */}
      <div className="space-y-12">
        {filteredDivisions.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16 bg-surface/35">
            <Shield size={40} className="mx-auto text-muted/60 mb-3" />
            <p className="text-muted font-medium">No divisions found matching your filters.</p>
          </Card>
        ) : (
          filteredDivisions.map((division) => (
            <section key={division.id} className="space-y-6">
              <div className="pb-3 border-b border-border/80 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text flex items-center gap-2">
                    <Shield className="text-primary" size={20} />
                    <span>{division.leagueNodeName}</span>
                  </h2>
                  <p className="text-xs text-muted mt-0.5">{division.seasonName} Season Standings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Standings Table - Left (2 cols) */}
                <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-border/80 bg-surface shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border bg-background/50 text-[10px] font-bold uppercase tracking-wider text-muted">
                        <th className="py-1.5 px-3 w-12 text-center">Pos</th>
                        <th className="py-1.5 px-3">Club / Team</th>
                        <th className="py-1.5 px-2 text-center">GP</th>
                        <th className="py-1.5 px-2 text-center">W</th>
                        <th className="py-1.5 px-2 text-center">L</th>
                        <th className="py-1.5 px-2 text-center">D</th>
                        <th className="py-1.5 px-2 text-center">GF</th>
                        <th className="py-1.5 px-2 text-center font-normal">GA</th>
                        <th className="py-1.5 px-2 text-center font-normal">GD</th>
                        <th className="py-1.5 px-3 text-center text-primary font-black">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {division.standings.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-4 text-center text-sm text-muted font-medium">
                            No match results reported for this division yet.
                          </td>
                        </tr>
                      ) : (
                        division.standings.map((team, index) => {
                          const gd = team.goalsFor - team.goalsAgainst;
                          return (
                            <tr
                              key={team.teamSeasonId}
                              className="border-b border-border/60 hover:bg-background/25 last:border-none transition-colors"
                            >
                              <td className="py-1.5 px-3 font-bold text-center text-muted/80 text-xs sm:text-sm">
                                {index + 1}
                              </td>
                              <td className="py-1.5 px-3">
                                <Link
                                  href={`/teams/${team.teamSeasonId}`}
                                  className="font-bold text-text hover:text-primary transition-colors text-xs sm:text-sm leading-tight block"
                                >
                                  {team.clubName && <span className="font-semibold text-[10px] text-muted block">{team.clubName}</span>}
                                  {team.teamName}
                                </Link>
                              </td>
                              <td className="py-1.5 px-2 text-center text-xs sm:text-sm font-medium">{team.gamesPlayed}</td>
                              <td className="py-1.5 px-2 text-center text-xs sm:text-sm font-semibold text-success">{team.wins}</td>
                              <td className="py-1.5 px-2 text-center text-xs sm:text-sm font-semibold text-danger">{team.losses}</td>
                              <td className="py-1.5 px-2 text-center text-xs sm:text-sm font-semibold text-muted">{team.draws}</td>
                              <td className="py-1.5 px-2 text-center text-xs sm:text-sm text-text/75">{team.goalsFor}</td>
                              <td className="py-1.5 px-2 text-center text-xs sm:text-sm text-muted/75">{team.goalsAgainst}</td>
                              <td className={`py-1.5 px-2 text-center text-xs sm:text-sm font-bold ${gd > 0 ? "text-success" : gd < 0 ? "text-danger" : "text-muted"}`}>
                                {gd > 0 ? `+${gd}` : gd}
                              </td>
                              <td className="py-1.5 px-3 text-center font-extrabold text-primary text-sm sm:text-base">{team.points}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Recent Games Panel - Right (1 col) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-text flex items-center gap-1.5 px-1 uppercase tracking-wider text-muted">
                    <Calendar size={14} className="text-primary" />
                    <span>Recent / Upcoming Matches</span>
                  </h3>
                  
                  {division.games.length === 0 ? (
                    <Card variant="outlined" padding="md" className="text-center py-6 text-muted text-sm font-medium bg-surface/30">
                      No matches scheduled.
                    </Card>
                  ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {division.games.map((game) => {
                        const isCompleted = game.status === "completed";
                        return (
                          <Card key={game.id} variant="default" padding="sm" className="bg-surface/50 border-border/80 text-xs">
                            <div className="flex justify-between items-center text-[10px] text-muted mb-2 border-b border-border/40 pb-1">
                              <span className="capitalize font-semibold">{game.gameType}</span>
                              {isCompleted ? (
                                <span className="font-extrabold text-success uppercase">Final</span>
                              ) : (
                                <span>{game.startDate}</span>
                              )}
                            </div>
                            
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-medium truncate pr-2 max-w-[130px]">{game.homeClubName || ""} {game.homeTeamName}</span>
                                {isCompleted ? (
                                  <span className="font-bold text-sm bg-background px-1.5 rounded">{game.homeScore}</span>
                                ) : (
                                  <span className="text-[10px] text-muted">Home</span>
                                )}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium truncate pr-2 max-w-[130px]">{game.awayClubName || ""} {game.awayTeamName}</span>
                                {isCompleted ? (
                                  <span className="font-bold text-sm bg-background px-1.5 rounded">{game.awayScore}</span>
                                ) : (
                                  <span className="text-[10px] text-muted">Away</span>
                                )}
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted">
                              <span className="flex items-center gap-1"><Clock size={10} /> {game.startTime || "TBD"}</span>

                              {canManage && (
                                <button
                                  onClick={() => setQuickScoreGame(game)}
                                  className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                  title="Enter or update match score"
                                >
                                  <Edit3 size={11} />
                                  <span>Quick Score</span>
                                </button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))
        )}
      </div>
      </div>
      )}

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
