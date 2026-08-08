"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import type { QuickAction } from "@/types/game";
import { Card } from "@/components/ui/Card";

interface GameActionCardProps {
  action: QuickAction;
  onSelect: (path: string) => void;
}

export default function GameActionCard({ action, onSelect }: GameActionCardProps) {
  const isPrimary = action.variant === "primary";

  return (
    <Card
      variant="clickable"
      onClick={() => onSelect(action.path)}
      padding="none"
      className={`${
        action.span ?? "col-span-1"
      } group p-5 text-left border border-border shadow-xs hover:border-primary/50 transition-all duration-200 hover:-translate-y-0.5 rounded-2xl bg-surface`}
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
    </Card>
  );
}
