'use client';

import {
  animate,
  motion,
  MotionConfig,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  Building2,
  CheckCircle2,
  FileSignature,
  KeyRound,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatform } from '@/lib/platform/platform-context';
import { apiClient } from '@/lib/api-client';

/* ────────────────────────────────────────────────────────────────────────────
 * Types & constants
 * ──────────────────────────────────────────────────────────────────────────── */

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onAreaClick: (areaName: string) => void;
}

interface PopularArea {
  name: string;
  count: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const HEADLINE = ['Rent', 'your', 'dream', 'home', 'without', 'middlemen'];
const GRADIENT_FROM_INDEX = 4; // "without middlemen" gets the gradient

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'NID-verified owners' },
  { icon: KeyRound, label: 'Deposit held safely' },
  { icon: FileSignature, label: 'Digital contracts' },
];

/* Keyframes live here so the file stays self-contained (no tailwind.config edits). */
const HERO_CSS = `
@keyframes hx-rise{from{transform:scale3d(1,1,.001)}to{transform:scale3d(1,1,1)}}
@keyframes hx-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes hx-spin{to{rotate:360deg}}
@keyframes hx-drift{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(48px,-36px,0)}}
@keyframes hx-pulse{0%{transform:scale(.4);opacity:.9}100%{transform:scale(2.4);opacity:0}}
@keyframes hx-glint{0%,100%{opacity:.55}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.hx-anim{animation:none!important}}
`;

/* ────────────────────────────────────────────────────────────────────────────
 * Data
 * ──────────────────────────────────────────────────────────────────────────── */

function usePopularAreas() {
  const [areas, setAreas] = useState<PopularArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient.public
      .getPopularAreas()
      .then((data) => active && setAreas(Array.isArray(data) ? data : []))
      .catch(() => active && setAreas([]))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { areas, isLoading };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Small interactive pieces
 * ──────────────────────────────────────────────────────────────────────────── */

/** Counts up once when scrolled into view. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    if (reduce) {
      el.textContent = to.toLocaleString('en-US');
      return;
    }
    const controls = animate(0, to, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString('en-US');
      },
    });
    return () => controls.stop();
  }, [inView, to, reduce]);

  return <span ref={ref}>0</span>;
}

/** Button that leans toward the cursor. */
function Magnetic({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 18 });
  const sy = useSpring(y, { stiffness: 300, damping: 18 });

  return (
    <motion.div
      style={{ x: sx, y: sy }}
      className="shrink-0"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.22);
        y.set((e.clientY - r.top - r.height / 2) * 0.3);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** A UI card that floats at its own depth, so it parallaxes against the 3D city. */
function Floating({
  mx,
  my,
  depth,
  delay,
  className,
  children,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  delay: number;
  className: string;
  children: ReactNode;
}) {
  const x = useTransform(mx, [-1, 1], [-26 * depth, 26 * depth]);
  const y = useTransform(my, [-1, 1], [-18 * depth, 18 * depth]);

  return (
    <motion.div
      style={{ x, y }}
      className={`absolute z-20 hidden sm:block ${className}`}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: EASE }}
    >
      <div
        className="hx-anim"
        style={{ animation: `hx-float ${5 + depth * 2}s ease-in-out ${delay}s infinite` }}
      >
        {children}
      </div>
    </motion.div>
  );
}

const glass =
  'rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl';

/* ────────────────────────────────────────────────────────────────────────────
 * 3D city (pure CSS 3D, no WebGL, no extra dependency)
 * ──────────────────────────────────────────────────────────────────────────── */

interface BoxProps {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  delay: number;
  top: string;
  south: string;
  east: string;
  dark: string;
  windowColor: string;
  beacon?: boolean;
}

function Box({ x, y, w, d, h, delay, top, south, east, dark, windowColor, beacon }: BoxProps) {
  const face: CSSProperties = { position: 'absolute', backfaceVisibility: 'hidden' };

  // Windows = a yellow/teal background showing through two crossing stripe layers.
  const wins = (base: string, vertical: boolean): CSSProperties => ({
    backgroundColor: windowColor,
    backgroundImage: vertical
      ? `repeating-linear-gradient(90deg,transparent 0 7px,${base} 7px 16px),repeating-linear-gradient(0deg,transparent 0 9px,${base} 9px 20px)`
      : `repeating-linear-gradient(90deg,transparent 0 9px,${base} 9px 20px),repeating-linear-gradient(0deg,transparent 0 7px,${base} 7px 16px)`,
  });

  return (
    <div
      className="hx-anim"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: d,
        transformStyle: 'preserve-3d',
        transformOrigin: '50% 50% 0',
        animation: `hx-rise 1.2s cubic-bezier(.22,1,.36,1) ${delay}s both`,
      }}
    >
      {/* contact shadow */}
      <div
        style={{
          ...face,
          inset: 0,
          transform: 'translateZ(1px)',
          boxShadow: '0 0 36px 14px rgba(2,6,23,.55)',
        }}
      />
      {/* roof */}
      <div style={{ ...face, inset: 0, background: top, transform: `translateZ(${h}px)` }}>
        {beacon && (
          <>
            <span
              className="hx-anim absolute left-1/2 top-1/2 -ml-8 -mt-8 h-16 w-16 rounded-full border-2 border-amber-300"
              style={{ animation: 'hx-pulse 2.4s ease-out infinite' }}
            />
            <span
              className="hx-anim absolute left-1/2 top-1/2 -ml-8 -mt-8 h-16 w-16 rounded-full border-2 border-amber-300"
              style={{ animation: 'hx-pulse 2.4s ease-out 1.2s infinite' }}
            />
            <span className="absolute left-1/2 top-1/2 -ml-2.5 -mt-2.5 h-5 w-5 rounded-full bg-amber-300 shadow-[0_0_24px_8px_rgba(252,211,77,.7)]" />
          </>
        )}
      </div>
      {/* south */}
      <div
        style={{
          ...face,
          left: 0,
          top: d - h,
          width: w,
          height: h,
          transformOrigin: '50% 100%',
          transform: 'rotateX(-90deg)',
          ...wins(south, true),
        }}
      />
      {/* east */}
      <div
        style={{
          ...face,
          left: w - h,
          top: 0,
          width: h,
          height: d,
          transformOrigin: '100% 50%',
          transform: 'rotateY(90deg)',
          ...wins(east, false),
        }}
      />
      {/* north + west (mostly hidden by backface culling, keeps the solid closed while tilting) */}
      <div
        style={{
          ...face,
          left: 0,
          top: 0,
          width: w,
          height: h,
          transformOrigin: '50% 0',
          transform: 'rotateX(90deg)',
          background: dark,
        }}
      />
      <div
        style={{
          ...face,
          left: 0,
          top: 0,
          width: h,
          height: d,
          transformOrigin: '0 50%',
          transform: 'rotateY(-90deg)',
          background: dark,
        }}
      />
    </div>
  );
}

const BUILDINGS: BoxProps[] = [
  { x: 64, y: 96, w: 70, d: 70, h: 64, delay: 0.5, top: '#99f6e4', south: '#0f766e', east: '#115e59', dark: '#134e4a', windowColor: '#5eead4' },
  { x: 352, y: 84, w: 62, d: 62, h: 96, delay: 0.62, top: '#99f6e4', south: '#0f766e', east: '#115e59', dark: '#134e4a', windowColor: '#5eead4' },
  { x: 60, y: 300, w: 124, d: 118, h: 112, delay: 0.4, top: '#5eead4', south: '#0d9488', east: '#0f766e', dark: '#115e59', windowColor: '#99f6e4' },
  { x: 334, y: 286, w: 108, d: 104, h: 152, delay: 0.55, top: '#5eead4', south: '#0d9488', east: '#0f766e', dark: '#115e59', windowColor: '#99f6e4' },
  { x: 196, y: 150, w: 120, d: 120, h: 240, delay: 0.3, top: '#fef3c7', south: '#0f766e', east: '#134e4a', dark: '#042f2e', windowColor: '#fbbf24', beacon: true },
];

function CityScene({
  rotX,
  rotZ,
  y,
}: {
  rotX: MotionValue<number>;
  rotZ: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0"
      style={{ rotateX: rotX, rotateZ: rotZ, y, transformStyle: 'preserve-3d' }}
    >
      {/* ground plate */}
      <div
        className="absolute inset-0 rounded-[32px]"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(20,184,166,.34), rgba(15,23,42,.72) 72%)',
          border: '1px solid rgba(255,255,255,.16)',
          boxShadow: '0 0 90px rgba(20,184,166,.28), inset 0 0 70px rgba(0,0,0,.45)',
        }}
      />
      <div
        className="absolute inset-0 rounded-[32px] opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* orbit ring with a travelling satellite */}
      <div
        className="hx-anim absolute left-1/2 top-1/2 h-[440px] w-[440px] rounded-full border border-dashed border-teal-300/40"
        style={{
          marginLeft: -220,
          marginTop: -220,
          transform: 'translateZ(2px)',
          animation: 'hx-spin 36s linear infinite',
        }}
      >
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-teal-200 shadow-[0_0_18px_6px_rgba(94,234,212,.8)]" />
      </div>

      {BUILDINGS.map((b, i) => (
        <Box key={i} {...b} />
      ))}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Hero
 * ──────────────────────────────────────────────────────────────────────────── */

export function HeroSection({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onAreaClick,
}: HeroSectionProps) {
  const { triggerHaptic } = usePlatform();
  const { areas, isLoading } = usePopularAreas();
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  /* pointer state (-1..1) shared by the 3D scene, floating cards and spotlight */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const mx = useSpring(px, { stiffness: 70, damping: 18 });
  const my = useSpring(py, { stiffness: 70, damping: 18 });
  const spotX = useMotionValue(900);
  const spotY = useMotionValue(220);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${spotX}px ${spotY}px, rgba(45,212,191,.14), transparent 62%)`;

  const rotZ = useTransform(mx, [-1, 1], [-53, -37]);
  const rotX = useTransform(my, [-1, 1], [68, 52]);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const totalHomes = useMemo(() => areas.reduce((sum, a) => sum + (a.count || 0), 0), [areas]);

  const handlePointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    px.set(nx * 2 - 1);
    py.set(ny * 2 - 1);
    spotX.set(e.clientX - r.left);
    spotY.set(e.clientY - r.top);
  };

  const handlePointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <MotionConfig reducedMotion="user">
      <style>{HERO_CSS}</style>

      <section
        ref={heroRef}
        aria-labelledby="hero-heading"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative isolate overflow-hidden bg-gradient-to-b from-teal-950 via-[#06302d] to-slate-950 py-14 text-white sm:py-20 lg:py-24"
      >
        {/* ── Backdrop: aurora, spotlight, grain ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="hx-anim absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-teal-500/20 blur-[110px] will-change-transform"
            style={{ animation: 'hx-drift 22s ease-in-out infinite' }}
          />
          <div
            className="hx-anim absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-emerald-500/15 blur-[120px] will-change-transform"
            style={{ animation: 'hx-drift 28s ease-in-out -8s infinite reverse' }}
          />
          <div
            className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          />
          <motion.div className="absolute inset-0" style={{ background: spotlight }} />
          <svg className="absolute inset-0 h-full w-full opacity-[0.06] mix-blend-overlay">
            <filter id="hx-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#hx-noise)" />
          </svg>
        </div>

        <div className="container mx-auto grid items-center gap-8 px-4 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
          {/* ── Copy + search ── */}
          <motion.div style={{ y: copyY }} className="relative z-10 max-w-2xl">
            <h1
              id="hero-heading"
              className="text-[2.6rem] font-black leading-[1.08] tracking-tight sm:text-6xl xl:text-7xl"
            >
              <span className="sr-only">{HEADLINE.join(' ')}</span>
              <span aria-hidden>
                {HEADLINE.map((word, i) => (
                  <span
                    key={word}
                    className="mr-[0.25em] inline-block overflow-hidden pb-[0.14em] align-bottom"
                    style={{ marginBottom: '-0.14em' }}
                  >
                    <motion.span
                      className={`inline-block ${
                        i >= GRADIENT_FROM_INDEX
                          ? 'bg-gradient-to-r from-teal-200 via-teal-300 to-emerald-300 bg-clip-text text-transparent'
                          : ''
                      }`}
                      initial={{ y: '115%' }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.08 }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </span>
            </h1>

            <motion.p
              className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-teal-100/80 sm:text-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
            >
              Connect directly with verified property owners across Dhaka. Transparent deposits,
              digital contracts and zero hidden broker fees.
            </motion.p>

            {/* Search: rotating light border */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.85 }}
            >
              <div className="relative overflow-hidden rounded-[22px] p-[1.5px] shadow-2xl shadow-teal-950/60">
                <div
                  aria-hidden
                  className="hx-anim absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0 68%, rgba(94,234,212,.95) 84%, transparent 100%)',
                    animation: 'hx-spin 5s linear infinite',
                  }}
                />
                <form
                  role="search"
                  onSubmit={onSearchSubmit}
                  className="relative flex flex-col gap-2 rounded-[20px] bg-background/95 p-2 text-foreground backdrop-blur-xl sm:flex-row dark:bg-slate-900/95"
                >
                  <label htmlFor="hero-search" className="sr-only">
                    Search rentals by area
                  </label>
                  <div className="relative flex-1">
                    <MapPin
                      aria-hidden
                      className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-600 dark:text-teal-400"
                    />
                    <Input
                      id="hero-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="Search an area, e.g. Dhanmondi or Gulshan"
                      enterKeyHint="search"
                      autoComplete="off"
                      className="h-12 rounded-xl border-0 bg-muted/40 pl-11 text-base focus-visible:ring-2 focus-visible:ring-teal-500"
                    />
                  </div>
                  <Magnetic>
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-7 font-bold text-white shadow-lg shadow-teal-900/30 hover:from-teal-500 hover:to-emerald-500 active:scale-[0.97] sm:w-auto"
                    >
                      <Search aria-hidden className="mr-2 h-4 w-4" />
                      Find homes
                    </Button>
                  </Magnetic>
                </form>
              </div>

              {/* Popular areas */}
              {(isLoading || areas.length > 0) && (
                <div
                  aria-busy={isLoading}
                  className="no-scrollbar mt-4 flex items-center gap-3 overflow-x-auto sm:flex-wrap sm:overflow-visible"
                >
                  <span className="shrink-0 text-sm text-teal-100/70">Popular areas</span>
                  <ul className="flex gap-2 sm:flex-wrap">
                    {isLoading
                      ? [0, 1, 2, 3].map((i) => (
                          <li key={i}>
                            <Skeleton className="h-9 w-24 rounded-full bg-white/10" />
                          </li>
                        ))
                      : areas.map((area) => (
                          <li key={area.name}>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic();
                                onAreaClick(area.name);
                              }}
                              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 text-sm text-white/90 transition-all hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 active:scale-95"
                            >
                              {area.name}
                              <span className="text-white/50">{area.count}</span>
                            </button>
                          </li>
                        ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Trust + live stat */}
            <motion.div
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.3 }}
            >
              {totalHomes > 0 && (
                <p className="shrink-0 text-sm text-teal-100/80">
                  <span className="block text-3xl font-black tabular-nums text-white">
                    <CountUp to={totalHomes} />+
                  </span>
                  homes in popular areas
                </p>
              )}
              <ul className="grid gap-2 text-sm text-teal-100/80">
                {TRUST_POINTS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2">
                    <Icon aria-hidden className="h-4 w-4 shrink-0 text-teal-300" />
                    {label}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* ── 3D city + floating UI ── */}
          <div className="relative mx-auto h-[360px] w-full max-w-[600px] sm:h-[480px] lg:h-[600px]" aria-hidden>
            <div
              className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 scale-[0.62] sm:scale-[0.85] lg:scale-100"
              style={{ perspective: 1600 }}
            >
              <div
                className="absolute left-1/2 top-1/2 -ml-[300px] -mt-[260px] h-[520px] w-[600px] rounded-full bg-teal-400/10 blur-[90px]"
              />
              <CityScene rotX={rotX} rotZ={rotZ} y={sceneY} />

              <Floating mx={mx} my={my} depth={1.4} delay={1.1} className="-left-6 top-2 sm:-left-14">
                <div className={`${glass} w-56 p-3`}>
                  <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/40 to-emerald-500/20">
                    <Building2 className="h-9 w-9 text-teal-100/80" />
                  </div>
                  <p className="text-sm font-semibold text-white">3 bed · Dhanmondi</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-teal-200">৳18,500 / mo</span>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] text-emerald-200">
                      Direct owner
                    </span>
                  </div>
                </div>
              </Floating>

              <Floating mx={mx} my={my} depth={2} delay={1.4} className="-right-2 top-28 sm:-right-10">
                <div className={`${glass} flex items-center gap-2.5 px-4 py-3`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Verified tenant</p>
                    <p className="text-[11px] text-teal-200/80">NID verified</p>
                  </div>
                </div>
              </Floating>

              <Floating mx={mx} my={my} depth={1.1} delay={1.7} className="-right-4 bottom-10 sm:-right-12">
                <div className={`${glass} flex items-center gap-2.5 px-4 py-3`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/30">
                    <KeyRound className="h-4 w-4 text-amber-200" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Token held</p>
                    <p className="text-[11px] text-teal-200/80">৳5,000 secured</p>
                  </div>
                </div>
              </Floating>

              <Floating mx={mx} my={my} depth={1.7} delay={2} className="-left-2 bottom-2 sm:-left-10">
                <div className={`${glass} flex items-center gap-2.5 px-4 py-3`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/30">
                    <FileSignature className="h-4 w-4 text-teal-100" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Contract signed</p>
                    <p className="text-[11px] text-teal-200/80">Digitally, by both</p>
                  </div>
                </div>
              </Floating>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}