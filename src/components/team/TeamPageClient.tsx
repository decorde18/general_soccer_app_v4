"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Calendar,
  Trophy,
  Users,
  ClipboardList,
  Zap,
  CalendarOff,
  Layers,
} from "lucide-react";
import TeamHeader, { type TeamLeagueLink } from "./TeamHeader";
import TeamOverview from "./TeamOverview";
import TeamRoster from "./TeamRoster";
import TeamSchedule from "./TeamSchedule";
import TeamStats from "./TeamStats";
import TeamCompetitions, {
  type TeamCompetitionSummary,
} from "./TeamCompetitions";

import TeamRequirements from "./TeamRequirements";
import TeamPerformance from "./TeamPerformance";
import TeamGroups from "./TeamGroups";
import TeamAvailability from "./TeamAvailability";

import TabbedPanel, { type TabItem } from "@/components/ui/TabbedPanel";
import Button from "@/components/ui/Button";
import type { PlayerSeasonStats, SubTeamInfo } from "@/lib/data/queries";

interface Game {
  id: number;
  seasonId: number;
  seasonName: string;
  homeTeamSeasonId: number;
  homeTeamName: string;
  homeClubName: string;
  awayTeamSeasonId: number;
  awayTeamName: string;
  awayClubName: string;
  status: string;
  gameType: string;
  startDate: string;
  startTime: string | null;
  locationName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  finalStatus: string | null;
  videoLink?: string | null;
}

interface Player {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  jerseyNumber: number | null;
  position: string | null;
  grade: string | null;
  status: string;
  captain: boolean;
  isActive: boolean;
  squadLevel?: string | null;
  squadLevels?: string[];
  teamSeasonId?: number;
  teamSeasonIds?: number[];
}

interface TeamStaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

interface TeamSeason {
  id: number;
  teamId: number;
  teamName: string;
  clubId: number;
  clubName: string;
  seasonId: number;
  seasonName: string;
  ageGroup: string | number | null;
  ageGroupName?: string | null;
  isActive: boolean;
  gender?: string | null;
}

interface TeamPageClientProps {
  teamSeason: TeamSeason;
  subTeams?: SubTeamInfo[];
  programTeamSeasonIds?: number[];
  players: Player[];
  staff: TeamStaffMember[];
  games: Game[];
  stats: PlayerSeasonStats[];
  record: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
  } | null;
  leagueLinks?: TeamLeagueLink[];
  customDefs?: any[];
  customVals?: any[];
  perfTests?: any[];
  perfLogs?: any[];
  groups?: any[];
  pairings?: any[];
  unavailabilities?: any[];
}

export default function TeamPageClient({
  teamSeason,
  subTeams = [],
  programTeamSeasonIds = [],
  players,
  staff,
  games,
  stats,
  record,
  leagueLinks,
  customDefs = [],
  customVals = [],
  perfTests = [],
  perfLogs = [],
  groups = [],
  pairings = [],
  unavailabilities = [],
}: TeamPageClientProps) {
  type TabType =
    | "overview"
    | "competitions"
    | "roster"
    | "schedule"
    | "stats"
    | "requirements"
    | "performance"
    | "groups"
    | "availability";

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Determine if sub-teams exist (e.g. LM & DC for U12 Elite, or Varsity & JV for high school)
  const hasSubTeams = Boolean(subTeams && subTeams.length > 0);

  // Sub-team tab filter state: "all" or specific teamSeasonId
  const [selectedSubTeam, setSelectedSubTeam] = useState<number | "all">(() => {
    if (hasSubTeams) {
      const current = subTeams.find((st) => st.isCurrent);
      return current ? current.teamSeasonId : teamSeason.id;
    }
    return "all";
  });

  const currentSubTeamInfo = useMemo(() => {
    if (selectedSubTeam === "all" || !hasSubTeams) return null;
    return subTeams.find((st) => st.teamSeasonId === selectedSubTeam) || null;
  }, [selectedSubTeam, hasSubTeams, subTeams]);

  // Filter games based on selected squad
  const filteredGames = useMemo(() => {
    if (selectedSubTeam === "all") return games;
    return games.filter(
      (g) =>
        g.homeTeamSeasonId === selectedSubTeam ||
        g.awayTeamSeasonId === selectedSubTeam
    );
  }, [games, selectedSubTeam]);

  // Filter roster based on selected squad
  const filteredPlayers = useMemo(() => {
    if (selectedSubTeam === "all") return players;
    return players.filter((p) => {
      if (p.teamSeasonId === selectedSubTeam) return true;
      if (p.teamSeasonIds?.includes(selectedSubTeam)) return true;
      if (
        currentSubTeamInfo?.squadCode &&
        p.squadLevels?.includes(currentSubTeamInfo.squadCode)
      ) {
        return true;
      }
      if (
        currentSubTeamInfo?.squadName &&
        p.squadLevels?.includes(currentSubTeamInfo.squadName)
      ) {
        return true;
      }
      return false;
    });
  }, [players, selectedSubTeam, currentSubTeamInfo]);

  // Recalculate W-L-D-Points record strictly for active squad
  const activeRecord = useMemo(() => {
    if (selectedSubTeam === "all" && record) {
      return record;
    }
    const rec = { wins: 0, losses: 0, draws: 0, points: 0 };
    const completed = filteredGames.filter(
      (g) => g.status === "completed" && (g.homeScore ?? 0) + (g.awayScore ?? 0) > 0
    );
    completed.forEach((g) => {
      const isHome = g.homeTeamSeasonId === selectedSubTeam;
      const ourScore = isHome ? g.homeScore : g.awayScore;
      const oppScore = isHome ? g.awayScore : g.homeScore;
      if (
        ourScore !== null &&
        oppScore !== null &&
        ourScore !== undefined &&
        oppScore !== undefined
      ) {
        if (ourScore > oppScore) {
          rec.wins += 1;
          rec.points += 3;
        } else if (ourScore < oppScore) {
          rec.losses += 1;
        } else {
          rec.draws += 1;
          rec.points += 1;
        }
      }
    });
    return rec;
  }, [filteredGames, selectedSubTeam, record]);

  // Determine next match & recent matches based on filtered games
  const nextMatch = useMemo(() => {
    return (
      filteredGames
        .filter((g) => g.status !== "completed")
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        )[0] || null
    );
  }, [filteredGames]);

  const recentResults = useMemo(() => {
    return filteredGames
      .filter((g) => g.status === "completed")
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      )
      .slice(0, 3);
  }, [filteredGames]);

  const activeTeamName = currentSubTeamInfo
    ? currentSubTeamInfo.teamName
    : teamSeason.teamName;

  const activeTeamSeasonId =
    typeof selectedSubTeam === "number" ? selectedSubTeam : teamSeason.id;

  const competitions: TeamCompetitionSummary[] = (leagueLinks ?? []).map(
    (link) => ({
      leagueId: link.leagueId,
      leagueName: link.leagueName,
      leagueNodeId: link.leagueNodeId,
      leagueNodeName: link.leagueNodeName,
      leagueNodeSeasonId: link.leagueNodeSeasonId,
      isTournament: link.isTournament ?? false,
      record: link.record ?? null,
      position: link.position ?? null,
    }),
  );

  const tabs: readonly TabItem<TabType>[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "competitions", label: "Competitions", icon: Trophy },
    { id: "roster", label: "Roster", icon: Users },
    { id: "requirements", label: "Requirements & Gear", icon: ClipboardList },
    { id: "performance", label: "Fitness Logs", icon: Zap },
    { id: "groups", label: "Groups & Sisters", icon: Users },
    { id: "availability", label: "Conflicts", icon: CalendarOff },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "stats", label: "Stats", icon: Trophy },
  ];

  return (
    <div className='w-full space-y-6'>
      {/* Visual Header Banner */}
      <TeamHeader
        teamName={activeTeamName}
        clubName={teamSeason.clubName}
        seasonName={teamSeason.seasonName}
        ageGroup={teamSeason.ageGroup}
        ageGroupName={teamSeason.ageGroupName}
        record={activeRecord}
      />

      {/* Sub-Teams / Squads Tab Bar */}
      {hasSubTeams && subTeams.length > 0 && (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 sm:px-4 bg-surface/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xs'>
          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted px-1'>
            <Layers size={15} className='text-primary' />
            <span>Squads / Sub-Teams:</span>
          </div>

          <div className='flex flex-wrap items-center gap-1.5'>
            <Button
              type='button'
              variant={selectedSubTeam === "all" ? "primary" : "ghost"}
              size='sm'
              onClick={() => setSelectedSubTeam("all")}
              className={`text-xs px-3.5 py-1.5 rounded-xl transition-all duration-150 ${
                selectedSubTeam === "all"
                  ? "shadow-sm font-semibold"
                  : "text-muted hover:text-text hover:bg-surface-hover"
              }`}
            >
              All Squads
            </Button>
            {subTeams.map((st) => {
              const isSelected = selectedSubTeam === st.teamSeasonId;
              return (
                <Button
                  key={st.teamSeasonId}
                  type='button'
                  variant={isSelected ? "primary" : "ghost"}
                  size='sm'
                  onClick={() => setSelectedSubTeam(st.teamSeasonId)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl transition-all duration-150 ${
                    isSelected
                      ? "shadow-sm font-semibold"
                      : "text-muted hover:text-text hover:bg-surface-hover"
                  }`}
                >
                  <span>{st.squadName}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <TabbedPanel
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        className='w-full'
      />

      {/* Tab Panels with smooth transitions */}
      <div className='transition-all duration-200'>
        {activeTab === "overview" && (
          <TeamOverview
            teamSeasonId={activeTeamSeasonId}
            record={activeRecord}
            nextMatch={nextMatch}
            recentResults={recentResults}
            stats={stats}
            staff={staff}
            onViewTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === "competitions" && (
          <TeamCompetitions
            competitions={competitions}
            teamSeasonId={activeTeamSeasonId}
            seasonId={teamSeason.seasonId}
          />
        )}

        {activeTab === "roster" && (
          <TeamRoster
            teamSeasonId={activeTeamSeasonId}
            players={filteredPlayers}
            staff={staff}
          />
        )}

        {activeTab === "requirements" && (
          <TeamRequirements
            teamSeasonId={activeTeamSeasonId}
            players={filteredPlayers}
            definitions={customDefs}
            initialValues={customVals}
          />
        )}

        {activeTab === "performance" && (
          <TeamPerformance
            teamSeasonId={activeTeamSeasonId}
            players={filteredPlayers}
            tests={perfTests}
            initialLogs={perfLogs}
          />
        )}

        {activeTab === "groups" && (
          <TeamGroups
            teamSeasonId={activeTeamSeasonId}
            players={filteredPlayers}
            groups={groups}
            pairings={pairings}
          />
        )}

        {activeTab === "availability" && (
          <TeamAvailability
            teamSeasonId={activeTeamSeasonId}
            players={filteredPlayers}
            records={unavailabilities}
          />
        )}

        {activeTab === "schedule" && (
          <TeamSchedule
            teamSeasonId={activeTeamSeasonId}
            games={filteredGames}
            programTeamSeasonIds={programTeamSeasonIds}
          />
        )}

        {activeTab === "stats" && (
          <TeamStats
            stats={stats}
            teamSeasonId={activeTeamSeasonId}
            leagueLinks={leagueLinks}
          />
        )}
      </div>
    </div>
  );
}
