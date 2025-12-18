import { cn } from '@/lib/utils';

export type BadgeVariant = 'best' | 'new' | 'hot' | 'free' | 'premium' | 'coming' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const badgeStyles: Record<BadgeVariant, string> = {
  best: 'bg-blue-100 text-blue-700',
  new: 'bg-orange-100 text-orange-600',
  hot: 'bg-red-50 text-[#FC1C49]',
  free: 'bg-green-100 text-green-700',
  premium: 'bg-purple-100 text-purple-700',
  coming: 'bg-gray-100 text-gray-500',
  default: 'bg-gray-100 text-gray-600',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
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
        'inline-flex items-center rounded font-medium whitespace-nowrap',
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
