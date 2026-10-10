"use client";

import React from "react";
import { Shield } from "lucide-react";
import { useEntityModal } from "@/providers/EntityModalProvider";

export interface ClubLinkProps {
  clubId?: number | null;
  clubName?: string | null;
  abbreviation?: string | null;
  logoUrl?: string | null;
  variant?: "short" | "long" | "default";
  showLogo?: boolean;
  className?: string;
  isInteractive?: boolean;
}

export function ClubLink({
  clubId = null,
  clubName,
  abbreviation,
  logoUrl,
  variant = "default",
  showLogo = true,
  className = "",
  isInteractive = true,
}: ClubLinkProps) {
  const { openClubModal } = useEntityModal();

  if (!clubName && !abbreviation) {
    return <span className="text-slate-500 text-xs">—</span>;
  }

  const labelText =
    variant === "short" && abbreviation ? abbreviation : clubName || abbreviation || "Club";

  const handleClick = (e: React.MouseEvent) => {
    if (isInteractive && clubId) {
      e.preventDefault();
      e.stopPropagation();
      openClubModal(clubId, clubName || abbreviation);
    }
  };

  return (
    <span
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 font-semibold text-slate-200 ${
        isInteractive && clubId ? "cursor-pointer hover:underline hover:text-primary transition-colors" : ""
      } ${className}`}
      title={isInteractive && clubId ? "Click to view club details" : undefined}
    >
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
