"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { resolveKnockoutPlaceholders } from "@/lib/actions/league-actions";
import { Zap, Calendar, MapPin, Trophy, Filter, Layers, Table, LayoutGrid } from "lucide-react";
import { formatDateStandard, formatTimeStandard } from "@/lib/utils/dateTimeUtils";
import LocationDetailsModal from "@/components/location/LocationDetailsModal";
import LocationLink from "@/components/shared/LocationLink";

interface GameRecord {
  id: number;
  startDate: string;
  startTime: string | null;
  homeClubName: string;
  homeTeamName: string;
  awayClubName: string;
  awayTeamName: string;
  homeTeamSeasonId: number;
  awayTeamSeasonId: number;
  locationId?: number | null;
  locationName: string;
  sublocationName: string;
  gameType: string;
  status: string;
  divisionNodeName: string;
}

interface TournamentScheduleViewProps {
  leagueName: string;
  leagueId?: number;
  games: GameRecord[];
}

export default function TournamentScheduleView({
  leagueName,
  leagueId,
  games,
}: TournamentScheduleViewProps) {
  const [selectedFilterType, setSelectedFilterType] = useState<string>("all");
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isResolving, setIsResolving] = useState(false);
  const [selectedLocationModal, setSelectedLocationModal] = useState<{ id: number | null; name?: string | null; subName?: string | null } | null>(null);

  const handleResolveSeedings = async () => {
    if (!leagueId) return;
    setIsResolving(true);
    try {
      const res = await resolveKnockoutPlaceholders(leagueId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve knockout seedings.");
    } finally {
      setIsResolving(false);
    }
  };

  const divisions = Array.from(new Set(games.map((g) => g.divisionNodeName).filter(Boolean)));
  const gameTypes = Array.from(new Set(games.map((g) => g.gameType).filter(Boolean)));

  const filteredGames = games.filter((g) => {
    if (selectedFilterType !== "all" && g.gameType !== selectedFilterType) return false;
    if (selectedDivision !== "all" && g.divisionNodeName !== selectedDivision) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{leagueName} Schedule</h2>
            <p className="text-xs text-slate-400">
              Showing {filteredGames.length} of {games.length} total matches
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {leagueId && (
            <button
              onClick={handleResolveSeedings}
              disabled={isResolving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition-all disabled:opacity-50"
              title="Automatically update knockout TBD/placeholder teams based on current group stage standings"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isResolving ? "Resolving..." : "Resolve Seedings"}</span>
            </button>
          )}
          {divisions.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Divisions</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {gameTypes.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Filter className="h-3.5 w-3.5 text-indigo-400" />
              <select
                value={selectedFilterType}
                onChange={(e) => setSelectedFilterType(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white focus:border-indigo-500 focus:outline-none capitalize"
              >
                <option value="all">All Stages</option>
                {gameTypes.map((gt) => (
                  <option key={gt} value={gt}>
                    {gt.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View (Default)"
            >
              <Table className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Grid / Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Games List (Table or Grid) */}
      {filteredGames.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-xs text-slate-400">
          No matches found for this filter selection.
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Stage / Type</th>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3">Matchup</th>
                  <th className="px-4 py-3">Venue / Field</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredGames.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap text-indigo-300">
                      <div>{formatDateStandard(g.startDate, "medium")}</div>
                      {g.startTime && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {formatTimeStandard(g.startTime)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {g.gameType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-400">
                      {g.divisionNodeName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">H</span>
                          <span className="font-semibold text-white">
                            {g.homeClubName ? <span className="text-slate-400 font-normal">{g.homeClubName} </span> : null}
                            {g.homeTeamName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">A</span>
                          <span className="font-semibold text-white">
                            {g.awayClubName ? <span className="text-slate-400 font-normal">{g.awayClubName} </span> : null}
                            {g.awayTeamName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <LocationLink
                        locationId={g.locationId}
                        locationName={g.locationName}
                        sublocationName={g.sublocationName}
                        showIcon
                        className="text-[11px]"
                      />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/gamestats/${g.homeTeamSeasonId}/${g.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                      >
                        <span>Match Details</span>
                        <span className="text-[10px]">→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGames.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-lg hover:border-slate-700 transition"
            >
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  {formatDateStandard(g.startDate, "full")} {g.startTime ? `@ ${formatTimeStandard(g.startTime)}` : ""}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {g.gameType.replace("_", " ")}
                </span>
              </div>

              {/* Teams Matchup */}
              <div className="space-y-2 py-1">
                {/* Home Team */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white truncate">
                    {g.homeClubName ? <span className="text-slate-400 font-normal">{g.homeClubName} </span> : null}
                    {g.homeTeamName}
                  </span>
                  <span className="text-xs text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-500/10">
                    Home
                  </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white truncate">
                    {g.awayClubName ? <span className="text-slate-400 font-normal">{g.awayClubName} </span> : null}
                    {g.awayTeamName}
                  </span>
                  <span className="text-xs text-blue-400 font-bold px-1.5 py-0.5 rounded bg-blue-500/10">
                    Away
                  </span>
                </div>
              </div>

              {/* Footer Venue & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <LocationLink
                  locationId={g.locationId}
                  locationName={g.locationName}
                  sublocationName={g.sublocationName}
                  showIcon
                  className="text-xs max-w-[240px]"
                />

                <Link
                  href={`/gamestats/${g.homeTeamSeasonId}/${g.id}`}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                >
                  Match Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
