"use client";

import React, { useState } from "react";
import { Activity, Calendar, Trophy, Users, ShieldAlert } from "lucide-react";
import TeamHeader, { type TeamLeagueLink } from "./TeamHeader";
import TeamOverview from "./TeamOverview";
import TeamRoster from "./TeamRoster";
import TeamSchedule from "./TeamSchedule";
import TeamStats from "./TeamStats";

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

interface PlayerSeasonStats {
  id: number;
  playerId: number;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  gamesPlayed: number;
  gamesStarted: number;
  minutesPlayed: number;
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
}

export default function TeamPageClient({
  teamSeason,
  players,
  staff,
  games,
  stats,
  record,
  leagueLinks,
}: TeamPageClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "roster" | "schedule" | "stats">("overview");

  // Determine next match & recent matches
  const nextMatch = games
    .filter((g) => g.status !== "completed")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] || null;

  const recentResults = games
    .filter((g) => g.status === "completed")
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3); // Get top 3 latest results

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "roster", label: "Roster", icon: Users },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "stats", label: "Stats", icon: Trophy },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Visual Header Banner */}
      <TeamHeader
        teamName={teamSeason.teamName}
        clubName={teamSeason.clubName}
        seasonName={teamSeason.seasonName}
        ageGroup={teamSeason.ageGroup}
        record={record}
        rosterCount={players.length}
        leagueLinks={leagueLinks}
      />

      {/* Tabs bar with horizontal scrolling for mobile */}
      <div className="border-b border-border/80 overflow-x-auto scrollbar-none flex -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex space-x-6 min-w-max pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-1 border-b-2 font-bold text-sm transition-all focus:outline-none ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-text hover:border-border"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels with smooth transitions */}
      <div className="transition-all duration-200">
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

        {activeTab === "roster" && <TeamRoster players={players} />}

        {activeTab === "schedule" && (
          <TeamSchedule teamSeasonId={teamSeason.id} games={games} />
        )}

        {activeTab === "stats" && <TeamStats stats={stats} />}
      </div>
    </div>
  );
}
