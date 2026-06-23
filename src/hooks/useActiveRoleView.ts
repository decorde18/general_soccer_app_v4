import { useEffect, useState } from "react";
import { clearCookie, getCookie, setCookie } from "@/lib/cookies";

const ACTIVE_ROLE_VIEW_COOKIE = "active-role-view";

// Reads/writes the "active-role-view" cookie that lets admins and club
// admins preview the app as a different role.
export function useActiveRoleView() {
  const [activeView, setActiveView] = useState<string>("");

  useEffect(() => {
    setActiveView(getCookie(ACTIVE_ROLE_VIEW_COOKIE));
  }, []);

  function changeActiveView(value: string) {
    if (value) {
      setCookie(ACTIVE_ROLE_VIEW_COOKIE, value);
    } else {
      clearCookie(ACTIVE_ROLE_VIEW_COOKIE);
    }
    window.location.reload();
  }

  return { activeView, changeActiveView };
}