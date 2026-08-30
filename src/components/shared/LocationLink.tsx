"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { useEntityModal } from "@/providers/EntityModalProvider";

export interface LocationLinkProps {
  locationId?: number | null;
  locationName?: string | null;
  sublocationName?: string | null;
  abbreviation?: string | null;
  variant?: "default" | "compact" | "abbreviated" | "full";
  showIcon?: boolean;
  className?: string;
}

export function LocationLink({
  locationId = null,
  locationName,
  sublocationName,
  abbreviation,
  variant = "default",
  showIcon = false,
  className = "",
}: LocationLinkProps) {
  const { openLocationModal } = useEntityModal();

  if (!locationName && !sublocationName) {
    return <span className="text-slate-500 text-xs">—</span>;
  }

  const baseName =
    (variant === "compact" || variant === "abbreviated") && abbreviation
      ? abbreviation
      : locationName || "Location";

  const subName = sublocationName ? ` (${sublocationName})` : "";
  const labelText = `${baseName}${subName}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openLocationModal(locationId, locationName, sublocationName);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Click to view interactive map & venue details"
      className={`inline-flex items-center gap-1 text-slate-300 hover:text-emerald-400 hover:underline transition-colors text-left focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded px-0.5 ${className}`}
    >
      {showIcon && <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
      <span className="truncate">{labelText}</span>
    </button>
  );
}

export default LocationLink;
