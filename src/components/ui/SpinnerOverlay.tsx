"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function SpinnerOverlay({
  isLoading,
  message = "Loading...",
  className = "",
}: SpinnerOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface/75 backdrop-blur-xs transition-all animate-fadeIn select-none",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-md">
        <Loader2 className="h-6 w-6 animate-spin text-primary stroke-[2.5]" />
      </div>
      {message && (
        <span className="text-xs font-extrabold uppercase tracking-wider text-text bg-surface/90 px-3 py-1 rounded-full border border-border/80 shadow-xs">
          {message}
        </span>
      )}
    </div>
  );
}

export default SpinnerOverlay;
