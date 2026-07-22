"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { NavItem } from "@/types/game";

interface GameNavItemProps {
  item: NavItem;
  isActive: boolean;
}

export default function GameNavItem({ item, isActive }: GameNavItemProps) {
  return (
    <Link
      href={item.path}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
        isActive
          ? "border border-white/10 bg-white/10 text-white shadow-lg backdrop-blur-sm"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      {isActive && (
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-primary to-secondary" />
      )}

      <span
        className={`transition-transform duration-300 ${
          isActive ? "scale-110 text-white" : "group-hover:scale-110"
        }`}
      >
        {item.icon}
      </span>

      <span className="flex-1">{item.label}</span>

      {isActive && <ChevronRight className="h-4 w-4 text-white/50" />}
    </Link>
  );
}
