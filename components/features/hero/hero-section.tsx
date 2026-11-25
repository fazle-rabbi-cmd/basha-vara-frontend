'use client';

import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MapPin,
  CheckCircle2,
  Building2,
  Users,
  KeyRound,
  Shield,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/lib/platform/platform-context';
import { apiClient } from '@/lib/api-client';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onAreaClick: (areaName: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, y: -15, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const searchVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] as const },
  },
};

const floatVariants = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 1, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const floatDelayedVariants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, -1, 0],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: 'easeInOut',
      delay: 2,
    },
  },
};

const orbVariants = {
  animate: {
    x: [0, 30, -20, 0],
    y: [0, -20, 15, 0],
    scale: [1, 1.05, 0.95, 1],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const orbReverseVariants = {
  animate: {
    x: [0, -25, 20, 0],
    y: [0, 15, -25, 0],
    scale: [1, 0.95, 1.05, 1],
    transition: {
      duration: 25,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const glowVariants = {
  animate: {
    opacity: [0.4, 0.7, 0.4],
    scale: [1, 1.1, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const shimmerVariants = {
  animate: {
    backgroundPosition: ['-200% center', '200% center'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

const gridVariants = {
  animate: {
    backgroundPosition: ['0px 0px', '64px 64px'],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

function FloatingCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={delay > 0 ? floatDelayedVariants : floatVariants}
      animate="animate"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay, duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}

function ParallaxOrb({
  className = '',
  variants: orbVars,
  depth = 0.3,
}: {
  className?: string;
  variants: typeof orbVariants | typeof orbReverseVariants;
  depth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 50, damping: 20 });
  const springY = useSpring(y, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      x.set(dx * 40 * depth);
      y.set(dy * 30 * depth);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [depth, x, y]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      variants={orbVars}
      animate="animate"
    />
  );
}

export function HeroSection({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onAreaClick,
}: HeroSectionProps) {
  const router = useRouter();
  const { isMobile, triggerHaptic } = usePlatform();
  const [isAreasLoading, setIsAreasLoading] = useState(true);
  const [popularAreas, setPopularAreas] = useState<{ name: string; count: number }[]>([]);
  const heroRef = useRef<HTMLElement>(null);

  // Scroll-linked parallax for hero content
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

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

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-gradient-to-b from-teal-950 via-teal-900 to-slate-900 text-white pt-8 pb-16 sm:pt-14 sm:pb-24"
    >
      {/* Animated gradient orbs with parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ParallaxOrb
          className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-[100px]"
          variants={orbVariants}
          depth={0.3}
        />
        <ParallaxOrb
          className="absolute top-1/3 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px]"
          variants={orbReverseVariants}
          depth={0.5}
        />
        <ParallaxOrb
          className="absolute bottom-0 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px]"
          variants={orbVariants}
          depth={0.2}
        />
      </div>

      {/* Animated grid pattern */}
      <motion.div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
        variants={gridVariants}
        animate="animate"
      />

      {/* Ambient glow */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none"
        variants={glowVariants}
        animate="animate"
      />

      {/* Floating property card mockups (desktop only) */}
      {!isMobile && (
        <>
          <motion.div
            className="hidden lg:block absolute left-[8%] top-[30%]"
            style={{ x: useTransform(scrollYProgress, [0, 1], [0, -40]), y: useTransform(scrollYProgress, [0, 1], [0, -20]) }}
          >
            <FloatingCard>
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
            </FloatingCard>
          </motion.div>

          <motion.div
            className="hidden lg:block absolute right-[8%] top-[25%]"
            style={{ x: useTransform(scrollYProgress, [0, 1], [0, -60]), y: useTransform(scrollYProgress, [0, 1], [0, -30]) }}
          >
            <FloatingCard delay={2.5}>
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
            </FloatingCard>
          </motion.div>

          <motion.div
            className="hidden lg:block absolute left-[15%] bottom-[20%]"
            style={{ x: useTransform(scrollYProgress, [0, 1], [0, -30]), y: useTransform(scrollYProgress, [0, 1], [0, -15]) }}
          >
            <FloatingCard delay={2.5}>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-400/30 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/90">Verified Tenant</div>
                  <div className="text-[10px] text-teal-300/70">NID Verified ✓</div>
                </div>
              </div>
            </FloatingCard>
          </motion.div>

          <motion.div
            className="hidden lg:block absolute right-[12%] bottom-[25%]"
            style={{ x: useTransform(scrollYProgress, [0, 1], [0, -50]), y: useTransform(scrollYProgress, [0, 1], [0, -25]) }}
          >
            <FloatingCard>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-amber-400/30 flex items-center justify-center">
                  <KeyRound className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/90">Token Held</div>
                  <div className="text-[10px] text-teal-300/70">৳5,000 secured</div>
                </div>
              </div>
            </FloatingCard>
          </motion.div>
        </>
      )}

      {/* Main content with scroll parallax */}
      <motion.div
        className="container mx-auto px-4 relative z-10"
        style={{ y: heroY, opacity: heroOpacity, scale: contentScale }}
      >
        <motion.div
          className="max-w-3xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Trust Badge */}
          <motion.div variants={badgeVariants}>
            <div className="inline-flex items-center gap-2 bg-teal-800/60 border border-teal-500/30 text-teal-200 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md shadow-inner">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              Verified Rentals & Direct Landlords in Bangladesh
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-4 sm:mb-6"
            variants={itemVariants}
          >
            Rent Your Dream Home{' '}
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-300"
              variants={shimmerVariants}
              animate="animate"
              style={{ backgroundSize: '200% auto' }}
            >
              Without Middlemen
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-sm sm:text-lg text-teal-100/80 mb-8 max-w-xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Connect directly with verified property owners across Dhaka. Transparent deposits, digital contracts, and zero hidden broker fees.
          </motion.p>

          {/* Search Card */}
          <motion.div variants={searchVariants}>
            <div className="rounded-2xl sm:rounded-3xl bg-background/95 dark:bg-slate-900/90 border border-white/20 p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl text-foreground text-left">
              <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1 flex items-center">
                  <MapPin className="absolute left-3.5 h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Enter location, area (e.g. Dhanmondi, Gulshan)..."
                    className="pl-11 h-12 sm:h-13 text-sm sm:text-base border-none bg-muted/40 focus-visible:ring-0 rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 sm:h-13 px-7 text-sm sm:text-base font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl shadow-lg shrink-0"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Homes
                </Button>
              </form>

              {/* Popular Area Chips */}
              {isAreasLoading ? (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="font-semibold text-teal-200 text-xs shrink-0 pl-1">Popular Areas:</span>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full shrink-0" />
                  ))}
                </div>
              ) : popularAreas.length > 0 ? (
                <motion.div
                  className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.8 } },
                  }}
                >
                  <span className="font-semibold text-teal-200 shrink-0 pl-1">Popular Areas:</span>
                  {popularAreas.map((area) => (
                    <motion.button
                      key={area.name}
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        onAreaClick(area.name);
                      }}
                      className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white font-medium border border-white/20"
                      variants={{
                        hidden: { opacity: 0, scale: 0.8 },
                        visible: { opacity: 1, scale: 1 },
                      }}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.25)' }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      {area.name} ({area.count})
                    </motion.button>
                  ))}
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
