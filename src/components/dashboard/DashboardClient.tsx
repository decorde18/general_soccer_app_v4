"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Users,
  Shield,
  PlusCircle,
  ArrowRight,
  Settings,
  Activity,
  Award,
  Star,
  MapPin,
  Clock,
  Sparkles,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface DashboardClientProps {
  user: {
    name: string;
    email: string;
    roles: {
      isAdmin: boolean;
      clubAdmin: boolean;
      teamAdmin: boolean;
      coach: boolean;
      player: boolean;
      parent: boolean;
    };
  };
  playerTeams?: any[];
  playerStats?: any[];
  childrenList?: any[];
  coachTeams?: any[];
}

export default function DashboardClient({
  user,
  playerTeams = [],
  playerStats = [],
  childrenList = [],
  coachTeams = [],
}: DashboardClientProps) {
  // State for coach team selection
  const [selectedCoachTeamId, setSelectedCoachTeamId] = useState<string>(
    coachTeams[0]?.id ? String(coachTeams[0].id) : ""
  );

  // Get active coached team details
  const activeCoachTeam = useMemo(() => {
    if (!selectedCoachTeamId) return null;
    return coachTeams.find((t) => String(t.id) === selectedCoachTeamId) || null;
  }, [selectedCoachTeamId, coachTeams]);

  // Helper to render role tags
  const renderRoleTags = () => {
    const tags: string[] = [];
    if (user.roles.isAdmin) tags.push("Admin");
    if (user.roles.clubAdmin) tags.push("Club Admin");
    if (user.roles.teamAdmin) tags.push("Team Admin");
    if (user.roles.coach) tags.push("Coach");
    if (user.roles.player) tags.push("Player");
    if (user.roles.parent) tags.push("Parent");

    return tags.map((t) => (
      <span
        key={t}
        className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full"
      >
        {t}
      </span>
    ));
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">{renderRoleTags()}</div>
            <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2">
              Welcome back, {user.name} <Sparkles className="text-amber-500 stroke-[1.5] animate-pulse" size={24} />
            </h1>
            <p className="text-xs text-muted font-medium">{user.email}</p>
          </div>
          <div className="flex items-center gap-4 bg-background/50 border border-border/40 p-4 rounded-xl shadow-inner max-w-xs">
            <Activity className="text-primary shrink-0" size={24} />
            <div className="text-xs">
              <span className="font-semibold block text-text/80">Account Status</span>
              <span className="text-success font-bold">Active & Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. SYSTEM ADMIN & CLUB ADMIN CONTROLS */}
      {(user.roles.isAdmin || user.roles.clubAdmin) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <Settings size={18} className="text-primary" />
            <h2 className="font-bold text-base text-text uppercase tracking-wider">
              Administration Center
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Leagues & Seasons CRUD */}
            {user.roles.isAdmin && (
              <Card variant="default" padding="md" className="hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between h-36">
                <div>
                  <div className="flex justify-between items-start">
                    <Trophy className="text-amber-500" size={24} />
                    <span className="text-[10px] uppercase font-bold text-muted bg-border px-1.5 py-0.5 rounded">
                      Structure
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text mt-3 group-hover:text-primary transition-colors">
                    Leagues & Node Seeding
                  </h4>
                  <p className="text-[11px] text-muted mt-1 leading-normal">
                    Manage age division trees, rearrange node branches, and assign teams.
                  </p>
                </div>
                <Link href="/admin/leagues" className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2">
                  <span>Open Seeding Tool</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Card>
            )}

            {/* Clubs & Teams CRUD */}
            {user.roles.isAdmin && (
              <Card variant="default" padding="md" className="hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between h-36">
                <div>
                  <div className="flex justify-between items-start">
                    <Building className="text-blue-500" size={24} />
                    <span className="text-[10px] uppercase font-bold text-muted bg-border px-1.5 py-0.5 rounded">
                      Clubs
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text mt-3 group-hover:text-primary transition-colors">
                    Clubs & Teams CRUD
                  </h4>
                  <p className="text-[11px] text-muted mt-1 leading-normal">
                    Register club organizations, define types, and configure active teams.
                  </p>
                </div>
                <Link href="/admin/clubs" className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2">
                  <span>Manage Clubs & Teams</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Card>
            )}

            {/* Staff Roles & Assignments */}
            {user.roles.isAdmin && (
              <Card variant="default" padding="md" className="hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between h-36">
                <div>
                  <div className="flex justify-between items-start">
                    <Users className="text-indigo-500" size={24} />
                    <span className="text-[10px] uppercase font-bold text-muted bg-border px-1.5 py-0.5 rounded">
                      Roles
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text mt-3 group-hover:text-primary transition-colors">
                    Staff Roles & Assignments
                  </h4>
                  <p className="text-[11px] text-muted mt-1 leading-normal">
                    Map head coaches, assistants, stats keepers, and club registrars.
                  </p>
                </div>
                <Link href="/admin/club-staff" className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2">
                  <span>Manage Staff Roles</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Card>
            )}

            {/* Locations & Fields CRUD */}
            {(user.roles.isAdmin || user.roles.clubAdmin) && (
              <Card variant="default" padding="md" className="hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between h-36">
                <div>
                  <div className="flex justify-between items-start">
                    <MapPin className="text-emerald-500" size={24} />
                    <span className="text-[10px] uppercase font-bold text-muted bg-border px-1.5 py-0.5 rounded">
                      Venues
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text mt-3 group-hover:text-primary transition-colors">
                    Locations & Pitch Layouts
                  </h4>
                  <p className="text-[11px] text-muted mt-1 leading-normal">
                    Create field complexes, add sublocation pitches, and configure capacities.
                  </p>
                </div>
                <Link href="/locations" className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2">
                  <span>Manage Facilities</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Card>
            )}

            {/* Guest Player Assignments */}
            {(user.roles.isAdmin || user.roles.clubAdmin) && (
              <Card variant="default" padding="md" className="hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between h-36">
                <div>
                  <div className="flex justify-between items-start">
                    <PlusCircle className="text-violet-500" size={24} />
                    <span className="text-[10px] uppercase font-bold text-muted bg-border px-1.5 py-0.5 rounded">
                      Players
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text mt-3 group-hover:text-primary transition-colors">
                    Bulk Guest Player Tool
                  </h4>
                  <p className="text-[11px] text-muted mt-1 leading-normal">
                    Add guest players to multiple matches in bulk using date filters.
                  </p>
                </div>
                <Link href="/dashboard/guest-players" className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2">
                  <span>Manage Guest Players</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Card>
            )}

            {/* Users & Security */}
            {user.roles.isAdmin && (
              <Card variant="default" padding="md" className="hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between h-36">
                <div>
                  <div className="flex justify-between items-start">
                    <Shield className="text-indigo-500" size={24} />
                    <span className="text-[10px] uppercase font-bold text-muted bg-border px-1.5 py-0.5 rounded">
                      Security
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-text mt-3 group-hover:text-primary transition-colors">
                    User Accounts & Roles
                  </h4>
                  <p className="text-[11px] text-muted mt-1 leading-normal">
                    Manage system login credentials and configure administrative roles.
                  </p>
                </div>
                <Link href="/admin/users" className="text-[11px] font-bold text-primary flex items-center gap-1 mt-2">
                  <span>Manage Users</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* 2. COACH & TEAM ADMIN CONTROL PANEL */}
      {(user.roles.coach || user.roles.teamAdmin) && coachTeams.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-primary" />
              <h2 className="font-bold text-base text-text uppercase tracking-wider">
                Coaching & Team Operations
              </h2>
            </div>
            
            {/* Team Selector Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted font-bold">Select Active Team:</span>
              <select
                value={selectedCoachTeamId}
                onChange={(e) => setSelectedCoachTeamId(e.target.value)}
                className="py-1 px-2 bg-surface border border-border/80 rounded-lg text-text font-bold focus:outline-none"
              >
                {coachTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.clubName} - {t.teamName} ({t.seasonName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeCoachTeam && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left summary cards */}
              <div className="lg:col-span-1 space-y-4">
                <Card variant="default" padding="lg" className="bg-surface space-y-4 shadow-sm border-l-4 border-l-primary">
                  <div>
                    <h3 className="font-black text-lg text-text leading-tight">
                      {activeCoachTeam.teamName}
                    </h3>
                    <p className="text-xs text-muted font-medium mt-0.5">
                      {activeCoachTeam.clubName} • {activeCoachTeam.seasonName}
                    </p>
                  </div>

                  <div className="text-xs divide-y divide-border/50">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-muted font-semibold">Club Type:</span>
                      <span className="font-bold text-text capitalize">{activeCoachTeam.clubType || "N/A"}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-muted font-semibold">Age Group ID:</span>
                      <span className="font-bold text-text">#{activeCoachTeam.ageGroup || "N/A"}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-muted font-semibold">Roster Capacity:</span>
                      <span className="font-bold text-text">Active</span>
                    </div>
                  </div>

                  {/* Actions shortcuts */}
                  <div className="space-y-2 pt-2">
                    <Link href={`/dashboard/guest-players`} className="block">
                      <Button variant="outline" size="sm" className="w-full text-xs flex justify-between items-center group font-bold">
                        <span>Assign Guest Players</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>

              {/* Right fixture card placeholder */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  <span>Team Match Center</span>
                </h4>
                <Card variant="outlined" padding="lg" className="bg-surface/50 text-center py-12 text-xs text-muted font-medium border-dashed border-border/80">
                  <Calendar size={36} className="mx-auto text-muted/50 mb-3" />
                  No upcoming games scheduled in the immediate dashboard timeline.<br />
                  Use the match logs or public schedules to view full results.
                </Card>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. PLAYER VIEW */}
      {user.roles.player && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <Star size={18} className="text-primary" />
            <h2 className="font-bold text-base text-text uppercase tracking-wider">
              Player Hub (My Metrics & Schedules)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player stats box */}
            <div className="lg:col-span-1">
              <Card variant="default" padding="lg" className="bg-surface shadow-sm border-t-4 border-t-primary space-y-6">
                <div>
                  <h3 className="font-black text-base text-text">Player Roster Stats</h3>
                  <p className="text-[10px] text-muted">Calculated across completed season match logs</p>
                </div>

                {playerStats.length === 0 ? (
                  <p className="text-xs text-muted text-center py-8">No statistics logged for this account yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Goals */}
                    <div className="bg-background/45 border border-border/50 p-3 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Goals</span>
                      <span className="text-2xl font-black text-primary block mt-1">{playerStats[0].goals}</span>
                    </div>

                    {/* Assists */}
                    <div className="bg-background/45 border border-border/50 p-3 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Assists</span>
                      <span className="text-2xl font-black text-text block mt-1">{playerStats[0].assists}</span>
                    </div>

                    {/* Games Played */}
                    <div className="bg-background/45 border border-border/50 p-3 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Matches</span>
                      <span className="text-2xl font-black text-text block mt-1">{playerStats[0].gamesPlayed}</span>
                    </div>

                    {/* Minutes */}
                    <div className="bg-background/45 border border-border/50 p-3 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Minutes</span>
                      <span className="text-2xl font-black text-text block mt-1">{playerStats[0].minutesPlayed}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Player team list */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">
                My Team Selections
              </h4>
              {playerTeams.length === 0 ? (
                <Card variant="outlined" padding="lg" className="bg-surface/30 text-center py-10 text-xs text-muted border-dashed">
                  No roster connections found for this account.
                </Card>
              ) : (
                <div className="space-y-3">
                  {playerTeams.map((t) => (
                    <Card key={t.id} variant="default" padding="md" className="hover:border-primary/30 transition-all flex items-center justify-between shadow-sm">
                      <div>
                        <h4 className="font-bold text-sm text-text">{t.teamName}</h4>
                        <p className="text-[10px] text-muted">{t.clubName} • {t.seasonName}</p>
                      </div>
                      <Link href={`/teams/${t.id}`}>
                        <Button variant="outline" size="xs" className="flex items-center gap-1 font-bold text-[10px]">
                          <span>Team Overview</span>
                          <ArrowRight size={10} />
                        </Button>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. PARENT VIEW */}
      {user.roles.parent && childrenList.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <Star size={18} className="text-primary" />
            <h2 className="font-bold text-base text-text uppercase tracking-wider">
              Parent Dashboard (Child Connections)
            </h2>
          </div>

          <div className="space-y-6">
            {childrenList.map((child) => (
              <div key={child.personId} className="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <div>
                    <h3 className="font-black text-base text-text">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-[10px] text-muted">Connected Child Roster Profile</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Child Roster Connection list */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Enrolled Teams
                    </h4>
                    {child.teamSeasons.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted">
                        No team enrollments mapped.
                      </div>
                    ) : (
                      child.teamSeasons.map((ts: any) => (
                        <div key={ts.teamSeasonId} className="flex justify-between items-center p-3 bg-background/35 border border-border/50 rounded-xl">
                          <div>
                            <span className="font-bold text-xs text-text block">{ts.teamName}</span>
                            <span className="text-[10px] text-muted">{ts.clubName} • {ts.seasonName}</span>
                          </div>
                          <Link href={`/teams/${ts.teamSeasonId}`}>
                            <Button variant="outline" size="xs" className="flex items-center gap-1 font-bold text-[10px]">
                              <span>View Team</span>
                              <ArrowRight size={10} />
                            </Button>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Child Stats Card */}
                  <div className="md:col-span-1">
                    <div className="bg-background/25 border border-border/50 p-4 rounded-2xl space-y-4 h-full flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">
                          Performance Stats
                        </h4>
                      </div>
                      
                      {child.stats && child.stats.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-surface border border-border/40 p-2.5 rounded-xl text-center">
                            <span className="text-[9px] font-semibold text-muted block">Goals</span>
                            <span className="text-base font-black text-primary block mt-0.5">{child.stats[0].goals}</span>
                          </div>
                          <div className="bg-surface border border-border/40 p-2.5 rounded-xl text-center">
                            <span className="text-[9px] font-semibold text-muted block">Assists</span>
                            <span className="text-base font-black text-text block mt-0.5">{child.stats[0].assists}</span>
                          </div>
                          <div className="bg-surface border border-border/40 p-2.5 rounded-xl text-center">
                            <span className="text-[9px] font-semibold text-muted block">Matches</span>
                            <span className="text-base font-black text-text block mt-0.5">{child.stats[0].gamesPlayed}</span>
                          </div>
                          <div className="bg-surface border border-border/40 p-2.5 rounded-xl text-center">
                            <span className="text-[9px] font-semibold text-muted block">Minutes</span>
                            <span className="text-base font-black text-text block mt-0.5">{child.stats[0].minutesPlayed}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted text-center py-6">No match statistics reported yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
