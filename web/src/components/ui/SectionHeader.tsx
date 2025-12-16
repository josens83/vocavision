"use client";

import Link from "next/link";

type BadgeType = "best" | "new" | "hot" | "update" | "free" | "premium";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: BadgeType;
  viewAllHref?: string;
  viewAllLabel?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<BadgeType, { bg: string; text: string; label: string }> = {
  best: {
    bg: "bg-gradient-to-r from-yellow-400 to-orange-500",
    text: "text-white",
    label: "BEST",
  },
  new: {
    bg: "bg-gradient-to-r from-green-400 to-emerald-500",
    text: "text-white",
    label: "NEW",
  },
  hot: {
    bg: "bg-gradient-to-r from-red-500 to-pink-500",
    text: "text-white",
    label: "HOT",
  },
  update: {
    bg: "bg-gradient-to-r from-blue-400 to-indigo-500",
    text: "text-white",
    label: "UPDATE",
  },
  free: {
    bg: "bg-gradient-to-r from-teal-400 to-cyan-500",
    text: "text-white",
    label: "FREE",
  },
  premium: {
    bg: "bg-gradient-to-r from-purple-500 to-violet-600",
    text: "text-white",
    label: "PRO",
  },
};

export function SectionHeader({
  title,
  subtitle,
  badge,
  viewAllHref,
  viewAllLabel = "전체보기",
  rightElement,
  className = "",
}: SectionHeaderProps) {
  const badgeConfig = badge ? badgeStyles[badge] : null;

  return (
    <div className={`flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Badge */}
        {badgeConfig && (
          <span
            className={`
              px-2.5 py-1 text-xs font-bold rounded-md
              ${badgeConfig.bg} ${badgeConfig.text}
              shadow-sm animate-pulse-soft
            `}
          >
            {badgeConfig.label}
          </span>
        )}

        {/* Title & Subtitle */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right side: View All or custom element */}
      {rightElement ? (
        rightElement
      ) : viewAllHref ? (
        <Link
          href={viewAllHref}
          className="
            flex items-center gap-1 text-sm font-medium text-slate-500
            hover:text-brand-primary transition-colors group
          "
        >
          {viewAllLabel}
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}

export default SectionHeader;
