'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, ArrowRight, Home as HomeIcon, Shield, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProperties } from '@/features/properties/property-service';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { useFavourites } from '@/features/favourites/favourite-service';
import dynamic from 'next/dynamic';

const PropertyCard = dynamic(() => import('@/components/shared/property-card').then(mod => ({ default: mod.PropertyCard })), {
  loading: () => <PropertyCardSkeleton />,
});

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { properties, fetchProperties, isLoading } = useProperties();
  const { toggleFavourite, isFavourited } = useFavourites(user?.id || '', user?.role || '');
  const featuredProperties = properties.slice(0, 6);

  useEffect(() => {
    fetchProperties({
      page: 1,
      limit: 6,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filters: { status: 'available' },
    });
  }, [fetchProperties]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get('search') as string;

    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);

    router.push(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <PageLayout>
      {/* Overflow guard: kono child boro hole-o page horizontally shore jabe na */}
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-14 sm:py-20 md:py-32">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMiAwIDQgMiA0IDJzMiAyIDIgMi0yIDItNCAyLTR6bTYgMGMwLTItMi00LTItNHMtMi0yLTQtMmMyIDAgNCAyIDQgMnMyIDIgMiAyLTIgMi00IDItNHptLTEyIDBjMC0yLTItNC0yLTRzLTItMi00LTJjMiAwIDQgMiA0IDJzMiAyIDIgMi0yIDItNCAyLTR6bTYgMGMwLTItMi00LTItNHMtMi0yLTQtMmMyIDAgNCAyIDQgMnMyIDIgMiAyLTIgMi00IDItNHptLTIgNjBjMC0yLTItNC0yLTRzLTItMi00LTJjMiAwIDQgMiA0IDJzMiAyIDIgMi0yIDItNCAyLTR6bTYgMGMwLTItMi00LTItNHMtMi0yLTQtMmMyIDAgNCAyIDQgMnMyIDIgMiAyLTIgMi00IDItNHptLTEyIDBjMC0yLTItNC0yLTRzLTItMi00LTJjMiAwIDQgMiA0IDJzMiAyIDIgMi0yIDItNCAyLTR6bTYgMGMwLTItMi00LTItNHMtMi0yLTQtMmMyIDAgNCAyIDQgMnMyIDIgMiAyLTIgMi00IDItNHoiLz48L2c+PC9zdmc+')] opacity-20" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center text-white mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight break-words">
                Find Your Perfect Rental Home in Bangladesh
              </h1>
              <p className="text-base sm:text-xl md:text-2xl text-white/90 mb-4 sm:mb-8">
                Browse thousands of verified properties from trusted landlords across Dhaka and beyond
              </p>
            </div>

            {/* Simple Search Box */}
            <Card className="max-w-3xl mx-auto w-full shadow-2xl">
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        name="search"
                        placeholder="Search by location, area, or keywords..."
                        className="pl-12 h-12 text-base w-full"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="h-12 px-8 text-base w-full md:w-auto">
                    Search Properties
                  </Button>
                </form>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">Popular:</span>
                  <Link href="/properties?area=Dhanmondi" className="hover:text-primary transition-colors">Dhanmondi</Link>
                  <Link href="/properties?area=Gulshan" className="hover:text-primary transition-colors">Gulshan</Link>
                  <Link href="/properties?area=Banani" className="hover:text-primary transition-colors">Banani</Link>
                  <Link href="/properties?area=Uttara" className="hover:text-primary transition-colors">Uttara</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-10 sm:py-12 bg-background border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">5000+</div>
                <div className="text-sm text-muted-foreground">Properties Listed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">2000+</div>
                <div className="text-sm text-muted-foreground">Verified Landlords</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-sm text-muted-foreground">Happy Tenants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">98%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8">
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Featured Properties</h2>
                <p className="text-muted-foreground">Fresh listings from trusted landlords</p>
              </div>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto shrink-0">
                <Link href="/properties">
                  Browse All Properties
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*]:min-w-0">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="h-80">
                    <CardContent className="p-0">
                      <div className="h-48 bg-muted animate-pulse" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                        <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : featuredProperties.length > 0 ? (
                featuredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onToggleFavourite={isAuthenticated && user?.role === 'tenant' ? toggleFavourite : undefined}
                    isFavourited={isFavourited(property.id)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No featured properties available at the moment
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-muted-foreground text-base sm:text-lg">Find your perfect home in 3 simple steps</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">1. Search Properties</h3>
                <p className="text-muted-foreground">
                  Browse through thousands of verified rental properties using our advanced search filters
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <HomeIcon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">2. Visit & Apply</h3>
                <p className="text-muted-foreground">
                  Schedule visits to properties you like and submit your rental application online
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">3. Move In</h3>
                <p className="text-muted-foreground">
                  Sign the lease and move into your new home. Our platform makes it easy and secure
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Propositions */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Verified Listings</h3>
                  <p className="text-muted-foreground">
                    All properties are verified by our team to ensure accuracy and build trust
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Direct Communication</h3>
                  <p className="text-muted-foreground">
                    Connect directly with landlords without any middlemen or hidden fees
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Local Expertise</h3>
                  <p className="text-muted-foreground">
                    Designed specifically for the Bangladesh rental market with local insights
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-primary to-primary/90">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Ready to Find Your Perfect Home?
              </h2>
              <p className="text-base sm:text-xl text-white/90 mb-8">
                Join thousands of happy tenants who found their rental home through Basha Vara
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                  <Link href="/properties">Browse Properties</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white/10" asChild>
                  <Link href="/register?role=landlord">List Your Property</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}