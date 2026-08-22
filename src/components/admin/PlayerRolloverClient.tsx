"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Square,
  Shield,
  Search,
  UserCheck,
  GraduationCap,
  Calendar,
  Layers,
  Filter,
  Check,
} from "lucide-react";
import { RolloverTeamSeason, RolloverPlayer } from "@/lib/data/queries";
import { rolloverPlayers, getTeamRosterAction } from "@/lib/actions/rollover-actions";

import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";

interface AggregatedRolloverPlayer extends RolloverPlayer {
  sourceTeamLabel: string;
  sourceSeasonName: string;
}

interface PlayerRolloverClientProps {
  teamSeasons: RolloverTeamSeason[];
}

export default function PlayerRolloverClient({
  teamSeasons,
}: PlayerRolloverClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Separate previous (completed/archived/inactive) vs new (active/upcoming) team seasons
  const previousTeamSeasons = useMemo(() => {
    const prev = teamSeasons.filter(
      (ts) => ts.seasonStatus === "completed" || ts.seasonStatus === "archived" || !ts.isActive
    );
    // Fallback: If no previous team seasons exist yet, return all team seasons
    return prev.length > 0 ? prev : teamSeasons;
  }, [teamSeasons]);

  const newTargetTeamSeasons = useMemo(() => {
    const targetList = teamSeasons.filter(
      (ts) => ts.seasonStatus === "active" || ts.seasonStatus === "upcoming" || ts.isActive
    );
    return targetList.length > 0 ? targetList : teamSeasons;
  }, [teamSeasons]);

  // Selection states: multiple source IDs allowed
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  const [targetId, setTargetId] = useState<string>("");

  // Roster data
  const [combinedSourceRoster, setCombinedSourceRoster] = useState<AggregatedRolloverPlayer[]>([]);
  const [targetRoster, setTargetRoster] = useState<RolloverPlayer[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);

  // Selected player person IDs
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);

  // Transfer options
  const [incrementGrade, setIncrementGrade] = useState(true);
  const [targetStatus, setTargetStatus] = useState("rostered");
  const [searchFilter, setSearchFilter] = useState("");

  // UI state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resultMsg, setResultMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Target team season object
  const targetTeamSeason = teamSeasons.find((ts) => ts.id === Number(targetId));

  // Set of person IDs already on target roster
  const targetPersonIds = new Set(targetRoster.map((p) => p.personId));

  // Toggle source team selection
  const toggleSourceTeam = (id: number) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all previous teams
  const handleSelectAllPreviousTeams = () => {
    if (selectedSourceIds.length === previousTeamSeasons.length) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(previousTeamSeasons.map((ts) => ts.id));
    }
  };

  // Fetch rosters for ALL selected source team seasons
  useEffect(() => {
    if (selectedSourceIds.length === 0) {
      setCombinedSourceRoster([]);
      setSelectedPersonIds([]);
      return;
    }

    async function loadCombinedSourceRosters() {
      setIsLoadingRoster(true);
      try {
        const rosterPromises = selectedSourceIds.map(async (tsId) => {
          const ts = teamSeasons.find((item) => item.id === tsId);
          const roster = await getTeamRosterAction(tsId);
          const label = ts ? `${ts.clubName} ${ts.teamName} (${ts.seasonName})` : `Team #${tsId}`;
          const seasonName = ts?.seasonName || "";
          return roster.map((p) => ({
            ...p,
            sourceTeamLabel: label,
            sourceSeasonName: seasonName,
          }));
        });

        const rostersArrays = await Promise.all(rosterPromises);
        
        // Combine & deduplicate players by personId
        const playerMap = new Map<number, AggregatedRolloverPlayer>();
        rostersArrays.flat().forEach((player) => {
          if (!playerMap.has(player.personId)) {
            playerMap.set(player.personId, player);
          }
        });

        const combinedList = Array.from(playerMap.values());
        setCombinedSourceRoster(combinedList);
        setSelectedPersonIds(combinedList.map((p) => p.personId));
      } catch (err) {
        console.error("Failed to fetch combined source rosters:", err);
      } finally {
        setIsLoadingRoster(false);
      }
    }

    loadCombinedSourceRosters();
  }, [selectedSourceIds, teamSeasons]);

  // Fetch target roster when targetId changes
  useEffect(() => {
    if (!targetId) {
      setTargetRoster([]);
      return;
    }

    async function loadTargetRoster() {
      try {
        const roster = await getTeamRosterAction(Number(targetId));
        setTargetRoster(roster);
      } catch (err) {
        console.error("Failed to fetch target roster:", err);
      }
    }

    loadTargetRoster();
  }, [targetId]);

  // Toggle single player checkbox
  const handleTogglePlayer = (personId: number) => {
    setSelectedPersonIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  // Toggle select all players
  const handleToggleSelectAll = () => {
    if (selectedPersonIds.length === filteredSourceRoster.length) {
      setSelectedPersonIds([]);
    } else {
      setSelectedPersonIds(filteredSourceRoster.map((p) => p.personId));
    }
  };

  // Filtered source roster
  const filteredSourceRoster = useMemo(() => {
    if (!searchFilter.trim()) return combinedSourceRoster;
    const q = searchFilter.toLowerCase();
    return combinedSourceRoster.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        (p.position && p.position.toLowerCase().includes(q)) ||
        (p.jerseyNumber && String(p.jerseyNumber).includes(q)) ||
        p.sourceTeamLabel.toLowerCase().includes(q)
    );
  }, [combinedSourceRoster, searchFilter]);

  // Candidate players count excluding already enrolled
  const validCandidateCount = selectedPersonIds.filter(
    (id) => !targetPersonIds.has(id)
  ).length;

  // Execute rollover
  const handleExecuteRollover = () => {
    if (selectedSourceIds.length === 0 || !targetId || selectedPersonIds.length === 0) return;
    setConfirmDialogOpen(false);
    setResultMsg(null);

    startTransition(async () => {
      try {
        const res = await rolloverPlayers({
          sourceTeamSeasonIds: selectedSourceIds,
          targetTeamSeasonId: Number(targetId),
          playerPersonIds: selectedPersonIds,
          incrementGrade,
          targetStatus,
        });

        if (res.success) {
          setResultMsg({
            type: "success",
            text: res.message,
          });
          // Refresh target roster
          const updatedTargetRoster = await getTeamRosterAction(Number(targetId));
          setTargetRoster(updatedTargetRoster);
          router.refresh();
        }
      } catch (err: any) {
        setResultMsg({
          type: "error",
          text: err?.message || "Failed to execute player rollover.",
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-6 md:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-indigo-400" />
            Season-to-Season Player Rollover Engine
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Migrate players from past season teams into upcoming active teams with multi-team merging and grade level incrementing.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 text-xs">
          <div className="text-center px-2 border-r border-slate-700">
            <span className="block font-bold text-indigo-400 text-lg">{previousTeamSeasons.length}</span>
            <span className="text-slate-400 text-[10px]">Past Teams</span>
          </div>
          <div className="text-center px-2">
            <span className="block font-bold text-emerald-400 text-lg">{newTargetTeamSeasons.length}</span>
            <span className="text-slate-400 text-[10px]">Target Teams</span>
          </div>
        </div>
      </div>

      {/* Result Alert */}
      {resultMsg && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center gap-3 ${
            resultMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {resultMsg.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          )}
          <span className="font-semibold">{resultMsg.text}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Source Teams Multiselect & Roster Candidate List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Source Teams Multiselect Card */}
          <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Select Previous Source Teams (Past Seasons) *
              </label>
              <button
                onClick={handleSelectAllPreviousTeams}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {selectedSourceIds.length === previousTeamSeasons.length
                  ? "Deselect All"
                  : "Select All Previous Teams"}
              </button>
            </div>

            {/* Source Teams Checkboxes List */}
            <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-700/60 rounded-xl bg-slate-900/50 p-2.5">
              {previousTeamSeasons.map((ts) => {
                const isSelected = selectedSourceIds.includes(ts.id);
                return (
                  <label
                    key={ts.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-600/15 text-white"
                        : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSourceTeam(ts.id)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div>
                        <span className="font-bold text-white">
                          {ts.clubName} — {ts.teamName}
                        </span>
                        <span className="ml-2 text-[11px] text-slate-400">
                          ({ts.seasonName} {ts.ageGroupName ? `• ${ts.ageGroupName}` : ""})
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-indigo-300 border border-slate-700">
                      {ts.playerCount} players
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Source Roster Candidate Card */}
          <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 overflow-hidden backdrop-blur-md shadow-lg">
            <div className="border-b border-slate-700/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Source Roster Candidates ({filteredSourceRoster.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select players to transfer to target team
                </p>
              </div>

              {/* Roster Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleSelectAll}
                  disabled={filteredSourceRoster.length === 0}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  {selectedPersonIds.length === filteredSourceRoster.length && filteredSourceRoster.length > 0
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="p-4 border-b border-slate-700/60 bg-slate-900/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter candidate roster by name, jersey, or position..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Roster Table / List */}
            {isLoadingRoster ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading source roster candidates...
              </div>
            ) : selectedSourceIds.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Select one or more previous teams above to view candidate players.
              </div>
            ) : filteredSourceRoster.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No players match your search filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/60 max-h-96 overflow-y-auto">
                {filteredSourceRoster.map((player) => {
                  const isChecked = selectedPersonIds.includes(player.personId);
                  const isAlreadyEnrolled = targetPersonIds.has(player.personId);

                  return (
                    <div
                      key={`${player.id}-${player.personId}`}
                      onClick={() => !isAlreadyEnrolled && handleTogglePlayer(player.personId)}
                      className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                        isAlreadyEnrolled
                          ? "bg-slate-900/30 opacity-60 cursor-not-allowed"
                          : isChecked
                          ? "bg-indigo-600/10 hover:bg-indigo-600/15"
                          : "hover:bg-slate-700/40"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isAlreadyEnrolled}
                          onChange={() => handleTogglePlayer(player.personId)}
                          className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {player.firstName} {player.lastName}
                            {player.jerseyNumber && (
                              <span className="font-mono text-xs text-indigo-300">
                                #{player.jerseyNumber}
                              </span>
                            )}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{player.sourceTeamLabel}</span>
                            {player.position && <span>• {player.position}</span>}
                            {player.grade && <span>• Grade {player.grade}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isAlreadyEnrolled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Already Enrolled
                          </span>
                        ) : isChecked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <Check className="h-3 w-3" /> Selected
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Target Team & Rollover Configuration */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-6 backdrop-blur-md space-y-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-400" />
              Target Team & Rollover Settings
            </h3>

            {/* Target Team Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Active Team Season *
              </label>
              <Select
                value={targetId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetId(e.target.value)}
                options={newTargetTeamSeasons.map((ts) => ({
                  value: String(ts.id),
                  label: `${ts.clubName} — ${ts.teamName} (${ts.seasonName})`,
                }))}
                placeholder="Choose target team season..."
                showPlaceholder={true}
              />
            </div>

            {targetTeamSeason && (
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3.5 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">Target Summary:</p>
                <p>Club: <strong className="text-indigo-300">{targetTeamSeason.clubName}</strong></p>
                <p>Team: <strong className="text-indigo-300">{targetTeamSeason.teamName}</strong></p>
                <p>Season: <strong className="text-indigo-300">{targetTeamSeason.seasonName}</strong> ({targetTeamSeason.seasonStatus.toUpperCase()})</p>
                <p>Current Active Roster: <strong className="text-emerald-400">{targetRoster.length} players</strong></p>
              </div>
            )}

            {/* Target Status Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Status on New Team
              </label>
              <Select
                value={targetStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetStatus(e.target.value)}
                options={[
                  { value: "rostered", label: "Rostered (Active)" },
                  { value: "trying out", label: "Trying Out" },
                  { value: "interested", label: "Interested / Available" },
                ]}
              />
            </div>

            {/* Grade Increment Toggle */}
            <div className="pt-2 border-t border-slate-700/60">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incrementGrade}
                  onChange={(e) => setIncrementGrade(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5"
                />
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-indigo-400" />
                    Auto-Increment Grade Levels (+1 Year)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Automatically bumps student grades (e.g. 9th → 10th, 11th → 12th, 12th → Graduated).
                  </p>
                </div>
              </label>
            </div>

            {/* Transfer Preview Action Button */}
            <div className="pt-4 border-t border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Selected Candidate Players:</span>
                <span className="font-bold text-emerald-400">{validCandidateCount} ready to transfer</span>
              </div>

              <Button
                onClick={() => setConfirmDialogOpen(true)}
                disabled={
                  isPending ||
                  selectedSourceIds.length === 0 ||
                  !targetId ||
                  validCandidateCount === 0
                }
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {isPending ? "Executing Rollover..." : `Transfer ${validCandidateCount} Player(s) Now 🚀`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG */}
      <Dialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleExecuteRollover}
        title="Confirm Player Rollover"
        description={`Are you sure you want to transfer ${validCandidateCount} selected player(s) into "${targetTeamSeason?.clubName} — ${targetTeamSeason?.teamName}" (${targetTeamSeason?.seasonName})?`}
        confirmText="Confirm & Execute Transfer"
        variant="primary"
      />
    </div>
  );
}
