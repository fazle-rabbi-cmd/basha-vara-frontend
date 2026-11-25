'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { RevealOnScroll } from '@/components/shared/reveal-on-scroll';
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

  // Mouse parallax for hero floating elements
  useEffect(() => {
    if (!isMounted || isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const layers = document.querySelectorAll('.parallax-layer');
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      layers.forEach((layer) => {
        const speed = parseFloat(layer.getAttribute('data-parallax') || '0.3');
        const x = dx * 30 * speed;
        const y = dy * 20 * speed;
        (layer as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMounted, isMobile]);

  // Stats count-up animation
  useEffect(() => {
    if (isStatsLoading) return;

    const counters = document.querySelectorAll('[data-count]');
    counters.forEach((el) => {
      const target = parseInt(el.getAttribute('data-count') || '0', 10);
      const duration = 1200;
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        el.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
  }, [isStatsLoading]);

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
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-[100px] animate-orb-drift" />
            <div className="absolute top-1/3 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] animate-orb-drift-reverse" />
            <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px] animate-orb-drift" />
          </div>

          {/* Animated grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none animate-grid-move"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: '64px 64px',
            }}
          />

          {/* Ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" />

          {/* Floating property card mockups (desktop only) */}
          <div className="hidden lg:block absolute left-[8%] top-[30%] parallax-layer" data-parallax="0.3">
            <div className="animate-card-float">
              <Card className="w-56 bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardContent className="p-4">
                  <div className="h-24 bg-gradient-to-br from-teal-400/30 to-emerald-500/20 rounded-lg mb-3 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-teal-300/60" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/20 rounded w-3/4" />
                    <div className="h-2.5 bg-white/15 rounded w-1/2" />
                    <div className="flex gap-2 mt-2">
                      <div className="h-5 bg-teal-400/30 rounded-full w-16" />
                      <div className="h-5 bg-emerald-400/20 rounded-full w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="hidden lg:block absolute right-[8%] top-[25%] parallax-layer" data-parallax="0.5">
            <div className="animate-card-float-delayed">
              <Card className="w-52 bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-teal-400/30 flex items-center justify-center">
                      <Users className="h-5 w-5 text-teal-300" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-white/25 rounded w-20" />
                      <div className="h-2 bg-white/15 rounded w-14" />
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded w-full mb-1.5" />
                  <div className="h-2 bg-white/10 rounded w-2/3" />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="hidden lg:block absolute left-[15%] bottom-[20%] parallax-layer" data-parallax="0.2">
            <div className="animate-card-float-delayed">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-400/30 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/90">Verified Tenant</div>
                  <div className="text-[10px] text-teal-300/70">NID Verified ✓</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block absolute right-[12%] bottom-[25%] parallax-layer" data-parallax="0.4">
            <div className="animate-card-float">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-amber-400/30 flex items-center justify-center">
                  <KeyRound className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/90">Token Held</div>
                  <div className="text-[10px] text-teal-300/70">৳5,000 secured</div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Trust Badge */}
              <div className="hero-badge inline-flex items-center gap-2 bg-teal-800/60 border border-teal-500/30 text-teal-200 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md shadow-inner">
                <CheckCircle2 className="h-4 w-4 text-teal-400" />
                Verified Rentals & Direct Landlords in Bangladesh
              </div>

              {/* Main Headline */}
              <h1 className="hero-title text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-4 sm:mb-6">
                <span className="hero-word" style={{ animationDelay: '0.3s' }}>Rent</span>{' '}
                <span className="hero-word" style={{ animationDelay: '0.4s' }}>Your</span>{' '}
                <span className="hero-word" style={{ animationDelay: '0.5s' }}>Dream</span>{' '}
                <span className="hero-word" style={{ animationDelay: '0.6s' }}>Home</span>
                <br className="hidden sm:block" />{' '}
                <span
                  className="hero-word text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-300 animate-shimmer-text"
                  style={{ animationDelay: '0.8s' }}
                >
                  Without Middlemen
                </span>
              </h1>

              <p className="hero-subtitle text-sm sm:text-lg text-teal-100/80 mb-8 max-w-xl mx-auto leading-relaxed">
                Connect directly with verified property owners across Dhaka. Transparent deposits, digital contracts, and zero hidden broker fees.
              </p>

              {/* Dynamic Search Card */}
              <div className="hero-search rounded-2xl sm:rounded-3xl bg-background/95 dark:bg-slate-900/90 border border-white/20 p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl text-foreground text-left">
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
                    className="h-12 sm:h-13 px-7 text-sm sm:text-base font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl shadow-lg shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Homes
                  </Button>
                </form>

                {/* Dynamic Popular Area Quick Chips */}
                {isAreasLoading ? (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span className="font-semibold text-teal-200 text-xs shrink-0 pl-1">Popular Areas:</span>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-6 w-20 rounded-full shrink-0" />
                    ))}
                  </div>
                ) : popularAreas.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
                    <span className="font-semibold text-teal-200 shrink-0 pl-1">Popular Areas:</span>
                    {popularAreas.map((area, i) => (
                      <button
                        key={area.name}
                        type="button"
                        onClick={() => handleAreaClick(area.name)}
                        className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white font-medium transition-all hover:scale-105 border border-white/20"
                        style={{ animationDelay: `${0.8 + i * 0.05}s` }}
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
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 animate-stat-pop" data-count={stats.totalProperties}>
                    {stats.totalProperties}
                  </div>
                )}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Properties Listed</div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl">
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto rounded-lg mb-1" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 animate-stat-pop" data-count={stats.totalLandlords} style={{ animationDelay: '0.1s' }}>
                    {stats.totalLandlords}
                  </div>
                )}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Registered Landlords</div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl">
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto rounded-lg mb-1" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 animate-stat-pop" data-count={stats.totalTenants} style={{ animationDelay: '0.2s' }}>
                    {stats.totalTenants}
                  </div>
                )}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Active Tenants</div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl">
                {isPropertiesLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto rounded-lg mb-1" />
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 animate-stat-pop" data-count={properties.length} style={{ animationDelay: '0.3s' }}>
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

        {/* TRUST & SECURITY PILLARS */}
        <section className="py-14 sm:py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <RevealOnScroll>
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
            </RevealOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <RevealOnScroll>
                <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
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
              </RevealOnScroll>

              <RevealOnScroll className="md:delay-100">
                <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
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
              </RevealOnScroll>

              <RevealOnScroll className="md:delay-200">
                <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
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
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-14 sm:py-20 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white relative overflow-hidden">
          {/* Subtle animated orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-400/10 rounded-full blur-[60px] animate-orb-drift" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-[60px] animate-orb-drift-reverse" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <RevealOnScroll>
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
                    className="w-full sm:w-auto h-12 px-7 bg-white text-teal-800 hover:bg-slate-100 font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    asChild
                  >
                    <Link href="/register?role=landlord">List Your Property Free</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-7 border-white/30 text-white hover:bg-white/10 font-bold rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    asChild
                  >
                    <Link href="/properties">Browse Rentals as Tenant</Link>
                  </Button>
                </div>
              </div>
            </RevealOnScroll>
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
