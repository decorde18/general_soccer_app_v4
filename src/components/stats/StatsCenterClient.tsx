"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import {
  Users,
  Shield,
  Filter,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import type { PlayerSeasonStats, ComprehensiveTeamStats } from "@/lib/data/queries";
import { fetchPlayerStatsAction, fetchTeamStatsAction } from "@/lib/actions/stats-actions";
import { formatTeamName } from "@/lib/utils/teamName";

interface StatsCenterClientProps {
  initialPlayerStats: PlayerSeasonStats[];
  initialTeamStats: ComprehensiveTeamStats[];
  seasons: { id: number; name: string }[];
  leagues: { id: number; name: string }[];
  clubs: { id: number; name: string }[];
  teams: { id: number; name: string; clubId?: number; clubName?: string }[];
  defaultSeasonId?: number;
}

export default function StatsCenterClient({
  initialPlayerStats,
  initialTeamStats,
  seasons,
  leagues,
  clubs,
  teams,
  defaultSeasonId,
}: StatsCenterClientProps) {
  const [activeTab, setActiveTab] = useState<"players" | "teams">("players");
  const [scope, setScope] = useState<"season" | "career" | "competition">("season");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    defaultSeasonId ? String(defaultSeasonId) : ""
  );
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [playerStats, setPlayerStats] = useState<PlayerSeasonStats[]>(initialPlayerStats);
  const [teamStats, setTeamStats] = useState<ComprehensiveTeamStats[]>(initialTeamStats);
  const [isPending, startTransition] = useTransition();

  // Sort State for Player Stats
  const [playerSortField, setPlayerSortField] = useState<keyof PlayerSeasonStats>("goals");
  const [playerSortAsc, setPlayerSortAsc] = useState<boolean>(false);

  // Sort State for Team Stats
  const [teamSortField, setTeamSortField] = useState<keyof ComprehensiveTeamStats>("points");
  const [teamSortAsc, setTeamSortAsc] = useState<boolean>(false);

  // Dropdown Options
  const seasonOptions = useMemo(
    () => [{ value: "", label: "-- All Seasons --" }, ...seasons.map((s) => ({ value: String(s.id), label: s.name }))],
    [seasons]
  );

  const leagueOptions = useMemo(
    () => [{ value: "", label: "-- All Leagues / Tournaments --" }, ...leagues.map((l) => ({ value: String(l.id), label: l.name }))],
    [leagues]
  );

  const clubOptions = useMemo(
    () => [{ value: "", label: "-- All Clubs --" }, ...clubs.map((c) => ({ value: String(c.id), label: c.name }))],
    [clubs]
  );

  const filteredTeams = useMemo(() => {
    if (!selectedClubId) return teams;
    return teams.filter((t) => String(t.clubId) === selectedClubId);
  }, [teams, selectedClubId]);

  const teamOptions = useMemo(
    () => [
      { value: "", label: "-- All Teams --" },
      ...filteredTeams.map((t) => ({
        value: String(t.id),
        label: formatTeamName({ teamName: t.name, clubName: t.clubName }, "short"),
      })),
    ],
    [filteredTeams]
  );

  // Trigger refetch whenever filters change
  useEffect(() => {
    startTransition(async () => {
      const filterOpts = {
        scope,
        seasonId: selectedSeasonId ? Number(selectedSeasonId) : undefined,
        leagueId: selectedLeagueId ? Number(selectedLeagueId) : undefined,
        clubId: selectedClubId ? Number(selectedClubId) : undefined,
        teamSeasonId: selectedTeamId ? Number(selectedTeamId) : undefined,
      };

      const [pRes, tRes] = await Promise.all([
        fetchPlayerStatsAction(filterOpts),
        fetchTeamStatsAction(filterOpts),
      ]);

      setPlayerStats(pRes);
      setTeamStats(tRes);
    });
  }, [scope, selectedSeasonId, selectedLeagueId, selectedClubId, selectedTeamId]);

  // Filtered & Sorted Player Stats
  const filteredPlayerStats = useMemo(() => {
    return playerStats
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
          const teamName = (p.teamName || "").toLowerCase();
          return fullName.includes(q) || teamName.includes(q);
        }
        return true;
      })
      .sort((a: any, b: any) => {
        const valA = a[playerSortField] ?? 0;
        const valB = b[playerSortField] ?? 0;
        if (valA < valB) return playerSortAsc ? -1 : 1;
        if (valA > valB) return playerSortAsc ? 1 : -1;
        return 0;
      });
  }, [playerStats, searchQuery, playerSortField, playerSortAsc]);

  // Filtered & Sorted Team Stats
  const filteredTeamStats = useMemo(() => {
    return teamStats
      .filter((t) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = (t.teamName || "").toLowerCase();
          const club = (t.clubName || "").toLowerCase();
          return name.includes(q) || club.includes(q);
        }
        return true;
      })
      .sort((a: any, b: any) => {
        const valA = a[teamSortField] ?? 0;
        const valB = b[teamSortField] ?? 0;
        if (valA < valB) return teamSortAsc ? -1 : 1;
        if (valA > valB) return teamSortAsc ? 1 : -1;
        return 0;
      });
  }, [teamStats, searchQuery, teamSortField, teamSortAsc]);

  const handlePlayerSort = (field: keyof PlayerSeasonStats) => {
    if (playerSortField === field) {
      setPlayerSortAsc(!playerSortAsc);
    } else {
      setPlayerSortField(field);
      setPlayerSortAsc(false);
    }
  };

  const handleTeamSort = (field: keyof ComprehensiveTeamStats) => {
    if (teamSortField === field) {
      setTeamSortAsc(!teamSortAsc);
    } else {
      setTeamSortField(field);
      setTeamSortAsc(false);
    }
  };

  const renderPlusMinusBadge = (val: number) => {
    if (val > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-success/20 text-success border border-success/30">
          +{val}
        </span>
      );
    }
    if (val < 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-danger/20 text-danger border border-danger/30">
          {val}
        </span>
      );
    }
    return <span className="text-xs text-muted font-medium">0</span>;
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <BarChart3 size={16} />
            <span>Comprehensive Analytics</span>
            {isPending && <Loader2 size={14} className="animate-spin text-primary ml-2" />}
          </div>
          <h1 className="text-2xl font-bold text-text">Stats Center</h1>
          <p className="text-sm text-muted">
            Track player playing time, +/- net differential, goals, assists, and team performance metrics.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center bg-background/80 p-1.5 rounded-lg border border-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("players")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "players"
                ? "bg-primary text-primary-contrast shadow-sm"
                : "text-muted hover:text-text hover:bg-surface-hover"
            }`}
          >
            <Users size={16} />
            <span>Player Stats</span>
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "teams"
                ? "bg-primary text-primary-contrast shadow-sm"
                : "text-muted hover:text-text hover:bg-surface-hover"
            }`}
          >
            <Shield size={16} />
            <span>Team Stats</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card variant="outlined" padding="md" className="bg-surface/50">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-text">
              <Filter size={16} className="text-primary" />
              <span>Stat Scope & Filters</span>
              {isPending && (
                <span className="text-xs font-normal text-muted italic ml-2">Updating stats...</span>
              )}
            </div>

            {/* SCOPE TOGGLE */}
            <div className="flex items-center gap-1 bg-background px-1 py-1 rounded-md border border-border">
              <button
                onClick={() => setScope("season")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  scope === "season"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                Current Season
              </button>
              <button
                onClick={() => setScope("career")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  scope === "career"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                Career (All-Time)
              </button>
              <button
                onClick={() => setScope("competition")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  scope === "competition"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                Tournament / League
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select
              label="Season"
              options={seasonOptions}
              value={selectedSeasonId}
              onChange={(e: any) => setSelectedSeasonId(e.target?.value ?? e)}
              width="full"
            />

            <Select
              label="League / Tournament"
              options={leagueOptions}
              value={selectedLeagueId}
              onChange={(e: any) => setSelectedLeagueId(e.target?.value ?? e)}
              width="full"
            />

            <Select
              label="Club"
              options={clubOptions}
              value={selectedClubId}
              onChange={(e: any) => {
                const newClubId = e.target?.value ?? e;
                setSelectedClubId(newClubId);
                setSelectedTeamId(""); // Reset team selection when club changes
              }}
              width="full"
            />

            <Select
              label="Team"
              options={teamOptions}
              value={selectedTeamId}
              onChange={(e: any) => setSelectedTeamId(e.target?.value ?? e)}
              width="full"
            />

            <Input
              label="Search Name / Team"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* PLAYER STATS TABLE VIEW */}
      {activeTab === "players" && (
        <Card variant="outlined" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface/80 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("lastName")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Player</span>
                      {playerSortField === "lastName" &&
                        (playerSortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("teamName")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Team</span>
                      {playerSortField === "teamName" &&
                        (playerSortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("gamesPlayed")}
                    title="Games Played"
                  >
                    GP
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("gamesStarted")}
                    title="Games Started"
                  >
                    GS
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text text-primary"
                    onClick={() => handlePlayerSort("minutesPlayed")}
                    title="Minutes Played"
                  >
                    MIN
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold"
                    onClick={() => handlePlayerSort("goals")}
                    title="Goals"
                  >
                    G
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("assists")}
                    title="Assists"
                  >
                    A
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold text-primary"
                    onClick={() => handlePlayerSort("points")}
                    title="Points (Goals * 2 + Assists)"
                  >
                    PTS
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold"
                    onClick={() => handlePlayerSort("plusMinus")}
                    title="Plus / Minus (Goal Differential while on field)"
                  >
                    +/-
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("shots")}
                    title="Shots"
                  >
                    SH
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("shotsOnTarget")}
                    title="Shots On Goal"
                  >
                    SOG
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("yellowCards")}
                    title="Yellow Cards"
                  >
                    YC
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("redCards")}
                    title="Red Cards"
                  >
                    RC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredPlayerStats.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-muted">
                      {isPending ? "Loading statistics..." : "No player statistics match the selected filters."}
                    </td>
                  </tr>
                ) : (
                  filteredPlayerStats.map((p, idx) => (
                    <tr
                      key={`${p.playerId}_${p.teamSeasonId}_${idx}`}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-xs text-muted">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="py-3 px-4 text-muted text-xs font-medium">
                        {p.teamName || "—"}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium">{p.gamesPlayed}</td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{p.gamesStarted}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-primary">
                        {p.minutesPlayed}′
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-text">
                        {p.goals}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{p.assists}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-primary">
                        {p.points}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {renderPlusMinusBadge(p.plusMinus)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{p.shots}</td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{p.shotsOnTarget}</td>
                      <td className="py-3 px-3 text-center font-mono text-xs">
                        {p.yellowCards > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning font-bold">
                            {p.yellowCards}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs">
                        {p.redCards > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-danger/20 text-danger font-bold">
                            {p.redCards}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TEAM STATS TABLE VIEW */}
      {activeTab === "teams" && (
        <Card variant="outlined" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface/80 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text"
                    onClick={() => handleTeamSort("teamName")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Team</span>
                      {teamSortField === "teamName" &&
                        (teamSortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text"
                    onClick={() => handleTeamSort("clubName")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Club</span>
                      {teamSortField === "clubName" &&
                        (teamSortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handleTeamSort("gamesPlayed")}
                    title="Games Played"
                  >
                    GP
                  </th>
                  <th className="py-3 px-3 text-center" title="Wins - Losses - Draws">
                    W - L - D
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold text-primary"
                    onClick={() => handleTeamSort("points")}
                    title="Points"
                  >
                    PTS
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold"
                    onClick={() => handleTeamSort("goalsFor")}
                    title="Goals For"
                  >
                    GF
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold"
                    onClick={() => handleTeamSort("goalsAgainst")}
                    title="Goals Against"
                  >
                    GA
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold text-primary"
                    onClick={() => handleTeamSort("goalDifferential")}
                    title="Goal Differential"
                  >
                    GD
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handleTeamSort("pointsPerMatch")}
                    title="Points Per Match"
                  >
                    PPM
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handleTeamSort("goalsForPerGame")}
                    title="Goals For Per Game"
                  >
                    GF/G
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handleTeamSort("goalsAgainstPerGame")}
                    title="Goals Against Per Game"
                  >
                    GA/G
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTeamStats.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-muted">
                      {isPending ? "Loading team statistics..." : "No team statistics match the selected filters."}
                    </td>
                  </tr>
                ) : (
                  filteredTeamStats.map((t, idx) => (
                    <tr key={`${t.teamSeasonId}_${idx}`} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs text-muted">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text">{t.teamName}</td>
                      <td className="py-3 px-4 text-muted text-xs font-medium">{t.clubName || "—"}</td>
                      <td className="py-3 px-3 text-center font-mono font-medium">{t.gamesPlayed}</td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-muted">
                        {t.wins} - {t.losses} - {t.draws}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-primary">
                        {t.points}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-success">
                        {t.goalsFor}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-danger">
                        {t.goalsAgainst}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-primary">
                        {t.goalDifferential > 0 ? `+${t.goalDifferential}` : t.goalDifferential}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{t.pointsPerMatch}</td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{t.goalsForPerGame}</td>
                      <td className="py-3 px-3 text-center font-mono text-muted">
                        {t.goalsAgainstPerGame}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
