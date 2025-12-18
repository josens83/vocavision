'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TagButtonProps {
  label: string;
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TagButton({
  label,
  href,
  isActive,
  onClick,
  className,
}: TagButtonProps) {
  const baseStyles = cn(
    'inline-block px-3 py-1.5 rounded text-sm transition-all duration-300',
    'shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
    isActive
      ? 'bg-gray-900 text-white'
      : 'bg-white text-gray-500 hover:bg-gray-900 hover:text-white',
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseStyles}>
        #{label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseStyles}>
      #{label}
    </button>
  );
}

interface TagGroupProps {
  tags: Array<{
    label: string;
    href?: string;
    isActive?: boolean;
  }>;
  onTagClick?: (label: string) => void;
  className?: string;
}

export function TagGroup({ tags, onTagClick, className }: TagGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <TagButton
          key={tag.label}
          label={tag.label}
          href={tag.href}
          isActive={tag.isActive}
          onClick={onTagClick ? () => onTagClick(tag.label) : undefined}
        />
      ))}
    </div>
  );
}

export default TagButton;
