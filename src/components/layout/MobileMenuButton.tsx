import { Menu } from "lucide-react";

interface MobileMenuButtonProps {
  onClick: () => void;
}

export default function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-3 left-4 z-[1200] bg-surface p-1.5 rounded-md shadow-sm border border-border text-text cursor-pointer transition-transform hover:scale-105"
      aria-label="Open menu"
    >
      <Menu size={24} />
    </button>
  );
}