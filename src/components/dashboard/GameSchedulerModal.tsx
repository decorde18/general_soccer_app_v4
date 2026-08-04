"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, X } from "lucide-react";
import { createGame, checkVenueConflict, getVenueOptions, getSchedulerOptions } from "@/lib/actions/game-actions";

interface TeamOption {
  teamSeasonId: number;
  displayName: string;
}

interface SeasonOption {
  id: number;
  name: string;
}

interface GameSchedulerModalProps {
  seasons?: SeasonOption[];
  teams?: TeamOption[];
  defaultHomeTeamSeasonId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GameSchedulerModal({
  seasons: propsSeasons,
  teams: propsTeams,
  defaultHomeTeamSeasonId,
  onClose,
  onSuccess,
}: GameSchedulerModalProps) {
  const [seasons, setSeasons] = useState<SeasonOption[]>(propsSeasons || []);
  const [teams, setTeams] = useState<TeamOption[]>(propsTeams || []);

  const [seasonId, setSeasonId] = useState<number>(defaultHomeTeamSeasonId || 1);
  const [homeTeamSeasonId, setHomeTeamSeasonId] = useState<number>(defaultHomeTeamSeasonId || 0);
  const [awayTeamSeasonId, setAwayTeamSeasonId] = useState<number>(0);

  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState<string>("10:00");
  const [venues, setVenues] = useState<Array<{ id: number; name: string; sublocations: Array<{ id: number; name: string }> }>>([]);
  const [locationId, setLocationId] = useState<number | "">("");
  const [sublocationId, setSublocationId] = useState<number | "">("");
  const [gameType, setGameType] = useState<"league" | "tournament" | "friendly" | "playoff">("league");

  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [requiresOverride, setRequiresOverride] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Load scheduler options if props not passed
  useEffect(() => {
    getVenueOptions().then(setVenues);

    if (!propsSeasons || !propsTeams) {
      getSchedulerOptions().then((opts) => {
        if (!propsSeasons) {
          setSeasons(opts.seasons);
          if (opts.seasons.length > 0) setSeasonId(opts.seasons[0].id);
        }
        if (!propsTeams) {
          setTeams(opts.teams);
          if (opts.teams.length > 0) {
            const hId = defaultHomeTeamSeasonId || opts.teams[0].teamSeasonId;
            setHomeTeamSeasonId(hId);
            const aOpt = opts.teams.find((t) => t.teamSeasonId !== hId) || opts.teams[0];
            setAwayTeamSeasonId(aOpt.teamSeasonId);
          }
        }
      });
    } else {
      if (propsSeasons.length > 0) setSeasonId(propsSeasons[0].id);
      if (propsTeams.length > 0) {
        const hId = defaultHomeTeamSeasonId || propsTeams[0].teamSeasonId;
        setHomeTeamSeasonId(hId);
        const aOpt = propsTeams.find((t) => t.teamSeasonId !== hId) || propsTeams[0];
        setAwayTeamSeasonId(aOpt.teamSeasonId);
      }
    }
  }, [propsSeasons, propsTeams, defaultHomeTeamSeasonId]);

  const selectedVenue = venues.find((v) => v.id === Number(locationId));

  // Perform dynamic venue double-booking check when location/sublocation/date/time changes
  useEffect(() => {
    if (startDate && (locationId || sublocationId)) {
      checkVenueConflict({
        startDate,
        startTime,
        locationId: locationId ? Number(locationId) : null,
        sublocationId: sublocationId ? Number(sublocationId) : null,
      }).then((res) => {
        if (res.hasConflict && res.message) {
          setWarningMsg(res.message);
          setRequiresOverride(true);
        } else {
          setWarningMsg(null);
          setRequiresOverride(false);
        }
      });
    } else {
      setWarningMsg(null);
      setRequiresOverride(false);
    }
  }, [startDate, startTime, locationId, sublocationId]);

  const handleSubmit = (override = false) => {
    if (homeTeamSeasonId === awayTeamSeasonId) {
      setErrorMsg("Home and Away teams must be different.");
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await createGame({
          seasonId: Number(seasonId),
          homeTeamSeasonId: Number(homeTeamSeasonId),
          awayTeamSeasonId: Number(awayTeamSeasonId),
          startDate,
          startTime,
          locationId: locationId ? Number(locationId) : null,
          sublocationId: sublocationId ? Number(sublocationId) : null,
          gameType,
          allowConflictOverride: override,
        });

        if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else if (res.requiresOverride && res.warning) {
          setWarningMsg(res.warning);
          setRequiresOverride(true);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to schedule match.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted hover:text-text rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-primary">
          <Calendar size={20} />
          <h3 className="font-extrabold text-base text-text">Schedule New Match</h3>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
            {errorMsg}
          </div>
        )}

        {warningMsg && (
          <div className="p-3 text-xs bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle size={16} />
              <span>Venue Conflict Warning</span>
            </div>
            <p className="text-[11px] leading-relaxed">{warningMsg}</p>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Season */}
            <div>
              <label className="text-xs font-bold text-muted uppercase">Season</label>
              <select
                value={seasonId}
                onChange={(e) => setSeasonId(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Game Type */}
            <div>
              <label className="text-xs font-bold text-muted uppercase">Match Type</label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text capitalize"
              >
                <option value="league">League</option>
                <option value="tournament">Tournament</option>
                <option value="friendly">Friendly</option>
                <option value="playoff">Playoff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Home Team */}
            <div>
              <label className="text-xs font-bold text-muted uppercase">Home Team</label>
              <select
                value={homeTeamSeasonId}
                onChange={(e) => setHomeTeamSeasonId(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
              >
                {teams.map((t) => (
                  <option key={t.teamSeasonId} value={t.teamSeasonId}>{t.displayName}</option>
                ))}
              </select>
            </div>

            {/* Away Team */}
            <div>
              <label className="text-xs font-bold text-muted uppercase">Away Team</label>
              <select
                value={awayTeamSeasonId}
                onChange={(e) => setAwayTeamSeasonId(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
              >
                {teams.map((t) => (
                  <option key={t.teamSeasonId} value={t.teamSeasonId}>{t.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-muted uppercase flex items-center gap-1">
                <Calendar size={12} /> Match Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-xs font-bold text-muted uppercase flex items-center gap-1">
                <Clock size={12} /> Kickoff Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Location Complex */}
            <div>
              <label className="text-xs font-bold text-muted uppercase flex items-center gap-1">
                <MapPin size={12} /> Venue Complex
              </label>
              <select
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value ? Number(e.target.value) : "");
                  setSublocationId("");
                }}
                className="w-full mt-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
              >
                <option value="">Select Location (Optional)</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Sublocation / Field */}
            <div>
              <label className="text-xs font-bold text-muted uppercase">Specific Field</label>
              <select
                value={sublocationId}
                disabled={!selectedVenue || selectedVenue.sublocations.length === 0}
                onChange={(e) => setSublocationId(e.target.value ? Number(e.target.value) : "")}
                className="w-full mt-1 px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text disabled:opacity-50"
              >
                <option value="">Select Field (Optional)</option>
                {selectedVenue?.sublocations.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-muted hover:text-text rounded-xl"
            >
              Cancel
            </button>

            {requiresOverride ? (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm"
              >
                <AlertTriangle size={14} />
                <span>Override Warning & Schedule</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl shadow-sm"
              >
                <CheckCircle size={15} />
                <span>{isPending ? "Scheduling..." : "Schedule Match"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
