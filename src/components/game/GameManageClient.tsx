"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity, Clock, Trash2, Edit2, AlertTriangle, ShieldCheck, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import useGameStore from "@/stores/gameStore";

export default function GameManageClient() {
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const deleteEvent = useGameStore((s) => s.deleteEvent);
  const syncGameStatus = useGameStore((s) => s.syncGameStatus);

  const [eventToDelete, setEventToDelete] = useState<{ id: number | string; type: any; label: string } | null>(null);

  if (!game) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading game management...
      </div>
    );
  }

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent(eventToDelete.id, eventToDelete.type);
      toast.success(`Deleted event: ${eventToDelete.label}`);
    } catch (err: any) {
      toast.error("Failed to delete event: " + err.message);
    } finally {
      setEventToDelete(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Activity size={14} />
              <span>Match Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Period Clock & Event Management
            </h1>
            <p className="text-xs text-muted max-w-xl">
              Audit recorded match events, remove erroneous entries, and adjust game status.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await syncGameStatus();
              toast.success("Game status resynced with period clocks.");
            }}
          >
            Resync Game Status
          </Button>
        </div>
      </div>

      {/* EVENT REVISION LOG */}
      <Card variant="outlined" padding="lg" className="space-y-4 bg-surface shadow-xs">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <h3 className="font-extrabold text-sm text-text uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            <span>Recorded Match Goals ({game.gameEventsGoals?.length || 0})</span>
          </h3>
        </div>

        <div className="space-y-2">
          {(!game.gameEventsGoals || game.gameEventsGoals.length === 0) ? (
            <p className="text-xs text-muted text-center py-6">No goals recorded yet.</p>
          ) : (
            game.gameEventsGoals.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background/50 text-xs"
              >
                <div>
                  <p className="font-bold text-text">
                    Goal #{g.id} ({typeof g.goal_types === "string" ? g.goal_types : "Standard Shot"})
                  </p>
                  <p className="text-[10px] text-muted">Team Season ID: {g.team_season_id}</p>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (g.id !== undefined) {
                      setEventToDelete({ id: g.id, type: "goal", label: `Goal #${g.id}` });
                    }
                  }}
                  className="flex items-center gap-1 text-[11px]"
                >
                  <Trash2 size={13} />
                  <span>Delete Goal</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* CONFIRMATION DIALOG */}
      <Dialog
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        title="Delete Match Event"
        message={`Are you sure you want to permanently remove ${eventToDelete?.label || "this event"} from the match record?`}
        type="warning"
        confirmText="Yes, Delete Event"
        cancelText="Cancel"
        onConfirm={confirmDeleteEvent}
      />
    </div>
  );
}
