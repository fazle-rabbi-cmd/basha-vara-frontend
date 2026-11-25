'use client';

/**
 * Hero section: single file.
 *
 * Requires:  npm i three && npm i -D @types/three
 *
 * Optional props (all backwards compatible):
 *  - featuredListings : real listings for the floating card (cycles every 5s)
 *  - rentalType / onRentalTypeChange : shows the Family / Bachelor / Sublet switch
 *  - locale : uses global useLocale() by default
 */

import type * as THREE from 'three';
import {
  animate,
  AnimatePresence,
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
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/shared/language-provider';
import {
  Building2,
  CheckCircle2,
  FileSignature,
  KeyRound,
  LocateFixed,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatform } from '@/lib/platform/platform-context';
import { apiClient } from '@/lib/api-client';

/* ────────────────────────────────────────────────────────────────────────────
 * Public types
 * ──────────────────────────────────────────────────────────────────────────── */

export type Locale = 'en' | 'bn';

export interface FeaturedListing {
  id: string | number;
  title: string;
  area?: string;
  priceBdt: number;
  beds?: number;
  imageUrl?: string;
  href?: string;
}

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onAreaClick: (areaName: string) => void;
  featuredListings?: FeaturedListing[];
  rentalType?: string;
  onRentalTypeChange?: (value: string) => void;
  /** @deprecated Use global useLocale() instead */
  locale?: Locale;
}

interface PopularArea {
  name: string; // canonical (English) name, what your backend searches by
  bn?: string;
  count?: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Copy (English + Bangla)
 * ──────────────────────────────────────────────────────────────────────────── */

const en = {
  headline: ['Rent', 'your', 'dream', 'home', 'without', 'middlemen'],
  gradientFrom: 4,
  description:
    'Connect directly with verified property owners across Dhaka. Transparent deposits, digital contracts and zero hidden broker fees.',
  searchLabel: 'Search rentals by area',
  placeholder: 'Search an area, e.g. Dhanmondi or Gulshan',
  find: 'Find homes',
  popular: 'Popular areas:',
  nearMe: 'Near me',
  locating: 'Finding your area…',
  clear: 'Clear search',
  suggestions: 'Area suggestions',
  homesN: (n: number) => `${n.toLocaleString('en-US')} homes`,
  homesStat: 'homes in popular areas',
  rentalType: 'Rental type',
  types: { any: 'Any', family: 'Family', bachelor: 'Bachelor', sublet: 'Sublet' } as Record<string, string>,
  trust: ['NID-verified owners', 'Deposit held safely', 'Digital contracts'],
  cards: {
    directOwner: 'Direct owner',
    verifiedTenant: 'Verified tenant',
    nidVerified: 'NID verified',
    tokenHeld: 'Token held',
    secured: '৳5,000 secured',
    contract: 'Contract signed',
    bothParties: 'Digitally, by both',
    perMonth: '/ mo',
    bed: (n: number) => `${n.toLocaleString('en-US')} bed`,
    sample: '3 bed · Dhanmondi',
  },
  geo: {
    denied: 'Location permission is off. Search by area instead.',
    unavailable: 'Could not get your location. Try again or search by area.',
    outside: 'You seem to be outside Dhaka. We list homes in Dhaka for now.',
    unsupported: 'Your browser cannot share location.',
    found: (a: string) => `Showing homes near ${a}`,
  },
  langLabel: 'Language',
};

const bn: typeof en = {
  headline: ['আপনার', 'স্বপ্নের', 'বাসা', 'ভাড়া', 'নিন', 'দালাল', 'ছাড়াই'],
  gradientFrom: 5,
  description:
    'ঢাকার যাচাইকৃত বাড়িওয়ালাদের সাথে সরাসরি যোগাযোগ করুন। স্বচ্ছ জামানত, ডিজিটাল চুক্তি এবং কোনো লুকানো দালালি ফি নেই।',
  searchLabel: 'এলাকা অনুযায়ী বাসা খুঁজুন',
  placeholder: 'এলাকা লিখুন, যেমন ধানমন্ডি বা গুলশান',
  find: 'বাসা খুঁজুন',
  popular: 'জনপ্রিয় এলাকা:',
  nearMe: 'আমার কাছাকাছি',
  locating: 'আপনার এলাকা খোঁজা হচ্ছে…',
  clear: 'মুছে ফেলুন',
  suggestions: 'এলাকার পরামর্শ',
  homesN: (n) => `${n.toLocaleString('bn-BD')}টি বাসা`,
  homesStat: 'জনপ্রিয় এলাকায় বাসা',
  rentalType: 'ভাড়ার ধরন',
  types: { any: 'সব', family: 'ফ্যামিলি', bachelor: 'ব্যাচেলর', sublet: 'সাবলেট' },
  trust: ['এনআইডি-যাচাইকৃত বাড়িওয়ালা', 'জামানত নিরাপদে সংরক্ষিত', 'ডিজিটাল চুক্তি'],
  cards: {
    directOwner: 'সরাসরি মালিক',
    verifiedTenant: 'যাচাইকৃত ভাড়াটিয়া',
    nidVerified: 'এনআইডি যাচাই সম্পন্ন',
    tokenHeld: 'টোকেন জমা',
    secured: '৳৫,০০০ সুরক্ষিত',
    contract: 'চুক্তি সই হয়েছে',
    bothParties: 'দুই পক্ষের ডিজিটাল সই',
    perMonth: '/ মাস',
    bed: (n) => `${n.toLocaleString('bn-BD')} বেড`,
    sample: '৩ বেড · ধানমন্ডি',
  },
  geo: {
    denied: 'লোকেশনের অনুমতি বন্ধ আছে। এলাকার নাম লিখে খুঁজুন।',
    unavailable: 'আপনার অবস্থান পাওয়া যায়নি। আবার চেষ্টা করুন বা এলাকার নাম লিখুন।',
    outside: 'আপনি ঢাকার বাইরে আছেন মনে হচ্ছে। আপাতত শুধু ঢাকার বাসা দেখানো হয়।',
    unsupported: 'আপনার ব্রাউজার লোকেশন শেয়ার করতে পারছে না।',
    found: (a) => `${a}-এর কাছাকাছি বাসা দেখানো হচ্ছে`,
  },
  langLabel: 'ভাষা',
};

const COPY: Record<Locale, typeof en> = { en, bn };
const BN_FONT =
  '"Hind Siliguri","Noto Sans Bengali","Kalpurush","Nirmala UI","Shonar Bangla",system-ui,sans-serif';

const formatBdt = (n: number, lang: Locale) =>
  `৳${n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-IN')}`;
const formatNum = (n: number, lang: Locale) => n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US');

/* ────────────────────────────────────────────────────────────────────────────
 * Constants
 * ──────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Approximate neighbourhood centres, used for "Near me" (computed on-device, nothing is sent). */
const DHAKA_AREAS = [
  { name: 'Dhanmondi', bn: 'ধানমন্ডি', lat: 23.7461, lng: 90.3742 },
  { name: 'Gulshan', bn: 'গুলশান', lat: 23.7925, lng: 90.4078 },
  { name: 'Banani', bn: 'বনানী', lat: 23.794, lng: 90.4043 },
  { name: 'Uttara', bn: 'উত্তরা', lat: 23.8759, lng: 90.3795 },
  { name: 'Mirpur', bn: 'মিরপুর', lat: 23.8223, lng: 90.3654 },
  { name: 'Mohammadpur', bn: 'মোহাম্মদপুর', lat: 23.7662, lng: 90.3589 },
  { name: 'Bashundhara', bn: 'বসুন্ধরা', lat: 23.8193, lng: 90.4526 },
  { name: 'Motijheel', bn: 'মতিঝিল', lat: 23.733, lng: 90.4172 },
  { name: 'Mohakhali', bn: 'মহাখালী', lat: 23.7781, lng: 90.4056 },
  { name: 'Badda', bn: 'বাড্ডা', lat: 23.7806, lng: 90.4261 },
  { name: 'Rampura', bn: 'রামপুরা', lat: 23.7612, lng: 90.4251 },
  { name: 'Malibagh', bn: 'মালিবাগ', lat: 23.7508, lng: 90.4116 },
  { name: 'Farmgate', bn: 'ফার্মগেট', lat: 23.7561, lng: 90.3872 },
  { name: 'Tejgaon', bn: 'তেজগাঁও', lat: 23.7587, lng: 90.3917 },
  { name: 'Lalmatia', bn: 'লালমাটিয়া', lat: 23.7556, lng: 90.3687 },
  { name: 'Khilgaon', bn: 'খিলগাঁও', lat: 23.751, lng: 90.426 },
  { name: 'Jatrabari', bn: 'যাত্রাবাড়ী', lat: 23.7104, lng: 90.4344 },
];

/** Shown when the API is empty or fails, so the chips never vanish. */
const FALLBACK_AREAS: PopularArea[] = DHAKA_AREAS.slice(0, 7).map(({ name, bn }) => ({ name, bn }));

const RENTAL_TYPE_KEYS = ['any', 'family', 'bachelor', 'sublet'];
const TRUST_ICONS = [ShieldCheck, KeyRound, FileSignature];

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37) % 100,
  top: 30 + ((i * 53) % 65),
  size: 2 + (i % 3),
  duration: 9 + (i % 5) * 2,
  delay: -(i * 1.3),
}));

/* Keyframes live here so the file stays self-contained (no tailwind.config edits). */
const HERO_CSS = `
@keyframes hx-rise{from{transform:scale3d(1,1,.001)}to{transform:scale3d(1,1,1)}}
@keyframes hx-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes hx-spin{to{rotate:360deg}}
@keyframes hx-drift{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(48px,-36px,0)}}
@keyframes hx-pulse{0%{transform:scale(.4);opacity:.9}100%{transform:scale(2.4);opacity:0}}
@keyframes hx-drive{to{offset-distance:100%}}
@keyframes hx-up{0%{transform:translateY(0);opacity:0}20%{opacity:.7}100%{transform:translateY(-160px);opacity:0}}
@keyframes hx-scroll{0%{transform:translateY(0);opacity:1}100%{transform:translateY(12px);opacity:0}}
.hx-anim{animation-play-state:var(--hx-play,running)!important}
@media (prefers-reduced-motion:reduce){.hx-anim{animation:none!important}}
`;

const stageBox =
  'absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 scale-[0.62] sm:scale-[0.85] lg:scale-100';

const glass =
  'rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl';

/* ────────────────────────────────────────────────────────────────────────────
 * Data + geo helpers
 * ──────────────────────────────────────────────────────────────────────────── */

function usePopularAreas() {
  const [liveAreas, setLiveAreas] = useState<PopularArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient.public
      .getPopularAreas()
      .then((data) => active && setLiveAreas(Array.isArray(data) ? data : []))
      .catch(() => active && setLiveAreas([]))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const isLive = liveAreas.length > 0;
  const areas = useMemo(() => {
    if (!isLive) return isLoading ? [] : FALLBACK_AREAS;
    // attach Bangla names where we know them
    return liveAreas.map((a) => ({
      ...a,
      bn: a.bn ?? DHAKA_AREAS.find((d) => d.name.toLowerCase() === a.name.toLowerCase())?.bn,
    }));
  }, [isLive, isLoading, liveAreas]);

  return { areas, isLive, isLoading };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestDhakaArea(lat: number, lng: number) {
  let best: (typeof DHAKA_AREAS)[number] | null = null;
  let bestD = Infinity;
  for (const a of DHAKA_AREAS) {
    const d = haversineKm(lat, lng, a.lat, a.lng);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best && bestD <= 12 ? best : null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Small interactive pieces
 * ──────────────────────────────────────────────────────────────────────────── */

/** Counts up once when scrolled into view. */
function CountUp({ to, lang }: { to: number; lang: Locale }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    if (reduce) {
      el.textContent = formatNum(to, lang);
      return;
    }
    const controls = animate(0, to, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = formatNum(Math.round(v), lang);
      },
    });
    return () => controls.stop();
  }, [inView, to, reduce, lang]);

  return <span ref={ref}>{formatNum(0, lang)}</span>;
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

/** A UI card that floats at its own depth, so it parallaxes against the city. */
function Floating({
  mx,
  my,
  depth,
  delay,
  className,
  decorative = true,
  children,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  delay: number;
  className: string;
  decorative?: boolean;
  children: ReactNode;
}) {
  const x = useTransform(mx, [-1, 1], [-26 * depth, 26 * depth]);
  const y = useTransform(my, [-1, 1], [-18 * depth, 18 * depth]);

  return (
    <motion.div
      aria-hidden={decorative || undefined}
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

/** Real listing(s) when provided, otherwise an illustrative sample card. */
function ListingCard({
  listings,
  lang,
  t,
}: {
  listings: FeaturedListing[];
  lang: Locale;
  t: typeof en;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (listings.length < 2 || paused || reduce) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % listings.length), 5000);
    return () => clearInterval(id);
  }, [listings.length, paused, reduce]);

  const l = listings[index % listings.length];

  const body = (
    <div className={`${glass} w-56 p-3`}>
      <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-teal-400/40 to-emerald-500/20">
        {l.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-9 w-9 text-teal-100/80" />
        )}
      </div>
      <p className="truncate text-sm font-semibold text-white">
        {l.title}
        {l.area ? ` · ${l.area}` : ''}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-teal-200">
          {formatBdt(l.priceBdt, lang)} {t.cards.perMonth}
        </span>
        {typeof l.beds === 'number' && (
          <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] text-emerald-200">
            {t.cards.bed(l.beds)}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={l.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          {l.href ? (
            <Link
              href={l.href}
              className="block rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              {body}
            </Link>
          ) : (
            body
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Search card: combobox + rental type + near me + popular areas
 * ──────────────────────────────────────────────────────────────────────────── */

function SearchCard({
  value,
  onChange,
  onSubmit,
  onAreaSelect,
  areas,
  isLive,
  isLoading,
  rentalType,
  onRentalTypeChange,
  lang,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onAreaSelect: (name: string) => void;
  areas: PopularArea[];
  isLive: boolean;
  isLoading: boolean;
  rentalType?: string;
  onRentalTypeChange?: (v: string) => void;
  lang: Locale;
  t: typeof en;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');

  const labelOf = (a: PopularArea) => (lang === 'bn' && a.bn ? a.bn : a.name);

  const suggestions = useMemo(() => {
    const q = value.trim();
    const ql = q.toLowerCase();
    const pool = q
      ? areas.filter((a) => a.name.toLowerCase().includes(ql) || (a.bn ? a.bn.includes(q) : false))
      : areas;
    return pool.slice(0, 6);
  }, [areas, value]);

  const showList = open && suggestions.length > 0;

  /* "/" focuses the search from anywhere on the page */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const select = (name: string) => {
    setOpen(false);
    setActive(-1);
    onAreaSelect(name);
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setGeoMsg(t.geo.unsupported);
      return;
    }
    setLocating(true);
    setGeoMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const near = nearestDhakaArea(pos.coords.latitude, pos.coords.longitude);
        if (!near) {
          setGeoMsg(t.geo.outside);
          return;
        }
        setGeoMsg(t.geo.found(lang === 'bn' ? near.bn : near.name));
        select(near.name);
      },
      (err) => {
        setLocating(false);
        setGeoMsg(err.code === err.PERMISSION_DENIED ? t.geo.denied : t.geo.unavailable);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    const n = suggestions.length;
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % n);
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? n - 1 : i - 1));
    } else if (e.key === 'Enter' && showList && active >= 0) {
      e.preventDefault();
      select(suggestions[active].name);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const statusText = locating ? t.locating : geoMsg;

  return (
    <div className="relative">
      {/* rotating light border (clipped on its own layer so the dropdown can overflow) */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden rounded-[22px] shadow-2xl shadow-teal-950/70"
      >
        <div
          className="hx-anim absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0 68%, rgba(94,234,212,.95) 84%, transparent 100%)',
            animation: 'hx-spin 5s linear infinite',
          }}
        />
      </div>

      <div className="relative m-[1.5px] rounded-[20px] bg-slate-950/95 p-2.5 text-white backdrop-blur-xl">
        {onRentalTypeChange && (
          <div role="group" aria-label={t.rentalType} className="mb-2 flex flex-wrap gap-1.5 px-1 pt-0.5">
            {RENTAL_TYPE_KEYS.map((key) => {
              const on = (rentalType ?? 'any') === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onRentalTypeChange(key)}
                  className={`h-8 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
                    on
                      ? 'bg-teal-500/25 text-teal-100 ring-1 ring-teal-400/50'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {t.types[key]}
                </button>
              );
            })}
          </div>
        )}

        <form role="search" onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <div
            className="relative flex-1"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
            }}
          >
            <label htmlFor={`${listId}-input`} className="sr-only">
              {t.searchLabel}
            </label>
            <MapPin
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-400"
            />
            <Input
              ref={inputRef}
              id={`${listId}-input`}
              type="search"
              role="combobox"
              aria-expanded={showList}
              aria-controls={`${listId}-list`}
              aria-autocomplete="list"
              aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setActive(-1);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={t.placeholder}
              enterKeyHint="search"
              autoComplete="off"
              className="h-12 rounded-xl border-0 bg-white/10 pl-11 pr-11 text-base text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-teal-400 [&::-webkit-search-cancel-button]:hidden"
            />
            {value ? (
              <button
                type="button"
                aria-label={t.clear}
                onClick={() => {
                  onChange('');
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            ) : (
              <kbd
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 text-xs text-white/50 sm:inline-flex"
              >
                /
              </kbd>
            )}

            {showList && (
              <ul
                id={`${listId}-list`}
                role="listbox"
                aria-label={t.suggestions}
                className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-white/15 bg-slate-900/95 py-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
              >
                {suggestions.map((a, i) => (
                  <li
                    key={a.name}
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(a.name)}
                    className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm ${
                      i === active ? 'bg-teal-500/20 text-white' : 'text-white/85'
                    }`}
                  >
                    <MapPin aria-hidden className="h-4 w-4 shrink-0 text-teal-400" />
                    <span className="flex-1">{labelOf(a)}</span>
                    {typeof a.count === 'number' && (
                      <span className="text-xs text-white/50">{t.homesN(a.count)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Magnetic>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-7 font-bold text-white shadow-lg shadow-teal-900/30 hover:from-teal-500 hover:to-emerald-500 active:scale-[0.97] sm:w-auto"
            >
              <Search aria-hidden className="mr-2 h-4 w-4" />
              {t.find}
            </Button>
          </Magnetic>
        </form>

        {/* Near me + popular areas */}
        <div
          aria-busy={isLoading}
          className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto border-t border-white/10 px-1 pt-3 sm:flex-wrap sm:overflow-visible"
        >
          <span className="shrink-0 text-xs font-semibold text-teal-200">{t.popular}</span>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-teal-400/50 bg-teal-500/20 px-3 text-xs font-semibold text-teal-100 transition-all hover:bg-teal-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 active:scale-95 disabled:opacity-60"
          >
            <LocateFixed aria-hidden className={`h-3.5 w-3.5 ${locating ? 'animate-pulse' : ''}`} />
            {t.nearMe}
          </button>
          {isLoading ? (
            [0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-full bg-white/10" />
            ))
          ) : (
            <ul className="flex gap-2 sm:flex-wrap">
              {areas.map((area) => (
                <li key={area.name}>
                  <button
                    type="button"
                    onClick={() => select(area.name)}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-medium text-white/90 transition-all hover:-translate-y-0.5 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 active:scale-95"
                  >
                    {labelOf(area)}
                    {isLive && typeof area.count === 'number' && (
                      <span className="text-white/50">({formatNum(area.count, lang)})</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {statusText && (
          <p role="status" className="px-1 pt-2 text-xs text-teal-200/90">
            {statusText}
          </p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * CSS 3D city: instant first paint, and the fallback if WebGL is unavailable
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
      <div
        style={{
          ...face,
          inset: 0,
          transform: 'translateZ(1px)',
          boxShadow: '0 0 36px 14px rgba(2,6,23,.55)',
        }}
      />
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

const CSS_BUILDINGS: BoxProps[] = [
  { x: 64, y: 96, w: 70, d: 70, h: 64, delay: 0.5, top: '#99f6e4', south: '#0f766e', east: '#115e59', dark: '#134e4a', windowColor: '#5eead4' },
  { x: 352, y: 84, w: 62, d: 62, h: 96, delay: 0.62, top: '#99f6e4', south: '#0f766e', east: '#115e59', dark: '#134e4a', windowColor: '#5eead4' },
  { x: 60, y: 300, w: 124, d: 118, h: 112, delay: 0.4, top: '#5eead4', south: '#0d9488', east: '#0f766e', dark: '#115e59', windowColor: '#99f6e4' },
  { x: 334, y: 286, w: 108, d: 104, h: 152, delay: 0.55, top: '#5eead4', south: '#0d9488', east: '#0f766e', dark: '#115e59', windowColor: '#99f6e4' },
  { x: 196, y: 150, w: 120, d: 120, h: 240, delay: 0.3, top: '#fef3c7', south: '#0f766e', east: '#134e4a', dark: '#042f2e', windowColor: '#fbbf24', beacon: true },
];

function CssCity({
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
      <div
        className="absolute inset-0 rounded-[32px]"
        style={{
          background: 'radial-gradient(circle at 50% 42%, rgba(20,184,166,.34), rgba(15,23,42,.72) 72%)',
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
      <div
        className="absolute inset-[18px] rounded-[40px] border-2 border-dashed border-white/10"
        style={{ transform: 'translateZ(1px)' }}
      />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="hx-anim absolute left-0 top-0 h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_10px_3px_rgba(252,211,77,.7)]"
          style={
            {
              offsetPath: 'inset(18px round 40px)',
              animation: `hx-drive 9s linear ${-i * 3}s infinite`,
              transform: 'translateZ(2px)',
            } as CSSProperties
          }
        />
      ))}
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
      {CSS_BUILDINGS.map((b, i) => (
        <Box key={i} {...b} />
      ))}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * WebGL city (three.js, lazy-loaded after first paint)
 * ──────────────────────────────────────────────────────────────────────────── */

interface GlOptions {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  isActive: () => boolean;
  reduce: boolean;
  onReady: () => void;
  onLost: () => void;
}

function buildCity(T: typeof THREE, host: HTMLElement, o: GlOptions): () => void {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  host.appendChild(canvas);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, 0.1, 200);
  const target = new T.Vector3(0, 2.4, 0);

  /* lights */
  scene.add(new T.HemisphereLight(0x99f6e4, 0x0b2b2a, 0.95));
  const sun = new T.DirectionalLight(0xffffff, 2.2);
  sun.position.set(7, 12, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const rim = new T.DirectionalLight(0x2dd4bf, 1.3);
  rim.position.set(-8, 5, -6);
  scene.add(rim);

  /* ground */
  const plate = new T.Mesh(
    new T.BoxGeometry(13, 0.4, 13),
    new T.MeshStandardMaterial({ color: 0x0f2f31, roughness: 0.9, metalness: 0.1 }),
  );
  plate.position.y = -0.2;
  plate.receiveShadow = true;
  scene.add(plate);
  const edge = new T.LineSegments(
    new T.EdgesGeometry(plate.geometry),
    new T.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.55 }),
  );
  edge.position.copy(plate.position);
  scene.add(edge);
  const grid = new T.GridHelper(12.4, 15, 0x2dd4bf, 0x2dd4bf);
  const gridMat = grid.material as THREE.LineBasicMaterial;
  gridMat.transparent = true;
  gridMat.opacity = 0.16;
  grid.position.y = 0.01;
  scene.add(grid);

  /* facade textures: base colour + emissive (lit windows only) */
  const facade = (base: string, lit: string[], cols: number, rows: number, seed: number) => {
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 256;
      return c;
    };
    const a = mk();
    const e = mk();
    const ca = a.getContext('2d')!;
    const ce = e.getContext('2d')!;
    ca.fillStyle = base;
    ca.fillRect(0, 0, 128, 256);
    ce.fillStyle = '#000';
    ce.fillRect(0, 0, 128, 256);
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const cw = 128 / cols;
    const ch = 256 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw + cw * 0.2;
        const y = r * ch + ch * 0.22;
        const w = cw * 0.6;
        const h = ch * 0.56;
        if (rnd() > 0.36) {
          const col = lit[Math.floor(rnd() * lit.length)];
          ca.fillStyle = col;
          ca.fillRect(x, y, w, h);
          ce.fillStyle = col;
          ce.fillRect(x, y, w, h);
        } else {
          ca.fillStyle = 'rgba(0,0,0,.4)';
          ca.fillRect(x, y, w, h);
        }
      }
    }
    const map = new T.CanvasTexture(a);
    const emissiveMap = new T.CanvasTexture(e);
    map.colorSpace = T.SRGBColorSpace;
    emissiveMap.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    return { map, emissiveMap };
  };

  /* buildings (units: 1 = 40 css px of the fallback scene) */
  const specs = [
    { x: -4.03, z: -3.23, w: 1.75, h: 1.6, d: 1.75, base: '#0f766e', lit: ['#5eead4', '#99f6e4'], roof: 0x99f6e4, delay: 0.5 },
    { x: 3.08, z: -3.63, w: 1.55, h: 2.4, d: 1.55, base: '#0f766e', lit: ['#5eead4', '#99f6e4'], roof: 0x99f6e4, delay: 0.62 },
    { x: -3.45, z: 2.48, w: 3.1, h: 2.8, d: 2.95, base: '#0d9488', lit: ['#99f6e4', '#ccfbf1'], roof: 0x5eead4, delay: 0.4 },
    { x: 3.2, z: 1.95, w: 2.7, h: 3.8, d: 2.6, base: '#0d9488', lit: ['#99f6e4', '#ccfbf1'], roof: 0x5eead4, delay: 0.55 },
    { x: -0.1, z: -1.25, w: 3, h: 6, d: 3, base: '#134e4a', lit: ['#fbbf24', '#fde68a', '#f59e0b'], roof: 0xfef3c7, delay: 0.3 },
  ];
  const lights: THREE.MeshStandardMaterial[] = [];
  const towers = specs.map((sp, i) => {
    const { map, emissiveMap } = facade(
      sp.base,
      sp.lit,
      Math.max(3, Math.round(sp.w * 3)),
      Math.max(4, Math.round(sp.h * 2.2)),
      11 + i * 97,
    );
    const side = new T.MeshStandardMaterial({
      map,
      emissive: 0xffffff,
      emissiveMap,
      emissiveIntensity: 1.2,
      roughness: 0.55,
      metalness: 0.15,
    });
    const roof = new T.MeshStandardMaterial({ color: sp.roof, roughness: 0.6, metalness: 0.1 });
    lights.push(side);
    const geo = new T.BoxGeometry(sp.w, sp.h, sp.d);
    geo.translate(0, sp.h / 2, 0);
    // box face order: +x, -x, +y(roof), -y, +z, -z
    const mesh = new T.Mesh(geo, [side, side, roof, side, side, side]);
    mesh.position.set(sp.x, 0, sp.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return { mesh, delay: sp.delay };
  });

  /* beacon on the tallest tower */
  const hero = specs[4];
  const beacon = new T.Group();
  beacon.position.set(hero.x, hero.h + 0.02, hero.z);
  const amber = (op: number) =>
    new T.MeshBasicMaterial({
      color: 0xfcd34d,
      transparent: true,
      opacity: op,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide,
    });
  const rings = [0, 1].map(() => {
    const m = new T.Mesh(new T.RingGeometry(0.5, 0.58, 48), amber(0.9));
    m.rotation.x = -Math.PI / 2;
    beacon.add(m);
    return m;
  });
  const core = new T.Mesh(new T.SphereGeometry(0.16, 24, 16), new T.MeshBasicMaterial({ color: 0xfde68a }));
  core.position.y = 0.16;
  beacon.add(core);
  const beam = new T.Mesh(new T.CylinderGeometry(0.06, 0.5, 4.5, 24, 1, true), amber(0.16));
  beam.position.y = 2.25;
  beacon.add(beam);
  const glow = new T.PointLight(0xfbbf24, 10, 10);
  glow.position.y = 0.7;
  beacon.add(glow);
  beacon.visible = false;
  scene.add(beacon);

  /* ring road with cars */
  const half = 6.0;
  const road = new T.LineLoop(
    new T.BufferGeometry().setFromPoints([
      new T.Vector3(-half, 0.02, -half),
      new T.Vector3(half, 0.02, -half),
      new T.Vector3(half, 0.02, half),
      new T.Vector3(-half, 0.02, half),
    ]),
    new T.LineDashedMaterial({ color: 0xffffff, dashSize: 0.22, gapSize: 0.16, transparent: true, opacity: 0.28 }),
  );
  road.computeLineDistances();
  scene.add(road);
  const cars = [0, 1, 2].map(() => {
    const m = new T.Mesh(
      new T.BoxGeometry(0.3, 0.1, 0.14),
      new T.MeshBasicMaterial({ color: 0xfde68a }),
    );
    m.position.y = 0.07;
    scene.add(m);
    return m;
  });
  const placeCar = (m: THREE.Mesh, t: number) => {
    const d = (((t % 1) + 1) % 1) * 8 * half;
    const side = Math.floor(d / (2 * half));
    const u = (d % (2 * half)) - half;
    if (side === 0) { m.position.x = u; m.position.z = -half; m.rotation.y = 0; }
    else if (side === 1) { m.position.x = half; m.position.z = u; m.rotation.y = -Math.PI / 2; }
    else if (side === 2) { m.position.x = -u; m.position.z = half; m.rotation.y = Math.PI; }
    else { m.position.x = -half; m.position.z = -u; m.rotation.y = Math.PI / 2; }
  };

  /* orbit ring + satellite */
  const orbit = new T.Group();
  orbit.position.y = 0.05;
  const torus = new T.Mesh(
    new T.TorusGeometry(5.2, 0.012, 6, 160),
    new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.55 }),
  );
  torus.rotation.x = Math.PI / 2;
  orbit.add(torus);
  const sat = new T.Mesh(new T.SphereGeometry(0.09, 16, 12), new T.MeshBasicMaterial({ color: 0xccfbf1 }));
  sat.position.set(5.2, 0, 0);
  orbit.add(sat);
  scene.add(orbit);

  /* dust */
  const N = 90;
  const pos = new Float32Array(N * 3);
  const speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = ((i * 37) % 130) / 10 - 6.5;
    pos[i * 3 + 1] = ((i * 53) % 90) / 10;
    pos[i * 3 + 2] = ((i * 71) % 130) / 10 - 6.5;
    speed[i] = 0.15 + ((i * 13) % 10) / 40;
  }
  const dustGeo = new T.BufferGeometry();
  dustGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const dust = new T.Points(
    dustGeo,
    new T.PointsMaterial({
      color: 0x99f6e4,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: T.AdditiveBlending,
    }),
  );
  scene.add(dust);

  /* sizing */
  let aspect = 1;
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    if (o.reduce) draw(10);
  };

  const ease = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

  /* one frame at time `time` seconds */
  function draw(time: number) {
    const intro = ease(time / 2.2);
    const radius = 36 * Math.max(1, 1.05 / aspect) * (1 + (1 - intro) * 0.18);
    const az = Math.PI / 4 + (o.reduce ? 0 : o.mx.get()) * 0.4;
    const el = 0.62 - (o.reduce ? 0 : o.my.get()) * 0.1;
    camera.position.set(
      target.x + radius * Math.cos(el) * Math.sin(az),
      target.y + radius * Math.sin(el),
      target.z + radius * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(target);

    towers.forEach((tw, i) => {
      tw.mesh.scale.y = Math.max(0.001, ease((time - tw.delay) / 1.2));
      lights[i].emissiveIntensity = 1.15 + 0.15 * Math.sin(time * 0.9 + i * 1.7);
    });
    beacon.visible = time > 1.2;
    rings.forEach((r, i) => {
      const p = ((time * 0.42 + i * 0.5) % 1);
      r.scale.setScalar(0.5 + p * 2.6);
      (r.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - p);
    });
    glow.intensity = 9 + Math.sin(time * 3) * 2;
    cars.forEach((c, i) => placeCar(c, time / 9 + i / 3));
    orbit.rotation.y = time * 0.17;

    const arr = dustGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      let y = arr.getY(i) + speed[i] * 0.016;
      if (y > 9) y = 0;
      arr.setY(i, y);
    }
    arr.needsUpdate = true;

    renderer.render(scene, camera);
  }

  let raf = 0;
  let elapsed = 0;
  let ready = false;
  const clock = new T.Clock();
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!o.isActive()) {
      clock.getDelta();
      return;
    }
    elapsed += Math.min(clock.getDelta(), 0.05);
    draw(elapsed);
    if (!ready) {
      ready = true;
      o.onReady();
    }
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const onLost = (e: Event) => {
    e.preventDefault();
    o.onLost();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  if (o.reduce) {
    draw(10);
    ready = true;
    o.onReady();
  } else {
    raf = requestAnimationFrame(frame);
  }

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.removeEventListener('webglcontextlost', onLost);
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => {
        Object.values(mat).forEach((v) => {
          if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
        });
        mat.dispose();
      });
    });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}

function GlCity({
  mx,
  my,
  active,
  reduce,
  onReady,
  onFail,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  active: boolean;
  reduce: boolean;
  onReady: () => void;
  onFail: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const cb = useRef({ onReady, onFail });
  activeRef.current = active;
  cb.current = { onReady, onFail };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData) {
      cb.current.onFail();
      return;
    }

    let disposed = false;
    let teardown: (() => void) | undefined;
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const boot = async () => {
      try {
        const T = await import('three');
        if (disposed) return;
        teardown = buildCity(T, host, {
          mx,
          my,
          reduce,
          isActive: () => activeRef.current,
          onReady: () => cb.current.onReady(),
          onLost: () => cb.current.onFail(),
        });
      } catch {
        if (!disposed) cb.current.onFail();
      }
    };

    // keep three.js off the critical path: start after first paint, when the browser is idle
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => void boot(), { timeout: 1500 });
    } else {
      timer = setTimeout(() => void boot(), 400);
    }

    return () => {
      disposed = true;
      teardown?.();
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timer) clearTimeout(timer);
    };
  }, [mx, my, reduce]);

  return <div ref={hostRef} aria-hidden className="absolute inset-0" />;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Hero
 * ──────────────────────────────────────────────────────────────────────────── */

export function HeroSection({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onAreaClick,
  featuredListings,
  rentalType,
  onRentalTypeChange,
  locale,
}: HeroSectionProps) {
  const { triggerHaptic } = usePlatform();
  const { areas, isLive, isLoading } = usePopularAreas();
  const reduce = useReducedMotion() ?? false;
  const heroRef = useRef<HTMLElement>(null);
  const visible = useInView(heroRef, { margin: '120px' });

  /* language (now uses global locale context) */
  const { locale: globalLocale, setLocale: setGlobalLocale } = useLocale();
  const lang = locale ?? globalLocale;
  const t = COPY[lang];

  /* pointer state (-1..1) shared by the 3D scenes, floating cards and spotlight */
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

  /* WebGL lifecycle: CSS city first, crossfade to WebGL when ready, fall back on failure */
  const [gl, setGl] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [cssGone, setCssGone] = useState(false);
  useEffect(() => {
    if (gl !== 'ready') return;
    const id = setTimeout(() => setCssGone(true), 900);
    return () => clearTimeout(id);
  }, [gl]);
  const handleGlReady = useCallback(() => setGl('ready'), []);
  const handleGlFail = useCallback(() => {
    setGl('failed');
    setCssGone(false);
  }, []);

  const totalHomes = useMemo(
    () => (isLive ? areas.reduce((sum, a) => sum + (a.count ?? 0), 0) : 0),
    [areas, isLive],
  );

  /* idle sway: the city breathes when nobody is moving a mouse (touch devices, resting cursor) */
  const idle = useRef<ReturnType<typeof animate> | null>(null);
  const startIdle = useCallback(() => {
    if (reduce) return;
    idle.current?.stop();
    idle.current = animate(px, [0, 0.35, 0, -0.35, 0], {
      duration: 14,
      ease: 'easeInOut',
      repeat: Infinity,
    });
  }, [px, reduce]);

  useEffect(() => {
    startIdle();
    return () => idle.current?.stop();
  }, [startIdle]);

  const handlePointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || reduce) return;
    idle.current?.stop();
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
    spotX.set(e.clientX - r.left);
    spotY.set(e.clientY - r.top);
  };

  const handlePointerLeave = () => {
    py.set(0);
    startIdle();
  };

  const handleAreaSelect = (name: string) => {
    triggerHaptic();
    onAreaClick(name);
  };

  const hasRealListings = !!featuredListings && featuredListings.length > 0;
  const isBn = lang === 'bn';

  return (
    <MotionConfig reducedMotion="user">
      <style>{HERO_CSS}</style>

      <section
        ref={heroRef}
        lang={lang}
        aria-labelledby="hero-heading"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={
          {
            '--hx-play': visible ? 'running' : 'paused',
            fontFamily: isBn ? BN_FONT : undefined,
          } as CSSProperties
        }
        className="relative isolate overflow-hidden bg-gradient-to-b from-teal-950 via-[#06302d] to-slate-950 py-14 text-white sm:py-20 lg:py-24"
      >
        {/* ── Backdrop: aurora, grid, spotlight, dust, grain ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="hx-anim absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-teal-500/20 blur-[110px] will-change-transform"
            style={{ animation: 'hx-drift 22s ease-in-out infinite' }}
          />
          <div
            className="hx-anim absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-emerald-500/15 blur-[120px] will-change-transform"
            style={{ animation: 'hx-drift 28s ease-in-out -8s infinite reverse' }}
          />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <motion.div className="absolute inset-0" style={{ background: spotlight }} />
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="hx-anim absolute rounded-full bg-teal-200/70"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                animation: `hx-up ${p.duration}s ease-in ${p.delay}s infinite`,
              }}
            />
          ))}
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
              className={
                isBn
                  ? 'text-4xl font-bold leading-[1.35] tracking-normal sm:text-5xl xl:text-6xl'
                  : 'text-[2.6rem] font-black leading-[1.08] tracking-tight sm:text-6xl xl:text-7xl'
              }
            >
              <span className="sr-only">{t.headline.join(' ')}</span>
              <span aria-hidden>
                {t.headline.map((word, i) => (
                  <span
                    key={`${lang}-${i}`}
                    className="mr-[0.25em] inline-block overflow-hidden pb-[0.18em] align-bottom"
                    style={{ marginBottom: '-0.18em' }}
                  >
                    <motion.span
                      className={`inline-block ${
                        i >= t.gradientFrom
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
              {t.description}
            </motion.p>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.85 }}
            >
              <SearchCard
                value={searchQuery}
                onChange={onSearchChange}
                onSubmit={onSearchSubmit}
                onAreaSelect={handleAreaSelect}
                areas={areas}
                isLive={isLive}
                isLoading={isLoading}
                rentalType={rentalType}
                onRentalTypeChange={onRentalTypeChange}
                lang={lang}
                t={t}
              />
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
                    <CountUp to={totalHomes} lang={lang} />+
                  </span>
                  {t.homesStat}
                </p>
              )}
              <ul className="grid gap-2 text-sm text-teal-100/80">
                {t.trust.map((label, i) => {
                  const Icon = TRUST_ICONS[i];
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <Icon aria-hidden className="h-4 w-4 shrink-0 text-teal-300" />
                      {label}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>

          {/* ── City (WebGL, CSS 3D fallback) + floating UI ── */}
          <div className="relative mx-auto h-[360px] w-full max-w-[600px] sm:h-[480px] lg:h-[600px]">
            {!cssGone && (
              <div
                aria-hidden
                className={`absolute inset-0 transition-opacity duration-700 ${
                  gl === 'ready' ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className={stageBox} style={{ perspective: 1600 }}>
                  <div className="absolute left-1/2 top-1/2 -ml-[300px] -mt-[260px] h-[520px] w-[600px] rounded-full bg-teal-400/10 blur-[90px]" />
                  <CssCity rotX={rotX} rotZ={rotZ} y={sceneY} />
                </div>
              </div>
            )}

            {gl !== 'failed' && (
              <motion.div
                aria-hidden
                style={{ y: sceneY }}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  gl === 'ready' ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <GlCity
                  mx={mx}
                  my={my}
                  active={visible}
                  reduce={reduce}
                  onReady={handleGlReady}
                  onFail={handleGlFail}
                />
              </motion.div>
            )}

            <div className={stageBox}>
              <Floating
                mx={mx}
                my={my}
                depth={1.4}
                delay={1.1}
                className="-left-6 top-2 sm:-left-14"
                decorative={!hasRealListings}
              >
                {hasRealListings ? (
                  <ListingCard listings={featuredListings!} lang={lang} t={t} />
                ) : (
                  <div className={`${glass} w-56 p-3`}>
                    <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/40 to-emerald-500/20">
                      <Building2 className="h-9 w-9 text-teal-100/80" />
                    </div>
                    <p className="text-sm font-semibold text-white">{t.cards.sample}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-teal-200">
                        {formatBdt(18500, lang)} {t.cards.perMonth}
                      </span>
                      <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] text-emerald-200">
                        {t.cards.directOwner}
                      </span>
                    </div>
                  </div>
                )}
              </Floating>

              <Floating mx={mx} my={my} depth={2} delay={1.4} className="-right-2 top-28 sm:-right-10">
                <div className={`${glass} flex items-center gap-2.5 px-4 py-3`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.cards.verifiedTenant}</p>
                    <p className="text-[11px] text-teal-200/80">{t.cards.nidVerified}</p>
                  </div>
                </div>
              </Floating>

              <Floating mx={mx} my={my} depth={1.1} delay={1.7} className="-right-4 bottom-10 sm:-right-12">
                <div className={`${glass} flex items-center gap-2.5 px-4 py-3`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/30">
                    <KeyRound className="h-4 w-4 text-amber-200" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.cards.tokenHeld}</p>
                    <p className="text-[11px] text-teal-200/80">{t.cards.secured}</p>
                  </div>
                </div>
              </Floating>

              <Floating mx={mx} my={my} depth={1.7} delay={2} className="-left-2 bottom-2 sm:-left-10">
                <div className={`${glass} flex items-center gap-2.5 px-4 py-3`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/30">
                    <FileSignature className="h-4 w-4 text-teal-100" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.cards.contract}</p>
                    <p className="text-[11px] text-teal-200/80">{t.cards.bothParties}</p>
                  </div>
                </div>
              </Floating>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-5 left-1/2 hidden h-8 w-5 -translate-x-1/2 justify-center rounded-full border border-white/30 pt-1.5 lg:flex"
        >
          <span
            className="hx-anim h-1.5 w-1 rounded-full bg-white/70"
            style={{ animation: 'hx-scroll 1.8s ease-in-out infinite' }}
          />
        </div>
      </section>
    </MotionConfig>
  );
}