"use client";

import React, { useState, useTransition, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import { Search, Plus, Trophy } from "lucide-react";
import {
  createInlineClub,
  createInlineTeam,
  createInlineLeague,
  createInlineLocation,
  createInlineSublocation,
  enrollTeamInLeagueNode,
} from "@/lib/actions/inlineEntity-actions";

export type InlineEntityType =
  | "club"
  | "team"
  | "league"
  | "location"
  | "sublocation"
  | "enroll_competition";

interface InlineEntityModalProps {
  entityType: InlineEntityType;
  contextData?: {
    seasonId?: number;
    teamSeasonId?: number;
    clubId?: number;
    locationId?: number;
    clubs?: Array<{ id: number; name: string }>;
    ageGroups?: Array<{ id: number; name: string }>;
    locations?: Array<{ id: number; name: string }>;
    allLeagueNodes?: Array<{ id: number; displayName: string; isTournament: boolean }>;
  };
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export default function InlineEntityModal({
  entityType: initialEntityType,
  contextData = {},
  onClose,
  onSuccess,
}: InlineEntityModalProps) {
  const [currentType, setCurrentType] = useState<InlineEntityType>(initialEntityType);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for different entity types
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [locationText, setLocationText] = useState("");
  
  // Team specific
  const [clubId, setClubId] = useState<number>(contextData.clubId || (contextData.clubs?.[0]?.id ?? 0));
  const [gender, setGender] = useState<"Men" | "Women" | "Mixed">("Mixed");
  const [ageGroupId, setAgeGroupId] = useState<number | "">("");

  // League specific
  const [isTournament, setIsTournament] = useState(false);

  // Competition Search & Enroll specific
  const [competitionSearch, setCompetitionSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  // Field/Sublocation specific
  const [locationId, setLocationId] = useState<number>(contextData.locationId || (contextData.locations?.[0]?.id ?? 0));
  const [surfaceType, setSurfaceType] = useState("");

  const filteredNodes = useMemo(() => {
    const nodes = contextData.allLeagueNodes || [];
    if (!competitionSearch.trim()) return nodes;
    const q = competitionSearch.toLowerCase();
    return nodes.filter((n) => n.displayName.toLowerCase().includes(q));
  }, [contextData.allLeagueNodes, competitionSearch]);

  const getTitle = () => {
    switch (currentType) {
      case "club": return "Create New Club";
      case "team": return "Create New Team";
      case "league": return "Create Brand-New Competition";
      case "enroll_competition": return "Enroll Team in Competition";
      case "location": return "Create New Venue Location";
      case "sublocation": return "Create New Field / Sublocation";
    }
  };

  const handleEnrollExistingNode = (nodeId: number) => {
    if (!contextData.teamSeasonId || !contextData.seasonId) {
      setErrorMsg("Primary team and season are required for enrollment.");
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await enrollTeamInLeagueNode({
          teamSeasonId: contextData.teamSeasonId!,
          leagueNodeId: nodeId,
          seasonId: contextData.seasonId!,
        });

        const matchedNode = contextData.allLeagueNodes?.find((n) => n.id === nodeId);
        onSuccess({ ...res, enrolledNodeId: nodeId, node: matchedNode });
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to enroll team in competition.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        if (currentType === "club") {
          const res = await createInlineClub({ name, abbreviation, location: locationText });
          onSuccess(res);
        } else if (currentType === "team") {
          if (!clubId) throw new Error("Please select a club for this team.");
          const res = await createInlineTeam({
            clubId: Number(clubId),
            teamName: name,
            gender,
            ageGroupId: ageGroupId ? Number(ageGroupId) : null,
            seasonId: contextData.seasonId,
          });
          onSuccess(res);
        } else if (currentType === "league") {
          const res = await createInlineLeague({
            name,
            abbreviation,
            isTournament,
            seasonId: contextData.seasonId,
          });

          // Auto-enroll if teamSeasonId is present
          if (contextData.teamSeasonId && contextData.seasonId && res.node) {
            await enrollTeamInLeagueNode({
              teamSeasonId: contextData.teamSeasonId,
              leagueNodeId: res.node.id,
              seasonId: contextData.seasonId,
            });
          }

          onSuccess(res);
        } else if (currentType === "location") {
          const res = await createInlineLocation({ name });
          onSuccess(res);
        } else if (currentType === "sublocation") {
          if (!locationId) throw new Error("Please select a venue complex.");
          const res = await createInlineSublocation({
            locationId: Number(locationId),
            name,
            surfaceType,
          });
          onSuccess(res);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to create entity.");
      }
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={getTitle()}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {currentType !== "enroll_competition" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Save & Select"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* SEARCH & ENROLL EXISTING COMPETITION */}
        {currentType === "enroll_competition" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                Search existing leagues & tournaments to enroll team:
              </span>

              <button
                type="button"
                onClick={() => setCurrentType("league")}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <Plus size={13} />
                <span>Create Brand New League</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={competitionSearch}
                onChange={(e) => setCompetitionSearch(e.target.value)}
                placeholder="Search leagues or tournaments..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-text"
              />
            </div>

            {/* List of competitions */}
            <div className="max-h-60 overflow-y-auto border border-border/80 rounded-xl divide-y divide-border/60">
              {filteredNodes.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">
                  No existing competitions found.
                </div>
              ) : (
                filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleEnrollExistingNode(node.id)}
                    className="w-full text-left p-3 hover:bg-surface text-xs font-medium text-text flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-primary" />
                      <span>{node.displayName}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Enroll & Select
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <Input
              label={currentType === "sublocation" ? "Field / Pitch Name" : "Name"}
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              placeholder={`Enter ${currentType} name...`}
              required
            />

            {/* Club specific fields */}
            {currentType === "club" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Abbreviation (e.g. TSSA)"
                  value={abbreviation}
                  onChange={(e: any) => setAbbreviation(e.target.value)}
                  placeholder="e.g. AFC"
                />
                <Input
                  label="City / Location"
                  value={locationText}
                  onChange={(e: any) => setLocationText(e.target.value)}
                  placeholder="e.g. Nashville, TN"
                />
              </div>
            )}

            {/* Team specific fields */}
            {currentType === "team" && (
              <div className="space-y-4">
                <Select
                  label="Club"
                  value={clubId}
                  onChange={(e: any) => setClubId(Number(e.target.value))}
                  options={contextData.clubs?.map((c) => ({ value: c.id, label: c.name })) || []}
                  placeholder="Select Club"
                  showPlaceholder={false}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Gender"
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value as any)}
                    options={[
                      { value: "Mixed", label: "Co-Ed / Mixed" },
                      { value: "Men", label: "Boys / Men" },
                      { value: "Women", label: "Girls / Women" },
                    ]}
                    showPlaceholder={false}
                  />

                  <Select
                    label="Age Group"
                    value={ageGroupId}
                    onChange={(e: any) => setAgeGroupId(e.target.value ? Number(e.target.value) : "")}
                    options={contextData.ageGroups?.map((ag) => ({ value: ag.id, label: ag.name })) || []}
                    placeholder="Select Age Group (Optional)"
                    showPlaceholder={true}
                  />
                </div>
              </div>
            )}

            {/* League specific fields */}
            {currentType === "league" && (
              <div className="space-y-4">
                <Input
                  label="Abbreviation"
                  value={abbreviation}
                  onChange={(e: any) => setAbbreviation(e.target.value)}
                  placeholder="e.g. MLS NEXT"
                />

                <Checkbox
                  label="Is this a Tournament competition?"
                  checked={isTournament}
                  onChange={(e: any) => setIsTournament(e.target.checked)}
                />
              </div>
            )}

            {/* Sublocation/Field specific fields */}
            {currentType === "sublocation" && (
              <div className="space-y-4">
                <Select
                  label="Venue Complex"
                  value={locationId}
                  onChange={(e: any) => setLocationId(Number(e.target.value))}
                  options={contextData.locations?.map((loc) => ({ value: loc.id, label: loc.name })) || []}
                  placeholder="Select Venue Complex"
                  showPlaceholder={false}
                />

                <Input
                  label="Surface Type"
                  value={surfaceType}
                  onChange={(e: any) => setSurfaceType(e.target.value)}
                  placeholder="e.g. Natural Grass, Turf, Indoor"
                />
              </div>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
}
