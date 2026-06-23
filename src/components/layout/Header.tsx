"use client";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import TeamSelector from "@/components/layout/TeamSelector";

import Logo from "@/components/layout/Logo";
import DevUserSwitcher from "@/components/layout/DevUserSwitcher";
import UserMenu from "@/components/layout/UserMenu";
import GuestActions from "@/components/layout/GuestActions";

import { useDevUserOverride } from "@/hooks/useDevUserOverride";
import { getDisplayName, getUserInitials } from "@/lib/userDisplay";
import type { HeaderUser } from "@/types/header";

interface HeaderProps {
  user?: HeaderUser;
}

function Header({ user }: HeaderProps) {
  const { data: session } = useSession();
  const { devUserMode, changeDevUser } = useDevUserOverride();

  const currentUser = user ?? (session?.user as HeaderUser | undefined);
  const name = getDisplayName(currentUser);
  const initials = getUserInitials(currentUser);
  const isAdmin = currentUser?.roles?.isAdmin;
  const formattedDate = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface shadow-md items-center">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo formattedDate={formattedDate} />

        {/* Team Selector */}
        <div className="flex-1">
          <TeamSelector type="header" />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <DevUserSwitcher value={devUserMode} onChange={(e) => changeDevUser(e.target.value)} />

          {currentUser ? (
            <UserMenu name={name} initials={initials} isAdmin={isAdmin} />
          ) : (
            <GuestActions />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;