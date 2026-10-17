"use client";

import React, { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  Search,
  PlusCircle,
  XCircle,
  Filter,
  CheckSquare,
  Square,
  Shield,
  Loader2,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatTimeStandard } from "@/lib/utils/dateTimeUtils";
import {
  addGuestPlayersToGames,
  removeGuestPlayerFromGame,
  getGuestPlayerOptionsAction,
  getGamesAction,
  getExistingGuestPlayersAction,
  rosterPersonAndAssignGuestGames,
} from "@/lib/actions/guestPlayer-actions";
import { searchPeopleFuzzy } from "@/lib/actions/people-actions";
import InlineEntityModal, { InlineEntityType } from "@/components/dashboard/InlineEntityModal";

import Dialog from "@/components/ui/Dialog";

interface GuestPlayersClientProps {
  clubs: { id: number; name: string }[];
  ageGroups: { id: number; name: string }[];
  teams: { id: number; name: string; clubId: number }[];
  teamSeasons: { id: number; teamName: string; clubName: string; seasonName: string; seasonId?: number }[];
}

interface PlayerOption {
  personId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  clubName: string;
  teamName: string;
  ageGroupName: string | null;
}

interface GameOption {
  id: number;
  homeTeamName: string;
  homeClubName: string;
  awayTeamName: string;
  awayClubName: string;
  startDate: string;
  startTime: string | null;
  status: string;
}

interface ExistingGuest {
  playerGameId: number;
  gameId: number;
  personId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  teamSeasonId: number;
  teamName: string;
}

export default function GuestPlayersClient({
  clubs,
  ageGroups,
  teams,
  teamSeasons,
}: GuestPlayersClientProps) {
  // Player filters
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>("");

  // Game filters
  const [targetTeamSeasonId, setTargetTeamSeasonId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Loaded data lists
  const [playersList, setPlayersList] = useState<PlayerOption[]>([]);
  const [gamesList, setGamesList] = useState<GameOption[]>([]);
  const [existingGuests, setExistingGuests] = useState<ExistingGuest[]>([]);

  // Selection states
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(new Set());
  const [selectedGameIds, setSelectedGameIds] = useState<Set<number>>(new Set());

  // Dialog state for unassigning guest
  const [guestToRemove, setGuestToRemove] = useState<{ playerGameId: number; name: string } | null>(null);

  // Pending states
  const [isPending, startTransition] = useTransition();
  const [isPlayersLoading, setIsPlayersLoading] = useState(false);
  const [isGamesLoading, setIsGamesLoading] = useState(false);
  const [isExistingLoading, setIsExistingLoading] = useState(false);

  // Dynamic Clubs & Teams lists (augmentable by inline entity creation)
  const [currentClubs, setCurrentClubs] = useState(clubs);
  const [currentTeams, setCurrentTeams] = useState(teams);

  // Target team season's seasonId
  const selectedTargetSeasonId = React.useMemo(() => {
    if (!targetTeamSeasonId) return undefined;
    const ts = teamSeasons.find((t) => t.id === Number(targetTeamSeasonId));
    return ts?.seasonId;
  }, [teamSeasons, targetTeamSeasonId]);

  // Roster New Player modal state
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterPersonMode, setRosterPersonMode] = useState<"search" | "create">("search");
  const [rosterPersonSearch, setRosterPersonSearch] = useState("");
  const [rosterPersonResults, setRosterPersonResults] = useState<Array<{ id: number; firstName: string; lastName: string; nickname?: string | null; email: string | null }>>([]);
  const [rosterSelectedPerson, setRosterSelectedPerson] = useState<{ id: number; firstName: string; lastName: string } | null>(null);

  const [rosterFirstName, setRosterFirstName] = useState("");
  const [rosterLastName, setRosterLastName] = useState("");
  const [rosterNickname, setRosterNickname] = useState("");
  const [rosterGender, setRosterGender] = useState("FEMALE");
  const [rosterBirthDate, setRosterBirthDate] = useState("");
  const [rosterEmail, setRosterEmail] = useState("");
  const [rosterPhone, setRosterPhone] = useState("");

  const [rosterClubId, setRosterClubId] = useState<number | "">("");
  const [rosterTeamId, setRosterTeamId] = useState<number | "">("");
  const [inlineModalType, setInlineModalType] = useState<InlineEntityType | null>(null);
  const [isRosteringSubmitting, setIsRosteringSubmitting] = useState(false);

  // Filtered teams list based on selected club
  const filteredTeams = React.useMemo(() => {
    if (!selectedClubId) return currentTeams;
    return currentTeams.filter((t) => t.clubId === Number(selectedClubId));
  }, [selectedClubId, currentTeams]);

  // Filtered teams in Roster modal
  const rosterFilteredTeams = React.useMemo(() => {
    if (!rosterClubId) return currentTeams;
    return currentTeams.filter((t) => t.clubId === Number(rosterClubId));
  }, [rosterClubId, currentTeams]);

  // Load players on filter changes
  useEffect(() => {
    let active = true;
    async function loadPlayers() {
      setIsPlayersLoading(true);
      try {
        const players = await getGuestPlayerOptionsAction({
          clubId: selectedClubId ? Number(selectedClubId) : undefined,
          ageGroupId: selectedAgeGroupId ? Number(selectedAgeGroupId) : undefined,
          teamId: selectedTeamId ? Number(selectedTeamId) : undefined,
          searchQuery: playerSearchQuery || undefined,
          excludeTeamSeasonId: targetTeamSeasonId ? Number(targetTeamSeasonId) : undefined,
          seasonId: selectedTargetSeasonId,
        });
        if (active) {
          setPlayersList(players);
        }
      } catch (err: any) {
        toast.error("Failed to load players: " + err.message);
      } finally {
        if (active) setIsPlayersLoading(false);
      }
    }

    const timer = setTimeout(loadPlayers, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedClubId, selectedAgeGroupId, selectedTeamId, playerSearchQuery, targetTeamSeasonId, selectedTargetSeasonId]);

  // Debounced search for existing people directory in Roster modal
  useEffect(() => {
    if (!isRosterModalOpen || rosterPersonMode !== "search" || rosterPersonSearch.trim().length < 2) {
      setRosterPersonResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchPeopleFuzzy(rosterPersonSearch, { limit: 15 });
        setRosterPersonResults(results);
      } catch (err: any) {
        console.error("Error searching people:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isRosterModalOpen, rosterPersonMode, rosterPersonSearch]);

  // Load games on target team season or date range changes
  useEffect(() => {
    if (!targetTeamSeasonId) {
      setGamesList([]);
      return;
    }

    async function loadGames() {
      setIsGamesLoading(true);
      try {
        const games = await getGamesAction({
          teamSeasonId: Number(targetTeamSeasonId),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setGamesList(games);
        // Clear game selections that no longer match the query
        const validGameIds = new Set(games.map((g) => g.id));
        setSelectedGameIds((prev) => {
          const next = new Set<number>();
          prev.forEach((id) => {
            if (validGameIds.has(id)) next.add(id);
          });
          return next;
        });
      } catch (err: any) {
        toast.error("Failed to load games: " + err.message);
      } finally {
        setIsGamesLoading(false);
      }
    }

    loadGames();
  }, [targetTeamSeasonId, startDate, endDate]);

  // Load existing guest players when selected games change
  useEffect(() => {
    const gameIds = Array.from(selectedGameIds);
    if (gameIds.length === 0) {
      setExistingGuests([]);
      return;
    }

    async function loadExistingGuests() {
      setIsExistingLoading(true);
      try {
        const guests = await getExistingGuestPlayersAction(gameIds);
        setExistingGuests(guests);
      } catch (err: any) {
        toast.error("Failed to load active guests: " + err.message);
      } finally {
        setIsExistingLoading(false);
      }
    }

    loadExistingGuests();
  }, [selectedGameIds]);

  // Player selection helpers
  const togglePlayerSelect = (personId: number) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  const handleSelectAllPlayers = () => {
    if (selectedPlayerIds.size === playersList.length) {
      setSelectedPlayerIds(new Set());
    } else {
      setSelectedPlayerIds(new Set(playersList.map((p) => p.personId)));
    }
  };

  // Game selection helpers
  const toggleGameSelect = (gameId: number) => {
    setSelectedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const handleSelectAllGames = () => {
    if (selectedGameIds.size === gamesList.length) {
      setSelectedGameIds(new Set());
    } else {
      setSelectedGameIds(new Set(gamesList.map((g) => g.id)));
    }
  };

  // Bulk add action
  const handleAddGuests = () => {
    if (selectedPlayerIds.size === 0) {
      toast.warning("Please select at least one player.");
      return;
    }
    if (selectedGameIds.size === 0) {
      toast.warning("Please select at least one game.");
      return;
    }
    if (!targetTeamSeasonId) {
      toast.warning("Please select a target team season.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await addGuestPlayersToGames(
          Array.from(selectedPlayerIds),
          Array.from(selectedGameIds),
          Number(targetTeamSeasonId)
        );
        toast.success(`Successfully assigned guest players to ${res.count} match slots!`);
        // Refresh active guest lists
        const guests = await getExistingGuestPlayersAction(Array.from(selectedGameIds));
        setExistingGuests(guests);
        setSelectedPlayerIds(new Set());
      } catch (err: any) {
        toast.error("Failed to add guest players: " + err.message);
      }
    });
  };

  // Unassign guest player action
  const confirmRemoveGuest = async () => {
    if (!guestToRemove) return;
    const { playerGameId, name } = guestToRemove;

    try {
      await removeGuestPlayerFromGame(playerGameId, Number(targetTeamSeasonId));
      toast.success(`Removed guest player ${name}.`);
      // Reload existing guests
      const guests = await getExistingGuestPlayersAction(Array.from(selectedGameIds));
      setExistingGuests(guests);
    } catch (err: any) {
      toast.error("Failed to remove guest player: " + err.message);
    } finally {
      setGuestToRemove(null);
    }
  };

  const existingGuestPersonIds = React.useMemo(() => {
    return new Set(existingGuests.map((g) => g.personId));
  }, [existingGuests]);

  const handleInlineSuccess = (res: any) => {
    setInlineModalType(null);
    if (res.club) {
      const newClub = { id: res.club.id, name: res.club.name };
      setCurrentClubs((prev) => [...prev, newClub]);
      setRosterClubId(newClub.id);
      setRosterTeamId("");
      toast.success(`Club "${newClub.name}" created!`);
    } else if (res.team) {
      const newTeam = { id: res.team.id, name: res.team.team_name, clubId: res.team.club_id };
      setCurrentTeams((prev) => [...prev, newTeam]);
      setRosterTeamId(newTeam.id);
      toast.success(`Team "${newTeam.name}" created!`);
    }
  };

  const handleRosterPlayerSubmit = async () => {
    if (!targetTeamSeasonId) {
      toast.warning("Please choose a Target Team Season first so we know which season to enroll this player into.");
      return;
    }
    if (!rosterTeamId) {
      toast.warning("Please select a club and team to roster this player on.");
      return;
    }
    if (rosterPersonMode === "search" && !rosterSelectedPerson) {
      toast.warning("Please select a person from search or switch to 'Create Person'.");
      return;
    }
    if (rosterPersonMode === "create" && (!rosterFirstName.trim() || !rosterLastName.trim())) {
      toast.warning("First Name and Last Name are required.");
      return;
    }

    setIsRosteringSubmitting(true);
    try {
      const res = await rosterPersonAndAssignGuestGames({
        targetTeamSeasonId: Number(targetTeamSeasonId),
        gameIds: Array.from(selectedGameIds),
        personId: rosterPersonMode === "search" ? rosterSelectedPerson?.id : undefined,
        newPerson: rosterPersonMode === "create"
          ? {
              firstName: rosterFirstName.trim(),
              lastName: rosterLastName.trim(),
              nickname: rosterNickname.trim() || undefined,
              gender: rosterGender,
              birthDate: rosterBirthDate || undefined,
              email: rosterEmail.trim() || undefined,
              phone: rosterPhone.trim() || undefined,
            }
          : undefined,
        rosterTeamId: Number(rosterTeamId),
      });

      toast.success("Player successfully rostered and ready for guest matches!");
      setSelectedPlayerIds((prev) => new Set([...prev, res.personId]));
      // Trigger player list refresh
      const players = await getGuestPlayerOptionsAction({
        excludeTeamSeasonId: Number(targetTeamSeasonId),
        seasonId: selectedTargetSeasonId,
      });
      setPlayersList(players);

      if (selectedGameIds.size > 0) {
        const guests = await getExistingGuestPlayersAction(Array.from(selectedGameIds));
        setExistingGuests(guests);
      }
      setIsRosterModalOpen(false);
      // Reset form
      setRosterSelectedPerson(null);
      setRosterPersonSearch("");
      setRosterFirstName("");
      setRosterLastName("");
      setRosterNickname("");
      setRosterBirthDate("");
      setRosterEmail("");
      setRosterPhone("");
      setRosterTeamId("");
    } catch (err: any) {
      toast.error("Failed to roster player: " + err.message);
    } finally {
      setIsRosteringSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-md">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Shield size={14} />
              <span>Match Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Guest Player Roster Assignments
            </h1>
            <p className="text-xs text-muted max-w-2xl">
              Borrow rostered players from other teams/clubs as guest players for upcoming matches.
            </p>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN GRID SETUP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PLAYER SELECTION (6 cols) */}
        <div className="lg:col-span-6 bg-surface border border-border/80 rounded-2xl p-4 shadow-sm space-y-2.5 flex flex-col max-h-[88vh]">
          <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-primary" />
              <h3 className="font-bold text-xs text-text uppercase tracking-wider">
                Step 1: Select Roster Players
              </h3>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsRosterModalOpen(true)}
              className="text-[10px] font-bold"
            >
              + Roster New Player
            </Button>
          </div>

          {/* Player Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Club Filter */}
            <div>
              <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-0.5">
                Club Organization
              </label>
              <select
                value={selectedClubId}
                onChange={(e) => {
                  setSelectedClubId(e.target.value);
                  setSelectedTeamId("");
                }}
                className="w-full text-[11px] py-1 px-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-text"
              >
                <option value="">All Clubs</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Filter */}
            <div>
              <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-0.5">
                Roster Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full text-[11px] py-1 px-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-text"
              >
                <option value="">All Teams</option>
                {filteredTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Group Filter */}
            <div>
              <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-0.5">
                Age Bracket
              </label>
              <select
                value={selectedAgeGroupId}
                onChange={(e) => setSelectedAgeGroupId(e.target.value)}
                className="w-full text-[11px] py-1 px-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-text"
              >
                <option value="">All Ages</option>
                {ageGroups.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Player Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search player name or email..."
              value={playerSearchQuery}
              onChange={(e) => setPlayerSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-[11px] bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-text placeholder:text-muted/60"
            />
          </div>

          {/* Players Selection Header / Count */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted bg-background/50 border border-border/40 px-2.5 py-1 rounded-lg">
            <button
              onClick={handleSelectAllPlayers}
              className="flex items-center gap-1.5 hover:text-text text-left transition-colors"
            >
              {selectedPlayerIds.size === playersList.length && playersList.length > 0 ? (
                <CheckSquare size={13} className="text-primary" />
              ) : (
                <Square size={13} />
              )}
              <span>Select All Players ({playersList.length})</span>
            </button>
            <span>{selectedPlayerIds.size} Selected</span>
          </div>

          {/* Players List Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 min-h-[420px]">
            {isPlayersLoading ? (
              <div className="flex justify-center items-center py-16 gap-2 text-xs text-muted">
                <Loader2 className="animate-spin text-primary" size={15} />
                <span>Loading players...</span>
              </div>
            ) : playersList.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-muted font-medium bg-background/25 border border-dashed border-border rounded-xl space-y-2">
                <p>No rostered players match your filters.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRosterModalOpen(true)}
                  className="text-xs"
                >
                  + Roster a Player to a Team This Season
                </Button>
              </div>
            ) : (
              playersList.map((player) => {
                const isSelected = selectedPlayerIds.has(player.personId);
                const isAlreadyGuest = existingGuestPersonIds.has(player.personId);
                return (
                  <div
                    key={player.personId}
                    onClick={() => togglePlayerSelect(player.personId)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-2xs"
                        : "bg-background/40 hover:bg-background/80 border-border/40 hover:border-border/80"
                    }`}
                  >
                    <div className="shrink-0 text-muted">
                      {isSelected ? (
                        <CheckSquare size={13} className="text-primary" />
                      ) : (
                        <Square size={13} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-text truncate text-[11px]">
                        {player.firstName} {player.lastName}
                      </span>
                      <span className="text-[10px] text-muted truncate font-normal">
                        {player.clubName} • {player.teamName}
                      </span>
                    </div>
                    {isAlreadyGuest && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold rounded-full border border-amber-500/20 shrink-0">
                        Assigned Guest
                      </span>
                    )}
                    {player.ageGroupName && (
                      <span className="text-[9px] px-1 bg-border/80 rounded text-muted font-semibold shrink-0">
                        {player.ageGroupName}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: GUEST TEAM & GAMES SELECT (6 cols) */}
        <div className="lg:col-span-6 bg-surface border border-border/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col max-h-[78vh]">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Calendar size={16} className="text-primary" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">
              Step 2: Choose Target Team & Games
            </h3>
          </div>

          {/* Guest Target Team Season Selection */}
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
              Guesting For Team Season
            </label>
            <select
              value={targetTeamSeasonId}
              onChange={(e) => setTargetTeamSeasonId(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text font-semibold"
            >
              <option value="">Select Target Team Season...</option>
              {teamSeasons.map((ts) => (
                <option key={ts.id} value={ts.id}>
                  {ts.clubName} - {ts.teamName} ({ts.seasonName})
                </option>
              ))}
            </select>
          </div>

          {/* Date range filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs py-1.5 px-2.5 bg-background border border-border/80 rounded-xl focus:outline-none text-text"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs py-1.5 px-2.5 bg-background border border-border/80 rounded-xl focus:outline-none text-text"
              />
            </div>
          </div>

          {/* Games Selection Header / Count */}
          <div className="flex items-center justify-between text-xs font-semibold text-muted bg-background/50 border border-border/40 px-3 py-1.5 rounded-xl">
            <button
              onClick={handleSelectAllGames}
              disabled={gamesList.length === 0}
              className="flex items-center gap-1.5 hover:text-text text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedGameIds.size === gamesList.length && gamesList.length > 0 ? (
                <CheckSquare size={14} className="text-primary" />
              ) : (
                <Square size={14} />
              )}
              <span>Select All Games ({gamesList.length})</span>
            </button>
            <span>{selectedGameIds.size} Selected</span>
          </div>

          {/* Games List Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[30vh]">
            {!targetTeamSeasonId ? (
              <div className="text-center py-16 text-xs text-muted font-medium bg-background/25 border border-dashed border-border rounded-xl">
                Please select a target team season above to load available games.
              </div>
            ) : isGamesLoading ? (
              <div className="flex justify-center items-center py-16 gap-2 text-xs text-muted">
                <Loader2 className="animate-spin text-primary" size={16} />
                <span>Loading games...</span>
              </div>
            ) : gamesList.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted font-medium bg-background/25 border border-dashed border-border rounded-xl">
                No games scheduled in this date range.
              </div>
            ) : (
              gamesList.map((game) => {
                const isSelected = selectedGameIds.has(game.id);
                const isHome = teamSeasons.find((ts) => ts.id === Number(targetTeamSeasonId))?.teamName === game.homeTeamName;
                return (
                  <div
                    key={game.id}
                    onClick={() => toggleGameSelect(game.id)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary/25 shadow-sm"
                        : "bg-background/40 hover:bg-background/70 border-border/40 hover:border-border/80"
                    }`}
                  >
                    <div className="shrink-0 text-muted">
                      {isSelected ? (
                        <CheckSquare size={14} className="text-primary" />
                      ) : (
                        <Square size={14} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex justify-between items-center text-[10px] text-muted">
                        <span className="font-semibold">{game.startDate} {formatTimeStandard(game.startTime)}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90 ${
                          isHome ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {isHome ? "Home" : "Away"}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-text truncate" title={`${game.homeClubName || ""} ${game.homeTeamName} vs ${game.awayClubName || ""} ${game.awayTeamName}`}>
                        {game.homeClubName} {game.homeTeamName} vs {game.awayClubName} {game.awayTeamName}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FOOTER ACTION BANNER */}
      <div className="bg-surface border border-border/80 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="text-xs text-text/85 z-10">
          <div className="font-bold flex items-center gap-1.5">
            <PlusCircle size={14} className="text-primary" />
            <span>Ready to Assign Guests</span>
          </div>
          <p className="text-muted mt-0.5">
            Adding <strong className="text-text font-black">{selectedPlayerIds.size}</strong> players as guests to{" "}
            <strong className="text-text font-black">{selectedGameIds.size}</strong> selected matches.
          </p>
        </div>

        <Button
          variant="primary"
          disabled={isPending || selectedPlayerIds.size === 0 || selectedGameIds.size === 0 || !targetTeamSeasonId}
          onClick={handleAddGuests}
          className="z-10 text-xs px-5 py-2.5 flex items-center gap-2 font-bold shadow-md shadow-primary/10 select-none whitespace-nowrap"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Assigning Guests...</span>
            </>
          ) : (
            <>
              <PlusCircle size={14} />
              <span>Assign Guest Players</span>
            </>
          )}
        </Button>
      </div>

      {/* ACTIVE GUEST MANAGEMENT SECTION */}
      {selectedGameIds.size > 0 && (
        <Card variant="outlined" padding="lg" className="bg-surface shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
            <Shield size={16} className="text-primary" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">
              Active Guests in Selected Matches ({existingGuests.length})
            </h3>
          </div>

          {isExistingLoading ? (
            <div className="flex justify-center items-center py-8 gap-2 text-xs text-muted">
              <Loader2 className="animate-spin text-primary" size={16} />
              <span>Loading current guests...</span>
            </div>
          ) : existingGuests.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted font-medium bg-background/25 border border-dashed border-border rounded-xl">
              No guest players are currently assigned to the selected matches.
            </div>
          ) : (
            <div className="border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/45 bg-background/20">
              {existingGuests.map((guest) => (
                <div
                  key={guest.playerGameId}
                  className="flex justify-between items-center px-3 py-1.5 hover:bg-background/35 transition-colors text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-text block truncate">
                      {guest.firstName} {guest.lastName}
                    </span>
                    <span className="text-[10px] text-muted">
                      Guesting for: <strong className="text-text/75 font-semibold">{guest.teamName}</strong>
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setGuestToRemove({ playerGameId: guest.playerGameId, name: `${guest.firstName} ${guest.lastName}` })}
                    className="p-1 hover:bg-danger/10 text-muted hover:text-danger rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] border border-transparent hover:border-danger/15"
                  >
                    <XCircle size={12} />
                    <span>Unassign</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* CONFIRMATION DIALOG */}
      <Dialog
        isOpen={Boolean(guestToRemove)}
        onClose={() => setGuestToRemove(null)}
        title="Unassign Guest Player"
        message={`Are you sure you want to remove guest player ${guestToRemove?.name || ""} from this match?`}
        type="warning"
        confirmText="Yes, Unassign"
        cancelText="Cancel"
        onConfirm={confirmRemoveGuest}
      />

      {/* ROSTER NEW / EXTERNAL PLAYER MODAL */}
      <Modal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        title="Roster Player to a Team (This Season)"
        description="Roster an existing person or register a new player into a club roster for this season so they can be assigned as a guest."
        maxWidth="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRosterModalOpen(false)}
              disabled={isRosteringSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRosterPlayerSubmit}
              disabled={
                isRosteringSubmitting ||
                !rosterTeamId ||
                (rosterPersonMode === "search" && !rosterSelectedPerson) ||
                (rosterPersonMode === "create" && (!rosterFirstName.trim() || !rosterLastName.trim()))
              }
              isLoading={isRosteringSubmitting}
            >
              {isRosteringSubmitting ? "Enrolling..." : "Roster Player for Season"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Step 1: Person */}
          <div className="p-3.5 bg-surface/40 border border-border rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <span className="text-xs font-bold text-text uppercase tracking-wider">
                Step 1: Player Information
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setRosterPersonMode("search")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                    rosterPersonMode === "search" ? "bg-primary text-white" : "text-muted hover:text-text"
                  }`}
                >
                  Search Directory
                </button>
                <button
                  type="button"
                  onClick={() => setRosterPersonMode("create")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                    rosterPersonMode === "create" ? "bg-primary text-white" : "text-muted hover:text-text"
                  }`}
                >
                  + Create Person
                </button>
              </div>
            </div>

            {rosterPersonMode === "search" ? (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Search all people in directory..."
                    value={rosterPersonSearch}
                    onChange={(e: any) => setRosterPersonSearch(e.target.value)}
                    className="pl-8 text-xs"
                  />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>

                {rosterPersonResults.length > 0 && !rosterSelectedPerson && (
                  <div className="border border-border rounded-lg divide-y divide-border/60 max-h-36 overflow-y-auto bg-background">
                    {rosterPersonResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setRosterSelectedPerson(p)}
                        className="p-2 hover:bg-primary/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-semibold">{p.firstName} {p.lastName}</span>
                          {p.nickname && <span className="text-muted ml-1">({p.nickname})</span>}
                          <span className="text-muted text-[10px] block">{p.email || "No email"}</span>
                        </div>
                        <Button variant="ghost" size="xs" className="text-primary font-bold text-[10px]">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {rosterSelectedPerson && (
                  <div className="p-2 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted">Selected: </span>
                      <span className="font-bold text-primary">{rosterSelectedPerson.firstName} {rosterSelectedPerson.lastName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRosterSelectedPerson(null)}
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
                    value={rosterFirstName}
                    onChange={(e: any) => setRosterFirstName(e.target.value)}
                    placeholder="Alex"
                    size="sm"
                  />
                  <Input
                    label="Last Name *"
                    value={rosterLastName}
                    onChange={(e: any) => setRosterLastName(e.target.value)}
                    placeholder="Morgan"
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Nickname"
                    value={rosterNickname}
                    onChange={(e: any) => setRosterNickname(e.target.value)}
                    placeholder="Ali"
                    size="sm"
                  />
                  <div>
                    <label className="text-xs font-bold text-muted uppercase block mb-1">Gender *</label>
                    <Select
                      value={rosterGender}
                      onChange={(e: any) => setRosterGender(e.target.value)}
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
                    value={rosterBirthDate}
                    onChange={(e: any) => setRosterBirthDate(e.target.value)}
                    size="sm"
                  />
                  <Input
                    label="Phone Number"
                    value={rosterPhone}
                    onChange={(e: any) => setRosterPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    size="sm"
                  />
                </div>
                <Input
                  label="Email Address"
                  type="email"
                  value={rosterEmail}
                  onChange={(e: any) => setRosterEmail(e.target.value)}
                  placeholder="player@example.com"
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Step 2: Club & Team Selection */}
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
                      value={rosterClubId}
                      onChange={(e: any) => {
                        const cId = e.target.value ? Number(e.target.value) : "";
                        setRosterClubId(cId);
                        setRosterTeamId("");
                      }}
                      options={currentClubs.map((c) => ({ value: c.id, label: c.name }))}
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
                      value={rosterTeamId}
                      onChange={(e: any) => setRosterTeamId(e.target.value ? Number(e.target.value) : "")}
                      options={rosterFilteredTeams.map((t) => ({ value: t.id, label: t.name }))}
                      placeholder={rosterClubId ? "Select Team..." : "Select Club first..."}
                      showPlaceholder={true}
                      disabled={!rosterClubId}
                      width="full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInlineModalType("team")}
                    title="Add New Team"
                    disabled={!rosterClubId}
                    className="px-2"
                  >
                    <Plus size={14} className="text-primary" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Sub-Modal for Inline Club / Team Creation */}
      {inlineModalType && (
        <InlineEntityModal
          entityType={inlineModalType}
          contextData={{
            clubId: rosterClubId ? Number(rosterClubId) : undefined,
            clubs: currentClubs,
            seasonId: selectedTargetSeasonId,
          }}
          onClose={() => setInlineModalType(null)}
          onSuccess={handleInlineSuccess}
        />
      )}
    </div>
  );
}
