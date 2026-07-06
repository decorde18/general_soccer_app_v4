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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  addGuestPlayersToGames,
  removeGuestPlayerFromGame,
  getGuestPlayerOptionsAction,
  getGamesAction,
  getExistingGuestPlayersAction,
} from "@/lib/actions/guestPlayer-actions";

interface GuestPlayersClientProps {
  clubs: { id: number; name: string }[];
  ageGroups: { id: number; name: string }[];
  teams: { id: number; name: string; clubId: number }[];
  teamSeasons: { id: number; teamName: string; clubName: string; seasonName: string }[];
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

  // Pending states
  const [isPending, startTransition] = useTransition();
  const [isPlayersLoading, setIsPlayersLoading] = useState(false);
  const [isGamesLoading, setIsGamesLoading] = useState(false);
  const [isExistingLoading, setIsExistingLoading] = useState(false);

  // Filtered teams list based on selected club
  const filteredTeams = React.useMemo(() => {
    if (!selectedClubId) return teams;
    return teams.filter((t) => t.clubId === Number(selectedClubId));
  }, [selectedClubId, teams]);

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
  }, [selectedClubId, selectedAgeGroupId, selectedTeamId, playerSearchQuery]);

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
  const handleRemoveGuest = async (playerGameId: number, name: string) => {
    if (!confirm(`Are you sure you want to remove guest player ${name}?`)) return;

    try {
      await removeGuestPlayerFromGame(playerGameId, Number(targetTeamSeasonId));
      toast.success(`Removed guest player ${name}.`);
      // Reload existing guests
      const guests = await getExistingGuestPlayersAction(Array.from(selectedGameIds));
      setExistingGuests(guests);
    } catch (err: any) {
      toast.error("Failed to remove guest player: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">
          Guest Player Assignment
        </h1>
        <p className="text-muted text-sm mt-1">
          Search for rostered players from any club, select target matches, and add them as guest players in bulk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PLAYER FILTER & SELECT (6 cols) */}
        <div className="lg:col-span-6 bg-surface border border-border/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col max-h-[78vh]">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Users size={16} className="text-primary" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">
              Step 1: Select Roster Players
            </h3>
          </div>

          {/* Player Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Club Filter */}
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                Club Organization
              </label>
              <select
                value={selectedClubId}
                onChange={(e) => {
                  setSelectedClubId(e.target.value);
                  setSelectedTeamId("");
                }}
                className="w-full text-xs py-1.5 px-2 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text"
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
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                Roster Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text"
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
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                Age Bracket
              </label>
              <select
                value={selectedAgeGroupId}
                onChange={(e) => setSelectedAgeGroupId(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text"
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search player name or email..."
              value={playerSearchQuery}
              onChange={(e) => setPlayerSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text placeholder:text-muted/60"
            />
          </div>

          {/* Players Selection Header / Count */}
          <div className="flex items-center justify-between text-xs font-semibold text-muted bg-background/50 border border-border/40 px-3 py-1.5 rounded-xl">
            <button
              onClick={handleSelectAllPlayers}
              className="flex items-center gap-1.5 hover:text-text text-left transition-colors"
            >
              {selectedPlayerIds.size === playersList.length && playersList.length > 0 ? (
                <CheckSquare size={14} className="text-primary" />
              ) : (
                <Square size={14} />
              )}
              <span>Select All Players ({playersList.length})</span>
            </button>
            <span>{selectedPlayerIds.size} Selected</span>
          </div>

          {/* Players List Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 min-h-[30vh]">
            {isPlayersLoading ? (
              <div className="flex justify-center items-center py-16 gap-2 text-xs text-muted">
                <Loader2 className="animate-spin text-primary" size={16} />
                <span>Loading players...</span>
              </div>
            ) : playersList.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted font-medium bg-background/25 border border-dashed border-border rounded-xl">
                No rostered players match your filters.
              </div>
            ) : (
              playersList.map((player) => {
                const isSelected = selectedPlayerIds.has(player.personId);
                return (
                  <div
                    key={player.personId}
                    onClick={() => togglePlayerSelect(player.personId)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary/25 shadow-sm"
                        : "bg-background/40 hover:bg-background/70 border-border/40 hover:border-border/80"
                    }`}
                  >
                    <div className="shrink-0 text-muted">
                      {isSelected ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-xs text-text truncate">
                          {player.firstName} {player.lastName}
                        </span>
                        {player.ageGroupName && (
                          <span className="text-[9px] px-1 bg-border rounded-full scale-90 text-muted font-semibold">
                            {player.ageGroupName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted truncate mt-0.5">
                        {player.clubName} • {player.teamName}
                      </div>
                    </div>
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
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[30vh]">
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
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary/25 shadow-sm"
                        : "bg-background/40 hover:bg-background/70 border-border/40 hover:border-border/80"
                    }`}
                  >
                    <div className="shrink-0 text-muted">
                      {isSelected ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-muted">
                        <span className="font-semibold">{game.startDate} {game.startTime || ""}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90 ${
                          isHome ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {isHome ? "Home" : "Away"}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-text truncate">
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
                  className="flex justify-between items-center p-3 hover:bg-background/35 transition-colors text-xs"
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
                    onClick={() => handleRemoveGuest(guest.playerGameId, `${guest.firstName} ${guest.lastName}`)}
                    className="p-1.5 hover:bg-danger/10 text-muted hover:text-danger rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] border border-transparent hover:border-danger/15"
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
    </div>
  );
}
