import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, UserCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import LogoutButton from "@/components/ui/LogoutButton";
import { useClickOutside } from "@/hooks/useClickOutside";

interface UserMenuProps {
  name: string;
  initials: string;
  isAdmin?: boolean;
}

export default function UserMenu({ name, initials, isAdmin }: UserMenuProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <Button
        variant="outline"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="hidden md:flex flex-row items-center gap-2 px-4 py-2 text-sm font-normal border-border bg-background hover:bg-primary/10"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
          {initials || "U"}
        </span>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-medium text-text">{name}</p>
          <p className="text-xs text-muted">{isAdmin ? "Admin" : "Member"}</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <Card variant="default" padding="none" className="absolute right-0 mt-2 w-48 shadow-lg">
          {/* User Info Header */}
          <div className="border-b border-border bg-background px-4 py-3">
            <p className="text-sm font-semibold text-text">{name}</p>
            <p className="text-xs text-muted">{isAdmin ? "Administrator" : "Member"}</p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Button
              variant="outline"
              onClick={() => {
                router.push("/profile");
                setIsDropdownOpen(false);
              }}
              className="w-full flex flex-row items-center justify-start gap-2 px-3 py-2 border-none font-normal text-text hover:bg-primary/10 bg-transparent shadow-none"
            >
              <UserCircle size={16} className="text-primary" />
              <span className="text-sm">Profile</span>
            </Button>
            <div className="border-t border-border my-1" />
            <LogoutButton onLogout={() => setIsDropdownOpen(false)} isDropdown={true} />
          </div>
        </Card>
      )}

      {/* Mobile User Avatar */}
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="md:hidden flex items-center justify-center h-10 w-10 !p-0 rounded-full text-sm"
      >
        {initials || "U"}
      </Button>
    </div>
  );
}