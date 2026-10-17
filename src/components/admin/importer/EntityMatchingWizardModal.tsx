"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, Building2, Shield, MapPin, Layers, Search, Sparkles, Loader2, PlusCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { lookupEntityDetails, EntityLookupResult } from "@/lib/actions/entityLookup-actions";
import { createInlineClub } from "@/lib/actions/inlineEntity-actions";
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
  clubId?: number | null;
  clubName?: string;
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
  onComplete: (resolvedMappings: Record<string, { matchedId: number | null; createNew: boolean; clubId?: number | null; clubName?: string }>) => void;
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

  // Mappings state: rawName -> { matchedId: number | null, createNew: boolean, clubId?: number | null, clubName?: string }
  const [mappings, setMappings] = useState<Record<string, { matchedId: number | null; createNew: boolean; clubId?: number | null; clubName?: string }>>({});

  // Dynamic clubs list (augmented with clubs created on-the-fly during Step 1)
  const [clubsList, setClubsList] = useState<{ id: number; name: string; abbreviation?: string }[]>(existingClubs);
  const [clubNamesToCreate, setClubNamesToCreate] = useState<Record<string, string>>({});
  const [isProcessingClubs, setIsProcessingClubs] = useState(false);
  const [clubCreationError, setClubCreationError] = useState<string | null>(null);

  // Sync external clubs changes
  useEffect(() => {
    setClubsList(existingClubs);
  }, [existingClubs]);

  // Web/AI Lookup States
  const [lookupResults, setLookupResults] = useState<Record<string, EntityLookupResult>>({});
  const [loadingLookups, setLoadingLookups] = useState<Record<string, boolean>>({});

  // Auto-match candidates on open
  useEffect(() => {
    if (!isOpen) return;

    const initialMappings: Record<string, { matchedId: number | null; createNew: boolean; clubId?: number | null; clubName?: string }> = { ...mappings };

    // Auto-match Clubs: If match found, link to match; otherwise DEFAULT TO CREATE NEW CLUB!
    unmatchedClubs.forEach((club) => {
      if (initialMappings[club]) return;
      const cLower = club.toLowerCase().trim();
      const match = clubsList.find(
        (c) => cLower.includes(c.name.toLowerCase().trim()) || c.name.toLowerCase().trim().includes(cLower)
      );
      if (match) {
        initialMappings[club] = { matchedId: match.id, createNew: false };
      } else {
        // Defaults to create new club so clubs are never left unresolved or blank
        initialMappings[club] = { matchedId: null, createNew: true };
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
          matchedClubName = rawClubName;
        } else if (clubMapping.matchedId) {
          matchedClubId = clubMapping.matchedId;
          const found = clubsList.find((c) => c.id === clubMapping.matchedId);
          if (found) matchedClubName = found.name;
        }
      } else if (rawClubName) {
        const cLower = rawClubName.toLowerCase().trim();
        const found = clubsList.find(
          (c) => c.name.toLowerCase().trim() === cLower || (c.abbreviation && c.abbreviation.toLowerCase().trim() === cLower)
        );
        if (found) {
          matchedClubId = found.id;
          matchedClubName = found.name;
        } else {
          matchedClubName = rawClubName;
        }
      }

      if (isNewClub) {
        // New club -> New team tied to this club
        initialMappings[teamName] = { matchedId: null, createNew: true, clubId: null, clubName: rawClubName };
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
          initialMappings[teamName] = { matchedId: match.id, createNew: false, clubId: matchedClubId, clubName: matchedClubName };
        } else {
          initialMappings[teamName] = { matchedId: null, createNew: true, clubId: matchedClubId, clubName: matchedClubName };
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
        } else {
          initialMappings[teamName] = { matchedId: null, createNew: true, clubName: rawClubName };
        }
      }
    });

    // Auto-match Locations: Default to create new if no match found
    unmatchedLocations.forEach((loc) => {
      if (initialMappings[loc]) return;
      const lLower = loc.toLowerCase().trim();
      const match = existingLocations.find(
        (l) => lLower.includes(l.name.toLowerCase().trim()) || l.name.toLowerCase().trim().includes(lLower)
      );
      if (match) {
        initialMappings[loc] = { matchedId: match.id, createNew: false };
      } else {
        initialMappings[loc] = { matchedId: null, createNew: true };
      }
    });

    // Auto-match Fields: Default to create new if no match found
    unmatchedFields.forEach((field) => {
      if (initialMappings[field]) return;
      const fLower = field.toLowerCase().trim();
      const match = existingSublocations.find(
        (s) => fLower.includes(s.name.toLowerCase().trim()) || s.name.toLowerCase().trim().includes(fLower)
      );
      if (match) {
        initialMappings[field] = { matchedId: match.id, createNew: false };
      } else {
        initialMappings[field] = { matchedId: null, createNew: true };
      }
    });

    setMappings(initialMappings);
  }, [isOpen, unmatchedClubs, unmatchedTeams, unmatchedLocations, unmatchedFields, clubsList, existingTeams, existingLocations, existingSublocations]);

  if (!isOpen) return null;

  const totalSteps = 4;

  const setMapping = (
    rawName: string,
    matchedId: number | null,
    createNew: boolean,
    clubId?: number | null,
    clubName?: string
  ) => {
    setMappings((prev) => ({
      ...prev,
      [rawName]: { matchedId, createNew, clubId, clubName },
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

  const handleNextStep = async () => {
    setClubCreationError(null);

    // STEP 1 TRANSITION: Immediately create clubs in DB so Step 2 teams can be linked to them!
    if (currentStep === 1) {
      const clubsToCreate = unmatchedClubs.filter(
        (c) => mappings[c]?.createNew && !mappings[c]?.matchedId
      );

      if (clubsToCreate.length > 0) {
        setIsProcessingClubs(true);
        try {
          const updatedClubs = [...clubsList];
          const updatedMappings = { ...mappings };

          for (const rawClubName of clubsToCreate) {
            const finalName = (clubNamesToCreate[rawClubName] || rawClubName).trim();
            const res = await createInlineClub({ name: finalName });
            if (res.success && res.club) {
              const newClubObj = {
                id: res.club.id,
                name: res.club.name,
                abbreviation: res.club.abbreviation || undefined,
              };
              updatedClubs.push(newClubObj);
              // Store matched club ID for this club
              updatedMappings[rawClubName] = {
                matchedId: res.club.id,
                createNew: false,
                clubId: res.club.id,
                clubName: res.club.name,
              };
              if (finalName !== rawClubName) {
                updatedMappings[finalName] = {
                  matchedId: res.club.id,
                  createNew: false,
                  clubId: res.club.id,
                  clubName: res.club.name,
                };
              }
            }
          }

          setClubsList(updatedClubs);
          setMappings(updatedMappings);
        } catch (err: any) {
          console.error("Failed to create clubs inline in Step 1:", err);
          setClubCreationError(err?.message || "Failed to create clubs in database.");
          setIsProcessingClubs(false);
          return;
        } finally {
          setIsProcessingClubs(false);
        }
      }

      setCurrentStep(2);
      return;
    }

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
          {clubCreationError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {clubCreationError}
            </div>
          )}

          {/* STEP 1: CLUBS */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Incoming schedule clubs not matching existing database records default to <strong className="text-emerald-400">Create New Club</strong>. New clubs will be created immediately in the database upon clicking Next so that teams in Step 2 can link to them.
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
                    const isNew = currentVal?.createNew ?? true;
                    const selectedId = isNew ? "new" : currentVal?.matchedId || "";
                    const lookup = lookupResults[club];
                    const isLoading = loadingLookups[club];
                    const clubNameInput = clubNamesToCreate[club] ?? club;

                    return (
                      <div key={club} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="font-semibold text-xs text-white flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span>"{club}"</span>
                            {isNew ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <PlusCircle className="h-2.5 w-2.5" />
                                + Create New Club
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                Matched to Existing
                              </span>
                            )}
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
                                else setMapping(club, null, true);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="new">+ Create New Club "{club}"</option>
                              <option disabled value="">──────────────</option>
                              <option disabled value="">-- Or Match to Existing Club --</option>
                              {clubsList.map((c) => (
                                <option key={c.id} value={c.id}>
                                  Match to: {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Editable Club Name for New Club Creation */}
                        {isNew && (
                          <div className="flex items-center gap-2 pl-6 pt-1 text-xs">
                            <span className="text-[11px] text-slate-400">Club Name:</span>
                            <input
                              type="text"
                              value={clubNameInput}
                              onChange={(e) =>
                                setClubNamesToCreate((prev) => ({ ...prev, [club]: e.target.value }))
                              }
                              placeholder={club}
                              className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none w-64"
                            />
                            <span className="text-[10px] text-emerald-400">Will be created in DB upon clicking Next</span>
                          </div>
                        )}

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
                Review incoming schedule teams. Each team is strictly scoped and tied to the club resolved or created in Step 1.
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
                    const selectedId = currentVal?.createNew ? "new" : currentVal?.matchedId || "new";
                    const lookup = lookupResults[teamName];
                    const isLoading = loadingLookups[teamName];

                    // Resolve selected/matched club from Step 1 or DB
                    const clubMapping = rawClubName ? mappings[rawClubName] : undefined;
                    let targetClubName = "";
                    let targetClubId: number | null = clubMapping?.matchedId || null;
                    let isClubInDb = false;

                    if (targetClubId) {
                      const foundClub = clubsList.find((c) => c.id === targetClubId);
                      if (foundClub) {
                        targetClubName = foundClub.name;
                        isClubInDb = true;
                      }
                    } else if (rawClubName) {
                      const cLower = rawClubName.toLowerCase().trim();
                      const foundClub = clubsList.find(
                        (c) => c.name.toLowerCase().trim() === cLower || (c.abbreviation && c.abbreviation.toLowerCase().trim() === cLower)
                      );
                      if (foundClub) {
                        targetClubId = foundClub.id;
                        targetClubName = foundClub.name;
                        isClubInDb = true;
                      } else {
                        targetClubName = clubNamesToCreate[rawClubName] || rawClubName;
                      }
                    }

                    // Filter available teams to ONLY those belonging to the picked club
                    const availableClubTeams = (targetClubId || targetClubName)
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
                            {targetClubName && (
                              <span className="text-[10px] font-normal text-slate-400 pl-6 flex items-center gap-1.5">
                                Club:{" "}
                                <strong className="text-emerald-300 font-semibold flex items-center gap-1">
                                  {isClubInDb && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                                  {targetClubName}
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
                                if (v === "new") setMapping(teamName, null, true, targetClubId, targetClubName);
                                else if (v) setMapping(teamName, Number(v), false, targetClubId, targetClubName);
                                else setMapping(teamName, null, true, targetClubId, targetClubName);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="new">+ Create New Team "{teamName}" in {targetClubName}</option>
                              {availableClubTeams.length > 0 && (
                                <>
                                  <option disabled value="">──────────────</option>
                                  <option disabled value="">-- Or Select Existing Team ({targetClubName}) --</option>
                                  {availableClubTeams.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.clubName} - {t.name}
                                    </option>
                                  ))}
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
                    const selectedId = currentVal?.createNew ? "new" : currentVal?.matchedId || "new";
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
                                else setMapping(loc, null, true);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="new">+ Create New Location "{loc}"</option>
                              <option disabled value="">──────────────</option>
                              <option disabled value="">-- Or Select Existing Location --</option>
                              {existingLocations.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name}
                                </option>
                              ))}
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
                    const selectedId = currentVal?.createNew ? "new" : currentVal?.matchedId || "new";
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
                                else setMapping(field, null, true);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="new">+ Create New Field "{field}"</option>
                              <option disabled value="">──────────────</option>
                              <option disabled value="">-- Or Select Existing Field --</option>
                              {existingSublocations.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.locationName ? `${s.locationName} - ` : ""}{s.name}
                                </option>
                              ))}
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
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isProcessingClubs}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button variant="secondary" size="sm" onClick={handlePrevStep} disabled={isProcessingClubs}>
                Back
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleNextStep}
              disabled={isProcessingClubs}
              isLoading={isProcessingClubs}
            >
              {isProcessingClubs
                ? "Creating Clubs..."
                : currentStep === 1
                ? "Next: Match Teams"
                : currentStep === 2
                ? "Next: Match Locations"
                : currentStep === 3
                ? "Next: Match Fields"
                : "Complete & Run Import"}
              {!isProcessingClubs && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
