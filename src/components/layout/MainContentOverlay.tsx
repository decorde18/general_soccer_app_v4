"use client";

import React from "react";
import { Shield } from "lucide-react";
import { useTeamLoadingStore } from "@/stores/teamLoadingStore";

export default function MainContentOverlay() {
  const { isTeamLoading, targetTeamName } = useTeamLoadingStore();

  if (!isTeamLoading) return null;

  return (
    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center p-6 transition-all duration-200 pointer-events-auto select-none">
      <div className="bg-surface/95 border border-border/80 shadow-2xl rounded-2xl p-6 flex flex-col items-center gap-4 max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Shield className="w-5 h-5 text-primary absolute" />
        </div>
        <div>
          <h4 className="font-bold text-base text-text">Updating Team Context...</h4>
          {targetTeamName ? (
            <p className="text-xs text-primary font-semibold mt-1 truncate max-w-[240px]">
              {targetTeamName}
            </p>
          ) : (
            <p className="text-xs text-muted mt-1">Loading dashboard content</p>
          )}
        </div>
      </div>
    </div>
  );
}
