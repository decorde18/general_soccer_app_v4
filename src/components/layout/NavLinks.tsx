import Link from "next/link";

interface NavLinksProps {
  pathname: string | null;
  showDashboard: boolean;
  isAdmin?: boolean;
}

export default function NavLinks({ pathname, showDashboard, isAdmin }: NavLinksProps) {
  const linkClass = (active: boolean) =>
    `w-full flex items-center gap-3 py-2.5 px-4 text-sm cursor-pointer transition-all duration-200 rounded-lg ${
      active
        ? "bg-primary/10 text-primary font-semibold shadow-sm"
        : "bg-transparent text-text hover:bg-surface-hover hover:translate-x-1"
    }`;

  return (
    <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
      <div className="space-y-1">
        <Link href="/" className={linkClass(pathname === "/")}>
          <span className="font-medium text-left">Home Match Center</span>
        </Link>
        {showDashboard && (
          <Link href="/dashboard" className={linkClass(pathname === "/dashboard")}>
            <span className="font-medium text-left">My Dashboard</span>
          </Link>
        )}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
              Admin Tools
            </div>
            <Link href="/admin" className={linkClass(pathname === "/admin")}>
              <span className="font-medium text-left">Admin Dashboard</span>
            </Link>
            <Link href="/admin/users" className={linkClass(pathname === "/admin/users")}>
              <span className="font-medium text-left">User Management</span>
            </Link>
            <Link href="/admin/clubs" className={linkClass(pathname === "/admin/clubs")}>
              <span className="font-medium text-left">Club & Team Roles</span>
            </Link>
            <Link href="/admin/seasons" className={linkClass(pathname === "/admin/seasons")}>
              <span className="font-medium text-left">Seasons Lifecycle</span>
            </Link>
            <Link href="/admin/leagues" className={linkClass(pathname === "/admin/leagues")}>
              <span className="font-medium text-left">League Structure</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}