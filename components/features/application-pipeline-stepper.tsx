'use client';

import { Check, Clock, UserCheck, Award, FileCheck2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationPipelineStepperProps {
  status: string;
  className?: string;
}

const STEPS = [
  { key: 'submitted', label: 'Submitted', icon: Clock },
  { key: 'under_review', label: 'Under Review', icon: Clock },
  { key: 'shortlisted', label: 'Shortlisted', icon: UserCheck },
  { key: 'selected', label: 'Selected', icon: Award },
  { key: 'lease_movein', label: 'Lease & Escrow', icon: FileCheck2 },
];

export function ApplicationPipelineStepper({ status, className }: ApplicationPipelineStepperProps) {
  const normStatus = (status || '').toLowerCase();

  const isRejected = normStatus === 'rejected' || normStatus === 'declined';
  const isWithdrawn = normStatus === 'cancelled' || normStatus === 'withdrawn';

  if (isRejected || isWithdrawn) {
    return (
      <div className={cn('flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-300', className)}>
        <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
        <span className="font-medium">
          {isWithdrawn ? 'Application withdrawn' : 'Application declined by landlord'}
        </span>
      </div>
    );
  }

  const getStepIndex = (s: string) => {
    switch (s) {
      case 'submitted':
      case 'pending':
        return 0;
      case 'under_review':
        return 1;
      case 'shortlisted':
        return 2;
      case 'selected':
      case 'accepted':
        return 3;
      case 'rented':
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(normStatus);

  return (
    <div className={cn('w-full py-2', className)}>
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-muted -z-0" />
        <div
          className="absolute top-3.5 left-4 h-0.5 bg-primary transition-all duration-300 -z-0"
          style={{
            width: `${Math.min(100, Math.max(0, (currentIndex / (STEPS.length - 1)) * 100))}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  isCompleted && 'bg-primary text-primary-foreground shadow-sm',
                  isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-sm',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground border border-border'
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1.5 font-medium whitespace-nowrap text-center',
                  isCurrent && 'text-primary font-bold',
                  isCompleted && 'text-foreground',
                  !isCompleted && !isCurrent && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
