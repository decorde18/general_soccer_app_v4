"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  ClipboardCheck,
  Check,
  X,
  Shield,
} from "lucide-react";
import {
  upsertPlayerUnavailability,
  deletePlayerUnavailability,
  getEventAttendance,
  markEventAttendance,
} from "@/lib/actions/unavailability-actions";
import { toast } from "sonner";

interface Player {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
}

interface EventItem {
  id: number;
  title: string;
  startDate: string | Date;
}

interface UnavailabilityRecord {
  id: number;
  player_id: number;
  team_season_id: number | null;
  event_id: number | null;
  start_date: Date | string;
  end_date: Date | string;
  reason: string | null;
  status: string;
  people?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  events?: {
    id: number;
    title: string;
    start_datetime: Date | string;
  };
}

interface TeamAvailabilityProps {
  teamSeasonId: number;
  players: Player[];
  events?: EventItem[];
  records: UnavailabilityRecord[];
  canManage?: boolean;
}

export default function TeamAvailability({
  teamSeasonId,
  players,
  events = [],
  records: initialRecords,
  canManage = true,
}: TeamAvailabilityProps) {
  const [records, setRecords] = useState<UnavailabilityRecord[]>(initialRecords);
  const [activeTab, setActiveTab] = useState<"conflicts" | "roll_call">("conflicts");
  const [selectedEventId, setSelectedEventId] = useState<number>(events[0]?.id || 0);

  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(players[0]?.personId || 0);
  const [unavailEventId, setUnavailEventId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (activeTab === "roll_call" && selectedEventId) {
      startTransition(async () => {
        try {
          const list = await getEventAttendance(selectedEventId, teamSeasonId);
          setAttendanceList(list);
        } catch (err: any) {
          console.error("Failed to fetch attendance:", err);
        }
      });
    }
  }, [activeTab, selectedEventId, teamSeasonId]);

  const handleCreateRecord = () => {
    if (!startDate || !endDate) {
      toast.error("Please enter start and end dates");
      return;
    }

    startTransition(async () => {
      try {
        const created = await upsertPlayerUnavailability({
          teamSeasonId,
          playerId: selectedPlayerId,
          eventId: unavailEventId || null,
          startDate,
          endDate,
          reason: reason || null,
          status,
        });

        const player = players.find((p) => p.personId === selectedPlayerId);

        setRecords((prev) => [
          ...prev,
          {
            ...created,
            people: player
              ? { id: player.personId, first_name: player.firstName, last_name: player.lastName }
              : undefined,
          },
        ]);

        setIsModalOpen(false);
        setReason("");
        toast.success("Unavailability logged");
      } catch (err: any) {
        toast.error("Failed to log unavailability");
      }
    });
  };

  const handleUpdateStatus = (id: number, newStatus: string) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;

    startTransition(async () => {
      try {
        await upsertPlayerUnavailability({
          id: rec.id,
          teamSeasonId,
          playerId: rec.player_id,
          eventId: rec.event_id,
          startDate: rec.start_date,
          endDate: rec.end_date,
          reason: rec.reason,
          status: newStatus,
        });

        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        toast.success("Status updated");
      } catch (err: any) {
        toast.error("Failed to update status");
      }
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      try {
        await deletePlayerUnavailability(id, teamSeasonId);
        setRecords((prev) => prev.filter((r) => r.id !== id));
        toast.success("Record deleted");
      } catch (err: any) {
        toast.error("Failed to delete record");
      }
    });
  };

  const handleMarkAttendance = (playerId: number, attStatus: string, unavailabilityId?: number | null) => {
    startTransition(async () => {
      try {
        const res = await markEventAttendance({
          eventId: selectedEventId,
          playerId,
          status: attStatus,
          unavailabilityId,
          teamSeasonId,
        });

        setAttendanceList((prev) => {
          const idx = prev.findIndex((a) => a.player_id === playerId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], status: attStatus };
            return copy;
          } else {
            const playerObj = players.find((p) => p.personId === playerId);
            return [
              ...prev,
              {
                ...res,
                people: playerObj
                  ? { id: playerObj.personId, first_name: playerObj.firstName, last_name: playerObj.lastName }
                  : undefined,
              },
            ];
          }
        });
        toast.success("Attendance updated");
      } catch (err: any) {
        toast.error("Failed to update attendance");
      }
    });
  };

  const attendanceMap = useMemo(() => {
    const map = new Map<number, any>();
    attendanceList.forEach((a) => map.set(a.player_id, a));
    return map;
  }, [attendanceList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/40 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Calendar className="text-amber-400" size={20} />
            <span>Player Unavailability & Event Roll Call</span>
          </h2>
          <p className="text-xs text-muted">
            Track advance unavailabilities and integrate live roll call (Present, Absent - Excused, Unexcused) for games and practices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface/80 p-1 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => setActiveTab("conflicts")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "conflicts"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Unavailability Conflicts ({records.length})
            </button>
            <button
              onClick={() => setActiveTab("roll_call")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === "roll_call"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Event Roll Call
            </button>
          </div>

          {canManage && activeTab === "conflicts" && (
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Log Unavailability</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === "conflicts" ? (
        <Card variant="outlined" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface/80 border-b border-border text-muted font-semibold">
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Dates / Event</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {records.map((rec) => {
                  const pName = rec.people
                    ? `${rec.people.first_name} ${rec.people.last_name}`
                    : `Player #${rec.player_id}`;

                  const startDateStr = new Date(rec.start_date).toLocaleDateString();
                  const endDateStr = new Date(rec.end_date).toLocaleDateString();

                  return (
                    <tr key={rec.id} className="hover:bg-surface/30">
                      <td className="py-2.5 px-4 font-medium text-text">{pName}</td>
                      <td className="py-2.5 px-4">
                        <div>
                          <div className="font-semibold text-text">
                            {startDateStr} - {endDateStr}
                          </div>
                          {rec.events && (
                            <div className="text-[11px] text-primary">
                              Event: {rec.events.title}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-muted">{rec.reason || "-"}</td>
                      <td className="py-2.5 px-4">
                        {canManage ? (
                          <Select
                            value={rec.status}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateStatus(rec.id, e.target.value)}
                            className="text-xs py-0.5 px-2 h-7"
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="approved">✅ Approved / Excused</option>
                            <option value="unexcused">❌ Unexcused Absence</option>
                          </Select>
                        ) : (
                          <span className="font-semibold text-text uppercase text-[10px]">
                            {rec.status}
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(rec.id)}
                            className="p-1 hover:bg-surface rounded text-muted hover:text-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {records.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted italic">
                      No player conflicts or unavailability recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-surface/30 p-3 rounded-lg border border-border/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text">Select Event:</span>
              {events.length > 0 ? (
                <Select
                  value={selectedEventId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEventId(Number(e.target.value))}
                  className="text-xs py-1 px-3 h-8"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({new Date(ev.startDate).toLocaleDateString()})
                    </option>
                  ))}
                </Select>
              ) : (
                <span className="text-muted italic">No upcoming events scheduled</span>
              )}
            </div>
            <span className="text-muted text-[11px]">
              Approved unavailabilities automatically pre-populate as Excused Absences.
            </span>
          </div>

          <Card variant="outlined" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface/80 border-b border-border text-muted font-semibold">
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">Roll Call Status</th>
                    <th className="py-3 px-4">Unavailability Note</th>
                    {canManage && <th className="py-3 px-4 text-right">Quick Toggle</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {players.map((p) => {
                    const att = attendanceMap.get(p.personId);
                    const attStatus = att?.status || "present";
                    const isExcused = attStatus === "absent_excused";
                    const isPresent = attStatus === "present";
                    const isUnexcused = attStatus === "absent_unexcused";
                    const isLate = attStatus === "late";

                    return (
                      <tr key={p.id} className="hover:bg-surface/30">
                        <td className="py-2.5 px-4 font-medium text-text">
                          #{p.jerseyNumber ?? "-"} {p.firstName} {p.lastName}
                        </td>

                        <td className="py-2.5 px-4">
                          {canManage ? (
                            <Select
                              value={attStatus}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                handleMarkAttendance(p.personId, e.target.value, att?.unavailability_id)
                              }
                              className="text-xs py-0.5 px-2 h-7 min-w-[130px]"
                            >
                              <option value="present">✅ Present</option>
                              <option value="absent_excused">📥 Absent - Excused</option>
                              <option value="absent_unexcused">❌ Absent - Unexcused</option>
                              <option value="late">⏰ Late</option>
                              <option value="injured">🏥 Injured</option>
                            </Select>
                          ) : (
                            <span className="font-semibold text-text uppercase text-[10px]">
                              {attStatus}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-muted">
                          {att?.notes || (att?.player_unavailability ? `Reason: ${att.player_unavailability.reason}` : "-")}
                        </td>

                        {canManage && (
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(p.personId, "present")}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                                  isPresent
                                    ? "bg-emerald-500 text-white"
                                    : "bg-surface/50 text-muted hover:bg-surface"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(p.personId, "absent_excused")}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                                  isExcused
                                    ? "bg-amber-500 text-white"
                                    : "bg-surface/50 text-muted hover:bg-surface"
                                }`}
                              >
                                Excused
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(p.personId, "absent_unexcused")}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                                  isUnexcused
                                    ? "bg-rose-500 text-white"
                                    : "bg-surface/50 text-muted hover:bg-surface"
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Log Unavailability Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Player Unavailability">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-text">Select Player *</label>
            <Select
              value={selectedPlayerId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPlayerId(Number(e.target.value))}
            >
              {players.map((p) => (
                <option key={p.id} value={p.personId}>
                  #{p.jerseyNumber ?? "-"} {p.firstName} {p.lastName}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-text">Start Date *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-text">End Date *</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-text">Reason / Description</label>
            <Input
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
              placeholder="e.g. Family vacation, Academic conflict, Doctor appointment"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRecord} isLoading={isPending}>
              Log Conflict
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
