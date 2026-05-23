"use client";

import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function LogoutButton() {
  return (
    <Button
      variant='secondary'
      size='sm'
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Logout
    </Button>
  );
}
