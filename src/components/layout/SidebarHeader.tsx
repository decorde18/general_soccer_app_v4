import Link from "next/link";
import { X } from "lucide-react";

interface SidebarHeaderProps {
  onClose: () => void;
}

export default function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <div className="flex-shrink-0 p-6 border-b border-border flex items-center justify-between">
      <Link href="/" className="hover:opacity-90 transition-opacity">
        <h1 className="text-2xl font-bold mb-1 text-primary">Soccer Stats</h1>
      </Link>
      <button
        onClick={onClose}
        className="lg:hidden p-1 rounded-md text-muted hover:bg-surface-hover"
        aria-label="Close menu"
      >
        <X size={24} />
      </button>
    </div>
  );
}