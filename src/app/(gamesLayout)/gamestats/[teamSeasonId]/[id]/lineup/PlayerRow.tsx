"use client";

import React, { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Player } from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";

interface PlayerRowProps {
  player: Player;
  handleStatus: (playerId: number, action: string) => void;
  section: string;
  starterLength: number;
}

interface ActionConfig {
  label: string;
  gameStatus: string;
  variant: "primary" | "secondary" | "success" | "danger" | "outline" | "muted";
}

interface OptionConfig {
  label: string;
  value: string;
}

export default function PlayerRow({
  player,
  handleStatus,
  section,
  starterLength,
}: PlayerRowProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const game = useGameStore((s) => s.game);

  const totalFieldPlayers = game?.settings?.playersOnField ?? 11;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.closest(".overflow-y-auto");

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const spaceBelow = containerRect.bottom - rect.bottom;
      setDropUp(spaceBelow < 180);
    } else {
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 180);
    }

    setShowDropdown(!showDropdown);
  };

  const getActionsBySection = (sec: string, playerStatus: string): ActionConfig[] => {
    const actions: ActionConfig[] = [];

    if (sec === "available") {
      actions.push(
        { label: "Start", gameStatus: "starter", variant: "primary" },
        { label: "Bench", gameStatus: "dressed", variant: "muted" }
      );
    }

    if (sec === "starters") {
      actions.push(
        {
          label: "GK",
          gameStatus: "goalkeeper",
          variant: playerStatus === "goalkeeper" ? "success" : "muted",
        },
        { label: "Bench", gameStatus: "dressed", variant: "muted" }
      );
    }

    if (sec === "bench") {
      actions.push({
        label: "Start",
        gameStatus: "starter",
        variant: "primary",
      });
    }

    return actions;
  };

  const getSettingsOptions = (sec: string, playerStatus: string): OptionConfig[] => {
    if (sec === "starters" || sec === "bench") {
      return [
        { label: "Not Dressed", value: "not_dressed" },
        { label: "Unavailable", value: "unavailable" },
        { label: "Injured", value: "injured" },
        { label: "Suspended", value: "suspended" },
      ];
    }
    if (sec === "available") {
      return [
        { label: "Dressed", value: "dressed" },
        { label: "Injured", value: "injured" },
        { label: "Unavailable", value: "unavailable" },
        { label: "Suspended", value: "suspended" },
      ];
    }
    if (sec === "unavailable") {
      const otherStatusOptions: OptionConfig[] = [];
      if (playerStatus !== "injured") otherStatusOptions.push({ label: "Injured", value: "injured" });
      if (playerStatus !== "suspended") otherStatusOptions.push({ label: "Suspended", value: "suspended" });
      if (playerStatus !== "unavailable") otherStatusOptions.push({ label: "Unavailable", value: "unavailable" });

      return [
        ...otherStatusOptions,
        { label: "Dressed", value: "dressed" },
        { label: "Not Dressed", value: "not_dressed" },
      ];
    }
    return [];
  };

  const ActionButtons = () => {
    const actions = getActionsBySection(section, player.gameStatus);
    const settingsOptions = getSettingsOptions(section, player.gameStatus);

    return (
      <div className="flex gap-1.5 relative">
        {actions.map((action) => (
          <Button
            key={action.gameStatus}
            size="xs"
            variant={action.variant}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleStatus(Number(player.id), action.gameStatus);
            }}
            disabled={
              (starterLength === totalFieldPlayers && action.gameStatus === "starter") ||
              (action.gameStatus === "goalkeeper" && starterLength === 0)
            }
          >
            {action.label}
          </Button>
        ))}

        {settingsOptions.length > 0 && (
          <div ref={dropdownRef} className="relative">
            <Button
              size="xs"
              variant="outline"
              className="px-1.5"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                handleToggle(e);
              }}
            >
              ⚙️
            </Button>

            {showDropdown && (
              <div
                className={`absolute px-2 right-0 z-50 min-w-[140px] py-2 bg-surface border border-border rounded-md shadow-xl ring-1 ring-black ring-opacity-5 
                ${dropUp ? "bottom-full mb-2" : "top-full mt-1"}`}
              >
                <div className="px-3 py-1 border-b border-border mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted">
                    Move to:
                  </span>
                </div>
                <div className="flex flex-col space-y-1.5">
                  {settingsOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="xs"
                      className="w-full text-left px-3 py-1 text-xs transition-colors hover:bg-muted/50 text-text flex items-center justify-between border-none shadow-none group"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleStatus(Number(player.id), option.value);
                        setShowDropdown(false);
                      }}
                    >
                      {option.label}
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", player.id.toString());
    setIsDragging(true);
  };

  const isGK = player.gameStatus === "goalkeeper";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      className={`flex items-center justify-between p-2.5 rounded-lg border-2 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? "opacity-40 border-primary border-dashed scale-[0.98] bg-primary/5 shadow-inner"
          : isGK
          ? "bg-success/5 border-success shadow-sm"
          : "bg-surface border-border hover:border-primary/50 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm ${
          isGK 
            ? "bg-success/15 text-success border-success/30" 
            : "bg-primary/10 text-primary border-primary/20"
        }`}>
          {player.jerseyNumber ?? "-"}
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-text leading-tight flex items-center gap-1.5">
            {player.fullName}
            {player.isGuest && (
              <span className="bg-primary/10 text-primary text-[8px] font-black uppercase px-1 rounded border border-primary/20">
                Guest
              </span>
            )}
          </div>
          {(section === "unavailable" || isGK) && (
            <span className={`text-[10px] font-bold uppercase leading-none mt-0.5 ${
              isGK ? "text-success" : "text-danger/80"
            }`}>
              {player.gameStatus}
            </span>
          )}
        </div>
      </div>
      <ActionButtons />
    </div>
  );
}
