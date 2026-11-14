'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { RentLedgerDashboard } from '@/components/features/rent-ledger/rent-ledger-dashboard';
import { LandlordRoute } from '@/features/auth/protected-route';

export default function LandlordRentLedgerPage() {
  return (
    <LandlordRoute>
      <PageLayout
        title="Rent Ledger"
        description="Track rent payments and utility charges for your properties"
      >
        <RentLedgerDashboard />
      </PageLayout>
    </LandlordRoute>
  );
}
