'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MapPin,
  ArrowRight,
  Shield,
  Users,
  Building2,
  CheckCircle2,
  KeyRound,
  FileCheck2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProperties } from '@/features/properties/property-service';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { useFavourites } from '@/features/favourites/favourite-service';
import dynamic from 'next/dynamic';
import { usePlatform } from '@/lib/platform/platform-context';
import { apiClient } from '@/lib/api-client';

const PropertyCard = dynamic(
  () => import('@/components/shared/property-card').then((mod) => ({ default: mod.PropertyCard })),
  {
    loading: () => <PropertyCardSkeleton />,
  }
);

function HomeContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { properties, fetchProperties, isLoading: isPropertiesLoading } = useProperties();
  const { toggleFavourite, isFavourited } = useFavourites(user?.id || '', user?.role || '');
  const { isMobile, isNative, triggerHaptic } = usePlatform();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isAreasLoading, setIsAreasLoading] = useState(true);

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

  const featuredProperties = properties.slice(0, isMounted && isMobile ? 4 : 6);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchProperties({
        page: 1,
        limit: isMobile ? 4 : 6,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filters: { status: 'available' },
      });
    }
  }, [fetchProperties, isMobile, isMounted]);

  useEffect(() => {
    let active = true;
    setIsStatsLoading(true);
    apiClient.public
      .getStats()
      .then((data) => {
        if (!active) return;
        setStats({
          totalProperties: Number(data.totalProperties ?? 0),
          totalLandlords: Number(data.totalLandlords ?? 0),
          totalTenants: Number(data.totalTenants ?? 0),
          successRate: data.successRate ?? null,
        });
      })
      .catch(() => {
        if (!active) return;
        setStats({
          totalProperties: 0,
          totalLandlords: 0,
          totalTenants: 0,
          successRate: null,
        });
      })
      .finally(() => {
        if (active) setIsStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsAreasLoading(true);
    apiClient.public
      .getPopularAreas()
      .then((data) => {
        if (!active) return;
        setPopularAreas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setPopularAreas([]);
      })
      .finally(() => {
        if (active) setIsAreasLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    triggerHaptic();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    router.push(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleAreaClick = (areaName: string) => {
    triggerHaptic();
    router.push(`/properties?area=${encodeURIComponent(areaName)}`);
  };

  return (
    <PageLayout>
      <div className={`w-full max-w-full overflow-x-hidden ${isNative ? 'capacitor-native' : ''}`}>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-950 via-teal-900 to-slate-900 text-white pt-8 pb-16 sm:pt-14 sm:pb-24">
          {/* Subtle architectural grid pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-teal-800/60 border border-teal-500/30 text-teal-200 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md shadow-inner">
                <CheckCircle2 className="h-4 w-4 text-teal-400" />
                Verified Rentals & Direct Landlords in Bangladesh
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-4 sm:mb-6">
                Rent Your Dream Home{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-300">
                  Without Middlemen
                </span>
              </h1>

              <p className="text-sm sm:text-lg text-teal-100/80 mb-8 max-w-xl mx-auto leading-relaxed">
                Connect directly with verified property owners across Dhaka. Transparent deposits, digital contracts, and zero hidden broker fees.
              </p>

              {/* Dynamic Search Card */}
              <div className="rounded-2xl sm:rounded-3xl bg-background/95 dark:bg-slate-900/90 border border-white/20 p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl text-foreground text-left">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1 flex items-center">
                    <MapPin className="absolute left-3.5 h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 pointer-events-none" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter location, area (e.g. Dhanmondi, Gulshan)..."
                      className="pl-11 h-12 sm:h-13 text-sm sm:text-base border-none bg-muted/40 focus-visible:ring-0 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 sm:h-13 px-7 text-sm sm:text-base font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl shadow-lg shrink-0"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Homes
                  </Button>
                </form>

                {/* Dynamic Popular Area Quick Chips */}
                {isAreasLoading ? (
                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="font-semibold text-muted-foreground text-xs shrink-0 pl-1">Popular Areas:</span>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-6 w-20 rounded-full shrink-0" />
                    ))}
                  </div>
                ) : popularAreas.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
                    <span className="font-semibold text-muted-foreground shrink-0 pl-1">Popular Areas:</span>
                    {popularAreas.map((area) => (
                      <button
                        key={area.name}
                        type="button"
                        onClick={() => handleAreaClick(area.name)}
                        className="shrink-0 px-2.5 py-1 rounded-full bg-muted/60 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950 dark:hover:text-teal-300 font-medium text-foreground transition-colors"
                      >
                        {area.name} ({area.count})
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* METRICS & PLATFORM STATS STRIP (100% Dynamic from live DB) */}
        <section className="border-b border-border/70 bg-card py-6 sm:py-8 shadow-xs">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div className="p-3 sm:p-4 rounded-xl">
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto rounded-lg mb-1" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                    {stats.totalProperties}
                  </div>
                )}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Properties Listed</div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl">
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto rounded-lg mb-1" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                    {stats.totalLandlords}
                  </div>
                )}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Registered Landlords</div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl">
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto rounded-lg mb-1" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                    {stats.totalTenants}
                  </div>
                )}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Active Tenants</div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl">
                {isPropertiesLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto rounded-lg mb-1" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                    {properties.length}
                  </div>
                )}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Available for Move-in</div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PROPERTIES FEED (100% Dynamic from live DB) */}
        <section className="py-12 sm:py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live Available Listings
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Featured Available Homes
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Verified rental homes available across Bangladesh
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="self-start sm:self-auto rounded-xl border-border/80 font-semibold"
              >
                <Link href="/properties">
                  Explore All Properties
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {isPropertiesLoading ? (
                Array.from({ length: isMounted && isMobile ? 4 : 6 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
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
                <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border/80">
                  <Building2 className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-base font-semibold text-foreground">No available properties right now</p>
                  <p className="text-xs text-muted-foreground mt-1">Check back soon or be the first to list a new home!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DYNAMIC POPULAR AREAS SHOWCASE (Only shown if popular areas exist in DB) */}
        {(isAreasLoading || popularAreas.length > 0) && (
          <section className="py-12 sm:py-16 bg-card border-y border-border/70">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
                  Explore by Area
                </h2>
                <p className="text-sm text-muted-foreground">
                  Browse rental properties grouped by active neighborhoods
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {isAreasLoading
                  ? [1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))
                  : popularAreas.map((area) => (
                      <button
                        key={area.name}
                        type="button"
                        onClick={() => handleAreaClick(area.name)}
                        className="group relative p-4 rounded-2xl border border-border/70 bg-background/60 hover:bg-muted/40 hover:border-teal-500/50 hover:shadow-md transition-all text-left active:scale-[0.98]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">
                            {area.count} {area.count === 1 ? 'Listing' : 'Listings'}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="text-base font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {area.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">Explore Homes</div>
                      </button>
                    ))}
              </div>
            </div>
          </section>
        )}

        {/* TRUST & SECURITY PILLARS */}
        <section className="py-14 sm:py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Safe & Regulated Renting
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2 mb-3">
                Built For Complete Peace of Mind
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Traditional renting in Dhaka is fraught with fake brokers and deposit disputes. Basha Vara establishes a trusted, transparent ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 sm:p-8">
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Police & NID Verification</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Compliant with Bangladesh police tenant verification guidelines. Both landlords and tenants verify identities safely.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 sm:p-8">
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Token-Hold Protection</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Hold rental advance payments securely until physical visit completion and OTP verification. Zero fraud risks.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 sm:p-8">
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5">
                    <FileCheck2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Digital Lease & Rent Ledger</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Generate legally sound digital lease agreements with digital signatures, rent receipts, and automated payment records.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-14 sm:py-20 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Are You a Property Owner?
              </h2>
              <p className="text-sm sm:text-base text-teal-100/90 mb-8 leading-relaxed">
                List your vacant apartments on Basha Vara for free. Receive pre-screened visit requests, manage rent ledgers, and secure reliable tenants.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 bg-white text-teal-800 hover:bg-slate-100 font-bold rounded-xl shadow-lg"
                  asChild
                >
                  <Link href="/register?role=landlord">List Your Property Free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-7 border-white/30 text-white hover:bg-white/10 font-bold rounded-xl"
                  asChild
                >
                  <Link href="/properties">Browse Rentals as Tenant</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}
