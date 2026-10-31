"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import {
  CalendarPlus,
  Plus,
  Trash2,
  History,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  getScheduleLeadsForTeamSeason,
  upsertScheduleLeadAction,
  deleteScheduleLeadAction,
  type ScheduleLeadEnriched,
} from "@/lib/actions/scheduleHelper-actions";
import { toast } from "sonner";

interface ScheduleHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamSeasonId: number;
  seasonId: number;
  seasonName?: string;
  clubs: { id: number; name: string }[];
  onPromoteToGame?: (lead: ScheduleLeadEnriched) => void;
}

const LIKELIHOOD_OPTIONS = [
  { value: "mandatory", label: "Mandatory (District / Rival)" },
  { value: "likely", label: "Likely" },
  { value: "hopeful", label: "Hopeful" },
  { value: "unlikely", label: "Unlikely" },
  { value: "unnecessary", label: "Unnecessary" },
];

const STATUS_OPTIONS = [
  { value: "no contact", label: "No Contact Yet" },
  { value: "contacted", label: "Contacted Coach" },
  { value: "pending", label: "Pending Date Confirmation" },
  { value: "scheduled", label: "Scheduled ✓" },
  { value: "unable", label: "Unable to Play" },
];

export default function ScheduleHelperModal({
  isOpen,
  onClose,
  teamSeasonId,
  seasonId,
  seasonName,
  clubs,
  onPromoteToGame,
}: ScheduleHelperModalProps) {
  const [leads, setLeads] = useState<ScheduleLeadEnriched[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // New Lead Form State
  const [opponentClubId, setOpponentClubId] = useState<string>("");
  const [likelihood, setLikelihood] = useState<string>("likely");
  const [status, setStatus] = useState<string>("no contact");
  const [preferredHomeAway, setPreferredHomeAway] = useState<string>("Either");
  const [notes, setNotes] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getScheduleLeadsForTeamSeason(teamSeasonId)
      .then((res) => {
        setLeads(res || []);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, teamSeasonId]);

  const filteredLeads = useMemo(() => {
    if (statusFilter === "all") return leads;
    return leads.filter((l) => l.status === statusFilter);
  }, [leads, statusFilter]);

  const handleAddLead = () => {
    if (!opponentClubId) {
      toast.error("Please select an opponent school/club");
      return;
    }

    startTransition(async () => {
      const res = await upsertScheduleLeadAction({
        seasonId,
        teamSeasonId,
        opponentClubId: Number(opponentClubId),
        likelihood,
        status,
        preferredHomeAway,
        notes,
      });

      if (res.success) {
        const refreshed = await getScheduleLeadsForTeamSeason(teamSeasonId);
        setLeads(refreshed);
        setOpponentClubId("");
        setNotes("");
        toast.success("Opponent added to Schedule Helper!");
      } else {
        toast.error(res.error || "Failed to add opponent lead");
      }
    });
  };

  const handleQuickUpdate = (
    lead: ScheduleLeadEnriched,
    field: "likelihood" | "status" | "preferredHomeAway",
    val: string
  ) => {
    setLeads((prev) =>
      prev.map((item) => (item.id === lead.id ? { ...item, [field]: val } : item))
    );

    startTransition(async () => {
      await upsertScheduleLeadAction({
        id: lead.id,
        seasonId: lead.seasonId,
        teamSeasonId: lead.teamSeasonId,
        opponentClubId: lead.opponentClubId,
        likelihood: field === "likelihood" ? val : lead.likelihood,
        status: field === "status" ? val : lead.status,
        preferredHomeAway: field === "preferredHomeAway" ? val : lead.preferredHomeAway,
        notes: lead.notes,
      });
    });
  };

  const handleDelete = (id: number) => {
    const prev = [...leads];
    setLeads((list) => list.filter((l) => l.id !== id));
    startTransition(async () => {
      const res = await deleteScheduleLeadAction(id, teamSeasonId);
      if (!res.success) {
        setLeads(prev);
        toast.error("Failed to delete lead");
      } else {
        toast.success("Removed from Schedule Helper");
      }
    });
  };

  const getLikelihoodBadge = (val: string) => {
    switch (val) {
      case "mandatory":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "likely":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "hopeful":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "unlikely":
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
      default:
        return "bg-muted/20 text-muted border-border";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Helper & Matchmaking Planner ${seasonName ? `(${seasonName})` : ""}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: "all", label: "All Leads", count: leads.length },
            {
              id: "scheduled",
              label: "Scheduled",
              count: leads.filter((l) => l.status === "scheduled").length,
            },
            {
              id: "contacted",
              label: "Contacted",
              count: leads.filter((l) => l.status === "contacted").length,
            },
            {
              id: "no contact",
              label: "Need Contact",
              count: leads.filter((l) => l.status === "no contact").length,
            },
            {
              id: "unable",
              label: "Unable",
              count: leads.filter((l) => l.status === "unable").length,
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={statusFilter === tab.id ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab.id)}
              className="flex items-center justify-between px-3 py-2 text-xs"
            >
              <span>{tab.label}</span>
              <span className="font-mono font-extrabold ml-1.5">{tab.count}</span>
            </Button>
          ))}
        </div>

        {/* Add Prospective Opponent Card */}
        <Card variant="outlined" padding="sm" className="bg-surface/60 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Add Prospective Opponent to Worksheet</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end">
            <div className="sm:col-span-2">
              <Select
                label="Opponent Club / High School"
                options={[
                  { value: "", label: "-- Select Opponent --" },
                  ...clubs.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
                value={opponentClubId}
                onChange={(e: any) => setOpponentClubId(e.target?.value ?? e)}
                width="full"
              />
            </div>
            <Select
              label="Priority / Likelihood"
              options={LIKELIHOOD_OPTIONS}
              value={likelihood}
              onChange={(e: any) => setLikelihood(e.target?.value ?? e)}
              width="full"
            />
            <Select
              label="Contact Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e: any) => setStatus(e.target?.value ?? e)}
              width="full"
            />
            <Button
              type="button"
              variant="primary"
              onClick={handleAddLead}
              isLoading={isPending}
              disabled={isPending}
              className="w-full h-10 text-xs"
            >
              <Plus size={14} className="mr-1" />
              <span>{isPending ? "Adding..." : "Add Lead"}</span>
            </Button>
          </div>
          <Input
            label="Notes (e.g. 'V Only 8/20', 'JV Separate Date', Coach Contact Info)"
            placeholder="Optional scheduling notes..."
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
          />
        </Card>

        {/* Leads Worksheet Table */}
        <div className="max-h-[420px] overflow-y-auto border border-border rounded-xl">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted">Loading schedule worksheet...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              No prospective opponents in this filter view.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface sticky top-0 z-10 border-b border-border text-[11px] uppercase font-bold text-muted">
                <tr>
                  <th className="py-2.5 px-3">Opponent</th>
                  <th className="py-2.5 px-2 text-center">All-Time Series</th>
                  <th className="py-2.5 px-2 text-center">Rotation Advice</th>
                  <th className="py-2.5 px-2">Likelihood</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredLeads.map((lead) => {
                  const sh = lead.seriesHistory;
                  const totalPlayed = sh.wins + sh.losses + sh.draws;
                  return (
                    <tr key={lead.id} className="hover:bg-surface-hover/50">
                      <td className="py-2.5 px-3 font-bold text-text">
                        {lead.opponentClubName}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono">
                        {totalPlayed > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-background border border-border font-semibold">
                            {sh.wins}W - {sh.losses}L - {sh.draws}D
                          </span>
                        ) : (
                          <span className="text-muted">First Meeting</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {sh.lastVenueWasHome !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                              sh.recommendedVenue === "Home"
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                            title={`Last played ${sh.lastGameDate} (${
                              sh.lastVenueWasHome ? "Home" : "Away"
                            })`}
                          >
                            <ArrowRightLeft size={11} />
                            Play {sh.recommendedVenue}
                          </span>
                        ) : (
                          <span className="text-muted">Either</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <Select
                          options={LIKELIHOOD_OPTIONS}
                          value={lead.likelihood}
                          onChange={(e: any) =>
                            handleQuickUpdate(lead, "likelihood", e.target?.value ?? e)
                          }
                          className="text-xs py-1 px-2 h-8"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <Select
                          options={STATUS_OPTIONS}
                          value={lead.status}
                          onChange={(e: any) =>
                            handleQuickUpdate(lead, "status", e.target?.value ?? e)
                          }
                          className="text-xs py-1 px-2 h-8"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-muted max-w-[180px] truncate" title={lead.notes || ""}>
                        {lead.notes || "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {onPromoteToGame && lead.status !== "scheduled" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onPromoteToGame(lead)}
                              className="text-[11px] px-2 py-1 h-auto text-primary border-primary/30"
                              title="Open Game Scheduler for this Opponent"
                            >
                              <CalendarPlus size={12} className="mr-1" />
                              Schedule
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleDelete(lead.id)}
                            className="text-muted hover:text-danger p-1 h-auto"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
