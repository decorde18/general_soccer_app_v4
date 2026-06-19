"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X, ChevronDown, ChevronRight, Building2, Users } from "lucide-react";
import LogoutButton from "../ui/LogoutButton";
import Select from "../ui/Select";

function NavBar({ user }: { user?: any }) {
  const { data: session } = useSession();
  const currentUser = user ?? session?.user;
  const activeRoles = currentUser?.roles;
  const originalRoles = currentUser?.originalRoles || activeRoles;

  // Real database options
  const [clubs, setClubs] = useState<any[]>([]);
  const [teamSeasons, setTeamSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");

  const pathname = usePathname();
  const router = useRouter();

  // Load cookies and mock states on mount
  useEffect(() => {
    const activeMatch = document.cookie.match(/(?:^|; )active-role-view=([^;]*)/);
    setActiveView(activeMatch ? decodeURIComponent(activeMatch[1]) : "");
  }, []);

  // Fetch real data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/teams-data");
        if (!res.ok) throw new Error("Failed to fetch teams data");
        const data = await res.json();
        setClubs(data.clubs || []);
        setTeamSeasons(data.teamSeasons || []);
      } catch (error) {
        console.error("Error loading teams data in NavBar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Synchronize selected club from path context
  useEffect(() => {
    if (loading || teamSeasons.length === 0) return;

    const teamMatch = pathname?.match(/\/teams\/(\d+)/);
    if (teamMatch) {
      const currentId = Number(teamMatch[1]);
      const currentTeam = teamSeasons.find((t) => t.id === currentId);
      if (currentTeam) {
        setSelectedClubId(String(currentTeam.clubId));
      }
    }
  }, [pathname, loading, teamSeasons]);



  // Handle active role view switching
  const handleActiveViewChange = (e: any) => {
    const val = e.target.value;
    if (val) {
      document.cookie = `active-role-view=${val}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = "active-role-view=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    }
    window.location.reload();
  };

  // Roles calculation
  const showActiveViewSelect = !!(originalRoles?.isAdmin || originalRoles?.clubAdmin);
  const activeViewOptions = originalRoles?.isAdmin
    ? [
        { value: "admin", label: "Admin View" },
        { value: "club_admin", label: "Club Admin View" },
        { value: "coach", label: "Coach View" },
        { value: "team_admin", label: "Team Admin View" },
        { value: "player", label: "Player View" },
        { value: "parent", label: "Parent View" },
      ]
    : [
        { value: "club_admin", label: "Club Admin View" },
        { value: "coach", label: "Coach View" },
        { value: "team_admin", label: "Team Admin View" },
        { value: "player", label: "Player View" },
        { value: "parent", label: "Parent View" },
      ];

  const currentActiveViewValue = activeView || (activeRoles?.isAdmin ? "admin" :
                                                activeRoles?.clubAdmin ? "club_admin" :
                                                activeRoles?.coach ? "coach" :
                                                activeRoles?.teamAdmin ? "team_admin" :
                                                activeRoles?.player ? "player" :
                                                activeRoles?.parent ? "parent" : "");

  // Calculate accessible team seasons
  let allowedTeamSeasonIds: number[] = [];
  let isAllTeams = false;

  if (activeRoles?.isAdmin) {
    isAllTeams = true;
  } else if (activeRoles?.clubAdmin) {
    allowedTeamSeasonIds = activeRoles.clubAdminTeamIds || [];
  } else if (activeRoles?.coach) {
    allowedTeamSeasonIds = activeRoles.coachTeamIds || [];
  } else if (activeRoles?.teamAdmin) {
    allowedTeamSeasonIds = activeRoles.teamAdminTeamIds || [];
  } else if (activeRoles?.player) {
    allowedTeamSeasonIds = activeRoles.playerTeamIds || [];
  } else if (activeRoles?.parent) {
    allowedTeamSeasonIds = activeRoles.parentTeamIds || [];
  }

  const accessibleTeams = isAllTeams
    ? teamSeasons
    : teamSeasons.filter((ts) => allowedTeamSeasonIds.includes(ts.id));

  // Calculate unique clubs the user has access to
  const accessibleClubIds = Array.from(new Set(accessibleTeams.map((ts) => ts.clubId)));
  const accessibleClubs = clubs.filter((c) => accessibleClubIds.includes(c.id));

  // Filter accessible teams by active club selection (if multiple clubs)
  const filteredTeamsForSelect = selectedClubId
    ? accessibleTeams.filter((t) => t.clubId === Number(selectedClubId))
    : accessibleTeams;

  const urlTeamMatch = pathname?.match(/\/teams\/(\d+)/);
  const currentUrlTeamSeasonId = urlTeamMatch ? urlTeamMatch[1] : "";

  return (
    <>
      {/* Hamburger Button (Mobile) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-3 left-4 z-[1200] bg-surface p-1.5 rounded-md shadow-sm border border-border text-text cursor-pointer transition-transform hover:scale-105"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-[1000] transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-surface text-text border-r border-border z-[1100] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.1)]" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-border flex items-center justify-between">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <h1 className="text-2xl font-bold mb-1 text-primary">Soccer Stats</h1>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-muted hover:bg-surface-hover"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>



          {/* Logged-in Role-switching Top Select */}
          {currentUser && showActiveViewSelect && (
            <div className="p-4 border-b border-border">
              <Select
                label="Switch View"
                options={activeViewOptions}
                value={currentActiveViewValue}
                onChange={handleActiveViewChange}
                width="full"
                showPlaceholder={false}
              />
            </div>
          )}

          {/* Club Selector / Holding Component */}
          {currentUser && !loading && (
            <>
              {accessibleClubs.length > 1 ? (
                <div className="p-4 border-b border-border">
                  <Select
                    label="Current Club"
                    value={selectedClubId}
                    onChange={(e: any) => setSelectedClubId(e.target.value)}
                    options={accessibleClubs.map((club: any) => ({
                      value: String(club.id),
                      label: club.name,
                    }))}
                    width="full"
                    showPlaceholder={true}
                    placeholder="Select Club..."
                  />
                </div>
              ) : accessibleClubs.length === 1 ? (
                <div className="p-4 border-b border-border space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                    Current Club
                  </span>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface/50">
                    <Building2 size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm font-semibold text-text truncate">
                      {accessibleClubs[0].name}
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Team Selector / Holding Component */}
          {currentUser && !loading && (
            <>
              {filteredTeamsForSelect.length > 1 ? (
                <div className="p-4 border-b border-border">
                  <Select
                    label="Current Team"
                    value={currentUrlTeamSeasonId}
                    onChange={(e: any) => {
                      if (e.target.value) router.push(`/teams/${e.target.value}`);
                    }}
                    options={filteredTeamsForSelect.map((team: any) => ({
                      value: String(team.id),
                      label: team.teamName,
                    }))}
                    width="full"
                    showPlaceholder={true}
                    placeholder="Select Team..."
                  />
                </div>
              ) : filteredTeamsForSelect.length === 1 ? (
                <div className="p-4 border-b border-border space-y-1.5">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                    Current Team
                  </span>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-surface/50">
                    <Users size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm font-semibold text-text truncate">
                      {filteredTeamsForSelect[0].teamName}
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Navigation Links Placeholder */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            <div className="space-y-1">
              <Link
                href="/"
                className={`w-full flex items-center gap-3 py-2.5 px-4 text-sm cursor-pointer transition-all duration-200 rounded-lg ${
                  pathname === "/"
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "bg-transparent text-text hover:bg-surface-hover hover:translate-x-1"
                }`}
              >
                <span className="font-medium text-left">Home Match Center</span>
              </Link>
              {currentUser && (
                <Link
                  href="/dashboard"
                  className={`w-full flex items-center gap-3 py-2.5 px-4 text-sm cursor-pointer transition-all duration-200 rounded-lg ${
                    pathname === "/dashboard"
                      ? "bg-primary/10 text-primary font-semibold shadow-sm"
                      : "bg-transparent text-text hover:bg-surface-hover hover:translate-x-1"
                  }`}
                >
                  <span className="font-medium text-left">My Dashboard</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Footer Actions */}
          {currentUser && (
            <div className="flex-shrink-0 p-4 border-t border-border space-y-2 bg-surface">
              <LogoutButton />
            </div>
          )}
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin: 8px 0;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            transition: background 0.2s;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }

          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
          }
        `}</style>
      </aside>
    </>
  );
}

export default NavBar;
