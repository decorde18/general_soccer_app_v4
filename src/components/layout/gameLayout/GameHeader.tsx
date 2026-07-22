import React from "react";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import useGameStore from "@/stores/gameStore";

interface GameHeaderProps {
  backUrl?: string;
  className?: string;
}

export default function GameHeader({ backUrl, className }: GameHeaderProps) {
  const game = useGameStore((s) => s.game);

  if (!game) return null;

  return (
    <div className={`bg-surface border-b border-border p-4 shadow-sm ${className ?? ""}`}>
      <div className="flex items-center gap-4 max-w-7xl mx-auto">
        {backUrl && (
          <Link href={backUrl} className="text-muted hover:text-text transition-colors">
            <ArrowLeft size={20} />
          </Link>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted uppercase font-bold tracking-wider mb-1">
            <span>Match Details</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-text flex items-center gap-2">
            <span className="text-primary font-black">{game.homeTeamName}</span>
            <span className="text-muted/60 font-semibold">vs</span>
            <span className="text-primary font-black">{game.awayTeamName}</span>
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="opacity-70" />
              {game.startDate} {game.startTime ? `@ ${game.startTime}` : ""}
            </span>
            {game.locationName && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="opacity-70" />
                {game.locationName}
              </span>
            )}
          </div>
        </div>
        <div className="bg-primary/5 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/10 uppercase">
          {game.gameType}
        </div>
      </div>
    </div>
  );
}
