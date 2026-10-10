"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Shirt,
  ClipboardList,
  Edit2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  RotateCcw,
  HelpCircle,
  ExternalLink,
  Camera,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  Upload,
} from "lucide-react";
import {
  upsertCustomFieldDefinition,
  deleteCustomFieldDefinition,
  updatePlayerCustomFieldValue,
  copyAnnualFieldsToSeason,
  type CustomFieldDefinitionInput,
} from "@/lib/actions/customFields-actions";
import {
  getTeamRosterPhotos,
  uploadPlayerPhoto,
  approvePlayerPhoto,
  rejectPlayerPhoto,
  updateTeamPhotoReviewSetting,
} from "@/lib/actions/photo-actions";
import { toast } from "sonner";

interface Player {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  photoUrl?: string | null;
  photoStatus?: string | null;
  photoRejectionReason?: string | null;
}

interface CustomFieldDefinition {
  id: number;
  team_season_id: number | null;
  club_id: number | null;
  field_key: string;
  label: string;
  field_type: string;
  category: string | null;
  options: string | null;
  permission_role: string;
  is_required: boolean;
  is_annual_recurring?: boolean;
  display_order: number;
  instructions?: string | null;
  action_url?: string | null;
  action_label?: string | null;
}

interface CustomFieldValue {
  id: number;
  definition_id: number;
  player_id: number;
  team_season_id: number | null;
  value: string | null;
}

interface TeamRequirementsProps {
  teamSeasonId: number;
  clubId?: number;
  players: Player[];
  definitions: CustomFieldDefinition[];
  initialValues: CustomFieldValue[];
  canManage?: boolean;
  initialRequirePhotoReview?: boolean;
}

export default function TeamRequirements({
  teamSeasonId,
  clubId,
  players,
  definitions,
  initialValues,
  canManage = true,
  initialRequirePhotoReview = true,
}: TeamRequirementsProps) {
  const [fieldDefs, setFieldDefs] = useState<CustomFieldDefinition[]>(definitions);
  const [fieldValues, setFieldValues] = useState<CustomFieldValue[]>(initialValues);
  const [rosterPlayers, setRosterPlayers] = useState<Player[]>(players);
  const [requirePhotoReview, setRequirePhotoReview] = useState<boolean>(initialRequirePhotoReview);
  const [isPending, startTransition] = useTransition();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Custom Field Builder Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<CustomFieldDefinition | null>(null);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [category, setCategory] = useState("Gear");
  const [optionsText, setOptionsText] = useState("");
  const [permissionRole, setPermissionRole] = useState("coach_edit_player_view");
  const [isRequired, setIsRequired] = useState(false);
  const [isAnnualRecurring, setIsAnnualRecurring] = useState(false);
  const [instructionsText, setInstructionsText] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [actionLabel, setActionLabel] = useState("");

  // Directions / Info Modal State
  const [activeDirectionsDef, setActiveDirectionsDef] = useState<CustomFieldDefinition | null>(null);

  // Photo Review & Upload Hub State
  const [isPhotoHubOpen, setIsPhotoHubOpen] = useState(false);
  const [rejectionModalPersonId, setRejectionModalPersonId] = useState<number | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [uploadModalPersonId, setUploadModalPersonId] = useState<number | null>(null);
  const [uploadUrlInput, setUploadUrlInput] = useState("");

  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    fieldDefs.forEach((d) => cats.add(d.category || "General"));
    return Array.from(cats);
  }, [fieldDefs]);

  const filteredDefs = useMemo(() => {
    if (selectedCategory === "All") return fieldDefs;
    return fieldDefs.filter((d) => (d.category || "General") === selectedCategory);
  }, [fieldDefs, selectedCategory]);

  const valueMap = useMemo(() => {
    const map = new Map<string, string>();
    fieldValues.forEach((v) => {
      if (v.value !== null) {
        map.set(`${v.definition_id}_${v.player_id}`, v.value);
      }
    });
    return map;
  }, [fieldValues]);

  const handleOpenAddField = () => {
    setEditingDef(null);
    setLabel("");
    setFieldType("text");
    setCategory("Gear");
    setOptionsText("");
    setPermissionRole("coach_edit_player_view");
    setIsRequired(false);
    setIsAnnualRecurring(false);
    setInstructionsText("");
    setActionUrl("");
    setActionLabel("");
    setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (def: CustomFieldDefinition) => {
    setEditingDef(def);
    setLabel(def.label);
    setFieldType(def.field_type);
    setCategory(def.category || "General");
    setOptionsText(def.options || "");
    setPermissionRole(def.permission_role);
    setIsRequired(def.is_required);
    setIsAnnualRecurring(Boolean(def.is_annual_recurring));
    setInstructionsText(def.instructions || "");
    setActionUrl(def.action_url || "");
    setActionLabel(def.action_label || "");
    setIsFieldModalOpen(true);
  };

  const handleSaveField = () => {
    if (!label.trim()) {
      toast.error("Please enter a field label");
      return;
    }

    startTransition(async () => {
      try {
        const payload: CustomFieldDefinitionInput = {
          id: editingDef?.id,
          teamSeasonId,
          clubId,
          fieldKey: label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          label,
          fieldType,
          category,
          options: optionsText.trim() || null,
          permissionRole,
          isRequired,
          isAnnualRecurring,
          instructions: instructionsText.trim() || null,
          actionUrl: actionUrl.trim() || null,
          actionLabel: actionLabel.trim() || null,
        };

        const res = await upsertCustomFieldDefinition(payload);
        if (editingDef) {
          setFieldDefs((prev) => prev.map((d) => (d.id === res.id ? (res as any) : d)));
          toast.success("Requirement updated");
        } else {
          setFieldDefs((prev) => [...prev, res as any]);
          toast.success("Custom requirement created");
        }
        setIsFieldModalOpen(false);
      } catch (err: any) {
        toast.error("Failed to save field definition: " + err.message);
      }
    });
  };

  const handleSyncAnnualTemplates = () => {
    startTransition(async () => {
      try {
        const copies = await copyAnnualFieldsToSeason(teamSeasonId, clubId);
        if (copies.length === 0) {
          toast.info("All annual recurring requirement templates are already synced!");
        } else {
          setFieldDefs((prev) => [...prev, ...(copies as any[])]);
          toast.success(`Synced ${copies.length} annual requirement template(s)!`);
        }
      } catch (err: any) {
        toast.error("Failed to sync annual templates");
      }
    });
  };

  const handleDeleteField = (id: number) => {
    if (!confirm("Are you sure you want to remove this requirement field?")) return;
    startTransition(async () => {
      try {
        await deleteCustomFieldDefinition(id, teamSeasonId);
        setFieldDefs((prev) => prev.filter((d) => d.id !== id));
        toast.success("Field deleted");
      } catch (err: any) {
        toast.error("Failed to delete field");
      }
    });
  };

  const handleUpdateValue = (definitionId: number, playerId: number, newValue: string | null) => {
    setFieldValues((prev) => {
      const existingIdx = prev.findIndex((v) => v.definition_id === definitionId && v.player_id === playerId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], value: newValue };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: Date.now(),
            definition_id: definitionId,
            player_id: playerId,
            team_season_id: teamSeasonId,
            value: newValue,
          },
        ];
      }
    });

    startTransition(async () => {
      try {
        await updatePlayerCustomFieldValue({
          definitionId,
          playerId,
          teamSeasonId,
          value: newValue,
        });
      } catch (err: any) {
        toast.error("Failed to update value: " + err.message);
      }
    });
  };

  // Photo Review Handlers
  const handleApprovePhoto = (personId: number) => {
    startTransition(async () => {
      try {
        await approvePlayerPhoto(personId, teamSeasonId);
        setRosterPlayers((prev) =>
          prev.map((p) =>
            p.personId === personId
              ? { ...p, photoStatus: "approved", photoRejectionReason: null }
              : p
          )
        );
        toast.success("Player photo approved!");
      } catch (err: any) {
        toast.error("Failed to approve photo");
      }
    });
  };

  const handleRejectPhotoSubmit = () => {
    if (!rejectionModalPersonId) return;
    if (!rejectionReasonInput.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }

    const targetPersonId = rejectionModalPersonId;
    const reason = rejectionReasonInput;

    startTransition(async () => {
      try {
        await rejectPlayerPhoto(targetPersonId, reason, teamSeasonId);
        setRosterPlayers((prev) =>
          prev.map((p) =>
            p.personId === targetPersonId
              ? { ...p, photoStatus: "rejected", photoRejectionReason: reason }
              : p
          )
        );
        toast.success("Photo status updated to Rejected");
        setRejectionModalPersonId(null);
        setRejectionReasonInput("");
      } catch (err: any) {
        toast.error("Failed to reject photo");
      }
    });
  };

  const handleUploadPhotoSubmit = () => {
    if (!uploadModalPersonId) return;
    if (!uploadUrlInput.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    const targetPersonId = uploadModalPersonId;
    const photoUrl = uploadUrlInput;

    startTransition(async () => {
      try {
        const res = await uploadPlayerPhoto(targetPersonId, photoUrl, teamSeasonId);
        setRosterPlayers((prev) =>
          prev.map((p) =>
            p.personId === targetPersonId
              ? {
                  ...p,
                  photoUrl,
                  photoStatus: res.photoStatus,
                  photoRejectionReason: null,
                }
              : p
          )
        );
        toast.success(
          res.photoStatus === "approved"
            ? "Photo uploaded & approved!"
            : "Photo uploaded & pending admin review."
        );
        setUploadModalPersonId(null);
        setUploadUrlInput("");
      } catch (err: any) {
        toast.error("Failed to upload photo");
      }
    });
  };

  const handleToggleRequireReview = (val: boolean) => {
    setRequirePhotoReview(val);
    startTransition(async () => {
      try {
        await updateTeamPhotoReviewSetting(teamSeasonId, val);
        toast.success(`Photo review setting updated`);
      } catch (err: any) {
        toast.error("Failed to update setting");
      }
    });
  };

  const renderCellInput = (def: CustomFieldDefinition, player: Player) => {
    const rawVal = valueMap.get(`${def.id}_${player.personId}`) || "";

    if (def.field_type === "photo_upload") {
      const status = player.photoStatus || "not_uploaded";
      return (
        <div className="flex flex-col gap-1 min-w-[150px]">
          <div className="flex items-center gap-2">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.firstName}
                className="w-7 h-7 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-muted">
                <Camera size={13} />
              </div>
            )}
            <div>
              {status === "approved" && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle size={10} /> Approved
                </span>
              )}
              {status === "pending_review" && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <Clock size={10} /> Pending Review
                </span>
              )}
              {status === "rejected" && (
                <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 flex items-center gap-1">
                  <XCircle size={10} /> Needs Revision
                </span>
              )}
              {status === "not_uploaded" && (
                <span className="text-[10px] text-muted italic">Not Uploaded</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setUploadModalPersonId(player.personId);
              setUploadUrlInput(player.photoUrl || "");
            }}
            className="text-[10px] text-primary hover:underline text-left font-medium"
          >
            {player.photoUrl ? "Change Photo..." : "+ Upload Photo..."}
          </button>
        </div>
      );
    }

    if (def.field_type === "text") {
      return (
        <Input
          value={rawVal}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateValue(def.id, player.personId, e.target.value)}
          placeholder="Value..."
          className="text-xs py-1 px-2 h-8"
          disabled={!canManage}
        />
      );
    }

    if (def.field_type === "select") {
      const opts = def.options ? def.options.split(",").map((s) => s.trim()) : ["S", "M", "L", "XL"];
      return (
        <Select
          value={rawVal}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateValue(def.id, player.personId, e.target.value)}
          className="text-xs py-1 px-2 h-8 min-w-[90px]"
          disabled={!canManage}
        >
          <option value="">-- Select --</option>
          {opts.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      );
    }

    if (def.field_type === "boolean") {
      const checked = rawVal === "true" || rawVal === "yes" || rawVal === "1";
      return (
        <button
          type="button"
          onClick={() => handleUpdateValue(def.id, player.personId, checked ? "false" : "true")}
          disabled={!canManage}
          className={`px-3 py-1 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            checked
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
              : "bg-surface/50 text-muted border border-border/50 hover:bg-surface"
          }`}
        >
          {checked ? <CheckCircle size={14} /> : <Clock size={14} />}
          <span>{checked ? "Done" : "Pending"}</span>
        </button>
      );
    }

    if (def.field_type === "date") {
      return (
        <Input
          type="date"
          value={rawVal}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateValue(def.id, player.personId, e.target.value)}
          className="text-xs py-1 px-2 h-8"
          disabled={!canManage}
        />
      );
    }

    if (def.field_type === "compound_status_dates") {
      let parsed: { status?: string; completed_date?: string; submitted_date?: string } = {};
      try {
        if (rawVal) parsed = JSON.parse(rawVal);
      } catch (e) {
        parsed = { status: rawVal };
      }

      return (
        <div className="flex flex-col gap-1.5 min-w-[170px] p-1.5 bg-surface/30 rounded border border-border/30">
          <Select
            value={parsed.status || "pending"}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const updated = { ...parsed, status: e.target.value };
              handleUpdateValue(def.id, player.personId, JSON.stringify(updated));
            }}
            className="text-xs py-0.5 px-1.5 h-7"
            disabled={!canManage}
          >
            <option value="pending">⏳ Pending</option>
            <option value="submitted">📥 Submitted</option>
            <option value="completed">✅ Approved/Completed</option>
            <option value="rejected">❌ Expired/Rejected</option>
          </Select>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <div>
              <label className="text-muted text-[9px] block">Completed:</label>
              <input
                type="date"
                value={parsed.completed_date || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const updated = { ...parsed, completed_date: e.target.value };
                  handleUpdateValue(def.id, player.personId, JSON.stringify(updated));
                }}
                disabled={!canManage}
                className="w-full bg-surface border border-border/50 rounded px-1 py-0.5 text-text text-[10px]"
              />
            </div>
            <div>
              <label className="text-muted text-[9px] block">Submitted:</label>
              <input
                type="date"
                value={parsed.submitted_date || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const updated = { ...parsed, submitted_date: e.target.value };
                  handleUpdateValue(def.id, player.personId, JSON.stringify(updated));
                }}
                disabled={!canManage}
                className="w-full bg-surface border border-border/50 rounded px-1 py-0.5 text-text text-[10px]"
              />
            </div>
          </div>
        </div>
      );
    }

    if (def.field_type === "fee_payment") {
      let parsed: { status?: string; amount_paid?: number; total_due?: number } = {};
      try {
        if (rawVal) parsed = JSON.parse(rawVal);
      } catch (e) {
        parsed = { status: rawVal };
      }

      const isPaid = parsed.status === "paid";
      return (
        <div className="flex flex-col gap-1 min-w-[140px]">
          <button
            type="button"
            onClick={() => {
              const updated = { ...parsed, status: isPaid ? "unpaid" : "paid" };
              handleUpdateValue(def.id, player.personId, JSON.stringify(updated));
            }}
            disabled={!canManage}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center justify-between transition-all ${
              isPaid
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
            }`}
          >
            <span className="flex items-center gap-1">
              <DollarSign size={12} />
              {isPaid ? "Paid" : "Unpaid"}
            </span>
            {isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
          </button>
        </div>
      );
    }

    return (
      <Input
        value={rawVal}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateValue(def.id, player.personId, e.target.value)}
        placeholder="Value..."
        className="text-xs py-1 px-2 h-8"
        disabled={!canManage}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/40 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <ClipboardList className="text-primary" size={20} />
            <span>Player Requirements & Custom Fields</span>
          </h2>
          <p className="text-xs text-muted">
            Track physicals, concussion tests, apparel sizes, fee payments, and player headshots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Category:</span>
            <Select
              value={selectedCategory}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
              className="text-xs py-1 px-3 h-9"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsPhotoHubOpen(true)}
            className="text-xs px-3 py-2 flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Camera size={14} />
            <span>Headshot Review Hub</span>
          </Button>

          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={handleSyncAnnualTemplates}
                disabled={isPending}
                className="text-xs px-3 py-2 flex items-center gap-1.5"
                title="Pull annual recurring requirements into this season"
              >
                <RotateCcw size={14} />
                <span>Sync Annual Templates</span>
              </Button>

              <Button
                variant="primary"
                onClick={handleOpenAddField}
                disabled={isPending}
                className="text-xs px-3 py-2 flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Add Custom Requirement</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Requirements Matrix Table */}
      <Card variant="outlined" padding="none" className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface/80 border-b border-border text-muted font-semibold">
              <th className="py-3 px-4 sticky left-0 bg-surface/90 backdrop-blur min-w-[160px] z-10">
                Player
              </th>
              {filteredDefs.map((def) => (
                <th key={def.id} className="py-3 px-4 min-w-[190px] border-l border-border/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-text flex items-center gap-1">
                        <span>{def.label}</span>
                        {def.is_required && <span className="text-danger">*</span>}
                        {def.is_annual_recurring && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1 rounded">
                            Annual
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-muted font-normal uppercase tracking-wider mt-0.5">
                        {def.category || "General"} ({def.field_type})
                      </div>

                      {/* Info / Action Shortcuts */}
                      {(def.instructions || def.action_url) && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveDirectionsDef(def)}
                            className="text-[10px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20"
                          >
                            <HelpCircle size={10} /> Directions
                          </button>
                          {def.action_url && (
                            <a
                              href={def.action_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary hover:underline font-medium flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20"
                            >
                              <ExternalLink size={10} />
                              <span>{def.action_label || "Open Link"}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditField(def)}
                          className="p-1 hover:bg-surface rounded text-muted hover:text-text"
                          title="Edit Requirement"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(def.id)}
                          className="p-1 hover:bg-surface rounded text-muted hover:text-danger"
                          title="Delete Requirement"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {filteredDefs.length === 0 && (
                <th className="py-4 px-6 text-center text-muted italic">
                  No custom requirements added yet. Click "+ Add Custom Requirement" to begin.
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {rosterPlayers.map((player) => (
              <tr key={player.id} className="hover:bg-surface/30 transition-colors">
                <td className="py-2.5 px-4 sticky left-0 bg-surface/90 backdrop-blur font-medium text-text z-10 border-r border-border/30">
                  <div className="flex items-center gap-2">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.firstName}
                        className="w-6 h-6 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <span className="w-6 text-center text-muted font-mono text-[11px]">
                        #{player.jerseyNumber ?? "-"}
                      </span>
                    )}
                    <span>
                      {player.firstName} {player.lastName}
                    </span>
                  </div>
                </td>
                {filteredDefs.map((def) => (
                  <td key={def.id} className="py-2.5 px-4 border-l border-border/30 align-top">
                    {renderCellInput(def, player)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Requirement Directions & Info Modal */}
      {activeDirectionsDef && (
        <Modal
          isOpen={Boolean(activeDirectionsDef)}
          onClose={() => setActiveDirectionsDef(null)}
          title={`Directions: ${activeDirectionsDef.label}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-surface/50 rounded-lg border border-border/50">
              <h4 className="font-semibold text-text text-sm mb-1">How to Complete</h4>
              <p className="text-muted whitespace-pre-wrap leading-relaxed">
                {activeDirectionsDef.instructions || "No detailed written directions provided for this task."}
              </p>
            </div>

            {activeDirectionsDef.action_url && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-primary">Required Action Link</div>
                  <div className="text-[11px] text-muted">
                    Click below to open the external portal or form needed to fulfill this requirement.
                  </div>
                </div>
                <a
                  href={activeDirectionsDef.action_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-primary text-white rounded font-semibold text-xs flex items-center gap-1 hover:bg-primary/90"
                >
                  <span>{activeDirectionsDef.action_label || "Open Link"}</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setActiveDirectionsDef(null)}>
                Close Directions
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Requirement Definition Modal */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title={editingDef ? "Edit Requirement Field" : "Create New Custom Requirement"}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-text">Requirement Label *</label>
            <Input
              value={label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
              placeholder="e.g. Physical Form, T-Shirt Size, Concussion Protocol, Team Fee"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-text">Category</label>
              <Select value={category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}>
                <option value="Gear">👕 Gear & Apparel</option>
                <option value="Medical">🏥 Medical & Forms</option>
                <option value="Fees">💰 Financial & Fees</option>
                <option value="Tasks">📋 Tasks & Checklist</option>
                <option value="General">⚙️ General</option>
              </Select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-text">Field Type</label>
              <Select value={fieldType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFieldType(e.target.value)}>
                <option value="text">Single Line Text</option>
                <option value="select">Dropdown Choice (e.g. Sizes)</option>
                <option value="boolean">Simple Checklist (Done / Pending)</option>
                <option value="date">Date Picker</option>
                <option value="compound_status_dates">
                  Physical / Medical (Status + Dates)
                </option>
                <option value="fee_payment">Fee Payment (Paid / Unpaid)</option>
                <option value="photo_upload">📷 Profile Photo Upload</option>
              </Select>
            </div>
          </div>

          {fieldType === "select" && (
            <div>
              <label className="block font-semibold mb-1 text-text">
                Dropdown Choices (Comma Separated)
              </label>
              <Input
                value={optionsText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOptionsText(e.target.value)}
                placeholder="e.g. S, M, L, XL, 2XL"
              />
            </div>
          )}

          {/* Directions & Action Link Section */}
          <div className="p-3 bg-surface/40 rounded-lg border border-border/40 space-y-3">
            <h4 className="font-semibold text-text text-xs flex items-center gap-1.5">
              <HelpCircle size={14} className="text-sky-400" />
              <span>Completion Directions & Action Link (Optional)</span>
            </h4>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">
                Instructions / What to do:
              </label>
              <textarea
                value={instructionsText}
                onChange={(e) => setInstructionsText(e.target.value)}
                placeholder="Explain step-by-step how players or parents complete this task..."
                rows={3}
                className="w-full bg-surface border border-border/60 rounded px-2.5 py-1.5 text-text text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">External Action Link URL:</label>
                <Input
                  value={actionUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActionUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Action Button Text:</label>
                <Input
                  value={actionLabel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActionLabel(e.target.value)}
                  placeholder="e.g. Take Test, Download PDF"
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
            <div>
              <label className="block font-semibold mb-1 text-text">Permission Role</label>
              <Select
                value={permissionRole}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPermissionRole(e.target.value)}
              >
                <option value="coach_edit_player_view">Coach edits, Player views</option>
                <option value="player_editable">Player can enter / edit choice</option>
                <option value="coach_private">Coach private / Internal only</option>
              </Select>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={isRequired}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsRequired(e.target.checked)}
                  className="rounded text-primary border-border"
                />
                <label htmlFor="reqCheck" className="text-text font-medium">
                  Mandatory Requirement
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="annualCheck"
                  checked={isAnnualRecurring}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsAnnualRecurring(e.target.checked)}
                  className="rounded text-primary border-border"
                />
                <label htmlFor="annualCheck" className="text-text font-medium">
                  Annual Recurring (Repeats Every Season)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => setIsFieldModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveField} isLoading={isPending}>
              {editingDef ? "Update Field" : "Create Requirement"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Headshot Review & Photo Upload Hub Modal */}
      {isPhotoHubOpen && (
        <Modal
          isOpen={isPhotoHubOpen}
          onClose={() => setIsPhotoHubOpen(false)}
          title="Roster Headshot & Photo Review Hub"
        >
          <div className="space-y-4 text-xs">
            {/* Setting Toggle Header */}
            <div className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-border/50">
              <div>
                <div className="font-semibold text-text flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-primary" />
                  <span>Require Admin Review for Uploaded Headshots</span>
                </div>
                <div className="text-[11px] text-muted">
                  If enabled, uploaded photos stay "Pending Review" until a coach approves them.
                </div>
              </div>

              <input
                type="checkbox"
                checked={requirePhotoReview}
                onChange={(e) => handleToggleRequireReview(e.target.checked)}
                disabled={!canManage || isPending}
                className="w-4 h-4 text-primary rounded border-border"
              />
            </div>

            {/* Photo Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
              {rosterPlayers.map((player) => {
                const status = player.photoStatus || "not_uploaded";
                return (
                  <div
                    key={player.id}
                    className="p-3 bg-surface/40 rounded-lg border border-border/50 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={player.firstName}
                          className="w-12 h-12 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-muted">
                          <Camera size={20} />
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-text">
                          #{player.jerseyNumber ?? "-"} {player.firstName} {player.lastName}
                        </div>
                        <div className="mt-1">
                          {status === "approved" && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle size={10} /> Approved
                            </span>
                          )}
                          {status === "pending_review" && (
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 w-fit">
                              <Clock size={10} /> Pending Review
                            </span>
                          )}
                          {status === "rejected" && (
                            <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 flex items-center gap-1 w-fit">
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                          {status === "not_uploaded" && (
                            <span className="text-[10px] text-muted italic">Not Uploaded</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {player.photoRejectionReason && (
                      <div className="text-[10px] text-rose-300 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                        Reason: {player.photoRejectionReason}
                      </div>
                    )}

                    {/* Admin Actions */}
                    {canManage && (
                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-border/30">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadModalPersonId(player.personId);
                            setUploadUrlInput(player.photoUrl || "");
                          }}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1"
                        >
                          <Upload size={10} /> Upload
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleApprovePhoto(player.personId)}
                            disabled={isPending || status === "approved"}
                            className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded disabled:opacity-30"
                            title="Approve Photo"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectionModalPersonId(player.personId);
                              setRejectionReasonInput(player.photoRejectionReason || "");
                            }}
                            disabled={isPending}
                            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"
                            title="Reject & Feedback"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/40">
              <Button variant="outline" onClick={() => setIsPhotoHubOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Photo Modal */}
      {rejectionModalPersonId && (
        <Modal
          isOpen={Boolean(rejectionModalPersonId)}
          onClose={() => setRejectionModalPersonId(null)}
          title="Reject Photo & Provide Feedback"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-text">Rejection Reason *</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Face not clearly visible, please upload a headshot on a plain background."
                rows={3}
                className="w-full bg-surface border border-border/60 rounded px-2.5 py-1.5 text-text text-xs"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectionModalPersonId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRejectPhotoSubmit} isLoading={isPending}>
                Reject Photo
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Photo Modal */}
      {uploadModalPersonId && (
        <Modal
          isOpen={Boolean(uploadModalPersonId)}
          onClose={() => setUploadModalPersonId(null)}
          title="Upload Player Profile Picture"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-text">Image / Photo URL *</label>
              <Input
                value={uploadUrlInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUploadUrlInput(e.target.value)}
                placeholder="https://example.com/headshots/player.jpg"
              />
            </div>

            {uploadUrlInput && (
              <div className="flex justify-center p-2 bg-surface/40 rounded border border-border/40">
                <img
                  src={uploadUrlInput}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border border-border"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadModalPersonId(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUploadPhotoSubmit} isLoading={isPending}>
                Save Photo
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
