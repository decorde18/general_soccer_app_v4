"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Shirt,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Layers,
  Package,
  UserCheck,
} from "lucide-react";
import {
  upsertUniformKitAction,
  addUniformJerseysBatchAction,
  toggleJerseyLostAction,
  assignKitToSeasonSquadAction,
  assignJerseyToPlayerAction,
  toggleUniformReturnedAction,
  deleteUniformAssignmentAction,
} from "@/lib/actions/uniform-actions";
import { toast } from "sonner";

interface Player {
  id: number; // player_teams.id
  personId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  squadLevel?: string | null;
}

interface TeamUniformsProps {
  teamSeasonId: number;
  seasonId: number;
  seasonName: string;
  clubId: number;
  players: Player[];
  initialKits: any[];
  initialSeasonKits: any[];
  initialAssignments: any[];
  canManage?: boolean;
}

export default function TeamUniforms({
  teamSeasonId,
  seasonId,
  seasonName,
  clubId,
  players,
  initialKits = [],
  initialSeasonKits = [],
  initialAssignments = [],
  canManage = true,
}: TeamUniformsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"assignments" | "inventory">("assignments");
  const [kits, setKits] = useState<any[]>(initialKits);
  const [seasonKits, setSeasonKits] = useState<any[]>(initialSeasonKits);
  const [assignments, setAssignments] = useState<any[]>(initialAssignments);
  const [selectedKitId, setSelectedKitId] = useState<number>(initialKits[0]?.id || 0);
  const [isPending, startTransition] = useTransition();

  // Kit Creation Modal
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [kitType, setKitType] = useState("Jersey");
  const [kitBrand, setKitBrand] = useState("Adidas");
  const [kitStyle, setKitStyle] = useState("");
  const [kitColor, setKitColor] = useState("Navy");
  const [kitYear, setKitYear] = useState(String(new Date().getFullYear()));

  // Add Jerseys to Kit Modal
  const [isAddJerseysModalOpen, setIsAddJerseysModalOpen] = useState(false);
  const [numbersInput, setNumbersInput] = useState("1-25");
  const [jerseySize, setJerseySize] = useState("M");

  // Assign Jersey to Player Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlayerTeamId, setSelectedPlayerTeamId] = useState<string>(
    players[0] ? String(players[0].id) : ""
  );
  const [assignKitId, setAssignKitId] = useState<string>(
    initialKits[0] ? String(initialKits[0].id) : ""
  );
  const [selectedJerseyId, setSelectedJerseyId] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<string>("primary");

  const activeKit = useMemo(
    () => kits.find((k) => k.id === selectedKitId) || kits[0] || null,
    [kits, selectedKitId]
  );

  const availableJerseysForAssign = useMemo(() => {
    const kit = kits.find((k) => String(k.id) === assignKitId);
    if (!kit || !kit.uniform_jerseys) return [];
    return kit.uniform_jerseys.filter((j: any) => !j.is_lost);
  }, [kits, assignKitId]);

  const handleCreateKit = () => {
    if (!kitStyle.trim() && !kitColor.trim()) {
      toast.error("Please enter a kit style or color");
      return;
    }

    startTransition(async () => {
      const res = await upsertUniformKitAction({
        clubId,
        type: kitType,
        brand: kitBrand,
        style: kitStyle,
        color: kitColor,
        year: kitYear ? parseInt(kitYear, 10) : null,
        isActive: true,
        teamSeasonId,
      });

      if (res.success && res.kit) {
        setKits((prev) => [res.kit, ...prev]);
        setSelectedKitId(res.kit.id);
        setIsKitModalOpen(false);
        setKitStyle("");
        toast.success("Uniform kit added to inventory!");
      } else {
        toast.error(res.error || "Failed to create uniform kit");
      }
    });
  };

  const handleBatchAddJerseys = () => {
    if (!activeKit) return;
    const nums: number[] = [];
    const parts = numbersInput.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end) && end >= start && end - start <= 100) {
          for (let i = start; i <= end; i++) nums.push(i);
        }
      } else {
        const n = parseInt(part, 10);
        if (!isNaN(n)) nums.push(n);
      }
    }

    if (nums.length === 0) {
      toast.error("Enter valid jersey numbers (e.g. 1-24 or 1,2,3)");
      return;
    }

    startTransition(async () => {
      const res = await addUniformJerseysBatchAction({
        uniformKitId: activeKit.id,
        numbers: nums,
        size: jerseySize,
        teamSeasonId,
      });

      if (res.success && res.jerseys) {
        setKits((prev) =>
          prev.map((k) =>
            k.id === activeKit.id
              ? {
                  ...k,
                  uniform_jerseys: [...(k.uniform_jerseys || []), ...res.jerseys].sort(
                    (a: any, b: any) => a.jersey_number - b.jersey_number
                  ),
                }
              : k
          )
        );
        setIsAddJerseysModalOpen(false);
        toast.success(`Added ${res.jerseys.length} items to kit!`);
      } else {
        toast.error(res.error || "Failed to add jerseys");
      }
    });
  };

  const handleToggleLost = (jerseyId: number, currentLost: boolean) => {
    startTransition(async () => {
      const res = await toggleJerseyLostAction(jerseyId, !currentLost, teamSeasonId);
      if (res.success) {
        setKits((prev) =>
          prev.map((k) => ({
            ...k,
            uniform_jerseys: (k.uniform_jerseys || []).map((j: any) =>
              j.id === jerseyId ? { ...j, is_lost: !currentLost } : j
            ),
          }))
        );
        toast.success(!currentLost ? "Marked as lost" : "Restored to active inventory");
      }
    });
  };

  const handleAssignJersey = () => {
    if (!selectedPlayerTeamId || !selectedJerseyId) {
      toast.error("Please select both a player and a jersey number");
      return;
    }

    startTransition(async () => {
      const res = await assignJerseyToPlayerAction({
        playerTeamId: Number(selectedPlayerTeamId),
        uniformJerseyId: Number(selectedJerseyId),
        assignmentType,
        teamSeasonId,
      });

      if (res.success && res.assignment) {
        setAssignments((prev) => [...prev, res.assignment]);
        setIsAssignModalOpen(false);
        toast.success("Uniform assigned to player!");
      } else {
        toast.error(res.error || "Failed to assign uniform");
      }
    });
  };

  const handleToggleReturned = (assignmentId: number, currentReturned: boolean) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, returned: !currentReturned } : a))
    );
    startTransition(async () => {
      const res = await toggleUniformReturnedAction(assignmentId, !currentReturned, teamSeasonId);
      if (!res.success) {
        toast.error("Failed to update return status");
      }
    });
  };

  const handleDeleteAssignment = (assignmentId: number) => {
    const prev = [...assignments];
    setAssignments((list) => list.filter((a) => a.id !== assignmentId));
    startTransition(async () => {
      const res = await deleteUniformAssignmentAction(assignmentId, teamSeasonId);
      if (!res.success) {
        setAssignments(prev);
        toast.error("Failed to remove assignment");
      } else {
        toast.success("Assignment removed");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/60 p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Shirt className="text-primary" size={20} />
            <span>Uniform Inventory & Player Kit Assignments</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Track team kits (Jerseys, Shorts, GK Kits), sizes, lost items, and player primary/secondary/GK jersey checkouts across seasons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-background p-1 rounded-xl border border-border">
            <Button
              type="button"
              variant={activeSubTab === "assignments" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveSubTab("assignments")}
              className="text-xs px-3 py-1.5 rounded-lg"
            >
              <UserCheck size={14} className="mr-1.5" />
              <span>Player Assignments ({assignments.length})</span>
            </Button>
            <Button
              type="button"
              variant={activeSubTab === "inventory" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveSubTab("inventory")}
              className="text-xs px-3 py-1.5 rounded-lg"
            >
              <Package size={14} className="mr-1.5" />
              <span>Kit Inventory ({kits.length})</span>
            </Button>
          </div>

          {canManage && activeSubTab === "assignments" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Assign Uniform</span>
            </Button>
          )}

          {canManage && activeSubTab === "inventory" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsKitModalOpen(true)}
              className="text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>New Uniform Kit</span>
            </Button>
          )}
        </div>
      </div>

      {/* Season Assigned Kits Summary Pills */}
      {seasonKits.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-surface/40 border border-border/60 rounded-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1">
            {seasonName} Squad Kits:
          </span>
          {seasonKits.map((sk) => (
            <span
              key={sk.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-xs font-semibold text-text"
            >
              <span className="px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold text-[10px] uppercase">
                {sk.squad_level}
              </span>
              <span>
                {sk.uniform_kits?.color} {sk.uniform_kits?.brand} {sk.uniform_kits?.style} ({sk.uniform_kits?.type})
              </span>
            </span>
          ))}
        </div>
      )}

      {/* SUB-TAB 1: PLAYER ASSIGNMENTS */}
      {activeSubTab === "assignments" && (
        <Card variant="outlined" padding="none" className="overflow-hidden">
          {assignments.length === 0 ? (
            <div className="text-center py-14 px-4">
              <Shirt size={40} className="mx-auto text-muted/60 mb-3" />
              <h3 className="text-base font-bold text-text mb-1">No Uniform Assignments for {seasonName}</h3>
              <p className="text-xs text-muted max-w-md mx-auto mb-4">
                Assign primary, secondary, match, or goalkeeper jerseys and shorts to rostered players.
              </p>
              {canManage && (
                <Button variant="primary" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                  <Plus size={14} className="mr-1.5" />
                  <span>Assign First Uniform</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-surface/90 border-b border-border text-[11px] uppercase tracking-wider font-bold text-muted">
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-3 text-center">Role / Type</th>
                    <th className="py-3 px-3 text-center">Jersey #</th>
                    <th className="py-3 px-3 text-center">Size</th>
                    <th className="py-3 px-4">Kit Set (Color / Style / Type)</th>
                    <th className="py-3 px-3 text-center">Returned</th>
                    {canManage && <th className="py-3 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {assignments.map((a) => {
                    const person = a.player_teams?.people;
                    const jersey = a.uniform_jerseys;
                    const kit = jersey?.uniform_kits;
                    return (
                      <tr key={a.id} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-text">
                          {person ? `${person.last_name}, ${person.first_name}` : "Player"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                            {a.assignment_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-extrabold text-primary">
                          #{jersey?.jersey_number ?? "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-xs text-muted">
                          {jersey?.size || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-text">
                          {kit ? (
                            <span>
                              <strong>{kit.color}</strong> {kit.brand} {kit.style} ({kit.type},{" "}
                              {kit.year || "N/A"})
                            </span>
                          ) : (
                            <span className="text-muted">Standard Roster Number (#{jersey?.jersey_number})</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggleReturned(a.id, Boolean(a.returned))}
                            className={`text-xs px-2 py-0.5 h-auto ${
                              a.returned ? "text-emerald-400 font-bold" : "text-muted"
                            }`}
                          >
                            {a.returned ? "✓ Returned" : "Checked Out"}
                          </Button>
                        </td>
                        {canManage && (
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleDeleteAssignment(a.id)}
                              className="text-muted hover:text-danger p-1 h-auto"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* SUB-TAB 2: KIT INVENTORY */}
      {activeSubTab === "inventory" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kit Selector Sidebar */}
          <div className="space-y-2.5">
            {kits.map((k) => {
              const isSelected = activeKit?.id === k.id;
              const totalCount = k.uniform_jerseys?.length || 0;
              const lostCount = (k.uniform_jerseys || []).filter((j: any) => j.is_lost).length;
              return (
                <Card
                  key={k.id}
                  variant="outlined"
                  padding="sm"
                  onClick={() => setSelectedKitId(k.id)}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "hover:border-border/80 bg-surface/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-text">
                          {k.color || "Standard"} {k.type}
                        </span>
                        {!k.is_active && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted/20 text-muted">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        {k.brand} {k.style} • {k.year || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-primary">
                        {totalCount - lostCount}/{totalCount}
                      </span>
                      {lostCount > 0 && (
                        <span className="block text-[10px] text-danger">{lostCount} lost</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Active Kit Items Grid */}
          <div className="lg:col-span-2">
            {activeKit ? (
              <Card variant="outlined" padding="md" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-text">
                      {activeKit.color} {activeKit.brand} {activeKit.style} ({activeKit.type})
                    </h3>
                    <p className="text-xs text-muted">
                      Purchased Year: {activeKit.year || "N/A"} •{" "}
                      {(activeKit.uniform_jerseys || []).length} total pieces
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddJerseysModalOpen(true)}
                      className="text-xs"
                    >
                      <Plus size={14} className="mr-1" />
                      <span>Add Numbers / Sizes</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                  {(activeKit.uniform_jerseys || []).map((j: any) => (
                    <div
                      key={j.id}
                      onClick={() => canManage && handleToggleLost(j.id, Boolean(j.is_lost))}
                      title={j.is_lost ? "Click to mark found" : "Click to mark lost"}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        j.is_lost
                          ? "border-danger/40 bg-danger/10 text-danger line-through opacity-75"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      <div className="text-base font-mono font-extrabold">#{j.jersey_number}</div>
                      <div className="text-[11px] font-semibold text-muted">
                        Size {j.size || "M"}
                      </div>
                      {j.is_lost && (
                        <div className="text-[9px] uppercase font-extrabold text-danger mt-0.5">
                          LOST
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card variant="outlined" padding="lg" className="text-center py-12">
                <p className="text-sm text-muted">Select or create a uniform kit to view inventory.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* CREATE KIT MODAL */}
      <Modal
        isOpen={isKitModalOpen}
        onClose={() => setIsKitModalOpen(false)}
        title="Add New Uniform Kit Set"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Kit Piece Type"
              options={[
                { value: "Jersey", label: "Field Jersey" },
                { value: "Shorts", label: "Field Shorts" },
                { value: "GK Jersey", label: "Goalkeeper Jersey" },
                { value: "GK Short", label: "Goalkeeper Shorts" },
              ]}
              value={kitType}
              onChange={(e: any) => setKitType(e.target?.value ?? e)}
              width="full"
            />
            <Input
              label="Brand"
              placeholder="Adidas, Nike..."
              value={kitBrand}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKitBrand(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Style / Model"
              placeholder="Campeon 21, Squadra..."
              value={kitStyle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKitStyle(e.target.value)}
            />
            <Input
              label="Color"
              placeholder="Navy, White, Vegas Gold..."
              value={kitColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKitColor(e.target.value)}
            />
            <Input
              label="Year Purchased"
              type="number"
              value={kitYear}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKitYear(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setIsKitModalOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateKit} isLoading={isPending} disabled={isPending}>
              {isPending ? "Creating..." : "Create Kit"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADD JERSEYS TO KIT MODAL */}
      <Modal
        isOpen={isAddJerseysModalOpen}
        onClose={() => setIsAddJerseysModalOpen(false)}
        title="Add Jersey Numbers to Kit"
      >
        <div className="space-y-4">
          <Input
            label="Jersey Number Range or Comma List"
            placeholder="e.g. 1-25 or 0, 1, 2, 10, 99"
            value={numbersInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumbersInput(e.target.value)}
          />
          <Select
            label="Size"
            options={[
              { value: "YS", label: "Youth Small (YS)" },
              { value: "YM", label: "Youth Medium (YM)" },
              { value: "YL", label: "Youth Large (YL)" },
              { value: "S", label: "Adult Small (S)" },
              { value: "M", label: "Adult Medium (M)" },
              { value: "L", label: "Adult Large (L)" },
              { value: "XL", label: "Adult XL" },
            ]}
            value={jerseySize}
            onChange={(e: any) => setJerseySize(e.target?.value ?? e)}
            width="full"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setIsAddJerseysModalOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBatchAddJerseys} isLoading={isPending} disabled={isPending}>
              {isPending ? "Adding..." : "Add Jerseys"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ASSIGN JERSEY TO PLAYER MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Uniform Piece to Player"
      >
        <div className="space-y-4">
          <Select
            label="Player"
            options={players.map((p) => ({
              value: String(p.id),
              label: `${p.lastName}, ${p.firstName}${p.jerseyNumber !== null ? ` (#${p.jerseyNumber})` : ""}`,
            }))}
            value={selectedPlayerTeamId}
            onChange={(e: any) => setSelectedPlayerTeamId(e.target?.value ?? e)}
            width="full"
          />

          <Select
            label="Uniform Kit"
            options={kits.map((k) => ({
              value: String(k.id),
              label: `${k.color || ""} ${k.brand || ""} ${k.style || ""} (${k.type}, ${k.year || ""})`,
            }))}
            value={assignKitId}
            onChange={(e: any) => {
              const val = e.target?.value ?? e;
              setAssignKitId(val);
              setSelectedJerseyId("");
            }}
            width="full"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Jersey Number & Size"
              options={[
                { value: "", label: "-- Select Number --" },
                ...availableJerseysForAssign.map((j: any) => ({
                  value: String(j.id),
                  label: `#${j.jersey_number} (Size ${j.size || "M"})`,
                })),
              ]}
              value={selectedJerseyId}
              onChange={(e: any) => setSelectedJerseyId(e.target?.value ?? e)}
              width="full"
            />

            <Select
              label="Assignment Role"
              options={[
                { value: "primary", label: "Primary Kit" },
                { value: "secondary", label: "Secondary / Away Kit" },
                { value: "match", label: "Match Shorts / Piece" },
                { value: "gk", label: "Goalkeeper Kit" },
              ]}
              value={assignmentType}
              onChange={(e: any) => setAssignmentType(e.target?.value ?? e)}
              width="full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssignJersey} isLoading={isPending} disabled={isPending}>
              {isPending ? "Assigning..." : "Assign Uniform"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
