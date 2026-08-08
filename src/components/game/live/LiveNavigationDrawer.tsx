"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, Users, Settings, Sliders, FileText, ChevronRight } from "lucide-react";

interface LiveNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  teamSeasonId: string;
  gameId: string;
}

export default function LiveNavigationDrawer({
  isOpen,
  onClose,
  teamSeasonId,
  gameId,
}: LiveNavigationDrawerProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const navItems = [
    {
      title: "Lineup & Roster Setup",
      desc: "Adjust starting starters, goalkeepers & player availability",
      icon: Users,
      path: `/gamestats/${teamSeasonId}/${gameId}/lineup`,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Game Rules & Settings",
      desc: "Change period lengths, overtime rules & clock direction",
      icon: Settings,
      path: `/gamestats/${teamSeasonId}/${gameId}/settings`,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Game Management",
      desc: "Manually edit periods, goals, cards & event logs",
      icon: Sliders,
      path: `/gamestats/${teamSeasonId}/${gameId}/manage`,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Match Summary",
      desc: "View overall match summary and team box score",
      icon: FileText,
      path: `/gamestats/${teamSeasonId}/${gameId}/summary`,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm h-full bg-surface border-l border-border shadow-2xl flex flex-col p-5 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-4 shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-text">Match Operations</h2>
            <p className="text-[11px] text-muted font-medium">Quick navigation & match controls</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-background transition-colors cursor-pointer"
            aria-label="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => {
                  onClose();
                  router.push(item.path);
                }}
                className="group flex items-center justify-between p-3.5 border border-border/60 bg-background/50 hover:bg-background/90 hover:border-primary/50 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg border ${item.color} shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-text group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-muted truncate">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted/60 group-hover:text-primary transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
