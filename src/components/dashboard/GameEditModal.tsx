"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, Calendar, Clock, MapPin, Edit3, Trash2, Ban, CheckCircle, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { updateGame, cancelGame, deleteGame, getVenueOptions } from "@/lib/actions/game-actions";
import { toast } from "sonner";

interface VenueOption {
  id: number;
  name: string;
  sublocations: { id: number; name: string }[];
}

interface GameEditModalProps {
  game: {
    id: number;
    homeTeamName: string;
    homeClubName: string;
    awayTeamName: string;
    awayClubName: string;
    startDate: string;
    startTime: string | null;
    gameType: string;
    status: string;
    locationId?: number | null;
    locationName: string | null;
    sublocationId?: number | null;
    sublocationName?: string | null;
    homeScore: number | null;
    awayScore: number | null;
    settings?: {
      playersOnField?: number;
      periodDuration?: number;
    };
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GameEditModal({ game, onClose, onSuccess }: GameEditModalProps) {
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState(game.startDate.slice(0, 10));
  const [startTime, setStartTime] = useState(game.startTime ? game.startTime.slice(11, 16) : "");
  const [gameType, setGameType] = useState<"league" | "tournament" | "friendly" | "playoff">(
    (game.gameType as any) || "league"
  );
  const [status, setStatus] = useState(game.status || "scheduled");
  const [homeScore, setHomeScore] = useState<string>(game.homeScore !== null ? String(game.homeScore) : "");
  const [awayScore, setAwayScore] = useState<string>(game.awayScore !== null ? String(game.awayScore) : "");
  
  const [playersOnField, setPlayersOnField] = useState<number>(
    game.settings?.playersOnField || 11
  );
  const [periodDurationMins, setPeriodDurationMins] = useState<number | string>(
    game.settings?.periodDuration ? Math.round(game.settings.periodDuration / 60) : 35
  );

  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(game.locationId || undefined);
  const [selectedSublocationId, setSelectedSublocationId] = useState<number | undefined>(game.sublocationId || undefined);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getVenueOptions().then((data) => {
      setVenues(data);
      let locId = game.locationId;
      if (!locId && game.locationName) {
        const matched = data.find((v) => v.name.toLowerCase() === game.locationName?.toLowerCase());
        if (matched) locId = matched.id;
      }
      if (locId) setSelectedLocationId(locId);
      if (game.sublocationId) setSelectedSublocationId(game.sublocationId);
    });
  }, [game]);

  const activeVenue = venues.find((v) => v.id === selectedLocationId);

  const handleSave = () => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const durationNum = typeof periodDurationMins === "number" 
          ? periodDurationMins 
          : (parseInt(periodDurationMins) || 35);

        await updateGame(game.id, {
          startDate,
          startTime: startTime || null,
          gameType,
          status,
          locationId: selectedLocationId || null,
          sublocationId: selectedSublocationId || null,
          periodDuration: durationNum * 60,
          notes: JSON.stringify({ playersOnField: Number(playersOnField) }),
        });

        toast.success("Game updated successfully!");
        if (onSuccess) onSuccess();
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to update game");
      }
    });
  };

  const handleCancelMatch = () => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await cancelGame(game.id);
        toast.success("Match status updated to Cancelled!");
        if (onSuccess) onSuccess();
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to cancel game");
      }
    });
  };

  const handleDeleteMatch = () => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await deleteGame(game.id);
        toast.success("Game fixture deleted permanently!");
        if (onSuccess) onSuccess();
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to delete game");
      }
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit Game #${game.id}`}>
      <div className="space-y-6">
        
        {/* Match Title Banner */}
        <div className="bg-surface/80 border border-border/80 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Match Fixture</span>
            <h3 className="text-base font-extrabold text-text">
              {game.homeClubName} {game.homeTeamName} <span className="text-muted font-normal">vs</span> {game.awayClubName} {game.awayTeamName}
            </h3>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-primary/10 text-primary border border-primary/20">
            {status}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-xs font-medium rounded-xl flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Delete Confirmation View */}
        {confirmDelete ? (
          <div className="bg-danger/5 border border-danger/30 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 text-danger font-bold text-sm">
              <Trash2 size={20} />
              <span>Delete Game Fixture?</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to permanently delete this game? This will also remove any assigned lineups, events, and officials recorded for this game.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" isLoading={isPending} onClick={handleDeleteMatch}>
                Yes, Delete Game
              </Button>
            </div>
          </div>
        ) : confirmCancel ? (
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 font-bold text-sm">
              <Ban size={20} />
              <span>Cancel Match Fixture?</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to mark this match as <strong>Cancelled</strong>? It will remain in season logs marked as Cancelled.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmCancel(false)}>
                Go Back
              </Button>
              <Button variant="primary" size="sm" isLoading={isPending} onClick={handleCancelMatch}>
                Yes, Mark Cancelled
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  <span>Date</span>
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                />
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" />
                  <span>Kickoff Time</span>
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                />
              </div>

              {/* Game Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text">Match Type</label>
                <Select
                  value={gameType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGameType(e.target.value as any)}
                  options={[
                    { value: "league", label: "League Play" },
                    { value: "tournament", label: "Tournament Play" },
                    { value: "friendly", label: "Friendly / Exhibition" },
                    { value: "playoff", label: "Playoff / Cup Match" },
                  ]}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text">Status</label>
                <Select
                  value={status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
                  options={[
                    { value: "scheduled", label: "Scheduled" },
                    { value: "in_progress", label: "In Progress (Live)" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                />
              </div>

              {/* Match Format (Players on Field) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text">Match Format</label>
                <Select
                  value={String(playersOnField)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlayersOnField(Number(e.target.value))}
                  options={[
                    { value: "11", label: "11v11 (Full Field)" },
                    { value: "9", label: "9v9 (Intermediate)" },
                    { value: "8", label: "8v8" },
                    { value: "7", label: "7v7 (Small Sided)" },
                    { value: "5", label: "5v5 (Futsal / Indoor)" },
                  ]}
                />
              </div>

              {/* Time per Half (Minutes) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text">Time Per Half (Mins)</label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {[25, 30, 35, 40, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setPeriodDurationMins(mins)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                        Number(periodDurationMins) === mins
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border text-muted hover:text-text"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={5}
                  max={90}
                  value={periodDurationMins}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodDurationMins(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(String(periodDurationMins));
                    if (isNaN(parsed) || parsed < 5) setPeriodDurationMins(35);
                  }}
                  placeholder="e.g. 35"
                />
              </div>

              {/* Venue Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" />
                  <span>Venue Complex</span>
                </label>
                <Select
                  value={selectedLocationId || ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const val = Number(e.target.value);
                    setSelectedLocationId(val || undefined);
                    setSelectedSublocationId(undefined);
                  }}
                  options={[
                    { value: "", label: "(No Venue Selected)" },
                    ...venues.map((v) => ({ value: v.id, label: v.name })),
                  ]}
                />
              </div>

              {/* Field Sublocation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text">Field / Sublocation</label>
                <Select
                  value={selectedSublocationId || ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSublocationId(Number(e.target.value) || undefined)}
                  disabled={!activeVenue || activeVenue.sublocations.length === 0}
                  options={[
                    { value: "", label: "(Main / Any Field)" },
                    ...(activeVenue?.sublocations.map((sub) => ({ value: sub.id, label: sub.name })) || []),
                  ]}
                />
              </div>

            </div>

            {/* Action Bar Footer */}
            <div className="border-t border-border pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 size={14} />
                  <span>Delete Game</span>
                </Button>
                
                {status !== "cancelled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmCancel(true)}
                    className="w-full sm:w-auto text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <Ban size={14} />
                    <span>Cancel Match</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
                <Button variant="primary" size="sm" isLoading={isPending} onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </>
        )}

      </div>
    </Modal>
  );
}
