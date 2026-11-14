'use client';

import { Lock, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PropertyLockBadgeProps {
  lockedUntil?: string | null;
  lockedByVisitId?: string | null;
  className?: string;
}

export function PropertyLockBadge({
  lockedUntil,
  lockedByVisitId,
  className = '',
}: PropertyLockBadgeProps) {
  if (!lockedUntil || !lockedByVisitId) {
    return null;
  }

  const lockExpiry = new Date(lockedUntil);
  const now = new Date();

  if (now > lockExpiry) {
    return null;
  }

  const hoursRemaining = Math.ceil((lockExpiry.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
      <Lock className="h-3 w-3" />
      Locked for {hoursRemaining}h
      <Clock className="h-3 w-3 ml-1" />
    </Badge>
  );
}
