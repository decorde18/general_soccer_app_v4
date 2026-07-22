"use client";

import { useEffect, useState } from "react";
import { Menu, X, Settings, BarChart2, Activity, Users } from "lucide-react";
import { useParams, usePathname } from "next/navigation";

import useGameStore from "@/stores/gameStore";
import GameHeader from "@/components/layout/gameLayout/GameHeader";
import GameNavItem from "@/components/game/GameNavItem";
import type { NavItem } from "@/types/game";

export default function GameNavBar() {
  const { id, teamSeasonId } = useParams<{
    id: string;
    teamSeasonId: string;
  }>();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const GAME_STAGES = useGameStore((s) => s.GAME_STAGES);

  // Auto-close on route change (mobile/tablet behavior)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!game) return null;

  const baseGamePath = `/gamestats/${teamSeasonId}/${id}`;
  const isGameCompleted = gameStage === GAME_STAGES.END_GAME;

  const isOnSubPage =
    pathname.includes("/settings") || pathname.includes("/manage");

  const navItems: NavItem[] = [
    {
      id: "lineup",
      label: "Lineup",
      path: `${baseGamePath}/lineup`,
      icon: <Users className='h-5 w-5' />,
    },
    {
      id: "manage",
      label: "Game Management",
      path: `${baseGamePath}/manage`,
      icon: <Activity className='h-5 w-5' />,
    },
    {
      id: "settings",
      label: "Settings",
      path: `${baseGamePath}/settings`,
      icon: <Settings className='h-5 w-5' />,
    },
  ];

  if (!isGameCompleted && isOnSubPage) {
    navItems.unshift({
      id: "return-to-game",
      label: "Return to Game",
      path: `${baseGamePath}/live`,
      icon: <Activity className='h-5 w-5 text-emerald-400' />,
    });
  }

  if (isGameCompleted) {
    navItems.push({
      id: "summary",
      label: "Game Summary",
      path: `${baseGamePath}/summary`,
      icon: <BarChart2 className='h-5 w-5' />,
    });
  }

  const isDarkHeader = pathname?.includes("/live");

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={`fixed left-4 top-4 z-[1200] flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 print:hidden ${
          sidebarOpen
            ? "translate-x-64 bg-transparent"
            : "translate-x-0 border border-white/20 bg-white/10 shadow-lg backdrop-blur-md"
        }`}
        aria-label='Toggle menu'
      >
        {sidebarOpen ? (
          <X size={32} className='text-white' />
        ) : (
          <Menu
            size={32}
            className={isDarkHeader ? "text-white" : "text-gray-800"}
          />
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm transition-all duration-500 print:hidden ${
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-[1100] h-full w-80 border-r border-white/5 bg-[#0f172a] text-white shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] print:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className='flex h-full flex-col bg-gradient-to-b from-primary/10 to-transparent'>
          {/* Header Area */}
          <div className='p-6 pb-2'>
            <div className='mb-8 flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20'>
                <span className='text-xl'>⚽</span>
              </div>
              <div>
                <h2 className='text-lg font-bold leading-tight'>Game Center</h2>
                <p className='text-xs text-white/50'>Manage your match</p>
              </div>
            </div>

            <div className='mb-6'>
              <GameHeader />
            </div>
          </div>

          {/* Navigation */}
          <nav className='custom-scrollbar flex-1 space-y-2 overflow-y-auto px-4'>
            <div className='mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/40'>
              Menu
            </div>
            {navItems.map((item) => (
              <GameNavItem
                key={item.id}
                item={item}
                isActive={pathname === item.path}
              />
            ))}
          </nav>

          {/* Footer Info */}
          <div className='mt-auto border-t border-white/5 bg-black/20 p-6 backdrop-blur-md'>
            <div className='flex items-center justify-between text-xs text-white/40'>
              <span>Game ID</span>
              <span className='rounded bg-white/5 px-2 py-1 font-mono'>
                {game.id}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
