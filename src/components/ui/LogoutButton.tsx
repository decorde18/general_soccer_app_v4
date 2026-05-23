"use client";

import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";
import { LogOut } from "lucide-react";
import React from "react";

interface LogoutButtonProps {
  isDropdown?: boolean;
  onLogout?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  isDropdown = false,
  onLogout,
}) => {
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    }
    await signOut({ callbackUrl: "/login" });
  };

  if (isDropdown) {
    return (
      <Button
        variant="outline"
        onClick={handleLogout}
        className='w-full flex flex-row items-center justify-start gap-2 px-3 py-2 border-none bg-transparent shadow-none font-normal text-danger hover:bg-danger/10'
      >
        <LogOut size={16} />
        <span className='text-sm'>Logout</span>
      </Button>
    );
  }

  return (
    <Button variant='secondary' size='sm' onClick={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton;
