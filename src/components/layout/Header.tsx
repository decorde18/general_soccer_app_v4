"use client";
import { format } from "date-fns";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
// import useAuthStore from "@/stores/authStore";
// import { useTeamSelectorStore } from "@/stores/teamSelectorStore";
import TeamSelector from "./TeamSelector";

import { ChevronDown, Settings, User } from "lucide-react";
import LoginButton from "@/components/ui/LoginButton";
import LogoutButton from "@/components/ui/LogoutButton";
import Button from "@/components/ui/Button";

const isValidTeamRoute = (route: string) => true;
const getTeamRoutePath = (id: number, subRoute?: string) =>
  `/teams/${id}${subRoute ? `/${subRoute}` : ""}`;

interface HeaderUser {
  name?: string;
  roles?: {
    isAdmin?: boolean;
  };
  first_name?: string;
  last_name?: string;
}

function Header({ user }: { user?: HeaderUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const previousTeamSeasonIdRef = useRef<number | null>(null);

  // Get team context from store
  // const { selectedTeam, selectedTeamSeasonId } = useTeamSelectorStore();

  // Track window size for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (userMenuOpen && target && !target.closest(".user-menu-container")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  // Handle team context changes from TeamSelector
  const handleContextChange = useCallback(
    (context: { teamSeasonId?: number; league?: { id?: number } } | null) => {
      if (!context?.teamSeasonId) return;

      // Only navigate if the team actually changed (user manually selected a new team)
      if (previousTeamSeasonIdRef.current === context.teamSeasonId) {
        return; // Same team, don't navigate
      }

      // Update the ref to track the current team
      previousTeamSeasonIdRef.current = context.teamSeasonId;

      // Extract the current sub-route if on a team page
      if (pathname?.startsWith("/teams/")) {
        const pathParts = pathname.split("/");
        const routeSegments = pathParts.slice(3);
        const mainRoute = routeSegments[0] || "";
        const fullSubRoute = routeSegments.join("/");

        if (isValidTeamRoute(mainRoute)) {
          router.push(getTeamRoutePath(context.teamSeasonId, fullSubRoute));
        } else {
          router.push(getTeamRoutePath(context.teamSeasonId));
        }

        return;
      }

      if (pathname?.startsWith("/leagues/") && context.league?.id) {
        router.push(`/leagues/${context.league.id}`);
      }
    },
    [pathname, router],
  );

  const formattedDate = format(new Date(), "EEEE, MMMM d, yyyy");

  // Responsive breakpoints
  const isXL = windowWidth >= 1280;
  const isSM = windowWidth >= 640;
  const isLG = windowWidth >= 1024;

  // User info (only if logged in)
  const name = user?.name;
  const systemAdmin = user?.roles?.isAdmin;
  const firstNameInitial = user?.first_name ? user.first_name[0] : "";
  const lastNameInitial = user?.last_name ? user.last_name[0] : "";
  const initials = `${firstNameInitial}${lastNameInitial}`.toUpperCase();

  return (
    <header className='bg-surface border-b border-border sticky top-0 z-50 shadow-sm'>
      <div className='flex items-center justify-between gap-2 px-3 sm:px-4 md:px-6 h-auto min-h-16 py-2 flex-wrap'>
        {/* Left - Date (hidden on smaller screens) */}
        {isXL && (
          <div className='text-sm text-muted whitespace-nowrap'>
            {formattedDate}
          </div>
        )}

        {/* Center - Team Selector (scrollable on smaller screens) */}
        <div
          className={`flex-1 flex justify-center overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent ${
            !isLG ? "ml-0" : ""
          }`}
        >
          <div className='w-full max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%]'>
            <TeamSelector type='header' onContextChange={handleContextChange} />
          </div>
        </div>

        {/* Right - User Menu (only if logged in) */}
        {user ? (
          <div className='relative user-menu-container flex justify-end'>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className='flex items-center gap-3 hover:bg-background rounded-lg p-2 transition-colors'
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-linear-to-br from-primary to-secondary text-white flex items-center justify-center font-semibold text-sm shadow-md'>
                  {initials}
                </div>
                {isSM && (
                  <div className='text-left'>
                    <div className='font-semibold text-sm text-text'>
                      {name}
                    </div>
                    <div className='text-xs text-muted capitalize'>
                      {systemAdmin && "Admin"}
                    </div>
                  </div>
                )}
              </div>
              {isSM && (
                <ChevronDown
                  size={16}
                  className={`text-muted transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {userMenuOpen && (
              <div className='absolute right-0 top-full mt-2 w-56 bg-surface rounded-lg shadow-lg border border-border py-2 z-50'>
                {!isSM && (
                  <div className='px-4 py-3 border-b border-border'>
                    <div className='font-semibold text-sm text-text'>
                      {name}
                    </div>
                    <div className='text-xs text-muted capitalize'>
                      {systemAdmin && "Admin"}
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => {
                    router.push("/profile");
                    setUserMenuOpen(false);
                  }}
                >
                  <User size={20} />
                  <span className='font-medium'>Profile</span>
                </Button>
                <Button
                  onClick={() => {
                    router.push("/settings");
                    setUserMenuOpen(false);
                  }}
                >
                  <Settings size={20} />
                  <span className='font-medium'>Settings</span>
                </Button>

                <div className='border-t border-border my-2'></div>

                <LogoutButton />
              </div>
            )}
          </div>
        ) : (
          // If no user, show Login/Register buttons
          <div className='flex gap-2'>
            <LoginButton />
            <Link href='/auth/register'>
              <button className='text-sm px-3 py-1 rounded-md bg-primary text-white hover:bg-primary/90 transition'>
                Register
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Scrollbar styling */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: hsl(var(--color-border));
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--color-muted));
        }
      `}</style>
    </header>
  );
}

export default Header;
