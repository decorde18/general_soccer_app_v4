"use client";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TeamSelector from "./TeamSelector";
import { useState, useRef, useEffect } from "react";

import { User, UserCircle, ChevronDown } from "lucide-react";
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
    <header className='sticky top-0 z-50 border-b border-border bg-linear-to-r from-primary via-secondary to-primary text-white shadow-lg'>
      <div className='mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg'>
            <User size={20} className='text-white' />
          </div>
          <div>
            <p className='text-sm font-bold text-white'>Soccer Stats</p>
            <p className='text-xs text-white/70 hidden sm:block'>
              {formattedDate}
            </p>
          </div>
        </div>

        <div className='flex-1'>
          <TeamSelector />
        </div>

        <div className='flex items-center gap-3'>
          {session?.user ? (
            <div className='relative' ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='hidden items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 text-sm text-white transition-all duration-200 md:flex'
              >
                <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-semibold text-xs'>
                  {initials || "U"}
                </span>
                <div className='min-w-0 text-left'>
                  <p className='truncate text-sm font-medium text-white'>
                    {name}
                  </p>
                  {isAdmin ? (
                    <p className='text-xs uppercase tracking-[0.25em] text-accent'>
                      Admin
                    </p>
                  ) : (
                    <p className='text-xs uppercase tracking-[0.25em] text-white/70'>
                      Member
                    </p>
                  )}
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className='absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95'>
                  <div className='px-4 py-3 border-b border-border bg-background/50'>
                    <p className='text-sm font-semibold text-text'>{name}</p>
                    <p className='text-xs text-muted'>
                      {isAdmin ? "Administrator" : "Member"}
                    </p>
                  </div>
                  <div className='p-2'>
                    <button
                      onClick={() => {
                        router.push("/profile");
                        setIsDropdownOpen(false);
                      }}
                      className='w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text hover:bg-primary/10 transition-colors duration-200 text-sm'
                    >
                      <UserCircle size={16} className='text-primary' />
                      <span>Profile</span>
                    </button>
                    <div className='border-t border-border my-1' />
                    <LogoutButton
                      onLogout={() => setIsDropdownOpen(false)}
                      isDropdown={true}
                    />
                  </div>
                </div>
              )}

              {/* Mobile User Icon */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-accent text-white font-semibold'
              >
                {initials || "U"}
              </button>
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
