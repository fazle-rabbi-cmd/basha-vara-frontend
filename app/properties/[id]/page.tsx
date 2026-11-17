import { PageLayout } from '@/components/layout/page-layout';
import { PropertyDetailContent } from './property-detail-content';

export default function PropertyPage({ params }: { params: { id: string } }) {
  return <PropertyDetailContent propertyId={params.id} />;
}
