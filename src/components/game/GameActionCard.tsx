"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import type { QuickAction } from "@/types/game";

interface GameActionCardProps {
  action: QuickAction;
  onSelect: (path: string) => void;
}

export default function GameActionCard({ action, onSelect }: GameActionCardProps) {
  const isPrimary = action.variant === "primary";

  return (
    <button
      onClick={() => onSelect(action.path)}
      className={`${action.span ?? "col-span-1"} group rounded-2xl border border-border bg-surface p-5 text-left shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div
          className={`rounded-xl p-3 transition-colors ${
            isPrimary
              ? "bg-primary text-white shadow-xs"
              : "bg-background border border-border text-muted group-hover:text-primary group-hover:border-primary/30"
          }`}
        >
          {action.icon}
        </div>
        <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <h4 className="text-sm font-extrabold text-text transition-colors group-hover:text-primary">
        {action.label}
      </h4>
      <p className="mt-1 text-xs text-muted leading-relaxed">{action.subLabel}</p>
    </button>
  );
}
