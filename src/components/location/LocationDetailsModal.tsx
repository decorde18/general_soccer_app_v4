"use client";

import React, { useEffect, useState } from "react";
import { X, MapPin, Navigation, Copy, Check, Layers, ExternalLink, Loader2, Info } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { getLocationDetails, LocationDetails } from "@/lib/actions/location-actions";

interface LocationDetailsModalProps {
  locationId: number | null;
  locationNameFallback?: string | null;
  sublocationName?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationDetailsModal({
  locationId,
  locationNameFallback,
  sublocationName,
  isOpen,
  onClose,
}: LocationDetailsModalProps) {
  const [details, setDetails] = useState<LocationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && locationId) {
      setLoading(true);
      getLocationDetails(locationId)
        .then((res) => setDetails(res))
        .catch((err) => console.error("Failed to load location details:", err))
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
    }
  }, [isOpen, locationId]);

  if (!isOpen) return null;

  const displayName = details?.name || locationNameFallback || "Match Venue";
  const fullAddress = details?.formattedAddress;
  const mapQuery = fullAddress || `${displayName} Soccer Complex`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = details?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  const handleCopyAddress = () => {
    if (!fullAddress) return;
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    toast.success("Address copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl space-y-0">
        
        {/* MODAL HEADER */}
        <div className="border-b border-slate-800 bg-slate-950 p-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <MapPin size={14} className="text-indigo-400" />
              <span>Venue & Location Details</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              {displayName}
            </h2>
            {(details?.abbreviation || sublocationName) && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                {details?.abbreviation && (
                  <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-bold text-[10px]">
                    {details.abbreviation}
                  </span>
                )}
                {sublocationName && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Layers size={12} /> {sublocationName}
                  </span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              <span>Loading venue details...</span>
            </div>
          ) : (
            <>
              {/* ADDRESS & NAVIGATION ACTION CARD */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Physical Address
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {fullAddress || "Address details not specified"}
                    </p>
                  </div>

                  {fullAddress && (
                    <button
                      onClick={handleCopyAddress}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all shrink-0"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                  >
                    <Navigation size={14} />
                    <span>Get Directions in Google Maps</span>
                    <ExternalLink size={12} className="opacity-70" />
                  </a>
                </div>
              </div>

              {/* EMBEDDED INTERACTIVE MAP */}
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-lg h-56 bg-slate-950 relative">
                <iframe
                  title="Venue Location Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={embedUrl}
                />
              </div>

              {/* SUBLOCATIONS / PITCHES LIST */}
              {details?.sublocations && details.sublocations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={13} className="text-indigo-400" />
                    Available Fields at Complex ({details.sublocations.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {details.sublocations.map((sub) => {
                      const isCurrent = sublocationName && (sub.name === sublocationName || sub.description === sublocationName);
                      return (
                        <div
                          key={sub.id}
                          className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                            isCurrent
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-bold"
                              : "border-slate-800 bg-slate-950/40 text-slate-300"
                          }`}
                        >
                          <div className={`h-2 w-2 rounded-full ${isCurrent ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                          <span className="truncate">{sub.name}</span>
                          {sub.description && (
                            <span className="text-[10px] opacity-60 font-mono">({sub.description})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 flex justify-end">
          <Button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5">
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
