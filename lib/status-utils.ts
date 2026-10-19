// Shared utility functions for status badge variants
// This prevents duplication across components

export type StatusBadgeVariant = 'success' | 'error' | 'warning' | 'secondary' | 'default';

export function getStatusBadgeVariant(status: string): StatusBadgeVariant {
  const lowerStatus = status.toLowerCase();

  // Property listing status
  if (lowerStatus === 'available') return 'success';
  if (lowerStatus === 'rented') return 'error';
  if (lowerStatus === 'paused') return 'warning';
  if (lowerStatus === 'archived') return 'secondary';

  // Application status
  if (lowerStatus === 'accepted') return 'success';
  if (lowerStatus === 'shortlisted') return 'warning';
  if (lowerStatus === 'pending') return 'default';
  if (lowerStatus === 'declined') return 'error';
  if (lowerStatus === 'cancelled') return 'error';

  // Visit status
  if (lowerStatus === 'confirmed') return 'success';
  if (lowerStatus === 'completed') return 'default';
  if (lowerStatus === 'reschedule_requested') return 'warning';

  return 'default';
}
