'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { RentLedgerDashboard } from '@/components/features/rent-ledger/rent-ledger-dashboard';
import { LandlordRoute } from '@/features/auth/protected-route';

export default function LandlordRentLedgerPage() {
  return (
    <LandlordRoute>
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Rent Ledger
            </h1>
            <p className="text-muted-foreground">
              Track rent payments and utility charges for your properties
            </p>
          </div>
          <RentLedgerDashboard />
        </div>
      </PageLayout>
    </LandlordRoute>
  );
}
