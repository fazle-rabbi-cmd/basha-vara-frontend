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
  if (lowerStatus === 'accepted' || lowerStatus === 'selected') return 'success';
  if (lowerStatus === 'shortlisted') return 'warning';
  if (lowerStatus === 'pending' || lowerStatus === 'submitted' || lowerStatus === 'under_review') return 'default';
  if (lowerStatus === 'declined' || lowerStatus === 'rejected') return 'error';
  if (lowerStatus === 'cancelled' || lowerStatus === 'withdrawn') return 'error';

  // Visit status
  if (lowerStatus === 'confirmed') return 'success';
  if (lowerStatus === 'completed') return 'default';
  if (lowerStatus === 'reschedule_requested') return 'warning';

  return 'default';
}
