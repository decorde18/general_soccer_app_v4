"use client";

import React, { useState } from "react";
import { Trophy, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatSecondsToMmss } from "@/lib/utils/dateTimeUtils";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export interface RecentEvent {
  id: string;
  dbId: string | number;
  time: number;
  type: string;
  desc: string;
}

interface RecentEventsPanelProps {
  recentEventsList?: RecentEvent[];
  confirmDeleteId?: string | null;
  setConfirmDeleteId?: (id: string | null) => void;
  onDeleteEvent?: (dbId: string | number, type: string) => void;
}

export default function RecentEventsPanel(props: RecentEventsPanelProps) {
  const rawParams = typeof useParams === "function" ? useParams() : null;
  const params = (rawParams || {}) as { id?: string; teamSeasonId?: string };
  const game = useGameStore((s) => s.game);
  const deleteEventStore = useGameStore((s) => s.deleteEvent);
  const players = useGamePlayersStore((s) => s.players);

  const [localConfirmDeleteId, setLocalConfirmDeleteId] = useState<string | null>(null);

  const confirmDeleteId = props.confirmDeleteId ?? localConfirmDeleteId;
  const setConfirmDeleteId = props.setConfirmDeleteId ?? setLocalConfirmDeleteId;

  const teamSeasonIdParam = params?.teamSeasonId;
  const ourId = Number(teamSeasonIdParam || (game?.isHome ? game?.home_team_season_id : game?.away_team_season_id) || 0);

  const computedRecentEventsList = React.useMemo(() => {
    if (!game) return [];
    const list: RecentEvent[] = [];

    const linkedMajorIds = new Set<number>();

    (game.gameEventsGoals || []).forEach((g: any) => {
      if (g.major_event_id) linkedMajorIds.add(Number(g.major_event_id));
      const major = (game.gameEventsMajor || []).find((m) => Number(m.id) === Number(g.major_event_id));
      const eventTime = g.game_time ?? major?.game_time ?? 0;
      const scorer = players.find((p) => Number(p.playerGameId) === Number(g.scorer_player_game_id));
      const teamName = Number(g.team_season_id) === ourId ? "Us" : "Opponent";
      const desc = `Goal for ${teamName} by ${scorer ? scorer.fullName : "Unknown"}${g.is_own_goal ? " (OG)" : ""}`;
      list.push({ id: `goal-${g.id || g.goal_id}`, dbId: g.id || g.goal_id, time: eventTime, type: "goal", desc });
    });

    (game.gameEventsDiscipline || []).forEach((d: any) => {
      if (d.major_event_id) linkedMajorIds.add(Number(d.major_event_id));
      const major = (game.gameEventsMajor || []).find((m) => Number(m.id) === Number(d.major_event_id));
      const eventTime = d.game_time ?? major?.game_time ?? 0;
      const player = players.find((p) => Number(p.playerGameId) === Number(d.player_game_id));
      const cardKind = String(d.card_type || d.card_color || "Card").toUpperCase();
      const desc = `${cardKind} Card to ${player ? player.fullName : "Unknown"}`;
      list.push({ id: `card-${d.id || d.discipline_id}`, dbId: d.id || d.discipline_id, time: eventTime, type: "discipline", desc });
    });

    (game.gameEventsTeam || []).forEach((t: any) => {
      const teamName = Number(t.team_season_id) === ourId ? "Us" : "Opponent";
      const desc = `Team ${t.event_type.toUpperCase()} for ${teamName}`;
      list.push({ id: `team-${t.id}`, dbId: t.id, time: t.game_time ?? 0, type: "team", desc });
    });

    (game.gameEventsMajor || []).forEach((m: any) => {
      if (!linkedMajorIds.has(Number(m.id)) && (m.details || m.event_type === "stoppage")) {
        const desc = m.details ? `Stoppage: ${m.details}` : `Stoppage Event`;
        list.push({ id: `major-${m.id}`, dbId: m.id, time: m.game_time ?? 0, type: "major", desc });
      }
    });

    return list.sort((a, b) => b.time - a.time);
  }, [game?.gameEventsGoals, game?.gameEventsDiscipline, game?.gameEventsTeam, game?.gameEventsMajor, players, ourId]);

  const recentEventsList = props.recentEventsList ?? computedRecentEventsList;

  const defaultDeleteEvent = async (dbId: string | number, type: string) => {
    try {
      let eventTypeKey: any = "major";
      if (type === "goal") eventTypeKey = "goal";
      if (type === "discipline") eventTypeKey = "discipline";
      if (type === "team") eventTypeKey = "team";

      await deleteEventStore(dbId, eventTypeKey);
      toast.success("Event deleted.");
    } catch (err: any) {
      toast.error("Failed to delete event: " + err.message);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const onDeleteEvent = props.onDeleteEvent ?? defaultDeleteEvent;

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
