"use client";
import { Menu, X, ChevronDown, ChevronRight, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { useNavigationStore } from "@/stores/navigationStore";
import {
  buildCompleteNavigation,
  getRoleBadgeInfo,
} from "@/lib/navigationUtils";
import LogoutButton from "../ui/LogoutButton";

function NavBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const { myTeams, myClubs, activeClubId, setActiveClubId } =
    useNavigationStore();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Record<number, boolean>>(
    {},
  );

  // Initialize active club when data loads
  useEffect(() => {
    if (!activeClubId && myClubs && myClubs.length > 0) {
      const first = myClubs[0];
      const initialClubId: number | null =
        typeof first.club_id === "number" ? first.club_id : null;
      setActiveClubId(initialClubId);
    }
  }, [myClubs, activeClubId, setActiveClubId]);

  // Auto-open on desktop
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

  // Auto-close sidebar when route changes (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Auto-expand the club/team that contains the current route
  useEffect(() => {
    const teamMatch = pathname?.match(/\/teams\/(\d+)/);
    if (teamMatch && myTeams.length > 0) {
      const teamSeasonId = parseInt(teamMatch[1]);
      const team = myTeams.find((t) => t.team_season_id === teamSeasonId);

      if (team) {
        const clubIdToSet: number | null =
          typeof team.club_id === "number" ? team.club_id : null;
        setActiveClubId(clubIdToSet);
        setExpandedTeams((prev) => ({ ...prev, [teamSeasonId]: true }));
      }
    }
  }, [pathname, myTeams]);

  const handleClubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveClubId(Number(e.target.value));
  };

  const toggleTeam = (teamSeasonId: number) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamSeasonId]: !prev[teamSeasonId],
    }));
  };

  const sections = buildCompleteNavigation(
    user,
    myTeams,
    myClubs,
    activeClubId,
  ) as any[];

  const NavButton = ({ item, indent = 0 }: { item: any; indent?: number }) => {
    const isActive = pathname === item.path;

    return (
      <Link
        href={item.path}
        className={`w-full flex items-center gap-3 py-2.5 text-white text-sm cursor-pointer transition-all duration-200 rounded-lg ${
          isActive
            ? "bg-white/15 backdrop-blur-sm shadow-lg"
            : "bg-transparent hover:bg-white/10 hover:translate-x-1"
        }`}
        style={{ paddingLeft: `${16 + indent * 12}px` }}
      >
        <div className='flex items-center gap-3 w-full'>
          {item.icon && <span className='text-base'>{item.icon}</span>}
          <span className='font-medium flex-1 text-left'>{item.label}</span>
          {item.badge && (
            <span className='text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white/90'>
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger Button - Hidden on desktop */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className='lg:hidden fixed top-4 left-4 z-[1200] bg-transparent border-none cursor-pointer transition-transform hover:scale-110'
        aria-label='Toggle menu'
      >
        {sidebarOpen ? (
          <X size={28} className='text-white drop-shadow-lg' />
        ) : (
          <Menu size={28} className='text-text drop-shadow-lg' />
        )}
      </button>

      {/* Backdrop - Hidden on desktop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-[1000] transition-opacity duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none ${
          sidebarOpen
            ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.2)]"
            : "-translate-x-full"
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex-shrink-0 p-6 border-b border-white/10'>
            <h1 className='text-2xl font-bold mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent'>
              Soccer Stats
            </h1>
          </div>

          {/* Club Selector */}
          {myClubs.length > 0 && (
            <div className='p-4 border-b border-white/5'>
              <label className='text-[10px] uppercase font-bold tracking-wider text-white/50 mb-1.5 block px-1'>
                Current Club
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/60'>
                  <Building2 size={14} />
                </div>
                <select
                  value={activeClubId || ""}
                  onChange={handleClubChange}
                  className='w-full pl-9 pr-8 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors'
                >
                  {myClubs.map((club: any) => (
                    <option
                      key={club.club_id}
                      value={club.club_id}
                      className='bg-gray-800 text-white'
                    >
                      {club.club_name}
                    </option>
                  ))}
                </select>
                <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-white/60'>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className='flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar'>
            {sections.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <div className='text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-4'>
                  {section.label}
                </div>

                {/* Simple list items */}
                {section.items && (
                  <div className='space-y-1'>
                    {section.items.map((item: any) => (
                      <NavButton key={item.id} item={item} />
                    ))}
                  </div>
                )}

                {/* Hierarchical structure (clubs > teams > routes) */}
                {section.type === "hierarchical" && section.clubs && (
                  <div className='space-y-1'>
                    {section.clubs.map((club: any) => (
                      <div key={club.club_id}>
                        {/* Club Header (Removed - Managed by Select) */}

                        {/* Teams under this club */}
                        <div className='space-y-1 mt-1'>
                          {club.teams.map((team: any) => {
                            const badge = getRoleBadgeInfo(team.role);

                            return (
                              <div key={team.team_season_id}>
                                {/* Team Header */}
                                <div className='w-full flex items-center gap-2 px-2 py-2'>
                                  <button
                                    onClick={() =>
                                      toggleTeam(team.team_season_id)
                                    }
                                    className='hover:bg-white/5 rounded p-1'
                                  >
                                    {expandedTeams[team.team_season_id] ? (
                                      <ChevronDown size={16} />
                                    ) : (
                                      <ChevronRight size={16} />
                                    )}
                                  </button>

                                  <Link
                                    href={`/teams/${team.team_season_id}`}
                                    className='flex-1 flex items-center gap-2 text-sm hover:bg-white/10 rounded-lg transition-all py-2 px-2'
                                  >
                                    <span className='flex-1 text-left font-medium truncate'>
                                      {team.team_name}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}
                                    >
                                      {badge.text}
                                    </span>
                                  </Link>
                                </div>

                                {/* Team Navigation */}
                                {expandedTeams[team.team_season_id] && (
                                  <div className='space-y-1 mt-1 ml-4 border-l border-white/10 pl-2'>
                                    {team.navigation
                                      .filter(
                                        (nav: any) => nav.type !== "divider",
                                      )
                                      .map((navItem: any) => (
                                        <NavButton
                                          key={navItem.id}
                                          item={navItem}
                                          indent={0}
                                        />
                                      ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer Actions */}
          {user && (
            <div className='flex-shrink-0 p-4 border-t border-white/10 space-y-2 bg-gradient-to-t from-black/10 to-transparent'>
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
