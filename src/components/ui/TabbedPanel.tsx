"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface TabbedPanelProps<T extends string> {
  tabs: readonly TabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
}

export default function TabbedPanel<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabbedPanelProps<T>) {
  return (
    <div
      className={`w-full overflow-x-auto border-b border-border/80 scrollbar-none ${className}`.trim()}
    >
      <div className='flex min-w-max items-center gap-2 pb-0.5'>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 py-3.5 text-sm font-bold transition-all focus:outline-none ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:border-border hover:text-text"
              }`}
            >
              {Icon && <Icon size={16} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
