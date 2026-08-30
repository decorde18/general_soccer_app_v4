"use client";

import React from "react";
import { Shield } from "lucide-react";

export interface ClubLinkProps {
  clubId?: number | null;
  clubName?: string | null;
  abbreviation?: string | null;
  logoUrl?: string | null;
  variant?: "short" | "long" | "default";
  showLogo?: boolean;
  className?: string;
}

export function ClubLink({
  clubId = null,
  clubName,
  abbreviation,
  logoUrl,
  variant = "default",
  showLogo = true,
  className = "",
}: ClubLinkProps) {
  if (!clubName && !abbreviation) {
    return <span className="text-slate-500 text-xs">—</span>;
  }

  const labelText =
    variant === "short" && abbreviation ? abbreviation : clubName || abbreviation || "Club";

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold text-slate-200 ${className}`}>
      {showLogo &&
        (logoUrl ? (
          <img src={logoUrl} alt={labelText} className="w-4 h-4 rounded-full object-contain shrink-0" />
        ) : (
          <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        ))}
      <span className="truncate">{labelText}</span>
    </span>
  );
}

export default ClubLink;
