import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function PropertyDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton variant="rectangular" className="aspect-[16/9] w-full rounded-xl" />
          <Card>
            <CardContent className="space-y-4 p-6">
              <Skeleton variant="text" className="h-7 w-2/3" />
              <Skeleton variant="text" className="h-4 w-1/2" />
              <Skeleton variant="text" className="h-4 w-1/3" />
              <div className="grid grid-cols-3 gap-4 pt-4">
                <Skeleton variant="rectangular" className="h-16" />
                <Skeleton variant="rectangular" className="h-16" />
                <Skeleton variant="rectangular" className="h-16" />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardContent className="space-y-4 p-6">
            <Skeleton variant="text" className="h-6 w-1/2" />
            <Skeleton variant="rectangular" className="h-11 w-full" />
            <Skeleton variant="rectangular" className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
