"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface LineupValidationBannerProps {
  isLineupConfigured: boolean;
  onFieldCount: number;
  playersOnFieldSetting: number;
  teamSeasonId: string;
  gameId: string;
}

export default function LineupValidationBanner({
  isLineupConfigured,
  onFieldCount,
  playersOnFieldSetting,
  teamSeasonId,
  gameId,
}: LineupValidationBannerProps) {
  const router = useRouter();

  if (isLineupConfigured) return null;

  return (
    <div className="shrink-0 p-2 border-l-4 border-l-amber-500 bg-amber-500/5 text-amber-800 dark:text-amber-300 rounded-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5 font-bold">
        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
        <span>
          Roster setup required: starting lineup size mismatch ({onFieldCount}/{playersOnFieldSetting}).
        </span>
      </div>
      <Button
        variant="outline"
        size="xs"
        onClick={() => router.push(`/gamestats/${teamSeasonId}/${gameId}/lineup`)}
        className="text-[10px] h-5 py-0 px-2 text-amber-700 dark:text-amber-300 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20"
      >
        Configure Lineup
      </Button>
    </div>
  );
}
