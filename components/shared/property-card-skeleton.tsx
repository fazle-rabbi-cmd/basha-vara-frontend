import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyCardSkeletonProps {
  variant?: 'default' | 'landlord';
}

export function PropertyCardSkeleton({ variant = 'default' }: PropertyCardSkeletonProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 bg-muted">
        <Skeleton variant="rectangular" className="w-full h-full" />
      </div>
      <CardContent className="p-4">
        <Skeleton variant="text" className="h-5 w-3/4 mb-2" />
        <Skeleton variant="text" className="h-4 w-1/2 mb-3" />
        <div className="flex items-center gap-4 mb-3">
          <Skeleton variant="text" className="h-4 w-16" />
          <Skeleton variant="text" className="h-4 w-16" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
        {variant === 'landlord' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="text" className="h-6 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton variant="rectangular" className="h-9 flex-1" />
              <Skeleton variant="rectangular" className="h-9 flex-1" />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="h-6 w-24" />
            <Skeleton variant="circular" className="h-10 w-10" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
