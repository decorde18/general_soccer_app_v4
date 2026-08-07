"use client";

import type { ReactNode } from "react";
import GameHeader from "@/components/layout/gameLayout/GameHeader";

interface GameStatusCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  accentColor: string;
}

export default function GameStatusCard({
  icon,
  title,
  subtitle,
  accentColor,
}: GameStatusCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-md border border-white/10 ${accentColor}`}
    >
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-black/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-md">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          <p className="text-xs font-semibold text-white/80">{subtitle}</p>
        </div>

        <div className="w-full pt-2">
          <GameHeader className="!border-white/20 !bg-white/10 !p-3 !shadow-none !backdrop-blur-md text-white" />
        </div>
      </div>
    </div>
  );
}
