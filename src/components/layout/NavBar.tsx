"use client";
import { useState, useTransition, useEffect } from "react";
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
import ClubTypeSelector from "./ClubTypeSelector";
import ClubSelector from "./ClubSelector";
import SidebarSeasonSelector from "./SidebarSeasonSelector";
import SidebarTeamSelector from "./SidebarTeamSelector";
import NavLinks from "./NavLinks";
import SidebarFooter from "./SidebarFooter";
import { useTeamLoadingStore } from "@/stores/teamLoadingStore";

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

  const { seasons, clubs, teamSeasons, loading } = useNavBarData();
  const { sidebarOpen, setSidebarOpen } = useSidebarState();
  const { activeView, changeActiveView } = useActiveRoleView();

  const [selectedClubType, setSelectedClubType] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("soccer_sidepanel_club_type");
      if (saved) return saved;
    }
    return "club";
  });
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("soccer_sidepanel_season_id");
      if (saved) return saved;
    }
    return "";
  });
  const [selectedClubId, setSelectedClubId] = useSelectedClub(teamSeasons, loading);

  const [isNavigating, startTransition] = useTransition();
  const [optimisticTeamId, setOptimisticTeamId] = useState<string | null>(null);

  const setGlobalTeamLoading = useTeamLoadingStore((s) => s.setIsTeamLoading);

  useEffect(() => {
    setOptimisticTeamId(null);
  }, [pathname]);

  // Default to active season if selectedSeasonId is empty or not in seasons
  useEffect(() => {
    if (loading || seasons.length === 0) return;

    if (!selectedSeasonId) {
      const savedSeasonId = typeof window !== "undefined" ? localStorage.getItem("soccer_sidepanel_season_id") : null;
      const matchedSaved = savedSeasonId ? seasons.find((s) => String(s.id) === savedSeasonId) : null;
      if (matchedSaved) {
        setSelectedSeasonId(String(matchedSaved.id));
      } else {
        const activeSeason = seasons.find((s) => s.status === "active") || seasons[0];
        if (activeSeason) {
          const defaultId = String(activeSeason.id);
          setSelectedSeasonId(defaultId);
          if (typeof window !== "undefined") {
            localStorage.setItem("soccer_sidepanel_season_id", defaultId);
          }
        }
      }
    }
  }, [loading, seasons, selectedSeasonId]);

  // Sync selectedClubType and selectedSeasonId when on a team page
  useEffect(() => {
    const urlTeamMatch = pathname?.match(/\/teams\/(\d+)/);
    if (urlTeamMatch && teamSeasons.length > 0) {
      const currentId = Number(urlTeamMatch[1]);
      const currentTeam = teamSeasons.find((t) => t.id === currentId);
      if (currentTeam) {
        if (currentTeam.seasonId) {
          const sId = String(currentTeam.seasonId);
          setSelectedSeasonId(sId);
          if (typeof window !== "undefined") {
            localStorage.setItem("soccer_sidepanel_season_id", sId);
          }
        }
        let resolvedType = currentTeam.clubType;
        if (!resolvedType) {
          const club = clubs.find((c) => c.id === currentTeam.clubId);
          if (club?.type) resolvedType = club.type;
        }
        if (resolvedType) {
          setSelectedClubType(resolvedType);
          if (typeof window !== "undefined") {
            localStorage.setItem("soccer_sidepanel_club_type", resolvedType);
          }
        }
      }
    }
  }, [pathname, teamSeasons, clubs]);

  const showActiveViewSelect = !!(originalRoles?.isAdmin || originalRoles?.clubAdmin);
  const currentActiveViewValue = getCurrentActiveViewValue(activeView, activeRoles);

  const accessibleTeams = getAccessibleTeams(activeRoles, teamSeasons);
  const accessibleClubs = getAccessibleClubs(accessibleTeams, clubs);

  const accessibleSeasons = seasons.filter((s) => {
    const hasAccessibleTeamInSeason = accessibleTeams.some((t) => t.seasonId === s.id);
    if (!hasAccessibleTeamInSeason && accessibleTeams.length > 0) return false;

    if (selectedClubType === "high_school") {
      const match = accessibleTeams.some(
        (t) => t.seasonId === s.id && t.clubType === "high_school"
      );
      if (!match) return false;
    } else if (selectedClubType === "club") {
      const match = accessibleTeams.some(
        (t) => t.seasonId === s.id && (t.clubType === "club" || !t.clubType)
      );
      if (!match) return false;
    }

    if (selectedClubId) {
      const match = accessibleTeams.some(
        (t) => t.seasonId === s.id && t.clubId === Number(selectedClubId)
      );
      if (!match) return false;
    }

    return true;
  });

  const filteredClubsByType = accessibleClubs.filter((c) => {
    if (!selectedClubType) {
      // pass
    } else if (selectedClubType === "high_school") {
      if (c.type !== "high_school") return false;
    } else if (selectedClubType === "club") {
      if (c.type && c.type !== "club") return false;
    }

    if (selectedSeasonId) {
      const matchSeason = accessibleTeams.some(
        (t) => t.clubId === c.id && t.seasonId === Number(selectedSeasonId)
      );
      if (!matchSeason) return false;
    }

    return true;
  });

  const filteredTeamsForSelect = accessibleTeams.filter((t) => {
    const matchType =
      !selectedClubType ||
      (selectedClubType === "high_school" && t.clubType === "high_school") ||
      (selectedClubType === "club" && (t.clubType === "club" || !t.clubType));
    const matchClub = selectedClubId ? t.clubId === Number(selectedClubId) : true;
    const matchSeason = selectedSeasonId ? t.seasonId === Number(selectedSeasonId) : true;
    return matchType && matchClub && matchSeason;
  });

  const handleClubTypeChange = (newType: string) => {
    setSelectedClubType(newType);
    if (typeof window !== "undefined") {
      if (newType) localStorage.setItem("soccer_sidepanel_club_type", newType);
      else localStorage.removeItem("soccer_sidepanel_club_type");
    }
    setSelectedClubId("");
    if (newType && selectedSeasonId) {
      const seasonHasTeamsOfType = accessibleTeams.some(
        (t) =>
          t.seasonId === Number(selectedSeasonId) &&
          ((newType === "high_school" && t.clubType === "high_school") ||
            (newType === "club" && (t.clubType === "club" || !t.clubType)))
      );
      if (!seasonHasTeamsOfType) {
        setSelectedSeasonId("");
      }
    }
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeasonId = e.target.value;
    setSelectedSeasonId(newSeasonId);
    if (typeof window !== "undefined") {
      if (newSeasonId) localStorage.setItem("soccer_sidepanel_season_id", newSeasonId);
      else localStorage.removeItem("soccer_sidepanel_season_id");
    }
    if (newSeasonId && selectedClubId) {
      const clubHasTeamsInSeason = accessibleTeams.some(
        (t) => t.clubId === Number(selectedClubId) && t.seasonId === Number(newSeasonId)
      );
      if (!clubHasTeamsInSeason) {
        setSelectedClubId("");
      }
    }
  };

  const handleClubChange = (newClubId: string) => {
    setSelectedClubId(newClubId);
    if (newClubId && selectedSeasonId) {
      const clubHasTeamsInSeason = accessibleTeams.some(
        (t) => t.clubId === Number(newClubId) && t.seasonId === Number(selectedSeasonId)
      );
      if (!clubHasTeamsInSeason) {
        setSelectedSeasonId("");
      }
    }
  };

  const urlTeamMatch = pathname?.match(/\/teams\/(\d+)/);
  const currentUrlTeamSeasonId = urlTeamMatch ? urlTeamMatch[1] : "";

  const activeTeamId = optimisticTeamId ?? currentUrlTeamSeasonId;
  const isCurrentTeamInFiltered = filteredTeamsForSelect.some(
    (t) => String(t.id) === String(activeTeamId)
  );
  const displayedTeamId = isCurrentTeamInFiltered ? activeTeamId : "";
  const isTeamLoading = isNavigating || (optimisticTeamId !== null && optimisticTeamId !== currentUrlTeamSeasonId);

  useEffect(() => {
    if (isTeamLoading) {
      const targetTeam = filteredTeamsForSelect.find(
        (t) => String(t.id) === String(activeTeamId),
      );
      setGlobalTeamLoading(true, targetTeam?.teamName || null);
    } else {
      setGlobalTeamLoading(false, null);
    }
  }, [isTeamLoading, activeTeamId, filteredTeamsForSelect, setGlobalTeamLoading]);

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
            <ClubTypeSelector
              value={selectedClubType}
              onChange={(e) => handleClubTypeChange(e.target.value)}
            />
          )}

          {currentUser && !loading && (
            <SidebarSeasonSelector
              seasons={accessibleSeasons}
              selectedSeasonId={selectedSeasonId}
              onChange={handleSeasonChange}
            />
          )}

          {currentUser && !loading && (
            <ClubSelector
              clubs={filteredClubsByType}
              selectedClubId={selectedClubId}
              onChange={(e) => handleClubChange(e.target.value)}
            />
          )}

          {currentUser && !loading && (
            <SidebarTeamSelector
              teams={filteredTeamsForSelect}
              currentTeamId={displayedTeamId}
              isLoading={isTeamLoading}
              onChange={(e) => {
                const newId = e.target.value;
                if (!newId) return;
                setOptimisticTeamId(newId);
                startTransition(() => {
                  router.push(`/teams/${newId}`);
                });
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