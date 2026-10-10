"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Activity,
  Plus,
  Trash2,
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  Home,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  upsertPerformanceTest,
  deletePerformanceTest,
  recordPlayerPerformanceLog,
  deletePerformanceLog,
} from "@/lib/actions/performance-actions";
import { toast } from "sonner";

interface Player {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
}

interface PerformanceTest {
  id: number;
  name: string;
  unit: string;
  higher_is_better: boolean;
  description: string | null;
}

interface PerformanceLog {
  id: number;
  test_id: number;
  player_id: number;
  test_date: Date | string;
  score_numeric: number | null;
  score_display: string;
  entry_source?: string;
  duration_seconds?: number | null;
  frequency_reps?: number | null;
  interval_details?: string | null;
  verification_status?: string;
  notes: string | null;
  performance_tests?: PerformanceTest;
  people?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface TeamPerformanceProps {
  teamSeasonId: number;
  players: Player[];
  tests: PerformanceTest[];
  initialLogs: PerformanceLog[];
  canManage?: boolean;
}

export default function TeamPerformance({
  teamSeasonId,
  players,
  tests,
  initialLogs,
  canManage = true,
}: TeamPerformanceProps) {
  const [testList, setTestList] = useState<PerformanceTest[]>(tests);
  const [logs, setLogs] = useState<PerformanceLog[]>(initialLogs);
  const [selectedTestId, setSelectedTestId] = useState<number>(tests[0]?.id || 0);

  const [isPending, startTransition] = useTransition();

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testName, setTestName] = useState("");
  const [testUnit, setTestUnit] = useState("level.shuttle");
  const [testDescription, setTestDescription] = useState("");

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(players[0]?.personId || 0);
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [scoreDisplay, setScoreDisplay] = useState("");
  const [scoreNumeric, setScoreNumeric] = useState<string>("");
  const [entrySource, setEntrySource] = useState("coach_practice");
  const [durationSeconds, setDurationSeconds] = useState<string>("");
  const [frequencyReps, setFrequencyReps] = useState<string>("");
  const [intervalDetails, setIntervalDetails] = useState<string>("");
  const [notes, setNotes] = useState("");

  const activeTest = useMemo(() => {
    return testList.find((t) => t.id === selectedTestId) || testList[0] || null;
  }, [testList, selectedTestId]);

  const activeLogs = useMemo(() => {
    if (!activeTest) return [];
    return logs.filter((l) => l.test_id === activeTest.id);
  }, [logs, activeTest]);

  const playerProgress = useMemo(() => {
    if (!activeTest) return [];

    return players.map((p) => {
      const pLogs = activeLogs
        .filter((l) => l.player_id === p.personId)
        .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());

      const latest = pLogs[0] || null;
      let best = null;
      if (pLogs.length > 0) {
        best = pLogs.reduce((acc, curr) => {
          if (!acc.score_numeric) return curr;
          if (!curr.score_numeric) return acc;
          return activeTest.higher_is_better
            ? curr.score_numeric > acc.score_numeric
              ? curr
              : acc
            : curr.score_numeric < acc.score_numeric
            ? curr
            : acc;
        }, pLogs[0]);
      }

      return {
        player: p,
        logs: pLogs,
        latest,
        best,
      };
    });
  }, [players, activeLogs, activeTest]);

  const handleCreateTest = () => {
    if (!testName.trim()) {
      toast.error("Enter a test name");
      return;
    }
    startTransition(async () => {
      try {
        const created = await upsertPerformanceTest({
          teamSeasonId,
          name: testName,
          unit: testUnit,
          description: testDescription || null,
        });
        setTestList((prev) => [...prev, created]);
        setSelectedTestId(created.id);
        setIsTestModalOpen(false);
        setTestName("");
        toast.success("Fitness test created");
      } catch (err: any) {
        toast.error("Failed to create test");
      }
    });
  };

  const handleSaveLog = () => {
    if (!activeTest) return;
    if (!scoreDisplay.trim()) {
      toast.error("Enter a score display value");
      return;
    }

    const numVal = scoreNumeric.trim() !== "" ? parseFloat(scoreNumeric) : null;
    const durVal = durationSeconds.trim() !== "" ? parseInt(durationSeconds, 10) : null;
    const repVal = frequencyReps.trim() !== "" ? parseInt(frequencyReps, 10) : null;

    startTransition(async () => {
      try {
        const newLog = await recordPlayerPerformanceLog({
          testId: activeTest.id,
          playerId: selectedPlayerId,
          testDate,
          scoreDisplay,
          scoreNumeric: numVal,
          entrySource,
          durationSeconds: durVal,
          frequencyReps: repVal,
          intervalDetails: intervalDetails || null,
          verificationStatus: entrySource === "player_home" ? "pending_coach_review" : "verified",
          notes,
          teamSeasonId,
        });

        const matchedPlayer = players.find((p) => p.personId === selectedPlayerId);

        setLogs((prev) => [
          ...prev,
          {
            ...newLog,
            performance_tests: activeTest,
            people: matchedPlayer
              ? {
                  id: matchedPlayer.personId,
                  first_name: matchedPlayer.firstName,
                  last_name: matchedPlayer.lastName,
                }
              : undefined,
          },
        ]);

        setIsLogModalOpen(false);
        setScoreDisplay("");
        setScoreNumeric("");
        setDurationSeconds("");
        setFrequencyReps("");
        setIntervalDetails("");
        setNotes("");
        toast.success("Performance score logged");
      } catch (err: any) {
        toast.error("Failed to log score");
      }
    });
  };

  const handleDeleteLog = (id: number) => {
    startTransition(async () => {
      try {
        await deletePerformanceLog(id, teamSeasonId);
        setLogs((prev) => prev.filter((l) => l.id !== id));
        toast.success("Log deleted");
      } catch (err: any) {
        toast.error("Failed to delete log");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/40 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Zap className="text-amber-400" size={20} />
            <span>Fitness Testing & Performance Logs</span>
          </h2>
          <p className="text-xs text-muted">
            Track repeat practice fitness tests (beep tests, shuttle runs) and at-home player workouts with interval/duration details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {testList.length > 0 && (
            <Select
              value={selectedTestId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTestId(Number(e.target.value))}
              className="text-xs py-1 px-3 h-9"
            >
              {testList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.unit})
                </option>
              ))}
            </Select>
          )}

          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsTestModalOpen(true)}
                className="text-xs px-3 py-2 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>New Test Type</span>
              </Button>
              {activeTest && (
                <Button
                  variant="primary"
                  onClick={() => setIsLogModalOpen(true)}
                  className="text-xs px-3 py-2 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Log Practice / Home Performance</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {!activeTest ? (
        <Card variant="outlined" padding="lg" className="text-center py-12 bg-surface/20">
          <Activity size={40} className="mx-auto text-muted mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-text mb-1">No Fitness Tests Created Yet</h3>
          <p className="text-xs text-muted max-w-md mx-auto mb-4">
            Start tracking beep tests, shuttle runs, or home workouts by creating a test type.
          </p>
          {canManage && (
            <Button variant="primary" onClick={() => setIsTestModalOpen(true)}>
              + Create First Fitness Test
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card variant="outlined" padding="none">
              <div className="p-4 border-b border-border/50 bg-surface/40 flex items-center justify-between">
                <h3 className="font-bold text-sm text-text flex items-center gap-2">
                  <Trophy size={16} className="text-amber-400" />
                  <span>{activeTest.name} Leaderboard & Progress</span>
                </h3>
                <span className="text-xs text-muted">Unit: {activeTest.unit}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface/80 border-b border-border text-muted font-semibold">
                      <th className="py-2.5 px-4">Player</th>
                      <th className="py-2.5 px-4">Personal Best</th>
                      <th className="py-2.5 px-4">Latest Score</th>
                      <th className="py-2.5 px-4">Total Attempts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {playerProgress.map(({ player, logs: pLogs, latest, best }) => (
                      <tr key={player.id} className="hover:bg-surface/30">
                        <td className="py-2.5 px-4 font-medium text-text">
                          #{player.jerseyNumber ?? "-"} {player.firstName} {player.lastName}
                        </td>
                        <td className="py-2.5 px-4">
                          {best ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Trophy size={12} />
                              {best.score_display}
                            </span>
                          ) : (
                            <span className="text-muted italic">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {latest ? (
                            <span className="font-medium text-text">
                              {latest.score_display} ({new Date(latest.test_date).toLocaleDateString()})
                            </span>
                          ) : (
                            <span className="text-muted italic">No logs</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-muted">{pLogs.length} logged</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card variant="outlined" padding="md">
              <h3 className="font-bold text-sm text-text mb-3 flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <span>Recent Log Entries</span>
              </h3>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {activeLogs.length === 0 ? (
                  <p className="text-xs text-muted italic">No scores recorded for this test yet.</p>
                ) : (
                  activeLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-surface/30 border border-border/40 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-text">
                          {log.people ? `${log.people.first_name} ${log.people.last_name}` : `Player #${log.player_id}`}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary text-sm">
                            {log.score_display}
                          </span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1 hover:bg-surface rounded text-muted hover:text-danger"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                          {log.entry_source === "player_home" ? (
                            <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                              <Home size={10} /> At Home
                            </span>
                          ) : (
                            <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                              <Zap size={10} /> In Practice
                            </span>
                          )}
                        </span>
                        <span>{new Date(log.test_date).toLocaleDateString()}</span>
                      </div>

                      {log.interval_details && (
                        <div className="text-[10px] text-text bg-surface/50 p-1 rounded font-mono">
                          Intervals: {log.interval_details}
                        </div>
                      )}

                      {log.notes && <p className="text-[11px] text-muted italic">"{log.notes}"</p>}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Create Fitness Test"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-text">Test Name *</label>
            <Input
              value={testName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestName(e.target.value)}
              placeholder="e.g. Beep Test, 100m Shuttle Run, 1-Mile Run, Vertical Jump"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-text">Unit of Measurement</label>
            <Input
              value={testUnit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestUnit(e.target.value)}
              placeholder="e.g. level.shuttle, seconds, mm:ss, inches"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-text">Description / Instructions</label>
            <Input
              value={testDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestDescription(e.target.value)}
              placeholder="e.g. 20m shuttle sprint test until exhaustion"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsTestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateTest} isLoading={isPending}>
              Create Test
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={`Log ${activeTest?.name || "Score"}`}
      >
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
              <label className="block font-semibold mb-1 text-text">Log Location / Source</label>
              <Select value={entrySource} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEntrySource(e.target.value)}>
                <option value="coach_practice">⚡ In Practice (Coach Logged)</option>
                <option value="player_home">🏠 At Home (Player Logged)</option>
                <option value="self_reported">📋 Self Reported</option>
              </Select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-text">Test Date *</label>
              <Input
                type="date"
                value={testDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-text">
                Score Display ({activeTest?.unit}) *
              </label>
              <Input
                value={scoreDisplay}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreDisplay(e.target.value)}
                placeholder="e.g. 11.4 or 6:30 or 4.8"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-text">
                Numeric Value (For sorting)
              </label>
              <Input
                type="number"
                step="any"
                value={scoreNumeric}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreNumeric(e.target.value)}
                placeholder="e.g. 11.4 or 390 (sec)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-text">Duration (Seconds)</label>
              <Input
                type="number"
                value={durationSeconds}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationSeconds(e.target.value)}
                placeholder="e.g. 1800 (for 30 mins)"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-text">Frequency / Reps</label>
              <Input
                type="number"
                value={frequencyReps}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrequencyReps(e.target.value)}
                placeholder="e.g. 5 sets, 50 reps"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-text">Interval Details / Split Times</label>
            <Input
              value={intervalDetails}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIntervalDetails(e.target.value)}
              placeholder='e.g. "5 x 200m @ 32s with 45s rest" or "Set 1: 10, Set 2: 12"'
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-text">Notes / Conditions</label>
            <Input
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
              placeholder="e.g. Indoor turf, hot weather, felt strong"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveLog} isLoading={isPending}>
              Save Performance Log
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
