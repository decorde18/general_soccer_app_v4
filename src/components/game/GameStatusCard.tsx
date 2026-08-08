"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface GameStatusCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  statusColor: string; // e.g. "bg-amber-500"
}

export default function GameStatusCard({
  icon,
  title,
  subtitle,
  statusColor,
}: GameStatusCardProps) {
  // Map background color to matching text and border colors
  const colorMap: Record<string, { border: string; text: string; bg: string }> = {
    "bg-amber-500": { border: "border-amber-500", text: "text-amber-600", bg: "bg-amber-500/15" },
    "bg-emerald-500": { border: "border-emerald-500", text: "text-emerald-600", bg: "bg-emerald-500/15" },
    "bg-blue-500": { border: "border-blue-500", text: "text-blue-600", bg: "bg-blue-500/15" },
    "bg-rose-500": { border: "border-rose-500", text: "text-rose-600", bg: "bg-rose-500/15" },
    "bg-slate-700": { border: "border-slate-500", text: "text-slate-600", bg: "bg-slate-500/15" },
  };

  const colors = colorMap[statusColor] || { border: "border-primary", text: "text-primary", bg: "bg-primary/10" };

  return (
    <Card
      variant="default"
      padding="md"
      className={`relative overflow-hidden border border-border border-l-4 ${colors.border} bg-surface shadow-xs rounded-r-2xl rounded-l-none`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}>
          {icon}
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Current Stage
          </span>
          <h2 className="text-base font-extrabold text-text tracking-tight">{title}</h2>
          <p className="text-xs text-muted font-medium">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}
