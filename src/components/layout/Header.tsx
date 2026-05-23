"use client";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TeamSelector from "./TeamSelector";
import { useState, useRef, useEffect } from "react";

import { User, LogOut, UserCircle, ChevronDown } from "lucide-react";
import LoginButton from "@/components/ui/LoginButton";
import LogoutButton from "@/components/ui/LogoutButton";
import Button from "@/components/ui/Button";

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
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentUser = (user as HeaderUser) ?? session?.user;
  const name = currentUser?.name ?? "Player";
  const isAdmin = currentUser?.roles?.isAdmin;
  const firstNameInitial = currentUser?.first_name
    ? currentUser.first_name[0]
    : (name?.[0] ?? "");
  const lastNameInitial = currentUser?.last_name
    ? currentUser.last_name[0]
    : "";
  const initials = `${firstNameInitial}${lastNameInitial}`.toUpperCase();
  const formattedDate = format(new Date(), "EEEE, MMMM d, yyyy");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className='sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm'>
      <div className='mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/10'>
            <User size={20} />
          </div>
          <div>
            <p className='text-sm font-semibold text-text'>Soccer Stats</p>
            <p className='text-xs text-muted hidden sm:block'>
              {formattedDate}
            </p>
          </div>
        </div>

        <div className='flex-1'>
          <TeamSelector />
        </div>

        <div className='flex items-center gap-3'>
          {session?.user ? (
            <div className='flex items-center gap-2'>
              <div className='hidden items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-text md:flex'>
                <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold'>
                  {initials || "U"}
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{name}</p>
                  {isAdmin ? (
                    <p className='text-xs uppercase tracking-[0.25em] text-primary'>
                      Admin
                    </p>
                  ) : (
                    <p className='text-xs uppercase tracking-[0.25em] text-muted'>
                      Member
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() => router.push("/profile")}
              >
                Profile
              </Button>
              <LogoutButton />
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <LoginButton />
              <Link href='/auth/register' className='inline-flex'>
                <Button variant='secondary' size='sm'>
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
