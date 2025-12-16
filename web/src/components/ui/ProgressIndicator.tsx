"use client";

interface ProgressIndicatorProps {
  /** Current value */
  current: number;
  /** Maximum value */
  total: number;
  /** Show percentage instead of numbers */
  showPercentage?: boolean;
  /** Variant style */
  variant?: "bar" | "circle" | "text" | "compact";
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Color scheme */
  color?: "primary" | "success" | "warning" | "danger" | "gradient";
  /** Custom label */
  label?: string;
  /** Show label */
  showLabel?: boolean;
  className?: string;
}

const colorStyles = {
  primary: {
    bg: "bg-brand-primary",
    text: "text-brand-primary",
    track: "bg-brand-primary/20",
  },
  success: {
    bg: "bg-green-500",
    text: "text-green-600",
    track: "bg-green-100",
  },
  warning: {
    bg: "bg-yellow-500",
    text: "text-yellow-600",
    track: "bg-yellow-100",
  },
  danger: {
    bg: "bg-red-500",
    text: "text-red-600",
    track: "bg-red-100",
  },
  gradient: {
    bg: "bg-gradient-to-r from-brand-primary to-level-intermediate",
    text: "text-brand-primary",
    track: "bg-slate-200",
  },
};

const sizeStyles = {
  sm: { bar: "h-1.5", circle: "w-12 h-12", text: "text-xs" },
  md: { bar: "h-2", circle: "w-16 h-16", text: "text-sm" },
  lg: { bar: "h-3", circle: "w-20 h-20", text: "text-base" },
};

export function ProgressIndicator({
  current,
  total,
  showPercentage = false,
  variant = "bar",
  size = "md",
  color = "primary",
  label,
  showLabel = true,
  className = "",
}: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const colors = colorStyles[color];
  const sizes = sizeStyles[size];

  // Text variant - simple "15/50" display
  if (variant === "text") {
    return (
      <span className={`font-medium ${colors.text} ${sizes.text} ${className}`}>
        {showPercentage ? `${percentage}%` : `${current}/${total}`}
      </span>
    );
  }

  // Compact variant - small inline progress
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex-1 max-w-[80px] ${colors.track} rounded-full overflow-hidden ${sizes.bar}`}>
          <div
            className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`${sizes.text} text-slate-500 whitespace-nowrap`}>
          {showPercentage ? `${percentage}%` : `${current}/${total}`}
        </span>
      </div>
    );
  }

  // Circle variant
  if (variant === "circle") {
    const strokeWidth = size === "sm" ? 4 : size === "md" ? 5 : 6;
    const radius = size === "sm" ? 20 : size === "md" ? 26 : 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`relative inline-flex items-center justify-center ${sizes.circle} ${className}`}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={colors.track}
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={colors.text}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${colors.text} ${sizes.text}`}>
            {showPercentage ? `${percentage}%` : current}
          </span>
          {!showPercentage && (
            <span className="text-xs text-slate-400">/{total}</span>
          )}
        </div>
      </div>
    );
  }

  // Bar variant (default)
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className={`${sizes.text} text-slate-600`}>{label || "진행률"}</span>
          <span className={`${sizes.text} font-medium ${colors.text}`}>
            {showPercentage ? `${percentage}%` : `${current}/${total}`}
          </span>
        </div>
      )}
      <div className={`${colors.track} rounded-full overflow-hidden ${sizes.bar}`}>
        <div
          className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Shorthand component for word progress
interface WordProgressProps {
  learned: number;
  total: number;
  className?: string;
}

export function WordProgress({ learned, total, className = "" }: WordProgressProps) {
  const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
  let color: "success" | "warning" | "danger" | "primary" = "primary";

  if (percentage >= 80) color = "success";
  else if (percentage >= 50) color = "warning";
  else if (percentage < 30) color = "danger";

  return (
    <ProgressIndicator
      current={learned}
      total={total}
      variant="compact"
      size="sm"
      color={color}
      className={className}
    />
  );
}

export default ProgressIndicator;
