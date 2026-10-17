"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Search, UserCheck, Shield, Hash, AlertCircle, Plus, UserPlus, Users } from "lucide-react";
import {
  searchGuestPlayerCandidates,
  searchAllPeopleForSeasonGuest,
  addGuestPlayerToLineup,
  rosterPersonAndAddGuestToLineup,
  LineupPlayer,
} from "@/lib/actions/gameLineup-actions";
import { getClubAndTeamOptions } from "@/lib/actions/inlineEntity-actions";
import InlineEntityModal, { InlineEntityType } from "@/components/dashboard/InlineEntityModal";
import { toast } from "sonner";

interface CandidatePlayer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  jerseyNumber: number | null;
  clubName: string | null;
  teamName: string | null;
  seasonName: string | null;
}

interface DirectoryPerson {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname?: string | null;
  email?: string | null;
  isRosteredThisSeason: boolean;
  rosteredTeamName?: string | null;
  rosteredClubName?: string | null;
}

interface AddGuestPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  teamSeasonId: number;
  existingPlayerIds?: number[];
  onGuestAdded: (player: LineupPlayer) => void;
}

export default function AddGuestPlayerModal({
  isOpen,
  onClose,
  gameId,
  teamSeasonId,
  existingPlayerIds = [],
  onGuestAdded,
}: AddGuestPlayerModalProps) {
  // Main Tab: "season_roster" (players already rostered on a team this season) vs "new_enroll" (roster new/existing person to team first)
  const [activeTab, setActiveTab] = useState<"season_roster" | "new_enroll">("season_roster");

  // Tab 1: Search guest candidates rostered this season
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CandidatePlayer[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePlayer | null>(null);

  // Tab 2: Roster Person to Team first
  const [personMode, setPersonMode] = useState<"search" | "create">("search");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directoryResults, setDirectoryResults] = useState<DirectoryPerson[]>([]);
  const [selectedDirectoryPerson, setSelectedDirectoryPerson] = useState<DirectoryPerson | null>(null);

  // New person form fields
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newGender, setNewGender] = useState("FEMALE");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Club & Team selection
  const [clubs, setClubs] = useState<Array<{ id: number; name: string }>>([]);
  const [teams, setTeams] = useState<Array<{ id: number; name: string; clubId: number }>>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | "">("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");
  const [inlineModalType, setInlineModalType] = useState<InlineEntityType | null>(null);

  // Shared match settings
  const [jerseyNumber, setJerseyNumber] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<"dressed" | "not_dressed" | "starter">("dressed");
  const [isSearching, startSearchTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load clubs & teams when modal opens
  useEffect(() => {
    if (isOpen) {
      getClubAndTeamOptions().then((opts) => {
        setClubs(opts.clubs);
        setTeams(opts.teams);
      });
    }
  }, [isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab("season_roster");
      setQuery("");
      setResults([]);
      setSelectedCandidate(null);
      setPersonMode("search");
      setDirectoryQuery("");
      setDirectoryResults([]);
      setSelectedDirectoryPerson(null);
      setNewFirstName("");
      setNewLastName("");
      setNewNickname("");
      setNewGender("FEMALE");
      setNewBirthDate("");
      setNewEmail("");
      setNewPhone("");
      setSelectedClubId("");
      setSelectedTeamId("");
      setJerseyNumber("");
      setGameStatus("dressed");
    }
  }, [isOpen]);

  // Debounced search for Tab 1 (Season Rostered candidates)
  useEffect(() => {
    if (activeTab !== "season_roster" || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        try {
          const candidates = await searchGuestPlayerCandidates(query, teamSeasonId);
          setResults(candidates);
        } catch (err: any) {
          console.error("Error searching guest candidates:", err);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, activeTab, teamSeasonId]);

  // Debounced search for Tab 2 (Directory search)
  useEffect(() => {
    if (activeTab !== "new_enroll" || personMode !== "search" || directoryQuery.trim().length < 2) {
      setDirectoryResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        try {
          const people = await searchAllPeopleForSeasonGuest(directoryQuery, teamSeasonId);
          setDirectoryResults(people);
        } catch (err: any) {
          console.error("Error searching directory:", err);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [directoryQuery, activeTab, personMode, teamSeasonId]);

  // Filtered teams based on selected club
  const filteredTeams = useMemo(() => {
    if (!selectedClubId) return teams;
    return teams.filter((t) => t.clubId === Number(selectedClubId));
  }, [teams, selectedClubId]);

  const handleSelectCandidate = (candidate: CandidatePlayer) => {
    setSelectedCandidate(candidate);
    setJerseyNumber(candidate.jerseyNumber != null ? String(candidate.jerseyNumber) : "");
  };

  // Submit Tab 1 (Season Rostered Player)
  const handleSubmitSeasonRostered = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    try {
      const parsedJersey = jerseyNumber.trim() !== "" ? parseInt(jerseyNumber, 10) : null;
      const res = await addGuestPlayerToLineup(gameId, teamSeasonId, {
        personId: selectedCandidate.id,
        jerseyNumber: parsedJersey,
        gameStatus,
      });

      if (res.success && res.player) {
        toast.success(`${res.player.fullName} added as guest player!`);
        onGuestAdded(res.player);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add guest player");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Tab 2 (Roster Person to Team + Add to Lineup)
  const handleSubmitNewEnrollment = async () => {
    if (!selectedTeamId) {
      toast.error("Please select a team to roster the player on for this season.");
      return;
    }

    if (personMode === "search" && !selectedDirectoryPerson) {
      toast.error("Please select a person from search or switch to 'Create New Person'.");
      return;
    }

    if (personMode === "create" && (!newFirstName.trim() || !newLastName.trim())) {
      toast.error("First Name and Last Name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedJersey = jerseyNumber.trim() !== "" ? parseInt(jerseyNumber, 10) : null;
      const res = await rosterPersonAndAddGuestToLineup({
        gameId,
        targetTeamSeasonId: teamSeasonId,
        personId: personMode === "search" ? selectedDirectoryPerson?.id : undefined,
        newPerson: personMode === "create"
          ? {
              firstName: newFirstName.trim(),
              lastName: newLastName.trim(),
              nickname: newNickname.trim() || undefined,
              gender: newGender,
              birthDate: newBirthDate || undefined,
              email: newEmail.trim() || undefined,
              phone: newPhone.trim() || undefined,
            }
          : undefined,
        rosterTeamId: Number(selectedTeamId),
        jerseyNumber: parsedJersey,
        gameStatus,
      });

      if (res.success && res.player) {
        toast.success(`${res.player.fullName} rostered and added as guest player!`);
        onGuestAdded(res.player);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to roster and add guest player");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineSuccess = (res: any) => {
    setInlineModalType(null);
    if (res.club) {
      const newClub = { id: res.club.id, name: res.club.name };
      setClubs((prev) => [...prev, newClub]);
      setSelectedClubId(newClub.id);
      setSelectedTeamId("");
      toast.success(`Club "${newClub.name}" created!`);
    } else if (res.team) {
      const newTeam = { id: res.team.id, name: res.team.team_name, clubId: res.team.club_id };
      setTeams((prev) => [...prev, newTeam]);
      setSelectedTeamId(newTeam.id);
      toast.success(`Team "${newTeam.name}" created!`);
    }
  };

  const statusOptions = [
    { value: "dressed", label: "Game Changers (Bench / Dressed)" },
    { value: "starter", label: "Starting Lineup" },
    { value: "not_dressed", label: "Available (Not Dressed)" },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Guest Player"
        description="Select an active player from this season or register a new player into a club roster."
        maxWidth="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={activeTab === "season_roster" ? handleSubmitSeasonRostered : handleSubmitNewEnrollment}
              disabled={
                isSubmitting ||
                (activeTab === "season_roster" && !selectedCandidate) ||
                (activeTab === "new_enroll" && (!selectedTeamId || (personMode === "search" && !selectedDirectoryPerson)))
              }
              isLoading={isSubmitting}
            >
              {isSubmitting
                ? "Processing..."
                : activeTab === "season_roster"
                ? "Add to Lineup"
                : "Roster to Team & Add to Lineup"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Main Mode Tabs */}
          <div className="flex border-b border-border pb-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("season_roster")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "season_roster"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text hover:bg-surface"
              }`}
            >
              Eligible Players (This Season)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("new_enroll")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "new_enroll"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text hover:bg-surface"
              }`}
            >
              + Roster New / External Player
            </button>
          </div>

          {/* TAB 1: Season-Scoped Candidates */}
          {activeTab === "season_roster" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                  Search Season Roster (Fuzzy Match)
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search by name (e.g. Alex Morgan, Smith, Soph) or email..."
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                    className="pl-9 text-sm"
                    autoFocus
                  />
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                </div>
                {isSearching && (
                  <p className="text-[11px] text-muted mt-1 italic">Searching players in this season...</p>
                )}
              </div>

              {/* Search Results */}
              {results.length > 0 && !selectedCandidate && (
                <div className="border border-border rounded-xl divide-y divide-border max-h-56 overflow-y-auto bg-surface/50">
                  {results.map((c) => {
                    const alreadyInLineup = existingPlayerIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => !alreadyInLineup && handleSelectCandidate(c)}
                        className={`p-2.5 flex items-center justify-between gap-2 transition-colors ${
                          alreadyInLineup
                            ? "opacity-50 cursor-not-allowed bg-muted/10"
                            : "cursor-pointer hover:bg-surface-hover"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.jerseyNumber ?? "-"}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-text truncate">
                              {c.fullName}
                            </div>
                            <div className="text-[11px] text-muted truncate">
                              {c.clubName || c.teamName ? (
                                <span>
                                  {c.clubName} {c.teamName && `· ${c.teamName}`}
                                </span>
                              ) : (
                                "Unattached / Club Pool"
                              )}
                            </div>
                          </div>
                        </div>

                        {alreadyInLineup ? (
                          <span className="text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">
                            Already in Lineup
                          </span>
                        ) : (
                          <Button variant="ghost" size="xs" className="shrink-0 text-primary font-semibold">
                            Select
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {query.trim().length >= 2 && !isSearching && results.length === 0 && (
                <div className="text-center py-5 border border-dashed border-border rounded-xl space-y-2 bg-surface/30">
                  <p className="text-xs text-muted">
                    No rostered player found in this season matching &ldquo;{query}&rdquo;.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab("new_enroll");
                      setPersonMode("search");
                      setDirectoryQuery(query);
                    }}
                    className="text-xs"
                  >
                    + Look up in all people or create player
                  </Button>
                </div>
              )}

              {/* Selected Candidate Preview */}
              {selectedCandidate && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text flex items-center gap-1.5">
                          <span>{selectedCandidate.fullName}</span>
                          <span className="bg-primary/20 text-primary text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-primary/30">
                            Guest
                          </span>
                        </div>
                        <div className="text-xs text-muted">
                          {selectedCandidate.clubName} {selectedCandidate.teamName && `· ${selectedCandidate.teamName}`}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setSelectedCandidate(null)}
                      className="text-xs text-muted hover:text-danger"
                    >
                      Change
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-primary/10">
                    <div>
                      <label className="block text-xs font-medium text-text mb-1">
                        Jersey # for Match
                      </label>
                      <Input
                        placeholder="#"
                        value={jerseyNumber}
                        onChange={(e: any) =>
                          setJerseyNumber(e.target.value.replace(/\D/g, "").slice(0, 3))
                        }
                        className="text-sm font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text mb-1">
                        Lineup Status
                      </label>
                      <Select
                        value={gameStatus}
                        onChange={(e: any) => setGameStatus(e.target.value as any)}
                        options={statusOptions}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: On-the-Fly Person & Team Enrollment */}
          {activeTab === "new_enroll" && (
            <div className="space-y-4">
              {/* Step 1: Person Selection / Creation */}
              <div className="p-3.5 bg-surface/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-border/70 pb-2">
                  <span className="text-xs font-bold text-text uppercase tracking-wider">
                    Step 1: Player Information
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPersonMode("search")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                        personMode === "search" ? "bg-primary text-white" : "text-muted hover:text-text"
                      }`}
                    >
                      Search Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersonMode("create")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                        personMode === "create" ? "bg-primary text-white" : "text-muted hover:text-text"
                      }`}
                    >
                      + Create Person
                    </button>
                  </div>
                </div>

                {personMode === "search" ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        placeholder="Search all people in directory..."
                        value={directoryQuery}
                        onChange={(e: any) => setDirectoryQuery(e.target.value)}
                        className="pl-8 text-xs"
                      />
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>

                    {directoryResults.length > 0 && !selectedDirectoryPerson && (
                      <div className="border border-border rounded-lg divide-y divide-border/60 max-h-36 overflow-y-auto bg-background">
                        {directoryResults.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedDirectoryPerson(p)}
                            className="p-2 hover:bg-primary/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <span className="font-semibold">{p.fullName}</span>
                              {p.nickname && <span className="text-muted ml-1">({p.nickname})</span>}
                              <span className="text-muted text-[10px] block">{p.email || "No email"}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              p.isRosteredThisSeason
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}>
                              {p.isRosteredThisSeason ? `On ${p.rosteredTeamName}` : "Not on roster this season"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedDirectoryPerson && (
                      <div className="p-2 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-muted">Selected Person: </span>
                          <span className="font-bold text-primary">{selectedDirectoryPerson.fullName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDirectoryPerson(null)}
                          className="text-[11px] text-muted hover:text-danger font-medium"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="First Name *"
                        value={newFirstName}
                        onChange={(e: any) => setNewFirstName(e.target.value)}
                        placeholder="Alex"
                        size="sm"
                      />
                      <Input
                        label="Last Name *"
                        value={newLastName}
                        onChange={(e: any) => setNewLastName(e.target.value)}
                        placeholder="Morgan"
                        size="sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Nickname"
                        value={newNickname}
                        onChange={(e: any) => setNewNickname(e.target.value)}
                        placeholder="Ali"
                        size="sm"
                      />
                      <div>
                        <label className="text-xs font-bold text-muted uppercase block mb-1">Gender *</label>
                        <Select
                          value={newGender}
                          onChange={(e: any) => setNewGender(e.target.value)}
                          options={[
                            { value: "FEMALE", label: "Female (Girls / Women)" },
                            { value: "MALE", label: "Male (Boys / Men)" },
                            { value: "MIXED", label: "Mixed / Co-Ed" },
                          ]}
                          width="full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Birth Date"
                        type="date"
                        value={newBirthDate}
                        onChange={(e: any) => setNewBirthDate(e.target.value)}
                        size="sm"
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        value={newEmail}
                        onChange={(e: any) => setNewEmail(e.target.value)}
                        placeholder="player@example.com"
                        size="sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Club & Team Selection (with Inline Creation) */}
              <div className="p-3.5 bg-surface/40 border border-border rounded-xl space-y-3">
                <span className="text-xs font-bold text-text uppercase tracking-wider block border-b border-border/70 pb-2">
                  Step 2: Club & Team Affiliation for this Season
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted uppercase block mb-1">
                      Club Affiliation
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <Select
                          value={selectedClubId}
                          onChange={(e: any) => {
                            const cId = e.target.value ? Number(e.target.value) : "";
                            setSelectedClubId(cId);
                            setSelectedTeamId("");
                          }}
                          options={clubs.map((c) => ({ value: c.id, label: c.name }))}
                          placeholder="Select Club..."
                          showPlaceholder={true}
                          width="full"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInlineModalType("club")}
                        title="Add New Club"
                        className="px-2"
                      >
                        <Plus size={14} className="text-primary" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase block mb-1">
                      Team Roster
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <Select
                          value={selectedTeamId}
                          onChange={(e: any) => setSelectedTeamId(e.target.value ? Number(e.target.value) : "")}
                          options={filteredTeams.map((t) => ({ value: t.id, label: t.name }))}
                          placeholder={selectedClubId ? "Select Team..." : "Select Club first..."}
                          showPlaceholder={true}
                          disabled={!selectedClubId}
                          width="full"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInlineModalType("team")}
                        title="Add New Team"
                        disabled={!selectedClubId}
                        className="px-2"
                      >
                        <Plus size={14} className="text-primary" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Match Lineup Details */}
              <div className="p-3.5 bg-surface/40 border border-border rounded-xl space-y-3">
                <span className="text-xs font-bold text-text uppercase tracking-wider block border-b border-border/70 pb-2">
                  Step 3: Match Lineup Details
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">
                      Jersey # for Match
                    </label>
                    <Input
                      placeholder="e.g. 15"
                      value={jerseyNumber}
                      onChange={(e: any) =>
                        setJerseyNumber(e.target.value.replace(/\D/g, "").slice(0, 3))
                      }
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">
                      Lineup Status
                    </label>
                    <Select
                      value={gameStatus}
                      onChange={(e: any) => setGameStatus(e.target.value as any)}
                      options={statusOptions}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Sub-Modal for Inline Club / Team Creation */}
      {inlineModalType && (
        <InlineEntityModal
          entityType={inlineModalType}
          contextData={{
            clubId: selectedClubId ? Number(selectedClubId) : undefined,
            clubs,
          }}
          onClose={() => setInlineModalType(null)}
          onSuccess={handleInlineSuccess}
        />
      )}
    </>
  );
}
