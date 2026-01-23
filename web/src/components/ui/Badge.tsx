import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'best'
  | 'new'
  | 'hot'
  | 'free'
  | 'premium'
  | 'coming'
  // Semantic colors
  | 'teal'
  | 'blue'
  | 'amber'
  | 'rose'
  | 'emerald'
  | 'purple'
  | 'orange'
  | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const badgeStyles: Record<BadgeVariant, string> = {
  // Legacy variants
  best: 'bg-teal-100 text-teal-700',
  new: 'bg-orange-100 text-orange-700',
  hot: 'bg-rose-100 text-rose-700',
  free: 'bg-emerald-100 text-emerald-700',
  premium: 'bg-purple-100 text-purple-700',
  coming: 'bg-gray-100 text-gray-500',
  default: 'bg-gray-100 text-gray-700',
  // Semantic colors
  teal: 'bg-teal-100 text-teal-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  gray: 'bg-gray-100 text-gray-600',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

export function Badge({
  variant = 'default',
  children,
  className,
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        sizeStyles[size],
        badgeStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
