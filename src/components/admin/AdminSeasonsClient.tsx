"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, Edit, Trash2, CheckSquare, Square, Info, ShieldAlert, Flag, RefreshCw, ArrowRight, CheckCircle2 } from "lucide-react";
import { Season, AgeGroup } from "@/lib/data/queries";
import { createSeason, updateSeason, deleteSeason, transitionCompletedSeason } from "@/lib/actions/season-actions";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Dialog from "@/components/ui/Dialog";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

interface AdminSeasonsClientProps {
  initialSeasons: Season[];
  allAgeGroups: AgeGroup[];
}

export default function AdminSeasonsClient({
  initialSeasons,
  allAgeGroups,
}: AdminSeasonsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);
  const [transitioningSeason, setTransitioningSeason] = useState<Season | null>(null);

  // Transition form state
  const [upcomingTargetSeasonId, setUpcomingTargetSeasonId] = useState<string>("");
  const [archiveTeamsOption, setArchiveTeamsOption] = useState<boolean>(true);
  const [createNewTeamsOption, setCreateNewTeamsOption] = useState<boolean>(true);
  const [transitionSuccess, setTransitionSuccess] = useState<{
    msg: string;
    newTeamsCount: number;
  } | null>(null);

  // Form state
  const [seasonName, setSeasonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<string>("upcoming");
  const [selectedAgeGroupIds, setSelectedAgeGroupIds] = useState<number[]>([]);
  const [inheritedFrom, setInheritedFrom] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to get status badge colors
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "upcoming":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "completed":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "archived":
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  // Open Create Modal (borrow previous season's age groups)
  const handleOpenCreate = () => {
    setErrorMsg(null);
    setTransitionSuccess(null);
    setSeasonName("");
    setStartDate(new Date().toISOString().slice(0, 10));
    
    // Default end date +1 year
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setEndDate(nextYear.toISOString().slice(0, 10));
    setStatus("upcoming");

    // Borrow age groups from the most recent season
    const mostRecentSeason = [...initialSeasons].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0];

    if (mostRecentSeason && mostRecentSeason.ageGroupIds && mostRecentSeason.ageGroupIds.length > 0) {
      setSelectedAgeGroupIds([...mostRecentSeason.ageGroupIds]);
      setInheritedFrom(mostRecentSeason.seasonName);
    } else {
      setSelectedAgeGroupIds(allAgeGroups.map((ag) => ag.id));
      setInheritedFrom(null);
    }

    setIsCreateOpen(true);
  };

  // Open Transition Modal
  const handleOpenTransition = (season: Season) => {
    setErrorMsg(null);
    setTransitionSuccess(null);
    setTransitioningSeason(season);
    setArchiveTeamsOption(true);
    setCreateNewTeamsOption(true);

    const upcomingSeason = initialSeasons.find(
      (s) => s.id !== season.id && (s.status === "upcoming" || s.status === "active")
    );
    setUpcomingTargetSeasonId(upcomingSeason ? String(upcomingSeason.id) : "");
  };

  // Submit Transition
  const handleTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitioningSeason) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await transitionCompletedSeason({
          completedSeasonId: transitioningSeason.id,
          upcomingSeasonId: upcomingTargetSeasonId ? Number(upcomingTargetSeasonId) : null,
          archiveCompletedTeams: archiveTeamsOption,
          createNewTeams: createNewTeamsOption,
        });

        if (res.success) {
          setTransitionSuccess({
            msg: res.message,
            newTeamsCount: res.newTeamsCreatedCount,
          });
          router.refresh();
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to transition season.");
      }
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (season: Season) => {
    setErrorMsg(null);
    setEditingSeason(season);
    setSeasonName(season.seasonName);
    setStartDate(season.startDate);
    setEndDate(season.endDate);
    setStatus(season.status);
    setSelectedAgeGroupIds(season.ageGroupIds || []);
    setInheritedFrom(null);
  };

  // Toggle single age group selection
  const handleToggleAgeGroup = (agId: number) => {
    setSelectedAgeGroupIds((prev) =>
      prev.includes(agId) ? prev.filter((id) => id !== agId) : [...prev, agId]
    );
  };

  // Select all / deselect all
  const handleSelectAllAgeGroups = () => {
    setSelectedAgeGroupIds(allAgeGroups.map((ag) => ag.id));
  };

  const handleDeselectAllAgeGroups = () => {
    setSelectedAgeGroupIds([]);
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!seasonName.trim()) {
      setErrorMsg("Season Name is required.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Start and End dates are required.");
      return;
    }

    startTransition(async () => {
      try {
        await createSeason({
          seasonName,
          startDate,
          endDate,
          status,
          ageGroupIds: selectedAgeGroupIds,
        });
        setIsCreateOpen(false);
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to create season.");
      }
    });
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeason) return;
    setErrorMsg(null);

    if (!seasonName.trim()) {
      setErrorMsg("Season Name is required.");
      return;
    }

    startTransition(async () => {
      try {
        await updateSeason(editingSeason.id, {
          seasonName,
          startDate,
          endDate,
          status,
          ageGroupIds: selectedAgeGroupIds,
        });
        setEditingSeason(null);
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to update season.");
      }
    });
  };

  // Submit Delete
  const handleDeleteConfirm = () => {
    if (!deletingSeason) return;

    startTransition(async () => {
      try {
        await deleteSeason(deletingSeason.id);
        setDeletingSeason(null);
        router.refresh();
      } catch (err: any) {
        alert(err?.message || "Failed to delete season.");
      }
    });
  };

  // Stats calculation
  const totalSeasons = initialSeasons.length;
  const activeSeasons = initialSeasons.filter((s) => s.status === "active").length;
  const upcomingSeasons = initialSeasons.filter((s) => s.status === "upcoming").length;
  const archivedSeasons = initialSeasons.filter(
    (s) => s.status === "completed" || s.status === "archived"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-indigo-400" />
            Seasons & Age Group Lifecycle
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage active, upcoming, and archived seasons along with their associated age group divisions.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Season
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Total Seasons</p>
          <p className="mt-2 text-2xl font-extrabold text-white">{totalSeasons}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Active</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-400">{activeSeasons}</p>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Upcoming</p>
          <p className="mt-2 text-2xl font-extrabold text-blue-400">{upcomingSeasons}</p>
        </div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/50 p-4 backdrop-blur-sm shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Completed / Archived</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-200">{archivedSeasons}</p>
        </div>
      </div>

      {/* Seasons Cards / Table */}
      <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/80 shadow-xl backdrop-blur-md">
        <div className="border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">All Seasons</h2>
          <span className="text-xs text-slate-400">{initialSeasons.length} records</span>
        </div>

        {initialSeasons.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="mx-auto h-12 w-12 opacity-30 mb-3" />
            <p className="text-base font-medium">No seasons created yet.</p>
            <p className="text-xs mt-1">Click "Create Season" to set up your first season.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {initialSeasons.map((season) => (
              <div
                key={season.id}
                className="p-6 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Season Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {season.seasonName}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                        season.status
                      )}`}
                    >
                      {season.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>
                      📅 <strong className="text-slate-300">Dates:</strong> {season.startDate} to {season.endDate}
                    </span>
                  </div>

                  {/* Associated Age Groups Pills */}
                  <div className="pt-2">
                    <p className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <span>Associated Age Groups:</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        ({season.ageGroups?.length || 0})
                      </span>
                    </p>
                    {season.ageGroups && season.ageGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {season.ageGroups.map((ag) => (
                          <span
                            key={ag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-indigo-300 border border-indigo-500/20"
                          >
                            {ag.ageGroupName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No age groups assigned</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {(season.status === "active" || season.status === "upcoming") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenTransition(season)}
                      className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 font-semibold"
                    >
                      <Flag className="mr-1.5 h-3.5 w-3.5" />
                      Complete Season 🏁
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEdit(season)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingSeason(season)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE SEASON MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Season"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5 pt-2">
          {errorMsg && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {inheritedFrom && (
            <div className="rounded-md bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-indigo-300 flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>
                Pre-selected age groups inherited from previous season: <strong>{inheritedFrom}</strong>.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Season Name *
            </label>
            <Input
              type="text"
              value={seasonName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeasonName(e.target.value)}
              placeholder="e.g. Fall 2026 / 2026-2027"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Start Date *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                End Date *
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status *
            </label>
            <Select
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
              options={[
                { value: "upcoming", label: "Upcoming" },
                { value: "active", label: "Active" },
                { value: "completed", label: "Completed" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </div>

          {/* AGE GROUPS CHECKBOX SELECTOR */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Associated Age Groups ({selectedAgeGroupIds.length}/{allAgeGroups.length})
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllAgeGroups}
                  className="text-indigo-400 hover:text-indigo-300 underline text-[11px]"
                >
                  Select All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllAgeGroups}
                  className="text-slate-400 hover:text-slate-300 underline text-[11px]"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/50 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allAgeGroups.map((ag) => {
                const isChecked = selectedAgeGroupIds.includes(ag.id);
                return (
                  <label
                    key={ag.id}
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-200"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleAgeGroup(ag.id)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="font-medium truncate">{ag.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isPending ? "Creating..." : "Save Season"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT SEASON MODAL */}
      <Modal
        isOpen={!!editingSeason}
        onClose={() => setEditingSeason(null)}
        title={`Edit Season: ${editingSeason?.seasonName || ""}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-5 pt-2">
          {errorMsg && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Season Name *
            </label>
            <Input
              type="text"
              value={seasonName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeasonName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Start Date *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                End Date *
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status *
            </label>
            <Select
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
              options={[
                { value: "upcoming", label: "Upcoming" },
                { value: "active", label: "Active" },
                { value: "completed", label: "Completed" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </div>

          {/* AGE GROUPS CHECKBOX SELECTOR FOR EDIT */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Associated Age Groups ({selectedAgeGroupIds.length}/{allAgeGroups.length})
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllAgeGroups}
                  className="text-indigo-400 hover:text-indigo-300 underline text-[11px]"
                >
                  Select All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllAgeGroups}
                  className="text-slate-400 hover:text-slate-300 underline text-[11px]"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/50 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allAgeGroups.map((ag) => {
                const isChecked = selectedAgeGroupIds.includes(ag.id);
                return (
                  <label
                    key={ag.id}
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-200"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleAgeGroup(ag.id)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="font-medium truncate">{ag.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingSeason(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isPending ? "Updating..." : "Update Season"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        isOpen={!!deletingSeason}
        onClose={() => setDeletingSeason(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Season"
        description={`Are you sure you want to delete "${deletingSeason?.seasonName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* SEASON TRANSITION & COMPLETION MODAL */}
      <Modal
        isOpen={!!transitioningSeason}
        onClose={() => {
          setTransitioningSeason(null);
          setTransitionSuccess(null);
        }}
        title={`Complete Season: ${transitioningSeason?.seasonName || ""}`}
      >
        {transitionSuccess ? (
          <div className="space-y-5 pt-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-300 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                <h3 className="text-base font-bold text-white">Season Transition Complete!</h3>
              </div>
              <p className="text-xs leading-relaxed text-emerald-200">{transitionSuccess.msg}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-300">Next Step: Populate New Season Rosters</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use the Player Rollover Tool to bulk migrate players from past season teams into the newly created blank teams.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="secondary"
                onClick={() => {
                  setTransitioningSeason(null);
                  setTransitionSuccess(null);
                }}
              >
                Close
              </Button>
              <a href="/admin/rollover">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Open Player Rollover Tool 🔄
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleTransitionSubmit} className="space-y-5 pt-2">
            {errorMsg && (
              <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 space-y-1.5">
              <p className="font-bold flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Completing Season "{transitioningSeason?.seasonName}"
              </p>
              <p className="text-slate-300 leading-relaxed">
                Completing this season will update its status, archive active rosters, and optionally set up new blank team records for the upcoming season.
              </p>
            </div>

            {/* Target Upcoming Season Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Activate Upcoming Season
              </label>
              <Select
                value={upcomingTargetSeasonId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUpcomingTargetSeasonId(e.target.value)}
                options={initialSeasons
                  .filter((s) => s.id !== transitioningSeason?.id)
                  .map((s) => ({
                    value: String(s.id),
                    label: `${s.seasonName} (${s.status.toUpperCase()})`,
                  }))}
                placeholder="Choose upcoming season to activate..."
                showPlaceholder={true}
              />
            </div>

            {/* Transition Options */}
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Automated Actions
              </h4>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/50 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={archiveTeamsOption}
                  onChange={(e) => setArchiveTeamsOption(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5"
                />
                <div>
                  <p className="text-xs font-semibold text-white">
                    Archive Team Seasons ({transitioningSeason?.seasonName})
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Marks current team seasons as inactive (`is_active = false`) while keeping all rosters, games, and career stats intact.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/50 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={createNewTeamsOption}
                  onChange={(e) => setCreateNewTeamsOption(e.target.checked)}
                  disabled={!upcomingTargetSeasonId}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 disabled:opacity-50"
                />
                <div>
                  <p className="text-xs font-semibold text-white">
                    Create Blank Teams for Target Season
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Generates new blank `team_seasons` for the target active season based on the age groups associated with the completed season.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setTransitioningSeason(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                {isPending ? "Transitioning..." : "Complete Season & Setup Teams 🚀"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
