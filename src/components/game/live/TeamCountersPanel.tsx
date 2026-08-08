"use client";

import React from "react";
import { Zap, PlusCircle, MinusCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface TeamCountersPanelProps {
  ourShortName: string;
  opponentShortName: string;
  ourId: number;
  oppId: number;
  ourCorners: number;
  oppCorners: number;
  ourOffsides: number;
  oppOffsides: number;
  ourFouls: number;
  oppFouls: number;
  onAddTeamEvent: (teamSeasonId: number | string, type: "corner" | "offside" | "foul") => void;
  onRemoveTeamEvent: (teamSeasonId: number | string, type: "corner" | "offside" | "foul") => void;
}

export default function TeamCountersPanel({
  ourShortName,
  opponentShortName,
  ourId,
  oppId,
  ourCorners,
  oppCorners,
  ourOffsides,
  oppOffsides,
  ourFouls,
  oppFouls,
  onAddTeamEvent,
  onRemoveTeamEvent,
}: TeamCountersPanelProps) {
  return (
    <Card variant="outlined" padding="sm" className="h-[182px] shrink-0 flex flex-col bg-surface shadow-xs rounded-xl overflow-hidden p-2.5">
      <div className="flex items-center gap-1 border-b border-border/40 pb-1 px-1 shrink-0">
        <Zap size={11} className="text-primary" />
        <span className="font-extrabold uppercase tracking-wider text-[10px] text-text">Team Counters</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2 text-[10px] p-1.5 min-h-0 overflow-y-auto mt-1">
        {/* Our Team */}
        <div className="space-y-1">
          <h4 className="font-extrabold text-[9px] uppercase text-primary border-b border-primary/10 pb-0.5 truncate" title={ourShortName}>
            {ourShortName}
          </h4>
          <div className="space-y-1 font-semibold text-text">
            <div className="flex items-center justify-between">
              <span>Corners: {ourCorners}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Our Corner"
                  onClick={() => onRemoveTeamEvent(ourId, "corner")}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Our Corner"
                  onClick={() => onAddTeamEvent(ourId, "corner")}
                  className="p-0.5 text-primary hover:text-primary-hover cursor-pointer"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Offsides: {ourOffsides}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Our Offside"
                  onClick={() => onRemoveTeamEvent(ourId, "offside")}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Our Offside"
                  onClick={() => onAddTeamEvent(ourId, "offside")}
                  className="p-0.5 text-primary hover:text-primary-hover cursor-pointer"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Fouls: {ourFouls}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Our Foul"
                  onClick={() => onRemoveTeamEvent(ourId, "foul")}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Our Foul"
                  onClick={() => onAddTeamEvent(ourId, "foul")}
                  className="p-0.5 text-primary hover:text-primary-hover cursor-pointer"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Opponent Team */}
        <div className="space-y-1 border-l border-border/60 pl-2">
          <h4 className="font-extrabold text-[9px] uppercase text-accent border-b border-accent/10 pb-0.5 truncate" title={opponentShortName}>
            {opponentShortName}
          </h4>
          <div className="space-y-1 font-semibold text-text">
            <div className="flex items-center justify-between">
              <span>Corners: {oppCorners}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Opponent Corner"
                  onClick={() => onRemoveTeamEvent(oppId, "corner")}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Opponent Corner"
                  onClick={() => onAddTeamEvent(oppId, "corner")}
                  className="p-0.5 text-accent hover:text-accent-hover cursor-pointer"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Offsides: {oppOffsides}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Opponent Offside"
                  onClick={() => onRemoveTeamEvent(oppId, "offside")}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Opponent Offside"
                  onClick={() => onAddTeamEvent(oppId, "offside")}
                  className="p-0.5 text-accent hover:text-accent-hover cursor-pointer"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Fouls: {oppFouls}</span>
              <div className="flex gap-0.5">
                <button
                  aria-label="Remove Opponent Foul"
                  onClick={() => onRemoveTeamEvent(oppId, "foul")}
                  className="p-0.5 text-muted hover:text-danger cursor-pointer"
                >
                  <MinusCircle size={12} />
                </button>
                <button
                  aria-label="Add Opponent Foul"
                  onClick={() => onAddTeamEvent(oppId, "foul")}
                  className="p-0.5 text-accent hover:text-accent-hover cursor-pointer"
                >
                  <PlusCircle size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
