"use client";

import { useState } from "react";

export type LearningStatus = "all" | "learning" | "completed" | "bookmarked";

interface StatusTab {
  id: LearningStatus;
  label: string;
  icon: string;
  count?: number;
}

interface LearningStatusTabsProps {
  activeStatus: LearningStatus;
  onStatusChange: (status: LearningStatus) => void;
  counts?: {
    all?: number;
    learning?: number;
    completed?: number;
    bookmarked?: number;
  };
  showAll?: boolean;
  variant?: "pill" | "underline" | "card";
  className?: string;
}

const statusConfig: Record<LearningStatus, { label: string; icon: string; color: string; bgColor: string }> = {
  all: {
    label: "전체",
    icon: "📚",
    color: "text-slate-700",
    bgColor: "bg-slate-100",
  },
  learning: {
    label: "학습중",
    icon: "📖",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  completed: {
    label: "완료",
    icon: "✅",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  bookmarked: {
    label: "찜",
    icon: "⭐",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
};

export function LearningStatusTabs({
  activeStatus,
  onStatusChange,
  counts,
  showAll = true,
  variant = "pill",
  className = "",
}: LearningStatusTabsProps) {
  const tabs: StatusTab[] = [
    ...(showAll ? [{ id: "all" as const, ...statusConfig.all, count: counts?.all }] : []),
    { id: "learning" as const, ...statusConfig.learning, count: counts?.learning },
    { id: "completed" as const, ...statusConfig.completed, count: counts?.completed },
    { id: "bookmarked" as const, ...statusConfig.bookmarked, count: counts?.bookmarked },
  ];

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.id;
          const config = statusConfig[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                ${isActive
                  ? `border-brand-primary ${config.bgColor} shadow-md`
                  : "border-slate-200 bg-white hover:border-slate-300"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div className="text-left">
                  <p className={`font-semibold ${isActive ? config.color : "text-slate-700"}`}>
                    {config.label}
                  </p>
                  {tab.count !== undefined && (
                    <p className="text-sm text-slate-500">{tab.count.toLocaleString()}개</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div className={`flex gap-1 border-b border-slate-200 ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.id;
          const config = statusConfig[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3 font-medium transition-colors
                ${isActive ? config.color : "text-slate-500 hover:text-slate-700"}
              `}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
              {tab.count !== undefined && (
                <span className={`
                  px-1.5 py-0.5 text-xs rounded-full
                  ${isActive ? config.bgColor : "bg-slate-100"}
                `}>
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pill variant (default)
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeStatus === tab.id;
        const config = statusConfig[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onStatusChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full font-medium
              transition-all duration-200 ease-out
              ${isActive
                ? `${config.bgColor} ${config.color} shadow-md`
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }
            `}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
            {tab.count !== undefined && (
              <span
                className={`
                  px-1.5 py-0.5 text-xs rounded-full
                  ${isActive ? "bg-white/50" : "bg-black/5"}
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default LearningStatusTabs;
