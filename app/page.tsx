'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, ArrowRight, Home as HomeIcon, Shield, Users, TrendingUp, Star, Building2, Heart, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProperties } from '@/features/properties/property-service';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { useFavourites } from '@/features/favourites/favourite-service';
import dynamic from 'next/dynamic';
import { usePlatform } from '@/lib/platform/platform-context';
import { RevealOnScroll } from '@/components/shared/reveal-on-scroll';
import { apiClient } from '@/lib/api-client';

const PropertyCard = dynamic(() => import('@/components/shared/property-card').then(mod => ({ default: mod.PropertyCard })), {
  loading: () => <PropertyCardSkeleton />,
});

function HomeContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { properties, fetchProperties, isLoading } = useProperties();
  const { toggleFavourite, isFavourited } = useFavourites(user?.id || '', user?.role || '');
  const { isMobile, isNative } = usePlatform();
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState<{
    totalProperties: number;
    totalLandlords: number;
    totalTenants: number;
    successRate: number | null;
  }>({
    totalProperties: 0,
    totalLandlords: 0,
    totalTenants: 0,
    successRate: null,
  });
  const [popularAreas, setPopularAreas] = useState<{ name: string; count: number }[]>([]);
  const featuredProperties = properties.slice(0, isMounted && isMobile ? 3 : 6);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchProperties({
        page: 1,
        limit: isMobile ? 3 : 6,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filters: { status: 'available' },
      });
    }
  }, [fetchProperties, isMobile, isMounted]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.public.getStats();
        setStats({
          totalProperties: data.totalProperties,
          totalLandlords: data.totalLandlords,
          totalTenants: data.totalTenants,
          successRate: data.successRate || null,
        });
      } catch {
        // Keep 0/null if API fails
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchPopularAreas = async () => {
      try {
        const data = await apiClient.public.getPopularAreas();
        setPopularAreas(data.slice(0, 4));
      } catch {
        // Keep empty if API fails
      }
    };
    fetchPopularAreas();
  }, []);

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
      <div className={`w-full max-w-full overflow-x-hidden ${isNative ? 'capacitor-native' : ''}`}>
        {/* Hero Section - Teal theme with animations */}
        <section className="relative overflow-hidden min-h-[600px] lg:min-h-[700px] flex items-center bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Animated decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating orbs */}
            <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse morph-shape" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl animate-pulse morph-shape" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse morph-shape" style={{ animationDuration: '12s', animationDelay: '4s' }} />
            <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-teal-200/10 rounded-full blur-3xl animate-pulse morph-shape" style={{ animationDuration: '9s', animationDelay: '6s' }} />

            {/* Floating particles */}
            <div className="particle" style={{ top: '20%', left: '10%', animationDelay: '0s' }} />
            <div className="particle" style={{ top: '40%', left: '30%', animationDelay: '1s' }} />
            <div className="particle" style={{ top: '60%', left: '50%', animationDelay: '2s' }} />
            <div className="particle" style={{ top: '30%', left: '70%', animationDelay: '3s' }} />
            <div className="particle" style={{ top: '70%', left: '20%', animationDelay: '4s' }} />
            <div className="particle" style={{ top: '50%', left: '80%', animationDelay: '5s' }} />
            <div className="particle" style={{ top: '80%', left: '40%', animationDelay: '6s' }} />
            <div className="particle" style={{ top: '25%', left: '60%', animationDelay: '7s' }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              {/* Content */}
              <div className="text-white">
                <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  #1 Rental Platform in Bangladesh
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white gradient-text-animated">Perfect Home</span>
                </h1>

                <p className="text-lg sm:text-xl text-teal-100 mb-8 max-w-xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  Browse thousands of verified rental properties from trusted landlords across Dhaka and beyond. Your dream home is just a search away.
                </p>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-6 mb-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-teal-200 float-icon" />
                    <span className="text-sm text-teal-100">Verified Listings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-teal-200 float-icon" style={{ animationDelay: '0.2s' }} />
                    <span className="text-sm text-teal-100">Trusted Landlords</span>
                  </div>
                  {stats.successRate !== null && (
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-teal-200 float-icon" style={{ animationDelay: '0.4s' }} />
                      <span className="text-sm text-teal-100">{stats.successRate}% Rating</span>
                    </div>
                  )}
                </div>

                {/* Search Box */}
                <Card className="max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                  <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-200" />
                          <Input
                            name="search"
                            placeholder="Search by location, area, or keywords..."
                            className="pl-12 h-12 sm:h-14 text-base bg-white/10 border-white/20 text-white placeholder:text-teal-200 focus:border-teal-300 focus:bg-white/20"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 sm:h-14 px-8 text-base font-semibold w-full sm:w-auto bg-white text-teal-700 hover:bg-teal-50 shadow-lg button-press"
                      >
                        Search
                      </Button>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-teal-100">
                      <span className="text-white font-medium">Popular:</span>
                      {popularAreas.length > 0 ? (
                        popularAreas.map((area) => (
                          <Link key={area.name} href={`/properties?area=${encodeURIComponent(area.name)}`} className="hover:text-white transition-colors font-medium">
                            {area.name}
                          </Link>
                        ))
                      ) : (
                        <span className="text-teal-200">No popular areas yet</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Modern cards */}
        <RevealOnScroll>
          <section className={`py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 ${isMounted && isMobile ? 'pt-8 pb-16' : ''}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">Why Choose Basha Vara?</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We're committed to making your rental experience seamless and secure</p>
              </div>
              <div className={`grid grid-cols-2 ${isMounted && isMobile ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-6 md:gap-8`}>
                {[
                  [stats.totalProperties > 0 ? `${stats.totalProperties}+` : '0', 'Properties Listed', Building2],
                  [stats.totalLandlords > 0 ? `${stats.totalLandlords}+` : '0', 'Verified Landlords', Shield],
                  [stats.totalTenants > 0 ? `${stats.totalTenants}+` : '0', 'Happy Tenants', Users],
                  [stats.successRate !== null ? `${stats.successRate}%` : 'No rating yet', 'Success Rate', Star],
                ].map(([value, label, Icon], i) => (
                  <div key={label} className="counter-animate text-center p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow" style={{ animationDelay: `${i * 100}ms` }}>
                    <Icon className="h-8 w-8 text-teal-500 mx-auto mb-3 float-icon" style={{ animationDelay: `${0.5 + i * 0.2}s` }} />
                    <div className="text-3xl sm:text-4xl font-extrabold gradient-text mb-2">{value}</div>
                    <div className="text-sm sm:text-base text-muted-foreground font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* Featured Properties */}
        <RevealOnScroll>
          <section className="py-16 sm:py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-10 sm:mb-12">
                <div className="min-w-0">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">Featured Properties</h2>
                  <p className="text-muted-foreground text-lg">Discover the latest listings from trusted landlords</p>
                </div>
                <Button variant="outline" size="lg" asChild className="w-full sm:w-auto shrink-0 border-2 hover:bg-teal-50 dark:hover:bg-teal-950 hover:border-teal-500">
                  <Link href="/properties">
                    Browse All Properties
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className={`grid gap-6 sm:gap-8 ${isMounted && isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} [&>*]:min-w-0`}>
                {isLoading ? (
                  Array.from({ length: isMounted && isMobile ? 3 : 6 }).map((_, i) => (
                    <Card key={i} className="h-72 sm:h-80">
                      <CardContent className="p-0">
                        <div className="h-48 sm:h-52 skeleton-shimmer" />
                        <div className="p-4 space-y-3">
                          <div className="h-5 skeleton-shimmer rounded w-3/4" />
                          <div className="h-4 skeleton-shimmer rounded w-1/2" />
                          <div className="h-4 skeleton-shimmer rounded w-1/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : featuredProperties.length > 0 ? (
                  featuredProperties.map((property, i) => (
                    <div key={property.id} className="stagger-item" style={{ animationDelay: `${i * 50}ms` }}>
                      <PropertyCard
                        property={property}
                        onToggleFavourite={isAuthenticated && user?.role === 'tenant' ? toggleFavourite : undefined}
                        isFavourited={isFavourited(property.id)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No featured properties available at the moment
                  </div>
                )}
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* How It Works - Modern step cards */}
        <RevealOnScroll>
          <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">How It Works</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Find your perfect home in 3 simple steps</p>
              </div>
              <div className={`grid gap-8 sm:gap-10 ${isMounted && isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                {[
                  { icon: Search, title: '1. Search Properties', text: 'Browse through thousands of verified rental properties using our advanced search filters' },
                  { icon: HomeIcon, title: '2. Visit & Apply', text: 'Schedule visits to properties you like and submit your rental application online' },
                  { icon: TrendingUp, title: '3. Move In', text: 'Sign the lease and move into your new home. Our platform makes it easy and secure' },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={title} className="animate-fade-in-up text-center group" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="h-20 sm:h-24 w-20 sm:w-24 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: `${i * 0.5}s` }}>
                      <Icon className="h-10 w-10 sm:h-12 sm:w-12" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">{title}</h3>
                    <p className="text-muted-foreground text-base leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* Value Propositions - Modern cards */}
        <RevealOnScroll>
          <section className="py-16 sm:py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <Card className="border-2 border-teal-100 hover:border-teal-300 transition-colors spotlight-card">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Shield className="h-12 w-12 sm:h-14 sm:w-14 text-teal-500 mx-auto mb-4 sm:mb-6" />
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">Verified Listings</h3>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                      All properties are verified by our team to ensure accuracy and build trust
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-teal-100 hover:border-teal-300 transition-colors spotlight-card">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Users className="h-12 w-12 sm:h-14 sm:w-14 text-teal-500 mx-auto mb-4 sm:mb-6" />
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">Direct Communication</h3>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                      Connect directly with landlords without any middlemen or hidden fees
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-teal-100 hover:border-teal-300 transition-colors spotlight-card">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <MapPin className="h-12 w-12 sm:h-14 sm:w-14 text-teal-500 mx-auto mb-4 sm:mb-6" />
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">Local Expertise</h3>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                      Designed specifically for the Bangladesh rental market with local insights
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* CTA Section - Modern gradient */}
        <RevealOnScroll>
          <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-r from-teal-600 to-teal-700">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center text-white">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6">
                  Ready to Find Your Perfect Home?
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-white/95 mb-8 sm:mb-10 leading-relaxed">
                  Join thousands of happy tenants who found their rental home through Basha Vara
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto text-base font-semibold h-14 px-8 button-press bg-white text-teal-700 hover:bg-slate-100">
                    <Link href="/properties">Browse Properties</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white/10 h-14 px-8 text-base font-semibold button-press" asChild>
                    <Link href="/register?role=landlord">List Your Property</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </RevealOnScroll>
      </div>
    </PageLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
