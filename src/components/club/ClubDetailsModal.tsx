"use client";

import React, { useEffect, useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  Shield,
  MapPin,
  Users,
  Phone,
  Mail,
  ExternalLink,
  Calendar,
  Building,
} from "lucide-react";
import { getClubModalDetails } from "@/lib/actions/club-actions";

interface ClubDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: number | null;
  clubNameFallback?: string | null;
}

export default function ClubDetailsModal({
  isOpen,
  onClose,
  clubId,
  clubNameFallback,
}: ClubDetailsModalProps) {
  const [club, setClub] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && clubId) {
      setIsLoading(true);
      startTransition(async () => {
        try {
          const data = await getClubModalDetails(clubId);
          setClub(data);
        } catch (err) {
          console.error("Failed to load club details:", err);
        } finally {
          setIsLoading(false);
        }
      });
    } else {
      setClub(null);
    }
  }, [isOpen, clubId]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={club ? club.name : clubNameFallback || "Club Details"}
    >
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading club details...</span>
        </div>
      ) : !club ? (
        <div className="py-8 text-center text-xs text-muted">
          <p>Club details unavailable for #{clubId}.</p>
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          {/* Header Banner */}
          <div className="flex items-center gap-4 bg-surface/50 p-4 rounded-xl border border-border/40">
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                className="w-14 h-14 rounded-lg object-contain bg-surface/80 p-1 border border-border/50 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-text">{club.name}</h3>
              <div className="flex items-center gap-2 text-muted mt-1">
                {club.abbreviation && (
                  <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border/50 font-semibold text-text uppercase">
                    {club.abbreviation}
                  </span>
                )}
                {club.type && (
                  <span className="capitalize text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                    {club.type.replace("_", " ")}
                  </span>
                )}
                {club.founded_year && (
                  <span className="text-[11px]">Est. {club.founded_year}</span>
                )}
              </div>
            </div>
          </div>

          {/* Location & Contact Info */}
          {(club.location || club.contact_info || club.addresses) && (
            <div className="space-y-2 bg-surface/30 p-3 rounded-lg border border-border/40">
              <span className="font-semibold text-text block text-[11px] uppercase tracking-wider">
                Location & Contact
              </span>

              {club.location && (
                <div className="flex items-center gap-2 text-muted">
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span>{club.location}</span>
                </div>
              )}

              {club.addresses && (
                <div className="flex items-center gap-2 text-muted">
                  <Building size={14} className="text-primary shrink-0" />
                  <span>
                    {club.addresses.city}
                    {club.addresses.state ? `, ${club.addresses.state}` : ""}
                  </span>
                </div>
              )}

              {club.contact_info && (
                <div className="flex items-center gap-2 text-muted">
                  <Mail size={14} className="text-primary shrink-0" />
                  <span>{club.contact_info}</span>
                </div>
              )}
            </div>
          )}

          {/* Active Teams */}
          <div>
            <span className="font-semibold text-text block mb-2 text-[11px] uppercase tracking-wider">
              Active Teams ({club.teams?.length || 0})
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {club.teams && club.teams.length > 0 ? (
                club.teams.map((t: any) => {
                  const activeSeason = t.team_seasons?.[0];
                  return (
                    <div
                      key={t.id}
                      className="p-2 rounded bg-surface/40 border border-border/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-text">{t.team_name}</div>
                        <div className="text-[10px] text-muted capitalize">
                          Gender: {t.gender?.toLowerCase()}
                        </div>
                      </div>

                      {activeSeason && (
                        <Link href={`/teams/${activeSeason.id}`} onClick={onClose}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] px-2 py-1 flex items-center gap-1 hover:bg-primary/20 text-primary"
                          >
                            <span>View</span>
                            <ExternalLink size={10} />
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-muted italic col-span-full">No active teams registered.</p>
              )}
            </div>
          </div>

          {/* Staff Members */}
          {club.club_staff && club.club_staff.length > 0 && (
            <div>
              <span className="font-semibold text-text block mb-2 text-[11px] uppercase tracking-wider">
                Club Administration & Leadership
              </span>

              <div className="space-y-1.5">
                {club.club_staff.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-2 rounded bg-surface/30 border border-border/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-muted shrink-0" />
                      <span className="font-medium text-text">
                        {s.people.first_name} {s.people.last_name}
                      </span>
                    </div>

                    <span className="text-[10px] uppercase font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {s.role.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border/50">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
