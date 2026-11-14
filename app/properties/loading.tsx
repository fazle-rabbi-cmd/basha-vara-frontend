import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';

export default function PropertiesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-3">
        <div className="skeleton-shimmer h-8 w-56 rounded-md" />
        <div className="skeleton-shimmer h-4 w-80 max-w-full rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
