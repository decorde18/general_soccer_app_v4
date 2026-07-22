"use client";

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
      className={`${action.span ?? "col-span-1"} group rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
        isPrimary ? "hover:border-primary/30" : "hover:border-slate-300"
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div
          className={`rounded-xl p-3 transition-colors ${
            isPrimary
              ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
          }`}
        >
          {action.icon}
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-primary" />
      </div>

      <h4 className="text-lg font-bold text-slate-800 transition-colors group-hover:text-primary">
        {action.label}
      </h4>
      <p className="mt-1 text-sm text-slate-500">{action.subLabel}</p>
    </button>
  );
}
