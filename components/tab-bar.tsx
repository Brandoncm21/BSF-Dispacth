"use client";

import { cn } from "@/lib/utils";

type TabOption = {
  id: string;
  label: string;
};

type Props = {
  tabs: TabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export function TabBar({ tabs, activeTab, onChange }: Props) {
  return (
    <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === tab.id
              ? "border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
