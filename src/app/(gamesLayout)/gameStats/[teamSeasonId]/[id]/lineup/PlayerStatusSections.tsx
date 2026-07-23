"use client";

import React, { useState } from "react";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import PlayerRow from "./PlayerRow";
import { toast } from "sonner";

interface StatusObj {
  gameStatus: string[];
  label: string;
  section: string;
  sort: string[];
  minSlots?: number;
  prominent?: boolean;
}

const statusArray: StatusObj[] = [
  {
    gameStatus: ["starter", "goalkeeper"],
    label: "Starting XI",
    section: "starters",
    sort: ["gameStatus", "jerseyNumber"],
    minSlots: 11,
    prominent: true,
  },
  {
    gameStatus: ["dressed"],
    label: "Game Changers",
    section: "bench",
    sort: ["jerseyNumber"],
    prominent: true,
  },
  {
    gameStatus: ["not_dressed"],
    label: "Available (Not Dressed)",
    section: "available",
    sort: ["jerseyNumber"],
  },
  {
    gameStatus: ["unavailable", "injured", "suspended"],
    label: "Unavailable",
    section: "unavailable",
    sort: ["gameStatus", "jerseyNumber"],
  },
];

export default function PlayerStatusSections() {
  const roster = useGamePlayersStore((s) => s.players);
  const updateGameStatus = useGamePlayersStore((s) => s.updateGameStatus);
  const game = useGameStore((s) => s.game);

  const [activeHoverSection, setActiveHoverSection] = useState<string | null>(null);

  const handleStatus = (playerId: number, action: string) => {
    updateGameStatus(playerId, action as any);
  };

  const starterLength = roster.filter(
    (player) =>
      player.gameStatus === "starter" || player.gameStatus === "goalkeeper"
  ).length;

  const totalFieldPlayers = game?.settings?.playersOnField ?? 11;

  const handleDrop = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setActiveHoverSection(null);

    const playerId = Number(e.dataTransfer.getData("text/plain"));
    if (isNaN(playerId)) return;

    const player = roster.find((p) => p.id === playerId);
    if (!player) return;

    // Check if the drop targets the Starting XI and if we are already full
    if (section === "starters") {
      const isAlreadyStarter = player.gameStatus === "starter" || player.gameStatus === "goalkeeper";
      if (!isAlreadyStarter && starterLength >= totalFieldPlayers) {
        toast.error(`Starting lineup is full (maximum ${totalFieldPlayers} players)`);
        return;
      }
      handleStatus(playerId, "starter");
      toast.success(`${player.fullName} moved to Starting XI`);
    } else if (section === "bench") {
      handleStatus(playerId, "dressed");
      toast.success(`${player.fullName} moved to Game Changers`);
    } else if (section === "available") {
      handleStatus(playerId, "not_dressed");
      toast.success(`${player.fullName} moved to Available`);
    } else if (section === "unavailable") {
      handleStatus(playerId, "unavailable");
      toast.success(`${player.fullName} marked as Unavailable`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* TOP/LEFT: Starters + Game Changers (PROMINENT) */}
      <div className="flex-1 flex flex-col sm:flex-row gap-4 lg:min-h-0">
        {statusArray
          .filter((s) => s.prominent)
          .map((statusObj) => {
            const filteredPlayers = roster.filter((player) =>
              statusObj.gameStatus.some((s) => player.gameStatus === s)
            );

            const sortedPlayers = [...filteredPlayers].sort((a, b) => {
              for (const key of statusObj.sort || []) {
                const desc = key.startsWith("-");
                const field = desc ? key.slice(1) : key;

                const valA = (a as any)[field];
                const valB = (b as any)[field];

                if (valA < valB) return desc ? 1 : -1;
                if (valA > valB) return desc ? -1 : 1;
              }
              return 0;
            });

            const hasGoalkeeper = sortedPlayers.some(
              (p) => p.gameStatus === "goalkeeper"
            );

            // Dynamically set starting slots from game settings
            const slotsToShow =
              statusObj.section === "starters"
                ? totalFieldPlayers
                : sortedPlayers.length;

            const emptySlots = Math.max(0, slotsToShow - sortedPlayers.length);
            const isHovered = activeHoverSection === statusObj.section;

            return (
              <div
                key={statusObj.section}
                className={`flex-1 bg-surface rounded-lg shadow border-2 p-4 flex flex-col transition-all duration-200 ${
                  isHovered
                    ? "border-primary border-dashed bg-primary/5 scale-[1.01]"
                    : "border-border"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setActiveHoverSection(statusObj.section);
                }}
                onDragLeave={() => setActiveHoverSection(null)}
                onDrop={(e) => handleDrop(e, statusObj.section)}
              >
                <div className="flex items-center justify-between mb-3 select-none">
                  <h2 className="text-lg font-bold text-text">
                    {statusObj.section === "starters"
                      ? `${totalFieldPlayers}v${totalFieldPlayers} Starting XI`
                      : statusObj.label}
                  </h2>
                  <span className="text-sm text-muted font-bold">
                    {statusObj.section === "starters"
                      ? `${starterLength}/${totalFieldPlayers}`
                      : `${filteredPlayers.length}`}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto min-h-[150px]">
                  {sortedPlayers.map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      handleStatus={handleStatus}
                      section={statusObj.section}
                      starterLength={starterLength}
                    />
                  ))}

                  {/* Empty slots for starters */}
                  {statusObj.section === "starters" &&
                    emptySlots > 0 &&
                    Array.from({ length: emptySlots }).map((_, idx) => (
                      <div
                        key={`empty-${idx}`}
                        className="flex items-center p-2.5 rounded border-2 border-dashed border-muted bg-background select-none"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-white text-sm font-bold mr-3">
                          -
                        </div>
                        <div className="text-sm text-muted italic">
                          Empty starting slot
                        </div>
                      </div>
                    ))}
                </div>

                {!hasGoalkeeper &&
                  statusObj.section === "starters" &&
                  starterLength > 0 && (
                    <div className="mt-3 p-2 bg-danger/5 border border-danger/20 rounded text-danger text-xs font-semibold flex items-center gap-2 animate-pulse">
                      <span>⚠️</span>
                      <span>Assign a goalkeeper</span>
                    </div>
                  )}
              </div>
            );
          })}
      </div>

      {/* BOTTOM/RIGHT: Available + Unavailable (SECONDARY) */}
      <div className="w-full sm:flex sm:flex-row sm:gap-4 lg:w-80 lg:flex-col lg:min-h-[600px]">
        {statusArray
          .filter((s) => !s.prominent)
          .map((statusObj) => {
            const filteredPlayers = roster.filter((player) =>
              statusObj.gameStatus.some((s) => player.gameStatus === s)
            );

            const sortedPlayers = [...filteredPlayers].sort((a, b) => {
              for (const key of statusObj.sort || []) {
                const desc = key.startsWith("-");
                const field = desc ? key.slice(1) : key;

                const valA = (a as any)[field];
                const valB = (b as any)[field];

                if (valA < valB) return desc ? 1 : -1;
                if (valA > valB) return desc ? -1 : 1;
              }
              return 0;
            });

            const isHovered = activeHoverSection === statusObj.section;

            return (
              <div
                key={statusObj.section}
                className={`bg-surface rounded-lg shadow border-2 p-4 flex flex-col flex-1 min-h-[220px] transition-all duration-200 ${
                  isHovered
                    ? "border-primary border-dashed bg-primary/5 scale-[1.01]"
                    : "border-border"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setActiveHoverSection(statusObj.section);
                }}
                onDragLeave={() => setActiveHoverSection(null)}
                onDrop={(e) => handleDrop(e, statusObj.section)}
              >
                <div className="flex items-center justify-between mb-3 select-none">
                  <h2 className="text-sm font-bold text-text uppercase tracking-wide">
                    {statusObj.label}
                  </h2>
                  <span className="bg-muted/10 text-muted text-xs px-2 py-0.5 rounded-full font-bold">
                    {filteredPlayers.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {sortedPlayers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted/20 rounded-lg py-8 select-none">
                      <span className="text-muted text-xs italic">
                        No players
                      </span>
                    </div>
                  ) : (
                    sortedPlayers.map((player) => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        handleStatus={handleStatus}
                        section={statusObj.section}
                        starterLength={starterLength}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
