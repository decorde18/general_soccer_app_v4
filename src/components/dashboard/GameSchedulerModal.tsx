"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Users,
  Trophy,
  Sliders,
  Plus,
  ArrowRight,
  ArrowLeft,
  Shield,
  Search,
  X,
} from "lucide-react";
import {
  createGame,
  checkVenueConflict,
  getVenueOptions,
  getSchedulerOptions,
  CompetitionNodeInput,
} from "@/lib/actions/game-actions";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Toggle from "@/components/ui/Toggle";
import DateSelect from "@/components/ui/DateSelect";
import TabbedPanel, { TabItem } from "@/components/ui/TabbedPanel";
import InlineEntityModal, { InlineEntityType } from "@/components/dashboard/InlineEntityModal";

interface TeamOption {
  teamSeasonId: number;
  teamId: number;
  clubId: number;
  clubName: string;
  teamName: string;
  ageGroup: string;
  displayName: string;
}

interface ClubOption {
  id: number;
  name: string;
  abbreviation?: string | null;
}

interface SeasonOption {
  id: number;
  name: string;
}

interface LeagueNodeOption {
  id: number;
  leagueId: number;
  leagueName: string;
  nodeName: string;
  isTournament: boolean;
  displayName: string;
}

interface EnrollmentOption {
  teamSeasonId: number;
  leagueNodeId: number;
  seasonId: number;
}

interface AgeGroupOption {
  id: number;
  name: string;
  defaultPeriodDuration: number;
  defaultOtIfTied: boolean;
  defaultOtDuration: number;
  defaultSoIfTied: boolean;
}

interface AdditionalCompetitionSlot {
  nodeId: number | "";
  isTournament: boolean;
  countsForStandings: boolean;
}

interface GameSchedulerModalProps {
  seasons?: SeasonOption[];
  teams?: TeamOption[];
  defaultHomeTeamSeasonId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

type TabType = "teams" | "competitions" | "schedule" | "rules";

const TABS: readonly TabItem<TabType>[] = [
  { id: "teams", label: "Teams", icon: Users },
  { id: "competitions", label: "Competitions", icon: Trophy },
  { id: "schedule", label: "Date & Venue", icon: Calendar },
  { id: "rules", label: "Game Rules", icon: Sliders },
] as const;

export default function GameSchedulerModal({
  seasons: propsSeasons,
  teams: propsTeams,
  defaultHomeTeamSeasonId,
  onClose,
  onSuccess,
}: GameSchedulerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("teams");

  // Options from server
  const [seasons, setSeasons] = useState<SeasonOption[]>(propsSeasons || []);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>(propsTeams || []);
  const [leagueNodes, setLeagueNodes] = useState<LeagueNodeOption[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentOption[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroupOption[]>([]);
  const [timezones, setTimezones] = useState<string[]>(["CST", "EST", "MST", "PST", "UTC"]);
  const [venues, setVenues] = useState<Array<{ id: number; name: string; sublocations: Array<{ id: number; name: string }> }>>([]);

  // Form State - Teams
  const [seasonId, setSeasonId] = useState<number>(1);
  const [myTeamSeasonId, setMyTeamSeasonId] = useState<number | "">(defaultHomeTeamSeasonId || "");
  const [isHomeMatch, setIsHomeMatch] = useState<boolean>(true); // Toggle under primary team
  
  // Unpopulated by default for Opponent
  const [clubSearchQuery, setClubSearchQuery] = useState("");
  const [opponentClubId, setOpponentClubId] = useState<number | "">("");
  const [opponentTeamSeasonId, setOpponentTeamSeasonId] = useState<number | "">("");

  // Competitions State
  const [gameType, setGameType] = useState<"league" | "tournament" | "friendly" | "playoff">("league");
  const [primaryLeagueNodeId, setPrimaryLeagueNodeId] = useState<number | "">("");
  const [primaryCountsForStandings, setPrimaryCountsForStandings] = useState<boolean>(true);

  // Additional Competition Slots
  const [additionalCompetitions, setAdditionalCompetitions] = useState<AdditionalCompetitionSlot[]>([]);

  // Date, Time & Venue
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("");
  const [timezoneLabel, setTimezoneLabel] = useState<string>("CST");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationId, setLocationId] = useState<number | "">("");
  const [sublocationId, setSublocationId] = useState<number | "">("");

  // Game Rules Override State
  const [defaultRegPeriods, setDefaultRegPeriods] = useState<number>(2);
  const [periodDurationMins, setPeriodDurationMins] = useState<number>(40);
  const [otIfTied, setOtIfTied] = useState<boolean>(false);
  const [otDurationMins, setOtDurationMins] = useState<number>(10);
  const [soIfTied, setSoIfTied] = useState<boolean>(true);

  // Warnings and UI State
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [requiresOverride, setRequiresOverride] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Inline Creation Sub-Modal State
  const [inlineModalType, setInlineModalType] = useState<InlineEntityType | null>(null);

  // Load scheduler options & venues on mount
  useEffect(() => {
    getVenueOptions().then(setVenues);

    getSchedulerOptions().then((opts) => {
      setSeasons(opts.seasons);
      setClubs(opts.clubs);
      setTeams(opts.teams);
      setLeagueNodes(opts.leagueNodes);
      setEnrollments(opts.enrollments);
      setAgeGroups(opts.ageGroups);
      setTimezones(opts.timezones);

      if (opts.seasons.length > 0) setSeasonId(opts.seasons[0].id);
      if (defaultHomeTeamSeasonId) setMyTeamSeasonId(defaultHomeTeamSeasonId);
    });
  }, [defaultHomeTeamSeasonId]);

  // Update default standings inclusion behavior when match type changes (League & Tournament default to true)
  useEffect(() => {
    const isDefaultOn = gameType === "league" || gameType === "tournament";
    setPrimaryCountsForStandings(isDefaultOn);
    setAdditionalCompetitions((prev) =>
      prev.map((slot) => ({ ...slot, countsForStandings: isDefaultOn }))
    );
  }, [gameType]);

  // Filter clubs based on search input
  const filteredClubs = useMemo(() => {
    if (!clubSearchQuery.trim()) return clubs;
    const q = clubSearchQuery.toLowerCase();
    return clubs.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.abbreviation && c.abbreviation.toLowerCase().includes(q))
    );
  }, [clubs, clubSearchQuery]);

  // Filter venue locations based on search input
  const filteredVenues = useMemo(() => {
    if (!locationSearchQuery.trim()) return venues;
    const q = locationSearchQuery.toLowerCase();
    return venues.filter((v) => v.name.toLowerCase().includes(q));
  }, [venues, locationSearchQuery]);

  // Filter available opponent teams based on selected opponent club
  const filteredOpponentTeams = useMemo(() => {
    let list = teams;
    if (myTeamSeasonId) {
      list = list.filter((t) => t.teamSeasonId !== Number(myTeamSeasonId));
    }
    if (opponentClubId) {
      list = list.filter((t) => t.clubId === Number(opponentClubId));
    }
    return list;
  }, [teams, opponentClubId, myTeamSeasonId]);

  // All competition nodes primary team is associated/enrolled in
  const primaryTeamEnrolledNodes = useMemo(() => {
    if (!myTeamSeasonId) return leagueNodes;
    const enrolledNodeIds = enrollments
      .filter((e) => e.teamSeasonId === Number(myTeamSeasonId))
      .map((e) => e.leagueNodeId);
    
    return enrolledNodeIds.length > 0
      ? leagueNodes.filter((n) => enrolledNodeIds.includes(n.id))
      : leagueNodes;
  }, [leagueNodes, enrollments, myTeamSeasonId]);

  // Filtered Primary competition options based on gameType
  const primaryCompetitionOptions = useMemo(() => {
    if (gameType === "league") {
      return primaryTeamEnrolledNodes.filter((n) => !n.isTournament);
    }
    if (gameType === "tournament") {
      return primaryTeamEnrolledNodes.filter((n) => n.isTournament);
    }
    return primaryTeamEnrolledNodes;
  }, [primaryTeamEnrolledNodes, gameType]);

  // Perform dynamic venue double-booking check
  useEffect(() => {
    if (startDate && (locationId || sublocationId)) {
      checkVenueConflict({
        startDate,
        startTime,
        locationId: locationId ? Number(locationId) : null,
        sublocationId: sublocationId ? Number(sublocationId) : null,
      }).then((res) => {
        if (res.hasConflict && res.message) {
          setWarningMsg(res.message);
          setRequiresOverride(true);
        } else {
          setWarningMsg(null);
          setRequiresOverride(false);
        }
      });
    } else {
      setWarningMsg(null);
      setRequiresOverride(false);
    }
  }, [startDate, startTime, locationId, sublocationId]);

  const selectedVenue = venues.find((v) => v.id === Number(locationId));

  // Compute Home vs Away IDs based on isHomeMatch toggle
  const homeTeamSeasonId = isHomeMatch ? Number(myTeamSeasonId) : Number(opponentTeamSeasonId);
  const awayTeamSeasonId = isHomeMatch ? Number(opponentTeamSeasonId) : Number(myTeamSeasonId);

  const primaryTeamObj = teams.find((t) => t.teamSeasonId === Number(myTeamSeasonId));
  const primaryTeamName = primaryTeamObj ? primaryTeamObj.teamName : "Primary Team";
  const homeToggleLabel = isHomeMatch
    ? `${primaryTeamName} is HOME (Opponent is AWAY)`
    : `${primaryTeamName} is AWAY (Opponent is HOME)`;

  // Handle inline entity creation or enrollment success
  const handleInlineSuccess = (res: any) => {
    setInlineModalType(null);
    if (!res) return;

    if (res.club) {
      setClubs((prev) => [...prev, { id: res.club.id, name: res.club.name, abbreviation: res.club.abbreviation }]);
      setOpponentClubId(res.club.id);
    } else if (res.teamSeason) {
      const ts = res.teamSeason;
      const clubName = ts.teams?.clubs?.name || "";
      const teamName = ts.teams?.team_name || "Team";
      const ageGroup = ts.age_groups?.name || "";
      const displayName = [clubName, teamName, ageGroup].filter(Boolean).join(" ");
      const newTeamObj: TeamOption = {
        teamSeasonId: ts.id,
        teamId: ts.team_id,
        clubId: ts.teams?.club_id || 0,
        clubName,
        teamName,
        ageGroup,
        displayName: displayName || `Team Season #${ts.id}`,
      };
      setTeams((prev) => [...prev, newTeamObj]);
      setOpponentClubId(newTeamObj.clubId);
      setOpponentTeamSeasonId(newTeamObj.teamSeasonId);
    } else if (res.league && res.node) {
      const newNodeOpt: LeagueNodeOption = {
        id: res.node.id,
        leagueId: res.league.id,
        leagueName: res.league.name,
        nodeName: res.node.name,
        isTournament: res.league.is_tournament,
        displayName: `${res.league.name} — ${res.node.name}`,
      };
      setLeagueNodes((prev) => [...prev, newNodeOpt]);
      if (myTeamSeasonId) {
        setEnrollments((prev) => [...prev, { teamSeasonId: Number(myTeamSeasonId), leagueNodeId: newNodeOpt.id, seasonId }]);
      }
      if (!primaryLeagueNodeId) {
        setPrimaryLeagueNodeId(newNodeOpt.id);
      }
    } else if (res.enrolledNodeId) {
      if (myTeamSeasonId) {
        setEnrollments((prev) => [...prev, { teamSeasonId: Number(myTeamSeasonId), leagueNodeId: res.enrolledNodeId, seasonId }]);
      }
      if (!primaryLeagueNodeId) {
        setPrimaryLeagueNodeId(res.enrolledNodeId);
      }
    } else if (res.location) {
      const newLoc = { id: res.location.id, name: res.location.name, sublocations: [] };
      setVenues((prev) => [...prev, newLoc]);
      setLocationId(res.location.id);
    } else if (res.sublocation) {
      const sub = res.sublocation;
      setVenues((prev) =>
        prev.map((v) =>
          v.id === sub.location_id
            ? { ...v, sublocations: [...v.sublocations, { id: sub.id, name: sub.name }] }
            : v
        )
      );
      setSublocationId(sub.id);
    }
  };

  const validateStep1 = () => {
    if (!myTeamSeasonId) {
      setErrorMsg("Please select your Primary Team.");
      return false;
    }
    if (!opponentTeamSeasonId) {
      setErrorMsg("Please select an Opponent Team (or TBD Opponent).");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if ((gameType === "league" || gameType === "tournament") && !primaryLeagueNodeId) {
      setErrorMsg(`Primary ${gameType === "league" ? "League Division" : "Tournament"} is required.`);
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleSubmit = (override = false) => {
    if (!validateStep1()) {
      setActiveTab("teams");
      return;
    }
    if (!validateStep2()) {
      setActiveTab("competitions");
      return;
    }
    setErrorMsg(null);

    const compNodes: CompetitionNodeInput[] = [];

    if (primaryLeagueNodeId) {
      compNodes.push({
        nodeId: Number(primaryLeagueNodeId),
        isPrimary: true,
        countsForStandings: primaryCountsForStandings,
      });
    }

    additionalCompetitions.forEach((slot) => {
      if (slot.nodeId && Number(slot.nodeId) !== Number(primaryLeagueNodeId)) {
        compNodes.push({
          nodeId: Number(slot.nodeId),
          isPrimary: false,
          countsForStandings: slot.countsForStandings,
        });
      }
    });

    startTransition(async () => {
      try {
        const res = await createGame({
          seasonId: Number(seasonId),
          homeTeamSeasonId,
          awayTeamSeasonId,
          startDate,
          startTime: startTime || null,
          timezoneLabel,
          locationId: locationId ? Number(locationId) : null,
          sublocationId: sublocationId ? Number(sublocationId) : null,
          gameType,
          competitionNodes: compNodes,
          defaultRegPeriods: Number(defaultRegPeriods),
          periodDuration: Number(periodDurationMins) * 60, // convert to seconds
          otIfTied,
          otDuration: Number(otDurationMins) * 60,
          soIfTied,
          allowConflictOverride: override,
        });

        if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else if (res.requiresOverride && res.warning) {
          setWarningMsg(res.warning);
          setRequiresOverride(true);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to schedule match.");
      }
    });
  };

  const handleNextTab = () => {
    if (activeTab === "teams") {
      if (!validateStep1()) return;
      setActiveTab("competitions");
    } else if (activeTab === "competitions") {
      if (!validateStep2()) return;
      setActiveTab("schedule");
    } else if (activeTab === "schedule") {
      setActiveTab("rules");
    }
  };

  const handleBackTab = () => {
    if (activeTab === "rules") setActiveTab("schedule");
    else if (activeTab === "schedule") setActiveTab("competitions");
    else if (activeTab === "competitions") setActiveTab("teams");
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Schedule New Match"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {activeTab !== "teams" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackTab}
                  className="inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>

              {activeTab !== "rules" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextTab}
                  className="inline-flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight size={14} />
                </Button>
              ) : requiresOverride ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleSubmit(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5"
                >
                  <AlertTriangle size={14} />
                  <span>Override Warning & Schedule</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSubmit(false)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  <span>{isPending ? "Scheduling..." : "Schedule Match"}</span>
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {/* Tab Navigation */}
          <TabbedPanel
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(t) => {
              if (activeTab === "teams" && t !== "teams" && !validateStep1()) return;
              if (activeTab === "competitions" && t !== "teams" && t !== "competitions" && !validateStep2()) return;
              setActiveTab(t);
            }}
          />

          {errorMsg && (
            <div className="p-2.5 text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl flex items-center justify-between font-medium">
              <span>{errorMsg}</span>
            </div>
          )}

          {warningMsg && (
            <div className="p-2.5 text-xs bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={15} />
                <span>Venue Conflict Warning</span>
              </div>
              <p className="text-[11px] leading-relaxed">{warningMsg}</p>
            </div>
          )}

          {/* TAB 1: TEAMS */}
          {activeTab === "teams" && (
            <div className="space-y-3 pt-1">
              {/* Season Selection */}
              <Select
                label="Season"
                value={seasonId}
                onChange={(e: any) => setSeasonId(Number(e.target.value))}
                options={seasons.map((s) => ({ value: s.id, label: s.name }))}
                width="full"
                showPlaceholder={false}
              />

              {/* Primary Team Selection & Home/Away Toggle */}
              <div className="p-3 bg-background/60 border border-border rounded-2xl space-y-2.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} className="text-primary" />
                  <span>Primary Team Selection</span>
                </label>

                <Select
                  value={myTeamSeasonId}
                  onChange={(e: any) => setMyTeamSeasonId(e.target.value ? Number(e.target.value) : "")}
                  options={teams.map((t) => ({ value: t.teamSeasonId, label: t.displayName }))}
                  placeholder="Select Primary Team..."
                  showPlaceholder={true}
                  width="full"
                />

                {/* Home/Away Toggle Component directly under team selection */}
                <div className="pt-0.5">
                  <Toggle
                    label={homeToggleLabel}
                    checked={isHomeMatch}
                    onChange={(val: boolean) => setIsHomeMatch(val)}
                  />
                </div>
              </div>

              {/* OPPONENT SELECTION: STACKED LAYOUT WITH INLINE (+) BUTTONS & UNPOPULATED DEFAULT */}
              <div className="p-3 bg-background/60 border border-border rounded-2xl space-y-2.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-accent" />
                  <span>Opponent Selection ({isHomeMatch ? "Away Team" : "Home Team"})</span>
                </label>

                {/* Search input for filtering clubs */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
                  <input
                    type="text"
                    value={clubSearchQuery}
                    onChange={(e) => {
                      setClubSearchQuery(e.target.value);
                      setOpponentClubId("");
                      setOpponentTeamSeasonId("");
                    }}
                    placeholder="Search clubs..."
                    className="w-full pl-8 pr-3 py-1 text-xs bg-surface border border-border/80 rounded-xl focus:outline-none focus:border-primary text-text placeholder:text-muted/60"
                  />
                </div>

                {/* Stacked Row 1: Opponent Club Select + Inline (+) Button */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted">Opponent Club</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={opponentClubId}
                        onChange={(e: any) => {
                          const cId = e.target.value ? Number(e.target.value) : "";
                          setOpponentClubId(cId);
                          if (cId === -999) {
                            setOpponentTeamSeasonId(-999); // Automatically default TBD Opponent
                          } else {
                            setOpponentTeamSeasonId(""); // Reset team on club change
                          }
                        }}
                        options={[
                          { value: -999, label: "TBD Club" },
                          ...filteredClubs.map((c) => ({ value: c.id, label: c.name })),
                        ]}
                        placeholder="Select Opponent Club..."
                        showPlaceholder={true}
                        width="full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInlineModalType("club")}
                      title="Add New Club"
                      className="px-2.5 py-1.5 border-border/80 hover:bg-border/30"
                    >
                      <Plus size={15} className="text-primary" />
                    </Button>
                  </div>
                </div>

                {/* Stacked Row 2: Opponent Team Select + Inline (+) Button */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted">Opponent Team</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={opponentTeamSeasonId}
                        onChange={(e: any) => {
                          const tId = e.target.value ? Number(e.target.value) : "";
                          setOpponentTeamSeasonId(tId);
                          if (tId === -999 && opponentClubId !== -999) {
                            setOpponentClubId(-999); // Also set club to TBD Club if TBD Opponent picked
                          }
                        }}
                        options={[
                          { value: -999, label: "TBD Opponent" },
                          ...filteredOpponentTeams.map((t) => ({ value: t.teamSeasonId, label: t.displayName })),
                        ]}
                        placeholder="Select Opponent Team..."
                        showPlaceholder={true}
                        width="full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInlineModalType("team")}
                      title="Add New Team"
                      className="px-2.5 py-1.5 border-border/80 hover:bg-border/30"
                    >
                      <Plus size={15} className="text-primary" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPETITIONS */}
          {activeTab === "competitions" && (
            <div className="space-y-3 pt-1">
              {/* Match Type Selection */}
              <Select
                label="Match Type"
                value={gameType}
                onChange={(e: any) => setGameType(e.target.value as any)}
                options={[
                  { value: "league", label: "League Match" },
                  { value: "tournament", label: "Tournament Match" },
                  { value: "playoff", label: "Playoff / Postseason" },
                  { value: "friendly", label: "Friendly / Exhibition" },
                ]}
                width="full"
                showPlaceholder={false}
              />

              {/* PRIMARY COMPETITION SLOT (Required for League/Tournament) */}
              {(gameType === "league" || gameType === "tournament") && (
                <div className="p-3 bg-background/60 border border-border rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                      <Trophy size={14} className="text-primary" />
                      <span>
                        {gameType === "league" ? "Primary League Division *" : "Primary Tournament *"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={primaryLeagueNodeId}
                        onChange={(e: any) => setPrimaryLeagueNodeId(e.target.value ? Number(e.target.value) : "")}
                        options={primaryCompetitionOptions.map((n) => ({ value: n.id, label: n.displayName }))}
                        placeholder={`Select ${gameType === "league" ? "League Division" : "Tournament"}...`}
                        showPlaceholder={true}
                        width="full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInlineModalType("enroll_competition")}
                      title="Enroll / Add Competition"
                      className="px-2.5 py-1.5 border-border/80 hover:bg-border/30"
                    >
                      <Plus size={15} className="text-primary" />
                    </Button>
                  </div>

                  {primaryLeagueNodeId !== "" && (
                    <div className="pt-1.5 border-t border-border/40">
                      <Checkbox
                        label="Primary Competition: Counts for Official Standings"
                        checked={primaryCountsForStandings}
                        onChange={(e: any) => setPrimaryCountsForStandings(e.target.checked)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ADDITIONAL COMPETITIONS SECTION */}
              <div className="space-y-3">
                {additionalCompetitions.map((slot, index) => {
                  const filteredOptions = slot.isTournament
                    ? primaryTeamEnrolledNodes.filter((n) => n.isTournament)
                    : primaryTeamEnrolledNodes.filter((n) => !n.isTournament);

                  return (
                    <div key={index} className="p-3 bg-background/60 border border-border rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                          <Trophy size={14} className="text-accent" />
                          <span>Competition #{index + 2} (Optional)</span>
                        </span>

                        <div className="flex items-center gap-3">
                          {/* League vs Tournament Toggle for Additional Competition */}
                          <Toggle
                            label={slot.isTournament ? "Tournament" : "League"}
                            checked={slot.isTournament}
                            onChange={(val: boolean) => {
                              setAdditionalCompetitions((prev) =>
                                prev.map((s, idx) => (idx === index ? { ...s, isTournament: val, nodeId: "" } : s))
                              );
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setAdditionalCompetitions((prev) => prev.filter((_, idx) => idx !== index));
                            }}
                            className="p-1 text-muted hover:text-rose-500 transition-colors"
                            title="Remove Competition"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Select + Inline (+) Button */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select
                            value={slot.nodeId}
                            onChange={(e: any) => {
                              const val = e.target.value ? Number(e.target.value) : "";
                              setAdditionalCompetitions((prev) =>
                                prev.map((s, idx) => (idx === index ? { ...s, nodeId: val } : s))
                              );
                            }}
                            options={filteredOptions.map((n) => ({ value: n.id, label: n.displayName }))}
                            placeholder={`Select Additional ${slot.isTournament ? "Tournament" : "League"}...`}
                            showPlaceholder={true}
                            width="full"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInlineModalType("enroll_competition")}
                          title="Enroll / Add Competition"
                          className="px-2.5 py-1.5 border-border/80 hover:bg-border/30"
                        >
                          <Plus size={15} className="text-primary" />
                        </Button>
                      </div>

                      {/* Per-Competition Standings Inclusion Toggle */}
                      {slot.nodeId !== "" && (
                        <div className="pt-1.5 border-t border-border/40">
                          <Checkbox
                            label={`${
                              leagueNodes.find((n) => n.id === Number(slot.nodeId))?.displayName || "Competition"
                            }: Counts for Official Standings`}
                            checked={slot.countsForStandings}
                            onChange={(e: any) => {
                              const val = e.target.checked;
                              setAdditionalCompetitions((prev) =>
                                prev.map((s, idx) => (idx === index ? { ...s, countsForStandings: val } : s))
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Additional Competition Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAdditionalCompetitions((prev) => [
                      ...prev,
                      {
                        nodeId: "",
                        isTournament: false,
                        countsForStandings: gameType === "league" || gameType === "tournament",
                      },
                    ]);
                  }}
                  className="w-full py-2 border-dashed border-border/80 hover:bg-border/20 text-xs font-bold text-primary flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Additional Competition</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: DATE, TIME & VENUE */}
          {activeTab === "schedule" && (
            <div className="space-y-3 pt-1">
              {/* DATE, KICKOFF TIME & TIMEZONE IN A CLEAN 3-COLUMN GRID WITHOUT POSITIONAL OFFSETS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Match Date (Required) */}
                <DateSelect
                  label="Match Date *"
                  value={startDate}
                  onChange={(e: any) => setStartDate(e.target.value)}
                />

                {/* Kickoff Time (Optional) */}
                <Input
                  type="time"
                  label="Kickoff Time (Optional)"
                  value={startTime}
                  onChange={(e: any) => setStartTime(e.target.value)}
                  placeholder="TBD"
                />

                {/* Timezone */}
                <Select
                  label="Time Zone"
                  value={timezoneLabel}
                  onChange={(e: any) => setTimezoneLabel(e.target.value)}
                  options={timezones.map((tz) => ({ value: tz, label: tz }))}
                  showPlaceholder={false}
                  width="full"
                />
              </div>

              {/* STACKED VENUE & FIELD WITH (+) BUTTONS */}
              <div className="p-3 bg-background/60 border border-border rounded-2xl space-y-2.5">
                {/* Search input for filtering venue complexes */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70" />
                  <input
                    type="text"
                    value={locationSearchQuery}
                    onChange={(e) => {
                      setLocationSearchQuery(e.target.value);
                      setLocationId("");
                      setSublocationId("");
                    }}
                    placeholder="Search venue complexes..."
                    className="w-full pl-8 pr-3 py-1 text-xs bg-surface border border-border/80 rounded-xl focus:outline-none focus:border-primary text-text placeholder:text-muted/60"
                  />
                </div>

                {/* Stacked Row 1: Venue Complex Select + Inline (+) Button */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted">Venue Complex</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={locationId}
                        onChange={(e: any) => {
                          setLocationId(e.target.value ? Number(e.target.value) : "");
                          setSublocationId("");
                        }}
                        options={filteredVenues.map((v) => ({ value: v.id, label: v.name }))}
                        placeholder="Select Venue Complex (Optional)..."
                        showPlaceholder={true}
                        width="full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInlineModalType("location")}
                      title="Add Venue Complex"
                      className="px-2.5 py-1.5 border-border/80 hover:bg-border/30"
                    >
                      <Plus size={15} className="text-primary" />
                    </Button>
                  </div>
                </div>

                {/* Stacked Row 2: Specific Field Select + Inline (+) Button */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted">Specific Field / Pitch</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={sublocationId}
                        disabled={!selectedVenue || selectedVenue.sublocations.length === 0}
                        onChange={(e: any) => setSublocationId(e.target.value ? Number(e.target.value) : "")}
                        options={selectedVenue?.sublocations.map((sub) => ({ value: sub.id, label: sub.name })) || []}
                        placeholder="Select Field (Optional)..."
                        showPlaceholder={true}
                        width="full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInlineModalType("sublocation")}
                      disabled={!locationId}
                      title="Add Field"
                      className="px-2.5 py-1.5 border-border/80 hover:bg-border/30 disabled:opacity-50"
                    >
                      <Plus size={15} className="text-primary" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GAME RULES & SETTINGS OVERRIDES */}
          {activeTab === "rules" && (
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-background/50 border border-border/80 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Sliders size={14} className="text-primary" />
                  <span>Game Rules & Duration Overrides</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Number of periods */}
                  <Input
                    type="number"
                    label="Regular Periods (Halves / Quarters)"
                    value={defaultRegPeriods}
                    min={1}
                    max={4}
                    onChange={(e: any) => setDefaultRegPeriods(parseInt(e.target.value) || 2)}
                  />

                  {/* Period duration in mins */}
                  <Input
                    type="number"
                    label="Period Duration (Minutes)"
                    value={periodDurationMins}
                    min={5}
                    max={60}
                    onChange={(e: any) => setPeriodDurationMins(parseInt(e.target.value) || 40)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
                  <Checkbox
                    label="Overtime if tied at full-time"
                    checked={otIfTied}
                    onChange={(e: any) => setOtIfTied(e.target.checked)}
                  />

                  {otIfTied && (
                    <Input
                      type="number"
                      label="OT Period Duration (Mins)"
                      value={otDurationMins}
                      min={1}
                      max={30}
                      onChange={(e: any) => setOtDurationMins(parseInt(e.target.value) || 10)}
                    />
                  )}

                  <Checkbox
                    label="Penalty Shootout if tied"
                    checked={soIfTied}
                    onChange={(e: any) => setSoIfTied(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Inline Entity Creation & Competition Enrollment Sub-Modal */}
      {inlineModalType && (
        <InlineEntityModal
          entityType={inlineModalType}
          contextData={{
            seasonId,
            teamSeasonId: myTeamSeasonId ? Number(myTeamSeasonId) : undefined,
            clubId: opponentClubId ? Number(opponentClubId) : undefined,
            locationId: locationId ? Number(locationId) : undefined,
            clubs,
            locations: venues,
            ageGroups,
            allLeagueNodes: leagueNodes,
          }}
          onClose={() => setInlineModalType(null)}
          onSuccess={handleInlineSuccess}
        />
      )}
    </>
  );
}
