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
import TabbedPanel, { type TabItem } from "@/components/ui/TabbedPanel";

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
  const [activeTab, setActiveTab] = useState<"club-staff" | "team-staff">(
    "club-staff",
  );

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

  const tabs: readonly TabItem<"club-staff" | "team-staff">[] = [
    { id: "club-staff", label: "Club Staff Assignments", icon: Building },
    { id: "team-staff", label: "Team Staff Assignments", icon: Users },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-text'>
          Club & Team Roles
        </h1>
        <p className='text-muted text-sm mt-1'>
          Assign role levels like Club Admin, Director, Coach, or Team Admin to
          people in the organization.
        </p>
      </div>

      <TabbedPanel
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        className='-mx-4 px-4 sm:mx-0 sm:px-0'
      />

      {/* Active Tab Panel */}
      <div className='transition-all duration-200'>
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
