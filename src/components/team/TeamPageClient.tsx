"use client";

import React, { useState } from "react";
import {
  Activity,
  Calendar,
  Trophy,
  Users,
  ClipboardList,
  Zap,
  CalendarOff,
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
import type { PlayerSeasonStats } from "@/lib/data/queries";

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
}

interface TeamPageClientProps {
  teamSeason: TeamSeason;
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

  // Determine next match & recent matches
  const nextMatch =
    games
      .filter((g) => g.status !== "completed")
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )[0] || null;

  const recentResults = games
    .filter((g) => g.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
    .slice(0, 3);

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
    <div className='w-full space-y-8'>
      {/* Visual Header Banner */}
      <TeamHeader
        teamName={teamSeason.teamName}
        clubName={teamSeason.clubName}
        seasonName={teamSeason.seasonName}
        ageGroup={teamSeason.ageGroup}
        ageGroupName={teamSeason.ageGroupName}
        record={record}
      />

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
            teamSeasonId={teamSeason.id}
            record={record}
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
            teamSeasonId={teamSeason.id}
            seasonId={teamSeason.seasonId}
          />
        )}

        {activeTab === "roster" && (
          <TeamRoster
            teamSeasonId={teamSeason.id}
            players={players}
            staff={staff}
          />
        )}

        {activeTab === "requirements" && (
          <TeamRequirements
            teamSeasonId={teamSeason.id}
            players={players}
            definitions={customDefs}
            initialValues={customVals}
          />
        )}

        {activeTab === "performance" && (
          <TeamPerformance
            teamSeasonId={teamSeason.id}
            players={players}
            tests={perfTests}
            initialLogs={perfLogs}
          />
        )}

        {activeTab === "groups" && (
          <TeamGroups
            teamSeasonId={teamSeason.id}
            players={players}
            groups={groups}
            pairings={pairings}
          />
        )}

        {activeTab === "availability" && (
          <TeamAvailability
            teamSeasonId={teamSeason.id}
            players={players}
            records={unavailabilities}
          />
        )}

        {activeTab === "schedule" && (
          <TeamSchedule teamSeasonId={teamSeason.id} games={games} />
        )}

        {activeTab === "stats" && (
          <TeamStats
            stats={stats}
            teamSeasonId={teamSeason.id}
            leagueLinks={leagueLinks}
          />
        )}
      </div>
    </div>
  );
}
