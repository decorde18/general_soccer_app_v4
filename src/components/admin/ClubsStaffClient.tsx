"use client";

import React, { useState, useMemo } from "react";
import { Building, Users } from "lucide-react";
import { EntityPage } from "@/components/entities/EntityPage";
import { clubStaffConfig } from "@/lib/entities/configs/clubStaff.config";
import { teamStaffConfig } from "@/lib/entities/configs/teamStaff.config";
import {
  createClubStaff,
  updateClubStaff,
  deleteClubStaff,
} from "@/lib/actions/clubStaff-actions";
import {
  createTeamStaff,
  updateTeamStaff,
  deleteTeamStaff,
} from "@/lib/actions/teamStaff-actions";
import { injectOptions } from "@/lib/utils/formHelpers";

interface ClubsStaffClientProps {
  clubsData: { label: string; value: string }[];
  peopleData: { label: string; value: string }[];
  teamSeasonsData: { label: string; value: string }[];
  clubStaffRecords: any[];
  teamStaffRecords: any[];
}

export default function ClubsStaffClient({
  clubsData,
  peopleData,
  teamSeasonsData,
  clubStaffRecords,
  teamStaffRecords,
}: ClubsStaffClientProps) {
  const [activeTab, setActiveTab] = useState<"club-staff" | "team-staff">("club-staff");

  // Inject options into configs dynamically
  const clubConfig = useMemo(() => {
    let cfg = { ...clubStaffConfig };
    cfg = injectOptions(cfg, "clubName", clubsData);
    cfg = injectOptions(cfg, "personName", peopleData);
    return cfg;
  }, [clubsData, peopleData]);

  const teamConfig = useMemo(() => {
    let cfg = { ...teamStaffConfig };
    cfg = injectOptions(cfg, "teamName", teamSeasonsData);
    cfg = injectOptions(cfg, "personName", peopleData);
    return cfg;
  }, [teamSeasonsData, peopleData]);

  // Compute stats for both tabs
  const clubStats = useMemo(() => {
    return [
      { label: "Total Assignments", value: clubStaffRecords.length },
      {
        label: "Active Staff",
        value: clubStaffRecords.filter((s) => s.isActive).length,
      },
      {
        label: "Club Admins",
        value: clubStaffRecords.filter((s) => s.role === "club_admin").length,
      },
    ];
  }, [clubStaffRecords]);

  const teamStats = useMemo(() => {
    return [
      { label: "Total Assignments", value: teamStaffRecords.length },
      {
        label: "Active Staff",
        value: teamStaffRecords.filter((s) => s.isActive).length,
      },
      {
        label: "Head Coaches",
        value: teamStaffRecords.filter((s) => s.role === "head_coach").length,
      },
    ];
  }, [teamStaffRecords]);

  const tabs = [
    { id: "club-staff", label: "Club Staff Assignments", icon: Building },
    { id: "team-staff", label: "Team Staff Assignments", icon: Users },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text">Club & Team Roles</h1>
        <p className="text-muted text-sm mt-1">
          Assign role levels like Club Admin, Director, Coach, or Team Admin to people in the organization.
        </p>
      </div>

      {/* Tabs list */}
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

      {/* Active Tab Panel */}
      <div className="transition-all duration-200">
        {activeTab === "club-staff" && (
          <EntityPage
            config={clubConfig}
            data={clubStaffRecords}
            stats={clubStats}
            onCreate={createClubStaff as any}
            onUpdate={updateClubStaff as any}
            onDelete={deleteClubStaff as any}
          />
        )}

        {activeTab === "team-staff" && (
          <EntityPage
            config={teamConfig}
            data={teamStaffRecords}
            stats={teamStats}
            onCreate={createTeamStaff as any}
            onUpdate={updateTeamStaff as any}
            onDelete={deleteTeamStaff as any}
          />
        )}
      </div>
    </div>
  );
}
