import { useEffect, useState } from "react";
import { clearCookie, getCookie, setCookie } from "@/lib/cookies";

const DEV_USER_COOKIE = "dev-user-override";
const ACTIVE_ROLE_VIEW_COOKIE = "active-role-view";

// Reads/writes the "dev-user-override" cookie used in development to preview
// the app as different mock users. Also clears any active-role-view override
// so the two preview systems don't conflict.
export function useDevUserOverride() {
  const [devUserMode, setDevUserMode] = useState<string>("");

  useEffect(() => {
    setDevUserMode(getCookie(DEV_USER_COOKIE));
  }, []);

  function changeDevUser(value: string) {
    if (value) {
      setCookie(DEV_USER_COOKIE, value);
    } else {
      clearCookie(DEV_USER_COOKIE);
    }
    // Clear active-role-view when changing mock users to avoid state conflicts
    clearCookie(ACTIVE_ROLE_VIEW_COOKIE);
    window.location.reload();
  }

  return { devUserMode, changeDevUser };
}