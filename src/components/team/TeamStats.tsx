"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import {
  Users,
  Shield,
  Search,
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

interface TeamStatsProps {
  stats: PlayerSeasonStats[];
  teamSeasonId?: number;
  leagueLinks?: {
    leagueNodeSeasonId: number;
    leagueName: string;
    leagueNodeName: string;
  }[];
}

export default function TeamStats({ stats: initialStats, teamSeasonId, leagueLinks }: TeamStatsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"players" | "team">("players");
  const [scope, setScope] = useState<"season" | "career" | "competition">("season");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [playerStats, setPlayerStats] = useState<PlayerSeasonStats[]>(initialStats);
  const [teamStats, setTeamStats] = useState<ComprehensiveTeamStats[]>([]);
  const [isPending, startTransition] = useTransition();

  // Sort State
  const [playerSortField, setPlayerSortField] = useState<keyof PlayerSeasonStats>("goals");
  const [playerSortAsc, setPlayerSortAsc] = useState<boolean>(false);
  const [teamSortField, setTeamSortField] = useState<keyof ComprehensiveTeamStats>("points");
  const [teamSortAsc, setTeamSortAsc] = useState<boolean>(false);

  // Competition Options
  const competitionOptions = useMemo(() => {
    const list = [{ value: "", label: "-- All Enrolled Competitions --" }];
    (leagueLinks || []).forEach((link) => {
      list.push({
        value: String(link.leagueNodeSeasonId),
        label: `${link.leagueName} (${link.leagueNodeName})`,
      });
    });
    return list;
  }, [leagueLinks]);

  // Fetch updated stats when scope or competition selection changes
  useEffect(() => {
    if (!teamSeasonId) return;

    startTransition(async () => {
      const filterOpts = {
        teamSeasonId: teamSeasonId,
        scope,
        leagueNodeSeasonId: selectedLeagueId ? Number(selectedLeagueId) : undefined,
      };

      const [pRes, tRes] = await Promise.all([
        fetchPlayerStatsAction(filterOpts),
        fetchTeamStatsAction(filterOpts),
      ]);

      if (pRes && pRes.length > 0) {
        setPlayerStats(pRes);
      } else if (scope === "season" && !selectedLeagueId) {
        setPlayerStats(initialStats);
      } else {
        setPlayerStats(pRes);
      }
      setTeamStats(tRes);
    });
  }, [teamSeasonId, scope, selectedLeagueId, initialStats]);

  // Filtered & Sorted Player Stats
  const filteredPlayerStats = useMemo(() => {
    let list = (playerStats || []).map((s) => ({
      ...s,
      plusMinus: s.plusMinus ?? 0,
      points: s.goals * 2 + s.assists,
    }));

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q)
      );
    }

    list.sort((a: any, b: any) => {
      let valA = a[playerSortField] ?? 0;
      let valB = b[playerSortField] ?? 0;

      if (playerSortField === ("lastName" as any)) {
        valA = `${a.lastName} ${a.firstName}`.toLowerCase();
        valB = `${b.lastName} ${b.firstName}`.toLowerCase();
      }

      if (valA < valB) return playerSortAsc ? -1 : 1;
      if (valA > valB) return playerSortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [playerStats, searchQuery, playerSortField, playerSortAsc]);

  // Filtered & Sorted Team Stats
  const filteredTeamStats = useMemo(() => {
    let list = [...(teamStats || [])];

    list.sort((a: any, b: any) => {
      let valA = a[teamSortField] ?? 0;
      let valB = b[teamSortField] ?? 0;

      if (valA < valB) return teamSortAsc ? -1 : 1;
      if (valA > valB) return teamSortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [teamStats, teamSortField, teamSortAsc]);

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
      {/* FILTER & SUB-TAB CONTROLS */}
      <Card variant="outlined" padding="md" className="bg-surface/50">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            {/* SUB-TABS: PLAYER VS TEAM */}
            <div className="flex items-center bg-background px-1 py-1 rounded-lg border border-border">
              <button
                onClick={() => setActiveSubTab("players")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "players"
                    ? "bg-primary text-primary-contrast shadow-sm"
                    : "text-muted hover:text-text"
                }`}
              >
                <Users size={14} />
                <span>Player Roster Stats</span>
              </button>
              <button
                onClick={() => setActiveSubTab("team")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === "team"
                    ? "bg-primary text-primary-contrast shadow-sm"
                    : "text-muted hover:text-text"
                }`}
              >
                <Shield size={14} />
                <span>Team Match Metrics</span>
              </button>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-center">
            {leagueLinks && leagueLinks.length > 0 && (
              <Select
                label="Filter by Competition"
                options={competitionOptions}
                value={selectedLeagueId}
                onChange={(e: any) => setSelectedLeagueId(e.target?.value ?? e)}
                width="full"
              />
            )}

            <Input
              label="Search Player Name"
              placeholder="Search player..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />

            {isPending && (
              <div className="flex items-center gap-2 text-xs font-semibold text-primary pt-3 sm:pt-0">
                <Loader2 size={14} className="animate-spin" />
                <span>Updating stats...</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* PLAYER STATS TAB */}
      {activeSubTab === "players" && (
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
                      <span>Player Name</span>
                      {playerSortField === "lastName" &&
                        (playerSortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold"
                    onClick={() => handlePlayerSort("goals")}
                  >
                    G
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold"
                    onClick={() => handlePlayerSort("assists")}
                  >
                    A
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold text-primary"
                    onClick={() => handlePlayerSort("points")}
                  >
                    PTS
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text font-bold"
                    onClick={() => handlePlayerSort("plusMinus")}
                  >
                    +/-
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("gamesPlayed")}
                  >
                    GP
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("gamesStarted")}
                  >
                    GS
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text text-primary"
                    onClick={() => handlePlayerSort("minutesPlayed")}
                  >
                    MIN
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("cleanSheets")}
                  >
                    CS
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("yellowCards")}
                  >
                    YC
                  </th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-text"
                    onClick={() => handlePlayerSort("redCards")}
                  >
                    RC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredPlayerStats.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-muted">
                      {isPending ? "Loading roster stats..." : "No player statistics found for selected filters."}
                    </td>
                  </tr>
                ) : (
                  filteredPlayerStats.map((row, idx) => (
                    <tr
                      key={`${row.id}_${idx}`}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-xs text-muted">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-text text-sm">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-text">
                        {row.goals}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{row.assists}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-primary">
                        {row.points}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {renderPlusMinusBadge(row.plusMinus ?? 0)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium">{row.gamesPlayed}</td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{row.gamesStarted}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-primary">
                        {row.minutesPlayed}′
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-muted">
                        {row.cleanSheets ?? 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs">
                        {row.yellowCards > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning font-bold">
                            {row.yellowCards}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs">
                        {row.redCards > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-danger/20 text-danger font-bold">
                            {row.redCards}
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

      {/* TEAM STATS TAB */}
      {activeSubTab === "team" && (
        <Card variant="outlined" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface/80 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-3 text-center">GP</th>
                  <th className="py-3 px-3 text-center">W - L - D</th>
                  <th className="py-3 px-3 text-center font-bold text-primary">PTS</th>
                  <th className="py-3 px-3 text-center font-bold">GF</th>
                  <th className="py-3 px-3 text-center font-bold">GA</th>
                  <th className="py-3 px-3 text-center font-bold text-primary">GD</th>
                  <th className="py-3 px-3 text-center">PPM</th>
                  <th className="py-3 px-3 text-center">GF/G</th>
                  <th className="py-3 px-3 text-center">GA/G</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTeamStats.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-muted">
                      {isPending ? "Loading team metrics..." : "No team metrics available for selected filters."}
                    </td>
                  </tr>
                ) : (
                  filteredTeamStats.map((t, idx) => (
                    <tr key={`${t.teamSeasonId}_${idx}`} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs text-muted">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text">{t.teamName}</td>
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
