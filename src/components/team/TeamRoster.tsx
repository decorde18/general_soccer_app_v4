"use client";

import React, { useState, useMemo, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Grid, List, Search, Star, User, Plus, Edit2, Trash2, UserPlus, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  addPlayerToRoster,
  updateRosterPlayer,
  removePlayerFromRoster,
  assignTeamStaff,
  removeTeamStaff,
  searchPeople,
} from "@/lib/actions/roster-actions";

import Dialog from "@/components/ui/Dialog";

interface Player {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  jerseyNumber: number | null;
  position: string | null;
  grade: string | null;
  status: string;
  captain: boolean;
  isActive: boolean;
}

interface TeamStaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

interface TeamRosterProps {
  teamSeasonId: number;
  players: Player[];
  staff?: TeamStaffMember[];
}

export default function TeamRoster({ teamSeasonId, players, staff = [] }: TeamRosterProps) {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Dialog state for removals
  const [playerToRemove, setPlayerToRemove] = useState<number | null>(null);
  const [staffToRemove, setStaffToRemove] = useState<number | null>(null);

  // Edit player modal state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editJersey, setEditJersey] = useState<string>("");
  const [editPosition, setEditPosition] = useState<string>("");
  const [editGrade, setEditGrade] = useState<string>("");
  const [editCaptain, setEditCaptain] = useState<boolean>(false);

  // Add player modal state
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: number; firstName: string; lastName: string; email: string | null }>>([]);
  const [selectedPerson, setSelectedPerson] = useState<{ id: number; firstName: string; lastName: string } | null>(null);
  const [addJersey, setAddJersey] = useState("");
  const [addPosition, setAddPosition] = useState("");
  const [addGrade, setAddGrade] = useState("");
  const [addCaptain, setAddCaptain] = useState(false);

  // Add staff modal state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [selectedStaffPerson, setSelectedStaffPerson] = useState<{ id: number; firstName: string; lastName: string } | null>(null);
  const [staffRole, setStaffRole] = useState<"head_coach" | "assistant_coach" | "team_admin" | "stats_keeper">("assistant_coach");

  const canManage = Boolean(session?.user);

  // Filter roster based on search input
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      const nickname = (player.nickname || "").toLowerCase();
      const pos = (player.position || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      
      return fullName.includes(query) || nickname.includes(query) || pos.includes(query);
    });
  }, [players, searchQuery]);

  const handleSearchPeople = async (q: string) => {
    setPersonSearch(q);
    if (q.trim().length >= 2) {
      const results = await searchPeople(q);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSaveEditPlayer = () => {
    if (!editingPlayer) return;
    startTransition(async () => {
      await updateRosterPlayer(editingPlayer.id, {
        jerseyNumber: editJersey ? Number(editJersey) : null,
        position: editPosition || null,
        grade: editGrade || null,
        captain: editCaptain,
      });
      setEditingPlayer(null);
    });
  };

  const confirmRemovePlayer = () => {
    if (!playerToRemove) return;
    const pId = playerToRemove;
    setPlayerToRemove(null);
    startTransition(async () => {
      await removePlayerFromRoster(pId);
      setEditingPlayer(null);
    });
  };

  const confirmRemoveStaff = () => {
    if (!staffToRemove) return;
    const sId = staffToRemove;
    setStaffToRemove(null);
    startTransition(async () => {
      await removeTeamStaff(sId);
    });
  };

  const handleAddPlayer = () => {
    if (!selectedPerson) return;
    startTransition(async () => {
      await addPlayerToRoster({
        teamSeasonId,
        personId: selectedPerson.id,
        jerseyNumber: addJersey ? Number(addJersey) : null,
        position: addPosition || null,
        grade: addGrade || null,
        captain: addCaptain,
      });
      setIsAddPlayerOpen(false);
      setSelectedPerson(null);
      setPersonSearch("");
      setAddJersey("");
      setAddPosition("");
      setAddGrade("");
      setAddCaptain(false);
    });
  };

  const handleAddStaff = () => {
    if (!selectedStaffPerson) return;
    startTransition(async () => {
      await assignTeamStaff({
        teamSeasonId,
        personId: selectedStaffPerson.id,
        role: staffRole,
      });
      setIsAddStaffOpen(false);
      setSelectedStaffPerson(null);
      setPersonSearch("");
    });
  };

  return (
    <div className="space-y-6">
      
      {/* FILTER & TOGGLE & ADD CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border/80 p-4 rounded-2xl shadow-sm">
        
        {/* Search input */}
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text"
            placeholder="Search players by name, nickname, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text placeholder:text-muted/65 transition-all"
          />
        </div>

        {/* View mode toggle & Action Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddPlayerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all"
              >
                <UserPlus size={15} />
                <span>Add Player</span>
              </button>

              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-text bg-background border border-border hover:bg-border/30 rounded-xl shadow-sm transition-all"
              >
                <ShieldCheck size={15} />
                <span>Add Staff</span>
              </button>
            </div>
          )}

          <div className="inline-flex rounded-xl bg-background border border-border/60 p-1">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary text-white" : "text-muted hover:text-text"}`}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-white" : "text-muted hover:text-text"}`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* STAFF LIST SECTION */}
      {staff && staff.length > 0 && (
        <Card variant="outlined" padding="md" className="bg-surface/50 border-border/70">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-primary" />
            <span>Coaching & Team Staff</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/60">
                <div>
                  <p className="font-bold text-xs text-text">{s.firstName} {s.lastName}</p>
                  <p className="text-[10px] text-muted capitalize">{s.role.replace("_", " ")}</p>
                </div>
                {canManage && (
                  <button
                    onClick={() => setStaffToRemove(s.id)}
                    className="p-1 text-muted hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Remove staff"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* NO PLAYERS PLACEHOLDER */}
      {filteredPlayers.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center py-16">
          <User size={40} className="mx-auto text-muted/60 mb-3" />
          <p className="text-muted font-medium">No players found matching your search.</p>
        </Card>
      ) : viewMode === "grid" ? (
        
        /* GRID LAYOUT (CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <Card 
              key={player.id} 
              variant="hover" 
              padding="none" 
              className="relative overflow-hidden border-border/80 bg-surface flex flex-col h-full group"
            >
              {/* Photo / Avatar Placeholder Header */}
              <div className="relative w-full h-32 bg-gradient-to-b from-primary/10 via-surface/60 to-surface flex items-center justify-center border-b border-border/40 overflow-hidden">
                <div className="h-16 w-16 rounded-full bg-surface/90 border-2 border-primary/20 flex items-center justify-center text-muted/60 shadow-inner group-hover:scale-105 transition-transform">
                  <User size={32} className="text-muted/40" />
                </div>
                
                {/* Jersey Badge Overlay */}
                <div className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white font-black text-xs shadow-sm">
                  {player.jerseyNumber !== null ? `#${player.jerseyNumber}` : "--"}
                </div>

                {/* Status / Captain / Edit Badges */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                  {canManage && (
                    <button
                      onClick={() => {
                        setEditingPlayer(player);
                        setEditJersey(player.jerseyNumber !== null ? String(player.jerseyNumber) : "");
                        setEditPosition(player.position || "");
                        setEditGrade(player.grade || "");
                        setEditCaptain(player.captain);
                      }}
                      className="p-1.5 rounded-lg bg-background/80 hover:bg-primary hover:text-white text-text border border-border shadow-sm transition-all"
                      title="Edit Player"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  {player.captain && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full shadow-sm">
                      <Star size={10} className="fill-amber-500 text-amber-500" />
                      <span>Captain</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                {/* Name and Position */}
                <div>
                  <h3 className="font-extrabold text-text text-base leading-snug">
                    {player.firstName} {player.lastName}
                    {player.nickname && (
                      <span className="text-muted text-xs font-normal italic block mt-0.5">
                        "{player.nickname}"
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {player.position && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {player.position}
                      </span>
                    )}
                    {player.grade && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                        Grade {player.grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        
        /* TABLE/LIST LAYOUT */
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-surface shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[10px] font-bold uppercase tracking-wider text-muted leading-tight">
                <th className="py-2 px-3 w-14 text-center">Jersey</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Position</th>
                <th className="py-2 px-3">Class/Grade</th>
                <th className="py-2 px-3 w-28 text-center">Roles / Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr 
                  key={player.id} 
                  className="border-b border-border/60 hover:bg-background/25 last:border-none transition-colors"
                >
                  <td className="py-2 px-3 font-black text-primary text-center text-xs">
                    {player.jerseyNumber !== null ? `#${player.jerseyNumber}` : "--"}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-text text-xs">
                      {player.firstName} {player.lastName}
                      {player.nickname && (
                        <span className="text-muted text-[10px] font-normal italic ml-1">
                          ({player.nickname})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-xs text-text/80 font-medium">
                    {player.position || "--"}
                  </td>
                  <td className="py-2 px-3 text-xs text-text/80 font-medium">
                    {player.grade ? `Grade ${player.grade}` : "--"}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {player.captain && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Star size={10} className="fill-amber-500 text-amber-500" />
                          <span>Captain</span>
                        </span>
                      )}
                      {canManage && (
                        <button
                          onClick={() => {
                            setEditingPlayer(player);
                            setEditJersey(player.jerseyNumber !== null ? String(player.jerseyNumber) : "");
                            setEditPosition(player.position || "");
                            setEditGrade(player.grade || "");
                            setEditCaptain(player.captain);
                          }}
                          className="p-1 text-muted hover:text-primary rounded-lg transition-colors"
                          title="Edit Roster Entry"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-text">
              Edit Roster Entry: {editingPlayer.firstName} {editingPlayer.lastName}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted uppercase">Jersey Number</label>
                <input
                  type="number"
                  value={editJersey}
                  onChange={(e) => setEditJersey(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase">Position</label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder="e.g. Midfielder, Forward, GK"
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase">Grade / Class</label>
                <input
                  type="text"
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  placeholder="e.g. 10, Senior, 2026"
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editCaptain"
                  checked={editCaptain}
                  onChange={(e) => setEditCaptain(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="editCaptain" className="text-xs font-bold text-text">
                  Team Captain
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setPlayerToRemove(editingPlayer.id)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
              >
                <Trash2 size={14} />
                <span>Remove Player</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-3 py-1.5 text-xs font-bold text-muted hover:text-text rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditPlayer}
                  disabled={isPending}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PLAYER MODAL */}
      {isAddPlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-text">Add Player to Roster</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted uppercase">Search Person Directory</label>
                <input
                  type="text"
                  value={personSearch}
                  onChange={(e) => handleSearchPeople(e.target.value)}
                  placeholder="Type name or email..."
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                />
                {searchResults.length > 0 && (
                  <div className="mt-1 max-h-36 overflow-y-auto border border-border rounded-xl bg-background divide-y divide-border/60">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPerson(p);
                          setSearchResults([]);
                          setPersonSearch(`${p.firstName} ${p.lastName}`);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-surface text-xs font-medium text-text flex items-center justify-between"
                      >
                        <span>{p.firstName} {p.lastName}</span>
                        <span className="text-muted text-[10px]">{p.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPerson && (
                  <div className="mt-2 text-xs font-bold text-primary">
                    Selected: {selectedPerson.firstName} {selectedPerson.lastName}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase">Jersey Number</label>
                <input
                  type="number"
                  value={addJersey}
                  onChange={(e) => setAddJersey(e.target.value)}
                  placeholder="e.g. 7"
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase">Position</label>
                <input
                  type="text"
                  value={addPosition}
                  onChange={(e) => setAddPosition(e.target.value)}
                  placeholder="e.g. Defender"
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase">Grade / Class</label>
                <input
                  type="text"
                  value={addGrade}
                  onChange={(e) => setAddGrade(e.target.value)}
                  placeholder="e.g. 11"
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addCaptain"
                  checked={addCaptain}
                  onChange={(e) => setAddCaptain(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="addCaptain" className="text-xs font-bold text-text">
                  Team Captain
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAddPlayerOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-muted hover:text-text rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPlayer}
                disabled={!selectedPerson || isPending}
                className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl shadow-sm"
              >
                Add to Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-text">Assign Team Staff</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted uppercase">Search Person Directory</label>
                <input
                  type="text"
                  value={personSearch}
                  onChange={(e) => handleSearchPeople(e.target.value)}
                  placeholder="Type name or email..."
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                />
                {searchResults.length > 0 && (
                  <div className="mt-1 max-h-36 overflow-y-auto border border-border rounded-xl bg-background divide-y divide-border/60">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffPerson(p);
                          setSearchResults([]);
                          setPersonSearch(`${p.firstName} ${p.lastName}`);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-surface text-xs font-medium text-text flex items-center justify-between"
                      >
                        <span>{p.firstName} {p.lastName}</span>
                        <span className="text-muted text-[10px]">{p.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedStaffPerson && (
                  <div className="mt-2 text-xs font-bold text-primary">
                    Selected: {selectedStaffPerson.firstName} {selectedStaffPerson.lastName}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase">Staff Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
                >
                  <option value="head_coach">Head Coach</option>
                  <option value="assistant_coach">Assistant Coach</option>
                  <option value="team_admin">Team Admin</option>
                  <option value="stats_keeper">Stats Keeper</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-muted hover:text-text rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                disabled={!selectedStaffPerson || isPending}
                className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl shadow-sm"
              >
                Assign Staff Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOGS */}
      <Dialog
        isOpen={Boolean(playerToRemove)}
        onClose={() => setPlayerToRemove(null)}
        title="Remove Player from Roster"
        message="Are you sure you want to remove this player from the team roster?"
        type="warning"
        confirmText="Yes, Remove"
        cancelText="Cancel"
        onConfirm={confirmRemovePlayer}
      />

      <Dialog
        isOpen={Boolean(staffToRemove)}
        onClose={() => setStaffToRemove(null)}
        title="Remove Team Staff Member"
        message="Are you sure you want to remove this staff member from the team?"
        type="warning"
        confirmText="Yes, Remove"
        cancelText="Cancel"
        onConfirm={confirmRemoveStaff}
      />

    </div>
  );
}
