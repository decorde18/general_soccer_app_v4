"use client";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useNavBarData } from "@/hooks/useNavBarData";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useActiveRoleView } from "@/hooks/useActiveRoleView";
import { useSelectedClub } from "@/hooks/useSelectedClub";
import {
  getAccessibleTeams,
  getAccessibleClubs,
  getCurrentActiveViewValue,
} from "@/lib/navAccess";
import type { NavUser } from "@/types/nav";

import MobileMenuButton from "./MobileMenuButton";
import MobileBackdrop from "./MobileBackdrop";
import SidebarHeader from "./SidebarHeader";
import ViewSwitcher from "./ViewSwitcher";
import ClubSelector from "./ClubSelector";
import SidebarTeamSelector from "./SidebarTeamSelector";
import NavLinks from "./NavLinks";
import SidebarFooter from "./SidebarFooter";

interface NavBarProps {
  user?: NavUser;
}

export default function NavBar({ user }: NavBarProps) {
  const { data: session } = useSession();
  const currentUser = user ?? (session?.user as NavUser | undefined);
  const activeRoles = currentUser?.roles;
  const originalRoles = currentUser?.originalRoles || activeRoles;

  const pathname = usePathname();
  const router = useRouter();

  const { clubs, teamSeasons, loading } = useNavBarData();
  const { sidebarOpen, setSidebarOpen } = useSidebarState();
  const { activeView, changeActiveView } = useActiveRoleView();
  const [selectedClubId, setSelectedClubId] = useSelectedClub(teamSeasons, loading);

  const showActiveViewSelect = !!(originalRoles?.isAdmin || originalRoles?.clubAdmin);
  const currentActiveViewValue = getCurrentActiveViewValue(activeView, activeRoles);

  const accessibleTeams = getAccessibleTeams(activeRoles, teamSeasons);
  const accessibleClubs = getAccessibleClubs(accessibleTeams, clubs);

  const filteredTeamsForSelect = selectedClubId
    ? accessibleTeams.filter((t) => t.clubId === Number(selectedClubId))
    : accessibleTeams;

  const urlTeamMatch = pathname?.match(/\/teams\/(\d+)/);
  const currentUrlTeamSeasonId = urlTeamMatch ? urlTeamMatch[1] : "";

  return (
    <>
      {!sidebarOpen && <MobileMenuButton onClick={() => setSidebarOpen(true)} />}

      <MobileBackdrop open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-surface text-text border-r border-border z-[1100] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.1)]" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarHeader onClose={() => setSidebarOpen(false)} />

          {currentUser && showActiveViewSelect && (
            <ViewSwitcher
              isAdmin={originalRoles?.isAdmin}
              value={currentActiveViewValue}
              onChange={(e) => changeActiveView(e.target.value)}
            />
          )}

          {currentUser && !loading && (
            <ClubSelector
              clubs={accessibleClubs}
              selectedClubId={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
            />
          )}

          {currentUser && !loading && (
            <SidebarTeamSelector
              teams={filteredTeamsForSelect}
              currentTeamId={currentUrlTeamSeasonId}
              onChange={(e) => {
                if (e.target.value) router.push(`/teams/${e.target.value}`);
              }}
            />
          )}

          <NavLinks
            pathname={pathname}
            showDashboard={!!currentUser}
            isAdmin={activeRoles?.isAdmin}
          />

          {currentUser && <SidebarFooter />}
        </div>

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