'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type ProgressColor = 'green' | 'blue' | 'purple' | 'orange' | 'brand';

interface AnimatedProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value. Default: 100 */
  max?: number;
  /** Color theme */
  color?: ProgressColor;
  /** Show label with percentage. Default: true */
  showLabel?: boolean;
  /** Enable animation. Default: true */
  animate?: boolean;
  /** Height class. Default: 'h-3' */
  height?: string;
  /** Custom class name */
  className?: string;
}

const colorStyles: Record<ProgressColor, string> = {
  green: 'from-green-400 to-green-600',
  blue: 'from-blue-400 to-blue-600',
  purple: 'from-purple-400 to-cyan-600',
  orange: 'from-orange-400 to-orange-600',
  brand: 'from-brand-primary to-brand-secondary',
};

/**
 * Animated linear progress bar
 */
export function AnimatedProgress({
  value,
  max = 100,
  color = 'brand',
  showLabel = true,
  animate = true,
  height = 'h-3',
  className = '',
}: AnimatedProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      <div className={`${height} bg-gray-100 rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full bg-gradient-to-r ${colorStyles[color]} rounded-full relative`}
          initial={shouldAnimate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={shouldAnimate ? { duration: 1, ease: 'easeOut', delay: 0.2 } : { duration: 0 }}
        >
          {/* Shimmer effect */}
          {shouldAnimate && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>
      </div>

      {showLabel && (
        <motion.div
          className="flex justify-between mt-1 text-sm"
          initial={shouldAnimate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-gray-500">
            {value} / {max}
          </span>
          <span className="font-medium text-gray-700">{Math.round(percentage)}%</span>
        </motion.div>
      )}
    </div>
  );
}

interface CircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Size in pixels. Default: 120 */
  size?: number;
  /** Stroke width. Default: 8 */
  strokeWidth?: number;
  /** Color theme */
  color?: ProgressColor;
  /** Show percentage in center. Default: true */
  showValue?: boolean;
  /** Custom class name */
  className?: string;
}

const gradientColors: Record<ProgressColor, [string, string]> = {
  green: ['#4ade80', '#16a34a'],
  blue: ['#60a5fa', '#2563eb'],
  purple: ['#a78bfa', '#7c3aed'],
  orange: ['#fb923c', '#ea580c'],
  brand: ['#50af31', '#1a8ec1'],
};

/**
 * Animated circular progress indicator
 */
export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'brand',
  showValue = true,
  className = '',
}: CircularProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const gradientId = `progress-gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors[color][0]} />
            <stop offset="100%" stopColor={gradientColors[color][1]} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={prefersReducedMotion ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {/* Center text */}
      {showValue && (
        <motion.div
          className="absolute text-2xl font-bold text-gray-800"
          initial={prefersReducedMotion ? { scale: 1 } : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5, type: 'spring' }}
        >
          {value}%
        </motion.div>
      )}
    </div>
  );
}

export default AnimatedProgress;
