import { RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  threshold: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isPulling,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const opacity = Math.min(pullDistance / threshold, 1);
  const scale = Math.min(pullDistance / threshold, 1.2);

  if (pullDistance < 10 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold) - 20}px)`,
        opacity,
      }}
    >
      <div
        className="bg-primary/10 backdrop-blur-sm rounded-full p-3 border border-primary/20"
        style={{ transform: `scale(${scale})` }}
      >
        <RefreshCw
          className={`h-6 w-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isPulling && !isRefreshing ? `rotate(${(pullDistance / threshold) * 360}deg)` : 'rotate(0deg)',
          }}
        />
      </div>
    </div>
  );
}
