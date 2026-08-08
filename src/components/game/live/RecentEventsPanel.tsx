"use client";

import React from "react";
import { Trophy, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";

export interface RecentEvent {
  id: string;
  dbId: string | number;
  time: number;
  type: string;
  desc: string;
}

interface RecentEventsPanelProps {
  recentEventsList: RecentEvent[];
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onDeleteEvent: (dbId: string | number, type: string) => void;
}

export default function RecentEventsPanel({
  recentEventsList,
  confirmDeleteId,
  setConfirmDeleteId,
  onDeleteEvent,
}: RecentEventsPanelProps) {
  return (
    <Card variant="outlined" padding="sm" className="h-[200px] shrink-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
      <div className="flex items-center gap-1 border-b border-border/40 pb-1 px-1 shrink-0">
        <Trophy size={11} className="text-primary" />
        <span className="font-extrabold uppercase tracking-wider text-[10px] text-text">Recent Events</span>
      </div>

      <div className="flex-1 overflow-y-auto p-1 mt-1.5 space-y-1.5 text-[9px] min-h-0">
        {recentEventsList.length === 0 ? (
          <p className="text-muted text-center py-8">No events logged yet.</p>
        ) : (
          recentEventsList.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 p-1.5 border border-border/20 bg-background/30 rounded">
              <span className="font-extrabold text-primary shrink-0 align-middle">
                {formatSecondsToMmss(e.time)}
              </span>
              <span className="truncate text-text font-semibold flex-1 text-left align-middle">{e.desc}</span>
              
              <div className="flex gap-1 shrink-0 align-middle" onClick={(evt) => evt.stopPropagation()}>
                {confirmDeleteId === e.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => onDeleteEvent(e.dbId, e.type)}
                      className="px-1.5 py-0.5 bg-emerald-500 text-white font-bold text-[8px] rounded hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-0.5 bg-slate-500 text-white font-bold text-[8px] rounded hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(e.id)}
                    className="p-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded transition-colors cursor-pointer"
                    title="Delete Event"
                    aria-label={`Delete event ${e.desc}`}
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
