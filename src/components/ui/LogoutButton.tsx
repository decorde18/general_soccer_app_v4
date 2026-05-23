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
      <button
        onClick={handleLogout}
        className='w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text hover:bg-danger/10 transition-colors duration-200 text-sm text-danger'
      >
        <LogOut size={16} className='text-danger' />
        <span>Logout</span>
      </button>
    );
  }

  return (
    <Button variant='secondary' size='sm' onClick={handleLogout}>
      Logout
    </Button>
  );
};

export default LogoutButton;
