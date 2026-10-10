"use client";

import React, { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Users,
  Plus,
  Trash2,
  Heart,
  Sparkles,
  Calendar,
  UserPlus,
  CheckCircle,
  Shield,
} from "lucide-react";
import {
  upsertTeamGroup,
  deleteTeamGroup,
  assignPlayerToGroup,
  removePlayerFromGroup,
  upsertPlayerPairing,
  deletePlayerPairing,
} from "@/lib/actions/groups-actions";
import { toast } from "sonner";

interface Player {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
}

interface GroupAssignment {
  id: number;
  group_id: number;
  player_id: number;
  role: string | null;
  people?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface TeamGroup {
  id: number;
  name: string;
  group_type: string;
  description: string | null;
  assigned_weeks_or_dates: string | null;
  player_group_assignments: GroupAssignment[];
}

interface PlayerPairing {
  id: number;
  pairing_type: string;
  player1_id: number;
  player2_id: number;
  notes: string | null;
  people_player_pairings_player1_idTopeople?: { id: number; first_name: string; last_name: string };
  people_player_pairings_player2_idTopeople?: { id: number; first_name: string; last_name: string };
}

interface TeamGroupsProps {
  teamSeasonId: number;
  players: Player[];
  groups: TeamGroup[];
  pairings: PlayerPairing[];
  canManage?: boolean;
}

export default function TeamGroups({
  teamSeasonId,
  players,
  groups: initialGroups,
  pairings: initialPairings,
  canManage = true,
}: TeamGroupsProps) {
  const [groups, setGroups] = useState<TeamGroup[]>(initialGroups);
  const [pairings, setPairings] = useState<PlayerPairing[]>(initialPairings);
  const [activeTab, setActiveTab] = useState<"duty_groups" | "sister_pairings">("duty_groups");

  const [isPending, startTransition] = useTransition();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("cleanup");
  const [assignedWeeks, setAssignedWeeks] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<number | null>(null);
  const [assignPlayerId, setAssignPlayerId] = useState<number>(players[0]?.personId || 0);

  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [player1Id, setPlayer1Id] = useState<number>(players[0]?.personId || 0);
  const [player2Id, setPlayer2Id] = useState<number>(players[1]?.personId || players[0]?.personId || 0);
  const [pairingNotes, setPairingNotes] = useState("");

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error("Enter a group name");
      return;
    }
    startTransition(async () => {
      try {
        const created = await upsertTeamGroup({
          teamSeasonId,
          name: groupName,
          groupType,
          assignedWeeksOrDates: assignedWeeks || null,
          description: groupDescription || null,
        });

        setGroups((prev) => [...prev, { ...created, player_group_assignments: [] }]);
        setIsGroupModalOpen(false);
        setGroupName("");
        setAssignedWeeks("");
        toast.success("Group created");
      } catch (err: any) {
        toast.error("Failed to create group");
      }
    });
  };

  const handleDeleteGroup = (id: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    startTransition(async () => {
      try {
        await deleteTeamGroup(id, teamSeasonId);
        setGroups((prev) => prev.filter((g) => g.id !== id));
        toast.success("Group deleted");
      } catch (err: any) {
        toast.error("Failed to delete group");
      }
    });
  };

  const handleAssignPlayer = () => {
    if (!targetGroupId) return;
    startTransition(async () => {
      try {
        await assignPlayerToGroup({
          groupId: targetGroupId,
          playerId: assignPlayerId,
          teamSeasonId,
        });

        const targetPlayer = players.find((p) => p.personId === assignPlayerId);

        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === targetGroupId) {
              const updatedAssignments = [
                ...g.player_group_assignments.filter((a) => a.player_id !== assignPlayerId),
                {
                  id: Date.now(),
                  group_id: targetGroupId,
                  player_id: assignPlayerId,
                  role: "member",
                  people: targetPlayer
                    ? {
                        id: targetPlayer.personId,
                        first_name: targetPlayer.firstName,
                        last_name: targetPlayer.lastName,
                      }
                    : undefined,
                },
              ];
              return { ...g, player_group_assignments: updatedAssignments };
            }
            return g;
          })
        );

        setIsAssignModalOpen(false);
        toast.success("Player assigned to group");
      } catch (err: any) {
        toast.error("Failed to assign player");
      }
    });
  };

  const handleRemovePlayerFromGroup = (groupId: number, playerId: number) => {
    startTransition(async () => {
      try {
        await removePlayerFromGroup(groupId, playerId, teamSeasonId);
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === groupId) {
              return {
                ...g,
                player_group_assignments: g.player_group_assignments.filter(
                  (a) => a.player_id !== playerId
                ),
              };
            }
            return g;
          })
        );
        toast.success("Player removed from group");
      } catch (err: any) {
        toast.error("Failed to remove player");
      }
    });
  };

  const handleCreatePairing = () => {
    if (player1Id === player2Id) {
      toast.error("Please select two different players for a pairing");
      return;
    }

    startTransition(async () => {
      try {
        const created = await upsertPlayerPairing({
          teamSeasonId,
          pairingType: "sister",
          player1Id,
          player2Id,
          notes: pairingNotes || null,
        });

        const p1 = players.find((p) => p.personId === player1Id);
        const p2 = players.find((p) => p.personId === player2Id);

        setPairings((prev) => [
          ...prev,
          {
            ...created,
            people_player_pairings_player1_idTopeople: p1
              ? { id: p1.personId, first_name: p1.firstName, last_name: p1.lastName }
              : undefined,
            people_player_pairings_player2_idTopeople: p2
              ? { id: p2.personId, first_name: p2.firstName, last_name: p2.lastName }
              : undefined,
          },
        ]);

        setIsPairingModalOpen(false);
        setPairingNotes("");
        toast.success("Sister/Mentor pairing created!");
      } catch (err: any) {
        toast.error("Failed to create pairing");
      }
    });
  };

  const handleDeletePairing = (id: number) => {
    startTransition(async () => {
      try {
        await deletePlayerPairing(id, teamSeasonId);
        setPairings((prev) => prev.filter((p) => p.id !== id));
        toast.success("Pairing deleted");
      } catch (err: any) {
        toast.error("Failed to delete pairing");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/40 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Users className="text-indigo-400" size={20} />
            <span>Groups, Duties & Sister Pairings</span>
          </h2>
          <p className="text-xs text-muted">
            Organize cleanup groups, ball girls/duty schedules, and Big Sister / Little Sister mentorship pairings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface/80 p-1 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => setActiveTab("duty_groups")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "duty_groups"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Duty & Cleanup Groups ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab("sister_pairings")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "sister_pairings"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Sister / Buddy Pairings ({pairings.length})
            </button>
          </div>

          {canManage && (
            <Button
              variant="primary"
              onClick={() =>
                activeTab === "duty_groups" ? setIsGroupModalOpen(true) : setIsPairingModalOpen(true)
              }
              className="text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{activeTab === "duty_groups" ? "New Group" : "New Sister Pairing"}</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === "duty_groups" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <Card key={group.id} variant="outlined" padding="md" className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-text flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      <span>{group.name}</span>
                    </h3>
                    <span className="text-[10px] uppercase font-semibold text-primary tracking-wider block">
                      {group.group_type} Group
                    </span>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1 hover:bg-surface rounded text-muted hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {group.assigned_weeks_or_dates && (
                  <div className="mt-2 text-xs text-muted flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded">
                    <Calendar size={12} className="text-muted" />
                    <span>Assigned: {group.assigned_weeks_or_dates}</span>
                  </div>
                )}

                {group.description && (
                  <p className="text-xs text-muted mt-2 italic">"{group.description}"</p>
                )}

                <div className="mt-4 space-y-1.5">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Members ({group.player_group_assignments.length})
                  </div>
                  {group.player_group_assignments.length === 0 ? (
                    <p className="text-xs text-muted italic">No players assigned yet.</p>
                  ) : (
                    group.player_group_assignments.map((assignment) => {
                      const pName = assignment.people
                        ? `${assignment.people.first_name} ${assignment.people.last_name}`
                        : `Player #${assignment.player_id}`;
                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface/30 border border-border/30"
                        >
                          <span className="font-medium text-text">{pName}</span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemovePlayerFromGroup(group.id, assignment.player_id)
                              }
                              className="text-muted hover:text-danger text-[11px]"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTargetGroupId(group.id);
                    setIsAssignModalOpen(true);
                  }}
                  className="w-full text-xs py-1.5 flex items-center justify-center gap-1"
                >
                  <UserPlus size={13} />
                  <span>Add Player to Group</span>
                </Button>
              )}
            </Card>
          ))}

          {groups.length === 0 && (
            <Card variant="outlined" padding="lg" className="col-span-full text-center py-10">
              <Users size={36} className="mx-auto text-muted mb-2 opacity-50" />
              <p className="text-xs text-muted">No duty or cleanup groups created yet.</p>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pairings.map((pairing) => {
            const p1Name = pairing.people_player_pairings_player1_idTopeople
              ? `${pairing.people_player_pairings_player1_idTopeople.first_name} ${pairing.people_player_pairings_player1_idTopeople.last_name}`
              : `Player #${pairing.player1_id}`;
            const p2Name = pairing.people_player_pairings_player2_idTopeople
              ? `${pairing.people_player_pairings_player2_idTopeople.first_name} ${pairing.people_player_pairings_player2_idTopeople.last_name}`
              : `Player #${pairing.player2_id}`;

            return (
              <Card key={pairing.id} variant="outlined" padding="md" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                    <Heart size={14} className="fill-pink-400/30" />
                    <span>Big Sister / Little Sister</span>
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDeletePairing(pairing.id)}
                      className="p-1 hover:bg-surface rounded text-muted hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 text-xs bg-surface/30 p-3 rounded-lg border border-border/40">
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-muted block uppercase">Big Sister</span>
                    <span className="font-bold text-text">{p1Name}</span>
                  </div>
                  <Heart size={16} className="text-pink-400 shrink-0" />
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-muted block uppercase">Little Sister</span>
                    <span className="font-bold text-text">{p2Name}</span>
                  </div>
                </div>

                {pairing.notes && (
                  <p className="text-xs text-muted italic">"{pairing.notes}"</p>
                )}
              </Card>
            );
          })}

          {pairings.length === 0 && (
            <Card variant="outlined" padding="lg" className="col-span-full text-center py-10">
              <Heart size={36} className="mx-auto text-pink-400/40 mb-2" />
              <p className="text-xs text-muted">No Big Sister / Little Sister pairings created yet.</p>
            </Card>
          )}
        </div>
      )}

      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Create Team Group">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-text">Group Name *</label>
            <Input
              value={groupName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroupName(e.target.value)}
              placeholder="e.g. Cleanup Crew 1, Ball Girls Group A, Locker Room Crew"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-text">Group Type</label>
              <Select value={groupType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGroupType(e.target.value)}>
                <option value="cleanup">🧹 Cleanup Crew</option>
                <option value="ball_girls">⚽ Ball Girls / Duty</option>
                <option value="general">👥 General Duty Group</option>
              </Select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-text">Assigned Weeks / Games</label>
              <Input
                value={assignedWeeks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignedWeeks(e.target.value)}
                placeholder="e.g. Weeks 1 & 4, or Home Games"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-text">Description / Tasks</label>
            <Input
              value={groupDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroupDescription(e.target.value)}
              placeholder="e.g. Responsible for equipment pickup after practice"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateGroup} isLoading={isPending}>
              Create Group
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Add Player to Group">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-text">Select Player</label>
            <Select value={assignPlayerId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAssignPlayerId(Number(e.target.value))}>
              {players.map((p) => (
                <option key={p.id} value={p.personId}>
                  #{p.jerseyNumber ?? "-"} {p.firstName} {p.lastName}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssignPlayer} isLoading={isPending}>
              Assign Player
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPairingModalOpen} onClose={() => setIsPairingModalOpen(false)} title="Create Sister / Mentor Pairing">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-text">Big Sister (Older / Mentor)</label>
            <Select value={player1Id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlayer1Id(Number(e.target.value))}>
              {players.map((p) => (
                <option key={p.id} value={p.personId}>
                  #{p.jerseyNumber ?? "-"} {p.firstName} {p.lastName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-text">Little Sister (Younger / Mentee)</label>
            <Select value={player2Id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlayer2Id(Number(e.target.value))}>
              {players.map((p) => (
                <option key={p.id} value={p.personId}>
                  #{p.jerseyNumber ?? "-"} {p.firstName} {p.lastName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-text">Notes / Special Instructions</label>
            <Input
              value={pairingNotes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPairingNotes(e.target.value)}
              placeholder="e.g. Partner for pre-game warmups"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsPairingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePairing} isLoading={isPending}>
              Create Pairing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
