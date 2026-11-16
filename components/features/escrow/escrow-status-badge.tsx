'use client';

import { Shield, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EscrowStatusBadgeProps {
  escrowStatus: string;
  className?: string;
}

export function EscrowStatusBadge({ escrowStatus, className = '' }: EscrowStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (escrowStatus) {
      case 'HELD':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Held in Escrow',
          color: 'text-yellow-600',
        };
      case 'RELEASED':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Released',
          color: 'text-green-600',
        };
      case 'REFUNDED':
        return {
          variant: 'outline' as const,
          icon: DollarSign,
          label: 'Refunded',
          color: 'text-blue-600',
        };
      case 'DISPUTED':
        return {
          variant: 'error' as const,
          icon: AlertCircle,
          label: 'Disputed',
          color: 'text-red-600',
        };
      case 'PARTIALLY_RELEASED':
        return {
          variant: 'secondary' as const,
          icon: Shield,
          label: 'Partially Released',
          color: 'text-purple-600',
        };
      default:
        return {
          variant: 'outline' as const,
          icon: Shield,
          label: 'Not Applicable',
          color: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${className}`}>
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
}
