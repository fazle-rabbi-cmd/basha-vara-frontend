import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantStyles = {
    default: 'h-4 w-full',
    text: 'h-4 w-3/4',
    circular: 'h-12 w-12 rounded-full',
    rectangular: 'h-24 w-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
