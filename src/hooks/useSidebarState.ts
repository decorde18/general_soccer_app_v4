import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface SidebarState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Tracks whether the mobile sidebar is open: auto-open on desktop widths,
// auto-close whenever the route changes on mobile.
export function useSidebarState(): SidebarState {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  return { sidebarOpen, setSidebarOpen };
}