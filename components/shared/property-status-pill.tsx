/**
 * Shared status pill: PropertyCard ar Property Detail page, duita jaygay ekhi component.
 * Badge variant er upor depend kore na, tai status always readable ar consistent thake.
 */

const NEUTRAL =
  'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20';

const STATUS_STYLES: Record<string, { label: string; pill: string; dot: string }> = {
  available: {
    label: 'Available',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
    dot: 'bg-emerald-500',
  },
  rented: {
    label: 'Rented',
    pill: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
    dot: 'bg-blue-500',
  },
  pending: {
    label: 'Pending',
    pill: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
  },
  draft: {
    label: 'Draft',
    pill: NEUTRAL,
    dot: 'bg-slate-400',
  },
  unavailable: {
    label: 'Unavailable',
    pill: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
    dot: 'bg-red-500',
  },
};

function getStatusStyle(status: string) {
  const key = status?.toLowerCase();
  if (STATUS_STYLES[key]) return STATUS_STYLES[key];
  // Unknown status: nijei label banay, neutral style
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown';
  return { label, pill: NEUTRAL, dot: 'bg-slate-400' };
}

export function PropertyStatusPill({ status, className = '' }: { status: string; className?: string }) {
  const style = getStatusStyle(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.pill} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}