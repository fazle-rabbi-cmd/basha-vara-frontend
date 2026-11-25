'use client';

import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  Shield,
  Building2,
  KeyRound,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProperties } from '@/features/properties/property-service';
import { PropertyCardSkeleton } from '@/components/shared/property-card-skeleton';
import { useEffect, useState, Suspense, useRef } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { useFavourites } from '@/features/favourites/favourite-service';
import dynamic from 'next/dynamic';
import { usePlatform } from '@/lib/platform/platform-context';
import { apiClient } from '@/lib/api-client';
import { HeroSection } from '@/components/features/hero/hero-section';

const PropertyCard = dynamic(
  () => import('@/components/shared/property-card').then((mod) => ({ default: mod.PropertyCard })),
  {
    loading: () => <PropertyCardSkeleton />,
  }
);

function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    const timer = setTimeout(() => {
      const controls = animate(mv, value, {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
        onComplete: () => setHasAnimated(true),
      });
      return controls;
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay, mv, hasAnimated]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function HomeContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { properties, fetchProperties, isLoading: isPropertiesLoading } = useProperties();
  const { toggleFavourite, isFavourited } = useFavourites(user?.id || '', user?.role || '');
  const { isMobile, isNative, triggerHaptic } = usePlatform();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStatsLoading, setIsStatsLoading] = useState(true);

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
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onAreaClick={handleAreaClick}
          featuredListings={featuredProperties.slice(0, 3).map((p) => ({
            id: p.id,
            title: p.title,
            area: p.area || p.city,
            priceBdt: Number(p.rent) || 0,
            beds: p.bedrooms,
            imageUrl: p.photos?.[0]?.url,
            href: `/properties/${p.id}`,
          }))}
        />

        {/* METRICS & PLATFORM STATS STRIP (100% Dynamic from live DB) */}
        <section className="border-b border-border/70 bg-card py-6 sm:py-8 shadow-xs">
          <div className="container mx-auto px-4">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              {[
                { label: 'Properties Listed', value: stats.totalProperties, loading: isStatsLoading },
                { label: 'Registered Landlords', value: stats.totalLandlords, loading: isStatsLoading },
                { label: 'Active Tenants', value: stats.totalTenants, loading: isStatsLoading },
                { label: 'Available for Move-in', value: properties.length, loading: isPropertiesLoading },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="p-3 sm:p-4 rounded-xl"
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {stat.loading ? (
                    <Skeleton className="h-8 w-20 mx-auto rounded-lg mb-1" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
                      <CountUp value={stat.value} delay={i * 100} />
                    </div>
                  )}
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
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
            <motion.div
              className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Safe & Regulated Renting
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2 mb-3">
                Built For Complete Peace of Mind
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Traditional renting in Dhaka is fraught with fake brokers and deposit disputes. Basha Vara establishes a trusted, transparent ecosystem.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.15 } },
              }}
            >
              {[
                {
                  icon: Shield,
                  title: 'Police & NID Verification',
                  desc: 'Compliant with Bangladesh police tenant verification guidelines. Both landlords and tenants verify identities safely.',
                },
                {
                  icon: KeyRound,
                  title: 'Token-Hold Protection',
                  desc: 'Hold rental advance payments securely until physical visit completion and OTP verification. Zero fraud risks.',
                },
                {
                  icon: FileCheck2,
                  title: 'Digital Lease & Rent Ledger',
                  desc: 'Generate legally sound digital lease agreements with digital signatures, rent receipts, and automated payment records.',
                },
              ].map((pillar) => (
                <motion.div
                  key={pillar.title}
                  variants={{
                    hidden: { opacity: 0, y: 40, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6 sm:p-8">
                        <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5">
                          <pillar.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">{pillar.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-14 sm:py-20 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white relative overflow-hidden">
          {/* Animated orbs */}
          <motion.div
            className="absolute -top-20 -right-20 w-64 h-64 bg-teal-400/10 rounded-full blur-[60px]"
            animate={{
              x: [0, -20, 0],
              y: [0, 15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-[60px]"
            animate={{
              x: [0, 20, 0],
              y: [0, -15, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="max-w-2xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Are You a Property Owner?
              </h2>
              <p className="text-sm sm:text-base text-teal-100/90 mb-8 leading-relaxed">
                List your vacant apartments on Basha Vara for free. Receive pre-screened visit requests, manage rent ledgers, and secure reliable tenants.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-7 bg-white text-teal-800 hover:bg-slate-100 font-bold rounded-xl shadow-lg"
                    asChild
                  >
                    <Link href="/register?role=landlord">List Your Property Free</Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-7 border-white/30 text-white hover:bg-white/10 font-bold rounded-xl"
                    asChild
                  >
                    <Link href="/properties">Browse Rentals as Tenant</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
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
