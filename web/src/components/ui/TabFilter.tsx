"use client";

import { useState } from "react";

export interface Tab {
  id: string;
  label: string;
  count?: number;
  color?: string;
}

interface TabFilterProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: "pill" | "underline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const levelColors: Record<string, { bg: string; text: string; activeBg: string }> = {
  all: { bg: "bg-slate-100", text: "text-slate-600", activeBg: "bg-slate-900" },
  L1: { bg: "bg-green-50", text: "text-green-600", activeBg: "bg-green-600" },
  L2: { bg: "bg-blue-50", text: "text-blue-600", activeBg: "bg-blue-600" },
  L3: { bg: "bg-purple-50", text: "text-purple-600", activeBg: "bg-purple-600" },
};

export function TabFilter({
  tabs,
  activeTab,
  onTabChange,
  variant = "pill",
  size = "md",
  className = "",
}: TabFilterProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  if (variant === "underline") {
    return (
      <div className={`flex gap-1 border-b border-slate-200 ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative ${sizeClasses[size]} font-medium transition-colors
              ${activeTab === tab.id
                ? "text-brand-primary"
                : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Pill variant (default)
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const colors = levelColors[tab.id] || levelColors.all;
        const customColor = tab.color;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              ${sizeClasses[size]} font-medium rounded-full
              transition-all duration-200 ease-out
              ${isActive
                ? customColor
                  ? `${customColor} text-white shadow-md`
                  : `${colors.activeBg} text-white shadow-md`
                : `${colors.bg} ${colors.text} hover:opacity-80`
              }
            `}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                    px-1.5 py-0.5 text-xs rounded-full
                    ${isActive ? "bg-white/20" : "bg-black/5"}
                  `}
                >
                  {tab.count.toLocaleString()}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Pre-configured level filter
interface LevelFilterProps {
  activeLevel: string;
  onLevelChange: (level: string) => void;
  counts?: { all?: number; L1?: number; L2?: number; L3?: number };
  showAll?: boolean;
  className?: string;
}

export function LevelFilter({
  activeLevel,
  onLevelChange,
  counts,
  showAll = true,
  className = "",
}: LevelFilterProps) {
  const tabs: Tab[] = [
    ...(showAll ? [{ id: "all", label: "전체", count: counts?.all }] : []),
    { id: "L1", label: "L1 기초", count: counts?.L1 },
    { id: "L2", label: "L2 중급", count: counts?.L2 },
    { id: "L3", label: "L3 고급", count: counts?.L3 },
  ];

  return (
    <TabFilter
      tabs={tabs}
      activeTab={activeLevel}
      onTabChange={onLevelChange}
      variant="pill"
      className={className}
    />
  );
}

export default TabFilter;
