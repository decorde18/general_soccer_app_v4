"use client";

import React, { useState, useEffect, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Search, UserCheck, Shield, Hash, AlertCircle } from "lucide-react";
import {
  searchGuestPlayerCandidates,
  addGuestPlayerToLineup,
  LineupPlayer,
} from "@/lib/actions/gameLineup-actions";
import { toast } from "sonner";

interface CandidatePlayer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  jerseyNumber: number | null;
  clubName: string | null;
  teamName: string | null;
  seasonName: string | null;
}

interface AddGuestPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  teamSeasonId: number;
  existingPlayerIds?: number[];
  onGuestAdded: (player: LineupPlayer) => void;
}

export default function AddGuestPlayerModal({
  isOpen,
  onClose,
  gameId,
  teamSeasonId,
  existingPlayerIds = [],
  onGuestAdded,
}: AddGuestPlayerModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CandidatePlayer[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePlayer | null>(null);
  const [jerseyNumber, setJerseyNumber] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<"dressed" | "not_dressed" | "starter">("dressed");
  const [isSearching, startSearchTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedCandidate(null);
      setJerseyNumber("");
      setGameStatus("dressed");
    }
  }, [isOpen]);

  // Debounced candidate search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        try {
          const candidates = await searchGuestPlayerCandidates(query);
          setResults(candidates);
        } catch (err: any) {
          console.error("Error searching guest candidates:", err);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectCandidate = (candidate: CandidatePlayer) => {
    setSelectedCandidate(candidate);
    setJerseyNumber(candidate.jerseyNumber != null ? String(candidate.jerseyNumber) : "");
  };

  const handleSubmit = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    try {
      const parsedJersey = jerseyNumber.trim() !== "" ? parseInt(jerseyNumber, 10) : null;
      const res = await addGuestPlayerToLineup(gameId, teamSeasonId, {
        personId: selectedCandidate.id,
        jerseyNumber: parsedJersey,
        gameStatus,
      });

      if (res.success && res.player) {
        toast.success(`${res.player.fullName} added as guest player!`);
        onGuestAdded(res.player);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add guest player");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "dressed", label: "Game Changers (Bench / Dressed)" },
    { value: "starter", label: "Starting Lineup" },
    { value: "not_dressed", label: "Available (Not Dressed)" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Guest Player"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedCandidate || isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add to Lineup"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
            Search Person Directory
          </label>
          <div className="relative">
            <Input
              placeholder="Search by first name, last name, or email..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              className="pl-9 text-sm"
              autoFocus
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
          </div>
          {isSearching && (
            <p className="text-[11px] text-muted mt-1 italic">Searching players...</p>
          )}
        </div>

        {/* Search Results */}
        {results.length > 0 && !selectedCandidate && (
          <div className="border border-border rounded-xl divide-y divide-border max-h-56 overflow-y-auto bg-surface/50">
            {results.map((c) => {
              const alreadyInLineup = existingPlayerIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => !alreadyInLineup && handleSelectCandidate(c)}
                  className={`p-2.5 flex items-center justify-between gap-2 transition-colors ${
                    alreadyInLineup
                      ? "opacity-50 cursor-not-allowed bg-muted/10"
                      : "cursor-pointer hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                      {c.jerseyNumber ?? "-"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text truncate">
                        {c.fullName}
                      </div>
                      <div className="text-[11px] text-muted truncate">
                        {c.clubName || c.teamName ? (
                          <span>
                            {c.clubName} {c.teamName && `· ${c.teamName}`}
                          </span>
                        ) : (
                          "Unattached / Club Pool"
                        )}
                      </div>
                    </div>
                  </div>

                  {alreadyInLineup ? (
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">
                      Already in Lineup
                    </span>
                  ) : (
                    <Button variant="ghost" size="xs" className="shrink-0 text-primary font-semibold">
                      Select
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {query.trim().length >= 2 && !isSearching && results.length === 0 && (
          <div className="text-center py-4 border border-dashed border-border rounded-xl">
            <p className="text-xs text-muted">No players found matching &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* Selected Candidate Preview & Settings */}
        {selectedCandidate && (
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-text flex items-center gap-1.5">
                    <span>{selectedCandidate.fullName}</span>
                    <span className="bg-primary/20 text-primary text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-primary/30">
                      Guest
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    {selectedCandidate.clubName} {selectedCandidate.teamName && `· ${selectedCandidate.teamName}`}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelectedCandidate(null)}
                className="text-xs text-muted hover:text-danger"
              >
                Change
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-primary/10">
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Jersey Number for Match
                </label>
                <Input
                  placeholder="#"
                  value={jerseyNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setJerseyNumber(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  className="text-sm font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Initial Section
                </label>
                <Select
                  value={gameStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setGameStatus(e.target.value as any)
                  }
                  options={statusOptions}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
