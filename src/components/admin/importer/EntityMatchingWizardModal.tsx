"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, Building2, Shield, MapPin, Layers, Search, Sparkles, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { lookupEntityDetails, EntityLookupResult } from "@/lib/actions/entityLookup-actions";
import { formatGenderDisplay } from "@/lib/utils/gender";

export interface UnmatchedItem {
  id: string;
  type: "club" | "team" | "location" | "sublocation";
  rawName: string;
  parentContext?: string;
}

export interface UnmatchedTeamItem {
  teamName: string;
  clubName: string;
}

export interface ResolvedMapping {
  rawName: string;
  matchedId: number | null;
  createNew: boolean;
  type: "club" | "team" | "location" | "sublocation";
}

interface EntityMatchingWizardModalProps {
  isOpen: boolean;
  unmatchedClubs: string[];
  unmatchedTeams: (string | UnmatchedTeamItem)[];
  unmatchedLocations: string[];
  unmatchedFields: string[];
  existingClubs: { id: number; name: string; abbreviation?: string }[];
  existingTeams: { id: number; name: string; clubName: string; clubId?: number }[];
  existingLocations: { id: number; name: string }[];
  existingSublocations: { id: number; name: string; locationName?: string }[];
  onComplete: (resolvedMappings: Record<string, { matchedId: number | null; createNew: boolean }>) => void;
  onCancel: () => void;
}

function getTeamItemInfo(item: string | UnmatchedTeamItem): { teamName: string; clubName: string } {
  if (typeof item === "string") return { teamName: item, clubName: "" };
  return item;
}

export default function EntityMatchingWizardModal({
  isOpen,
  unmatchedClubs,
  unmatchedTeams,
  unmatchedLocations,
  unmatchedFields,
  existingClubs,
  existingTeams,
  existingLocations,
  existingSublocations,
  onComplete,
  onCancel,
}: EntityMatchingWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Mappings state: rawName -> { matchedId: number | null, createNew: boolean }
  const [mappings, setMappings] = useState<Record<string, { matchedId: number | null; createNew: boolean }>>({});

  // Web/AI Lookup States
  const [lookupResults, setLookupResults] = useState<Record<string, EntityLookupResult>>({});
  const [loadingLookups, setLoadingLookups] = useState<Record<string, boolean>>({});

  // Auto-match candidates on open
  useEffect(() => {
    if (!isOpen) return;

    const initialMappings: Record<string, { matchedId: number | null; createNew: boolean }> = { ...mappings };

    // Auto-match Clubs
    unmatchedClubs.forEach((club) => {
      if (initialMappings[club]) return;
      const cLower = club.toLowerCase().trim();
      const match = existingClubs.find(
        (c) => cLower.includes(c.name.toLowerCase().trim()) || c.name.toLowerCase().trim().includes(cLower)
      );
      if (match) {
        initialMappings[club] = { matchedId: match.id, createNew: false };
      }
    });

    // Auto-match Teams strictly against the picked/resolved club context
    unmatchedTeams.forEach((item) => {
      const { teamName, clubName: rawClubName } = getTeamItemInfo(item);
      if (initialMappings[teamName]) return;

      const clubMapping = rawClubName ? initialMappings[rawClubName] : undefined;
      let matchedClubId: number | null = null;
      let matchedClubName = "";
      let isNewClub = false;

      if (clubMapping) {
        if (clubMapping.createNew) {
          isNewClub = true;
        } else if (clubMapping.matchedId) {
          matchedClubId = clubMapping.matchedId;
          const found = existingClubs.find((c) => c.id === clubMapping.matchedId);
          if (found) matchedClubName = found.name;
        }
      } else if (rawClubName) {
        const cLower = rawClubName.toLowerCase().trim();
        const found = existingClubs.find(
          (c) => c.name.toLowerCase().trim() === cLower || (c.abbreviation && c.abbreviation.toLowerCase().trim() === cLower)
        );
        if (found) {
          matchedClubId = found.id;
          matchedClubName = found.name;
        }
      }

      if (isNewClub) {
        // New club -> New team
        initialMappings[teamName] = { matchedId: null, createNew: true };
      } else if (matchedClubName || matchedClubId) {
        // Filter candidate teams ONLY to existing teams belonging to this club
        const clubTeams = existingTeams.filter(
          (t) =>
            (matchedClubId && (t as any).clubId === matchedClubId) ||
            (matchedClubName && t.clubName.toLowerCase().trim() === matchedClubName.toLowerCase().trim())
        );

        const tLower = teamName.toLowerCase().trim();
        const match = clubTeams.find((t) => {
          const full = `${t.clubName} ${t.name}`.toLowerCase().trim();
          const simple = t.name.toLowerCase().trim();
          return tLower === full || tLower === simple || tLower.includes(simple) || simple.includes(tLower);
        });

        if (match) {
          initialMappings[teamName] = { matchedId: match.id, createNew: false };
        } else {
          initialMappings[teamName] = { matchedId: null, createNew: true };
        }
      } else {
        // Global fallback if no club context at all
        const tLower = teamName.toLowerCase().trim();
        const match = existingTeams.find((t) => {
          const full = `${t.clubName} ${t.name}`.toLowerCase().trim();
          const simple = t.name.toLowerCase().trim();
          return tLower === full || tLower === simple || tLower.includes(simple) || simple.includes(tLower);
        });
        if (match) {
          initialMappings[teamName] = { matchedId: match.id, createNew: false };
        }
      }
    });

    // Auto-match Locations
    unmatchedLocations.forEach((loc) => {
      if (initialMappings[loc]) return;
      const lLower = loc.toLowerCase().trim();
      const match = existingLocations.find(
        (l) => lLower.includes(l.name.toLowerCase().trim()) || l.name.toLowerCase().trim().includes(lLower)
      );
      if (match) {
        initialMappings[loc] = { matchedId: match.id, createNew: false };
      }
    });

    setMappings(initialMappings);
  }, [isOpen, unmatchedClubs, unmatchedTeams, unmatchedLocations, existingClubs, existingTeams, existingLocations]);

  if (!isOpen) return null;

  const totalSteps = 4;

  const setMapping = (rawName: string, matchedId: number | null, createNew: boolean) => {
    setMappings((prev) => ({
      ...prev,
      [rawName]: { matchedId, createNew },
    }));
  };

  const handleWebLookup = async (rawName: string, entityType: "club" | "team" | "location" | "sublocation") => {
    setLoadingLookups((prev) => ({ ...prev, [rawName]: true }));
    try {
      const res = await lookupEntityDetails(rawName, entityType);
      setLookupResults((prev) => ({ ...prev, [rawName]: res }));
      if (res.candidateDbMatchId) {
        setMapping(rawName, res.candidateDbMatchId, false);
      }
    } catch (err) {
      console.error("Web lookup failed for", rawName, err);
    } finally {
      setLoadingLookups((prev) => ({ ...prev, [rawName]: false }));
    }
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
    } else {
      onComplete(mappings);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl space-y-0">
        {/* HEADER */}
        <div className="border-b border-slate-800 bg-slate-950 p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                Step {currentStep} of {totalSteps} — Schedule Import Matcher
              </span>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                {currentStep === 1 && <Building2 className="h-5 w-5 text-indigo-400" />}
                {currentStep === 2 && <Shield className="h-5 w-5 text-indigo-400" />}
                {currentStep === 3 && <MapPin className="h-5 w-5 text-indigo-400" />}
                {currentStep === 4 && <Layers className="h-5 w-5 text-indigo-400" />}
                {currentStep === 1 && "Match Unrecognized Clubs"}
                {currentStep === 2 && "Match Unrecognized Teams"}
                {currentStep === 3 && "Match Unrecognized Locations"}
                {currentStep === 4 && "Match Unrecognized Fields & Complexes"}
              </h2>
            </div>

            {/* STEP PROGRESS BADGES */}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-2.5 w-6 rounded-full transition-all ${
                    step === currentStep
                      ? "bg-indigo-500 w-8"
                      : step < currentStep
                      ? "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* STEP BODY */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          {/* STEP 1: CLUBS */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Review incoming schedule clubs that do not exactly match existing database records. Match them to a candidate club or select <strong className="text-indigo-300">Create New Club</strong>.
              </p>

              {unmatchedClubs.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>All imported club names automatically match existing database clubs!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {unmatchedClubs.map((club) => {
                    const currentVal = mappings[club];
                    const selectedId = currentVal?.createNew ? "new" : currentVal?.matchedId || "";
                    const lookup = lookupResults[club];
                    const isLoading = loadingLookups[club];

                    return (
                      <div key={club} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="font-semibold text-xs text-white flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span>"{club}"</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleWebLookup(club, "club")}
                              disabled={isLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                              )}
                              <span>Web Lookup</span>
                            </button>

                            <select
                              value={selectedId}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "new") setMapping(club, null, true);
                                else if (v) setMapping(club, Number(v), false);
                                else setMapping(club, null, false);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="">-- Select Existing Club --</option>
                              {existingClubs.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                              <option value="new">+ Create New Club "{club}"</option>
                            </select>
                          </div>
                        </div>

                        {lookup && (
                          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-indigo-300">
                              <Sparkles className="h-3 w-3 text-indigo-400" />
                              Suggested Match: {lookup.suggestedName}
                              {lookup.abbreviation && <span className="text-slate-400">({lookup.abbreviation})</span>}
                            </div>
                            {lookup.candidateDbMatchName && (
                              <div className="text-[10px] text-emerald-400 font-semibold">
                                ✓ Found DB Match: {lookup.candidateDbMatchName}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: TEAMS */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Review incoming schedule teams that do not match existing team seasons in your database.
              </p>

              {unmatchedTeams.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>All imported team names automatically match existing database teams!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {unmatchedTeams.map((item, idx) => {
                    const { teamName, clubName: rawClubName } = getTeamItemInfo(item);
                    const currentVal = mappings[teamName];
                    const selectedId = currentVal?.createNew ? "new" : currentVal?.matchedId || "";
                    const lookup = lookupResults[teamName];
                    const isLoading = loadingLookups[teamName];

                    // Resolve selected/matched club from Step 1 or DB
                    const clubMapping = rawClubName ? mappings[rawClubName] : undefined;
                    let targetClubName = "";
                    let targetClubId: number | null = null;
                    let isNewClub = false;

                    if (clubMapping) {
                      if (clubMapping.createNew) {
                        isNewClub = true;
                      } else if (clubMapping.matchedId) {
                        targetClubId = clubMapping.matchedId;
                        const foundClub = existingClubs.find((c) => c.id === clubMapping.matchedId);
                        if (foundClub) targetClubName = foundClub.name;
                      }
                    } else if (rawClubName) {
                      const cLower = rawClubName.toLowerCase().trim();
                      const foundClub = existingClubs.find(
                        (c) => c.name.toLowerCase().trim() === cLower || (c.abbreviation && c.abbreviation.toLowerCase().trim() === cLower)
                      );
                      if (foundClub) {
                        targetClubId = foundClub.id;
                        targetClubName = foundClub.name;
                      }
                    }

                    // Filter available teams to ONLY those belonging to the picked club
                    const availableClubTeams = isNewClub
                      ? []
                      : targetClubId || targetClubName
                      ? existingTeams.filter((t) => {
                          if (targetClubId && (t as any).clubId === targetClubId) return true;
                          if (targetClubName && t.clubName.toLowerCase().trim() === targetClubName.toLowerCase().trim()) return true;
                          return false;
                        })
                      : existingTeams;

                    const itemKey = typeof item === "string" ? item : `${item.clubName}-${item.teamName}-${idx}`;

                    return (
                      <div key={itemKey} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="font-semibold text-xs text-white flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-indigo-400" />
                              <span>"{teamName}"</span>
                            </div>
                            {rawClubName && (
                              <span className="text-[10px] font-normal text-slate-400 pl-6">
                                Club:{" "}
                                <strong className="text-amber-300 font-semibold">
                                  {isNewClub ? `${rawClubName} (New Club)` : targetClubName || rawClubName}
                                </strong>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleWebLookup(teamName, "team")}
                              disabled={isLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                              )}
                              <span>Web Lookup</span>
                            </button>

                            <select
                              value={selectedId}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "new") setMapping(teamName, null, true);
                                else if (v) setMapping(teamName, Number(v), false);
                                else setMapping(teamName, null, false);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                              {isNewClub ? (
                                <option value="new">+ Create New Team "{teamName}" (New Club)</option>
                              ) : (
                                <>
                                  <option value="">
                                    {availableClubTeams.length > 0
                                      ? `-- Select Existing Team (${targetClubName || rawClubName}) --`
                                      : `-- No Existing Teams in ${targetClubName || rawClubName || "Club"} --`}
                                  </option>
                                  {availableClubTeams.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.clubName} - {t.name}
                                    </option>
                                  ))}
                                  <option value="new">+ Create New Team "{teamName}"</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        {lookup && (
                          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-indigo-300">
                              <Sparkles className="h-3 w-3 text-indigo-400" />
                              Suggested: {lookup.suggestedName}
                              {lookup.gender && <span className="text-emerald-400">({formatGenderDisplay(lookup.gender)})</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: LOCATIONS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Match incoming venue and complex locations to existing database locations.
              </p>

              {unmatchedLocations.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>All locations match existing database records!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {unmatchedLocations.map((loc) => {
                    const currentVal = mappings[loc];
                    const selectedId = currentVal?.createNew ? "new" : currentVal?.matchedId || "";
                    const lookup = lookupResults[loc];
                    const isLoading = loadingLookups[loc];

                    return (
                      <div key={loc} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="font-semibold text-xs text-white flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>"{loc}"</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleWebLookup(loc, "location")}
                              disabled={isLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                              )}
                              <span>Web Lookup</span>
                            </button>

                            <select
                              value={selectedId}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "new") setMapping(loc, null, true);
                                else if (v) setMapping(loc, Number(v), false);
                                else setMapping(loc, null, false);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="">-- Select Existing Location --</option>
                              {existingLocations.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name}
                                </option>
                              ))}
                              <option value="new">+ Create New Location "{loc}"</option>
                            </select>
                          </div>
                        </div>

                        {lookup && (
                          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-indigo-300">
                              <Sparkles className="h-3 w-3 text-indigo-400" />
                              Suggested Venue: {lookup.suggestedName}
                              {lookup.addressLine1 && <span className="text-slate-300">({lookup.addressLine1})</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: FIELDS / SUBLOCATIONS */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Match pitch and field designations (e.g. Field #1, Field #2) to sublocations.
              </p>

              {unmatchedFields.length === 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>All field/pitch names match existing sublocations!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {unmatchedFields.map((field) => {
                    const currentVal = mappings[field];
                    const selectedId = currentVal?.createNew ? "new" : currentVal?.matchedId || "";
                    const lookup = lookupResults[field];
                    const isLoading = loadingLookups[field];

                    return (
                      <div key={field} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="font-semibold text-xs text-white flex items-center gap-2">
                            <Layers className="h-4 w-4 text-slate-400" />
                            <span>"{field}"</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleWebLookup(field, "sublocation")}
                              disabled={isLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                              )}
                              <span>Web Lookup</span>
                            </button>

                            <select
                              value={selectedId}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "new") setMapping(field, null, true);
                                else if (v) setMapping(field, Number(v), false);
                                else setMapping(field, null, false);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="">-- Select Existing Field --</option>
                              {existingSublocations.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.locationName ? `${s.locationName} - ` : ""}{s.name}
                                </option>
                              ))}
                              <option value="new">+ Create New Field "{field}"</option>
                            </select>
                          </div>
                        </div>

                        {lookup && (
                          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-indigo-300">
                              <Sparkles className="h-3 w-3 text-indigo-400" />
                              Suggested Field Name: {lookup.suggestedName}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 p-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button variant="secondary" size="sm" onClick={handlePrevStep}>
                Back
              </Button>
            )}

            <Button variant="primary" size="sm" onClick={handleNextStep}>
              {currentStep < 4 ? "Next Step" : "Complete & Run Import"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
