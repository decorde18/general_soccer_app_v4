"use client";

import React, { useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Building, Plus, Search, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { GenericForm } from "@/components/ui/GenericForm";
import { clubConfig } from "@/lib/entities/configs/club.config";
import { teamConfig } from "@/lib/entities/configs/team.config";
import { createClub, updateClub, deleteClub } from "@/lib/actions/club-actions";
import { createTeam, updateTeam, deleteTeam } from "@/lib/actions/team-actions";
import { useSessionContext } from "@/contexts/SessionProvider";
import { getEffectiveRoles } from "@/lib/roles";
import type { Role } from "@/components/entities/types";

interface ClubRecord {
  id: number;
  name: string;
  abbreviation: string | null;
  location: string | null;
  locationId: number | null;
  logoUrl: string | null;
  foundedYear: number | null;
  contactInfo: string | null;
  type: string;
  isActive: boolean;
}

interface TeamRecord {
  id: number;
  clubId: number;
  clubName: string;
  teamName: string;
  gender: string;
  isActive: boolean;
}

interface ClubsDashboardClientProps {
  initialClubs: ClubRecord[];
  initialTeams: TeamRecord[];
}

export default function ClubsDashboardClient({
  initialClubs,
  initialTeams,
}: ClubsDashboardClientProps) {
  // Roles & permissions
  const session = useSessionContext() as any;
  const activeRoles = useMemo<Role[]>(
    () => getEffectiveRoles(session?.user?.roles),
    [session]
  );
  
  const canAdmin = activeRoles.includes("ADMIN") || activeRoles.includes("CLUB_ADMIN");
  const canDelete = activeRoles.includes("ADMIN");

  // State data lists
  const [clubs, setClubs] = useState<ClubRecord[]>(initialClubs);
  const [teams, setTeams] = useState<TeamRecord[]>(initialTeams);

  // Filter & selections
  const [clubSearch, setClubSearch] = useState("");
  const [selectedClubId, setSelectedClubId] = useState<number | null>(
    initialClubs[0]?.id || null
  );

  // Form modals state
  const [showClubForm, setShowClubForm] = useState(false);
  const [editClubRecord, setEditClubRecord] = useState<ClubRecord | null>(null);

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editTeamRecord, setEditTeamRecord] = useState<TeamRecord | null>(null);

  // Delete modals state
  const [deleteClubTarget, setDeleteClubTarget] = useState<ClubRecord | null>(null);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<TeamRecord | null>(null);

  const [isPending, startTransition] = useTransition();

  // Selected Club object
  const selectedClub = useMemo(() => {
    return clubs.find((c) => c.id === selectedClubId) || null;
  }, [selectedClubId, clubs]);

  // Filtered clubs (left pane)
  const filteredClubs = useMemo(() => {
    return clubs.filter((c) =>
      c.name.toLowerCase().includes(clubSearch.toLowerCase())
    );
  }, [clubs, clubSearch]);

  // Teams belonging to selected club
  const activeTeams = useMemo(() => {
    if (!selectedClubId) return [];
    return teams.filter((t) => t.clubId === selectedClubId);
  }, [teams, selectedClubId]);

  // teamConfig dynamic options
  const populatedTeamConfig = useMemo(() => {
    const configCopy = { ...teamConfig };
    const clubFieldIndex = configCopy.form.fields.findIndex((f) => f.key === "clubName");
    if (clubFieldIndex !== -1) {
      configCopy.form.fields[clubFieldIndex].options = clubs.map((c) => ({
        label: c.name,
        value: String(c.id),
      }));
    }
    return configCopy;
  }, [clubs]);

  // --- Club CRUD actions ---
  const handleClubSubmit = async (formData: Record<string, string>) => {
    startTransition(async () => {
      try {
        if (editClubRecord) {
          await updateClub(editClubRecord.id, formData);
          setClubs((prev) =>
            prev.map((c) =>
              c.id === editClubRecord.id
                ? {
                    ...c,
                    name: formData.name,
                    abbreviation: formData.abbreviation,
                    logoUrl: formData.logoUrl,
                    location: formData.location,
                    foundedYear: formData.foundedYear ? Number(formData.foundedYear) : null,
                    contactInfo: formData.contactInfo,
                    isActive: formData.isActive === "true",
                    type: formData.type || "club",
                  }
                : c
            )
          );
          toast.success("Club updated successfully");
        } else {
          const newClub = await createClub(formData);
          setClubs((prev) => [
            ...prev,
            {
              id: newClub.id,
              name: formData.name,
              abbreviation: formData.abbreviation || null,
              logoUrl: formData.logoUrl || null,
              location: formData.location || null,
              locationId: newClub.location_id || null,
              foundedYear: formData.foundedYear ? Number(formData.foundedYear) : null,
              contactInfo: formData.contactInfo || null,
              isActive: formData.isActive === "true",
              type: formData.type || "club",
            },
          ]);
          setSelectedClubId(newClub.id);
          toast.success("Club created successfully");
        }
        setShowClubForm(false);
        setEditClubRecord(null);
      } catch (err: any) {
        toast.error(err.message || "Action failed");
      }
    });
  };

  const handleClubDelete = async () => {
    if (!deleteClubTarget) return;
    startTransition(async () => {
      try {
        await deleteClub(deleteClubTarget.id);
        setClubs((prev) => prev.filter((c) => c.id !== deleteClubTarget.id));
        setTeams((prev) => prev.filter((t) => t.clubId !== deleteClubTarget.id));
        
        // Select another club if current was deleted
        if (selectedClubId === deleteClubTarget.id) {
          const remaining = clubs.filter((c) => c.id !== deleteClubTarget.id);
          setSelectedClubId(remaining[0]?.id || null);
        }
        toast.success("Club deleted successfully");
        setDeleteClubTarget(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete club");
      }
    });
  };

  // --- Team CRUD actions ---
  const handleTeamSubmit = async (formData: Record<string, string>) => {
    const targetClubId = Number(formData.clubId);
    const targetClubName = clubs.find((c) => c.id === targetClubId)?.name || "";

    startTransition(async () => {
      try {
        if (editTeamRecord) {
          await updateTeam(editTeamRecord.id, formData);
          setTeams((prev) =>
            prev.map((t) =>
              t.id === editTeamRecord.id
                ? {
                    ...t,
                    teamName: formData.teamName,
                    clubId: targetClubId,
                    clubName: targetClubName,
                    gender: formData.gender,
                    isActive: formData.isActive === "true",
                  }
                : t
            )
          );
          toast.success("Team updated successfully");
        } else {
          const newTeam = await createTeam(formData);
          setTeams((prev) => [
            ...prev,
            {
              id: newTeam.id,
              teamName: formData.teamName,
              clubId: targetClubId,
              clubName: targetClubName,
              gender: formData.gender,
              isActive: formData.isActive === "true",
            },
          ]);
          toast.success("Team created successfully");
        }
        setShowTeamForm(false);
        setEditTeamRecord(null);
      } catch (err: any) {
        toast.error(err.message || "Action failed");
      }
    });
  };

  const handleTeamDelete = async () => {
    if (!deleteTeamTarget) return;
    startTransition(async () => {
      try {
        await deleteTeam(deleteTeamTarget.id);
        setTeams((prev) => prev.filter((t) => t.id !== deleteTeamTarget.id));
        toast.success("Team deleted successfully");
        setDeleteTeamTarget(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete team");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Clubs & Teams</h1>
          <p className="text-muted text-sm mt-1">
            Register soccer clubs and map active playing teams to their respective organizations.
          </p>
        </div>
        {canAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setEditClubRecord(null);
              setShowClubForm(true);
            }}
            className="flex items-center gap-1.5 font-bold text-xs py-2 px-4 shadow-sm"
          >
            <Plus size={14} />
            <span>Add Club</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CLUBS LIST (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
          <h3 className="font-bold text-xs text-text uppercase tracking-wider">
            Organizations ({clubs.length})
          </h3>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search club name..."
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text placeholder:text-muted/60"
            />
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-1">
            {filteredClubs.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted">No clubs registered.</div>
            ) : (
              filteredClubs.map((club) => {
                const isSelected = club.id === selectedClubId;
                return (
                  <div
                    key={club.id}
                    onClick={() => setSelectedClubId(club.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary/25 shadow-sm font-bold text-primary"
                        : "bg-background/40 hover:bg-background/70 border-border/40 hover:border-border/80 text-text"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs truncate block">{club.name}</span>
                      <span className="text-[10px] text-muted font-normal block truncate">
                        {club.type === "high_school" ? "High School" : "Soccer Club"}{" "}
                        {club.abbreviation ? `(${club.abbreviation})` : ""}
                      </span>
                    </div>

                    {canAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0 opacity-70 hover:opacity-100 pl-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditClubRecord(club);
                            setShowClubForm(true);
                          }}
                          className="p-1 hover:bg-primary/10 text-muted hover:text-primary rounded"
                        >
                          <Edit2 size={12} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteClubTarget(club);
                            }}
                            className="p-1 hover:bg-danger/10 text-muted hover:text-danger rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CLUB TEAMS LIST & CRUD (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedClub ? (
            <div className="bg-surface border border-border/80 rounded-2xl p-5 shadow-sm space-y-6">
              {/* Club details summary */}
              <div className="flex items-start justify-between border-b border-border/45 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary">
                    <Building size={18} />
                    <h2 className="font-extrabold text-xl text-text leading-none">
                      {selectedClub.name}
                    </h2>
                  </div>
                  <p className="text-xs text-muted font-medium pl-6">
                    {selectedClub.type === "high_school" ? "High School Division" : "Club Organization"}
                    {selectedClub.foundedYear ? ` • Founded in ${selectedClub.foundedYear}` : ""}
                    {selectedClub.location ? ` • Located: ${selectedClub.location}` : ""}
                  </p>
                </div>
              </div>

              {/* Club Teams table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-text uppercase tracking-wider">
                    Assigned Playing Teams ({activeTeams.length})
                  </h3>
                  {canAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditTeamRecord(null);
                        setShowTeamForm(true);
                      }}
                      className="flex items-center gap-1 font-bold text-[10px] py-1.5 px-3 rounded-lg"
                    >
                      <Plus size={12} />
                      <span>Add Team</span>
                    </Button>
                  )}
                </div>

                {activeTeams.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted bg-background/20 border border-dashed border-border rounded-xl">
                    No teams are registered under this organization yet. Click &quot;Add Team&quot; to configure one.
                  </div>
                ) : (
                  <div className="border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/50 bg-background/15">
                    {activeTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex justify-between items-center p-3.5 hover:bg-background/25 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-text block truncate">{team.teamName}</span>
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-border text-muted">
                              {team.gender}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Active badge */}
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            {team.isActive ? (
                              <span className="text-success flex items-center gap-1">
                                <CheckCircle size={12} /> Active
                              </span>
                            ) : (
                              <span className="text-muted flex items-center gap-1">
                                <XCircle size={12} /> Inactive
                              </span>
                            )}
                          </div>

                          {/* Action icons */}
                          {canAdmin && (
                            <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
                              <button
                                onClick={() => {
                                  setEditTeamRecord(team);
                                  setShowTeamForm(true);
                                }}
                                className="p-1 hover:bg-primary/10 text-muted hover:text-primary rounded transition-colors"
                              >
                                <Edit2 size={12} />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => setDeleteTeamTarget(team)}
                                  className="p-1 hover:bg-danger/10 text-muted hover:text-danger rounded transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface/30 border border-dashed border-border rounded-2xl py-24 text-center text-xs text-muted">
              Select an organization from the left panel to review profiles and manage teams.
            </div>
          )}
        </div>
      </div>

      {/* --- FORM MODALS --- */}
      {/* Club Form */}
      {showClubForm && (
        <GenericForm
          config={clubConfig}
          initialData={editClubRecord as any}
          onSubmit={handleClubSubmit as any}
          onCancel={() => {
            setShowClubForm(false);
            setEditClubRecord(null);
          }}
        />
      )}

      {/* Team Form */}
      {showTeamForm && (
        <GenericForm
          config={populatedTeamConfig}
          initialData={
            (editTeamRecord || {
              clubId: String(selectedClubId),
              clubName: selectedClub?.name || "",
              isActive: "true",
              gender: "Mixed",
            }) as any
          }
          onSubmit={handleTeamSubmit as any}
          onCancel={() => {
            setShowTeamForm(false);
            setEditTeamRecord(null);
          }}
        />
      )}

      {/* --- DELETE CONFIRMS --- */}
      <Dialog
        isOpen={!!deleteClubTarget}
        onClose={() => setDeleteClubTarget(null)}
        title="Delete Club"
        message={`Are you sure you want to delete ${deleteClubTarget?.name || ""}? All child playing teams will also be deleted. This cannot be undone.`}
        type="error"
        confirmText="Delete Club"
        cancelText="Cancel"
        onConfirm={handleClubDelete}
      />

      <Dialog
        isOpen={!!deleteTeamTarget}
        onClose={() => setDeleteTeamTarget(null)}
        title="Delete Team"
        message={`Are you sure you want to delete ${deleteTeamTarget?.teamName || ""}? All team rosters, matches, and event mappings for this team will be permanently deleted. This cannot be undone.`}
        type="error"
        confirmText="Delete Team"
        cancelText="Cancel"
        onConfirm={handleTeamDelete}
      />
    </div>
  );
}
